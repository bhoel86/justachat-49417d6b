import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ModerationRequest {
  command: string;
  targetUsername: string;
  reason?: string;
  channelId?: string;
  duration?: string;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  moderator: 2,
  user: 1,
};

type AppRole = keyof typeof ROLE_HIERARCHY;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the calling user
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callingUserId = userData.user.id;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get calling user's role server-side
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUserId)
      .maybeSingle();

    const callerRole: AppRole = (roleData?.role as AppRole) || "user";
    const callerRoleLevel = ROLE_HIERARCHY[callerRole];

    // Check if user is owner
    const { data: isOwner } = await serviceClient.rpc("is_owner", { _user_id: callingUserId });

    // Parse request
    const { command, targetUsername, reason, channelId, duration }: ModerationRequest = await req.json();

    if (!command || !targetUsername) {
      return new Response(
        JSON.stringify({ error: "Missing command or targetUsername" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find target user
    const { data: targetUser, error: targetError } = await serviceClient
      .from("profiles")
      .select("user_id, username")
      .ilike("username", targetUsername)
      .maybeSingle();

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({ error: `User "${targetUsername}" not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user's role
    const { data: targetRoleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUser.user_id)
      .maybeSingle();

    const targetRole: AppRole = (targetRoleData?.role as AppRole) || "user";
    const targetRoleLevel = ROLE_HIERARCHY[targetRole];

    // Define command requirements and execute
    const moderatorCommands = ["kick", "ban", "unban", "mute", "unmute", "op", "deop", "topic"];
    const adminCommands = ["admin", "deadmin", "kline", "unkline"];

    const isModerator = callerRoleLevel >= ROLE_HIERARCHY.moderator;
    const isAdmin = callerRoleLevel >= ROLE_HIERARCHY.admin;

    // Check command permissions
    if (moderatorCommands.includes(command) && !isModerator) {
      return new Response(
        JSON.stringify({ error: "You need moderator privileges to use this command" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (adminCommands.includes(command) && !isAdmin && !isOwner) {
      return new Response(
        JSON.stringify({ error: "You need admin privileges to use this command" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hierarchy check - can't moderate higher or equal roles (except owner)
    if (["ban", "mute", "kick", "deop", "deadmin"].includes(command)) {
      if (targetRole === "owner") {
        return new Response(
          JSON.stringify({ error: "Cannot perform this action on an owner" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (targetRoleLevel >= callerRoleLevel && !isOwner) {
        return new Response(
          JSON.stringify({ error: "Cannot perform this action on a user with equal or higher role" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get caller username for messaging
    const { data: callerProfile } = await serviceClient
      .from("profiles")
      .select("username")
      .eq("user_id", callingUserId)
      .single();

    const callerUsername = callerProfile?.username || "Unknown";

    // Execute command
    let result: { success: boolean; message: string; broadcast?: boolean };

    switch (command) {
      case "ban": {
        const { error } = await serviceClient.from("bans").upsert({
          user_id: targetUser.user_id,
          banned_by: callingUserId,
          reason: reason || "No reason given",
        });
        if (error) throw new Error("Failed to ban user");
        
        // Log action
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "ban_user",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username, reason },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been banned by ${callerUsername}. Reason: ${reason || "No reason given"}`,
          broadcast: true,
        };
        break;
      }

      case "unban": {
        const { error } = await serviceClient
          .from("bans")
          .delete()
          .eq("user_id", targetUser.user_id);
        if (error) throw new Error("Failed to unban user");
        
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "unban_user",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been unbanned.`,
          broadcast: true,
        };
        break;
      }

      case "mute": {
        const { error } = await serviceClient.from("mutes").upsert({
          user_id: targetUser.user_id,
          muted_by: callingUserId,
          reason: reason || "No reason given",
        });
        if (error) throw new Error("Failed to mute user");
        
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "mute_user",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username, reason },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been muted. Reason: ${reason || "No reason given"}`,
          broadcast: true,
        };
        break;
      }

      case "unmute": {
        const { error } = await serviceClient
          .from("mutes")
          .delete()
          .eq("user_id", targetUser.user_id);
        if (error) throw new Error("Failed to unmute user");
        
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "unmute_user",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been unmuted.`,
          broadcast: true,
        };
        break;
      }

      case "kick": {
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "kick_user",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username, reason },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been kicked by ${callerUsername}. Reason: ${reason || "No reason given"}`,
          broadcast: true,
        };
        break;
      }

      case "op": {
        if (targetRole === "owner" || targetRole === "admin") {
          return new Response(
            JSON.stringify({ error: "Cannot change role of admin or owner" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await serviceClient
          .from("user_roles")
          .upsert({ user_id: targetUser.user_id, role: "moderator" }, { onConflict: "user_id" });
        if (error) throw new Error("Failed to give operator status");
        
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "change_role",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username, previous_role: targetRole, new_role: "moderator" },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been given moderator status.`,
          broadcast: true,
        };
        break;
      }

      case "deop": {
        const { error } = await serviceClient
          .from("user_roles")
          .upsert({ user_id: targetUser.user_id, role: "user" }, { onConflict: "user_id" });
        if (error) throw new Error("Failed to remove operator status");
        
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "change_role",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username, previous_role: targetRole, new_role: "user" },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been demoted to user.`,
          broadcast: true,
        };
        break;
      }

      case "admin": {
        const { error } = await serviceClient
          .from("user_roles")
          .upsert({ user_id: targetUser.user_id, role: "admin" }, { onConflict: "user_id" });
        if (error) throw new Error("Failed to give admin status");
        
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "change_role",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username, previous_role: targetRole, new_role: "admin" },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been promoted to admin.`,
          broadcast: true,
        };
        break;
      }

      case "deadmin": {
        if (!isOwner) {
          return new Response(
            JSON.stringify({ error: "Only the owner can demote admins" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (targetRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "User is not an admin" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await serviceClient
          .from("user_roles")
          .upsert({ user_id: targetUser.user_id, role: "moderator" }, { onConflict: "user_id" });
        if (error) throw new Error("Failed to demote admin");
        
        await serviceClient.from("audit_logs").insert({
          user_id: callingUserId,
          action: "change_role",
          resource_type: "user",
          resource_id: targetUser.user_id,
          details: { target_username: targetUser.username, previous_role: "admin", new_role: "moderator" },
        });

        result = {
          success: true,
          message: `${targetUser.username} has been demoted to moderator.`,
          broadcast: true,
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown command: ${command}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`[execute-moderation] ${callerUsername} executed ${command} on ${targetUser.username}`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
