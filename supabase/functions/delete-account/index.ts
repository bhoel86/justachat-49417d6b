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

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`[delete-account] Deleting account for user: ${userId}`);

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete user data from all related tables (cascade where possible, explicit otherwise)
    // Order matters: delete from tables that reference profiles first

    // Private messages
    await adminClient
      .from("private_messages")
      .delete()
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

    // Messages in channels
    await adminClient.from("messages").delete().eq("user_id", userId);

    // Channel memberships
    await adminClient.from("channel_members").delete().eq("user_id", userId);

    // Room admins
    await adminClient.from("room_admins").delete().eq("user_id", userId);

    // Room bans (as banned or banner)
    await adminClient.from("room_bans").delete().eq("user_id", userId);
    await adminClient.from("room_bans").delete().eq("banned_by", userId);

    // Room mutes
    await adminClient.from("room_mutes").delete().eq("user_id", userId);
    await adminClient.from("room_mutes").delete().eq("muted_by", userId);

    // Channel access list
    await adminClient.from("channel_access_list").delete().eq("user_id", userId);

    // Friends and friend requests
    await adminClient
      .from("friends")
      .delete()
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    await adminClient
      .from("friend_requests")
      .delete()
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

    // Blocked users
    await adminClient
      .from("blocked_users")
      .delete()
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    // Bans (global)
    await adminClient.from("bans").delete().eq("user_id", userId);

    // Mutes (global)
    await adminClient.from("mutes").delete().eq("user_id", userId);

    // User reports
    await adminClient
      .from("user_reports")
      .delete()
      .or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`);

    // Support tickets and messages
    const { data: tickets } = await adminClient
      .from("support_tickets")
      .select("id")
      .eq("user_id", userId);
    if (tickets && tickets.length > 0) {
      const ticketIds = tickets.map((t) => t.id);
      await adminClient.from("support_messages").delete().in("ticket_id", ticketIds);
      await adminClient.from("support_tickets").delete().eq("user_id", userId);
    }

    // Dating profiles, swipes, matches
    await adminClient.from("dating_profiles").delete().eq("user_id", userId);
    await adminClient
      .from("dating_swipes")
      .delete()
      .or(`swiper_id.eq.${userId},swiped_id.eq.${userId}`);
    await adminClient
      .from("dating_matches")
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    // Trivia scores
    await adminClient.from("trivia_scores").delete().eq("user_id", userId);

    // User channel visits
    await adminClient.from("user_channel_visits").delete().eq("user_id", userId);

    // User conversation topics
    await adminClient.from("user_conversation_topics").delete().eq("user_id", userId);

    // User locations
    await adminClient.from("user_locations").delete().eq("user_id", userId);

    // Donation clicks
    await adminClient.from("donation_clicks").delete().eq("user_id", userId);

    // Registered nicks
    await adminClient.from("registered_nicks").delete().eq("user_id", userId);

    // Channel registrations (founder)
    await adminClient.from("channel_registrations").delete().eq("founder_id", userId);

    // Channels created by user (set created_by to null or delete if empty)
    await adminClient.from("channels").update({ created_by: null }).eq("created_by", userId);

    // User roles
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // Profile (must be last before auth.users)
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Delete avatar from storage
    try {
      await adminClient.storage.from("avatars").remove([`${userId}/avatar.webp`]);
    } catch (storageErr) {
      console.log("Avatar deletion skipped (may not exist):", storageErr);
    }

    // Finally, delete the user from auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account from auth system" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[delete-account] Successfully deleted user: ${userId}`);

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
