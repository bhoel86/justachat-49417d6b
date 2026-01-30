import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: userError } = await userClient.auth.getUser();
    if (userError || !caller) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for optional admin deletion
    let targetUserId = caller.id;
    let addIpBan = false;
    let isAdminDeletion = false;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.targetUserId && body.targetUserId !== caller.id) {
          // Admin is trying to delete another user
          targetUserId = body.targetUserId;
          addIpBan = body.addIpBan === true;
          isAdminDeletion = true;
        }
      } catch {
        // No body or invalid JSON, user is deleting their own account
      }
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // If admin deletion, verify caller has admin/owner role
    if (isAdminDeletion) {
      const { data: callerIsOwner } = await adminClient.rpc('is_owner', { _user_id: caller.id });
      const { data: callerIsAdmin } = await adminClient.rpc('has_role', { _user_id: caller.id, _role: 'admin' });
      
      if (!callerIsOwner && !callerIsAdmin) {
        return new Response(
          JSON.stringify({ error: "Only admins/owners can delete other users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent deleting owners (unless caller is owner)
      const { data: targetIsOwner } = await adminClient.rpc('is_owner', { _user_id: targetUserId });
      if (targetIsOwner && !callerIsOwner) {
        return new Response(
          JSON.stringify({ error: "Cannot delete an owner account" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get target user's username for logging
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("username")
        .eq("user_id", targetUserId)
        .single();

      console.log(`[delete-account] Admin ${caller.id} deleting user ${targetUserId} (${targetProfile?.username}), IP ban: ${addIpBan}`);

      // If addIpBan is true, get the user's IP and add a K-line
      if (addIpBan) {
        const { data: locationData } = await adminClient
          .from("user_locations")
          .select("ip_address")
          .eq("user_id", targetUserId)
          .order("last_seen", { ascending: false })
          .limit(1)
          .single();

        if (locationData?.ip_address) {
          // Add K-line entry
          await adminClient.from("klines").insert({
            ip_pattern: locationData.ip_address,
            reason: `User ${targetProfile?.username || targetUserId} deleted by admin with IP ban`,
            set_by: caller.id,
            expires_at: null, // Permanent ban
          });
          console.log(`[delete-account] Added K-line for IP: ${locationData.ip_address}`);
        }
      }

      // Log the admin action
      await adminClient.from("audit_logs").insert({
        user_id: caller.id,
        action: "admin_delete_user",
        resource_type: "user",
        resource_id: targetUserId,
        details: {
          deleted_username: targetProfile?.username,
          ip_ban_added: addIpBan,
        },
      });
    } else {
      console.log(`[delete-account] User ${targetUserId} deleting their own account`);
    }

    // Delete user data from all related tables
    // Order matters: delete from tables that reference profiles first

    // Private messages
    await adminClient
      .from("private_messages")
      .delete()
      .or(`sender_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`);

    // Messages in channels
    await adminClient.from("messages").delete().eq("user_id", targetUserId);

    // Channel memberships
    await adminClient.from("channel_members").delete().eq("user_id", targetUserId);

    // Room admins
    await adminClient.from("room_admins").delete().eq("user_id", targetUserId);

    // Room bans (as banned or banner)
    await adminClient.from("room_bans").delete().eq("user_id", targetUserId);
    await adminClient.from("room_bans").delete().eq("banned_by", targetUserId);

    // Room mutes
    await adminClient.from("room_mutes").delete().eq("user_id", targetUserId);
    await adminClient.from("room_mutes").delete().eq("muted_by", targetUserId);

    // Channel access list
    await adminClient.from("channel_access_list").delete().eq("user_id", targetUserId);

    // Friends and friend requests
    await adminClient
      .from("friends")
      .delete()
      .or(`user_id.eq.${targetUserId},friend_id.eq.${targetUserId}`);
    await adminClient
      .from("friend_requests")
      .delete()
      .or(`sender_id.eq.${targetUserId},recipient_id.eq.${targetUserId}`);

    // Blocked users
    await adminClient
      .from("blocked_users")
      .delete()
      .or(`blocker_id.eq.${targetUserId},blocked_id.eq.${targetUserId}`);

    // Bans (global)
    await adminClient.from("bans").delete().eq("user_id", targetUserId);

    // Mutes (global)
    await adminClient.from("mutes").delete().eq("user_id", targetUserId);

    // User reports
    await adminClient
      .from("user_reports")
      .delete()
      .or(`reporter_id.eq.${targetUserId},reported_user_id.eq.${targetUserId}`);

    // Support tickets and messages
    const { data: tickets } = await adminClient
      .from("support_tickets")
      .select("id")
      .eq("user_id", targetUserId);
    if (tickets && tickets.length > 0) {
      const ticketIds = tickets.map((t) => t.id);
      await adminClient.from("support_messages").delete().in("ticket_id", ticketIds);
      await adminClient.from("support_tickets").delete().eq("user_id", targetUserId);
    }

    // Dating profiles, swipes, matches
    await adminClient.from("dating_profiles").delete().eq("user_id", targetUserId);
    await adminClient
      .from("dating_swipes")
      .delete()
      .or(`swiper_id.eq.${targetUserId},swiped_id.eq.${targetUserId}`);
    await adminClient
      .from("dating_matches")
      .delete()
      .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);

    // Trivia scores
    await adminClient.from("trivia_scores").delete().eq("user_id", targetUserId);

    // User channel visits
    await adminClient.from("user_channel_visits").delete().eq("user_id", targetUserId);

    // User conversation topics
    await adminClient.from("user_conversation_topics").delete().eq("user_id", targetUserId);

    // User locations (delete AFTER potential IP ban lookup)
    await adminClient.from("user_locations").delete().eq("user_id", targetUserId);

    // Donation clicks
    await adminClient.from("donation_clicks").delete().eq("user_id", targetUserId);

    // Registered nicks
    await adminClient.from("registered_nicks").delete().eq("user_id", targetUserId);

    // Channel registrations (founder)
    await adminClient.from("channel_registrations").delete().eq("founder_id", targetUserId);

    // Channels created by user (set created_by to null)
    await adminClient.from("channels").update({ created_by: null }).eq("created_by", targetUserId);

    // User roles
    await adminClient.from("user_roles").delete().eq("user_id", targetUserId);

    // Profile (must be last before auth.users)
    await adminClient.from("profiles").delete().eq("user_id", targetUserId);

    // Delete avatar from storage
    try {
      await adminClient.storage.from("avatars").remove([`${targetUserId}/avatar.webp`]);
    } catch (storageErr) {
      console.log("Avatar deletion skipped (may not exist):", storageErr);
    }

    // Finally, delete the user from auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account from auth system" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[delete-account] Successfully deleted user: ${targetUserId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in delete-account:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
