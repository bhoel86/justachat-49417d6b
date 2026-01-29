import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResetPasswordRequest {
  targetUserId: string;
  newPassword: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No auth header");
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

    // Verify the calling user using getUser()
    const { data: userData, error: userError } = await userClient.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callingUserId = userData.user.id;
    console.log("Authenticated user:", callingUserId);

    // Check if calling user is an Owner (only owners can reset passwords)
    // NOTE: using the SECURITY DEFINER db function avoids issues if user_roles has multiple rows per user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isOwner, error: isOwnerError } = await adminClient
      .rpc("is_owner", { _user_id: callingUserId });

    console.log("Owner check:", { isOwner, isOwnerError });

    if (isOwnerError || !isOwner) {
      console.error("Owner check failed:", isOwnerError, "isOwner:", isOwner);
      return new Response(
        JSON.stringify({ error: "Only owners can reset passwords" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { targetUserId, newPassword }: ResetPasswordRequest = await req.json();

    if (!targetUserId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Missing targetUserId or newPassword" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Resetting password for:", targetUserId);

    // Get target user info for logging
    const { data: targetUser } = await adminClient.auth.admin.getUserById(targetUserId);
    
    // Reset the password using admin API
    const { data, error } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword
    });

    if (error) {
      console.error("Password reset error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the action
    await adminClient.from("audit_logs").insert({
      user_id: callingUserId,
      action: "admin_password_reset",
      resource_type: "user",
      resource_id: targetUserId,
      details: {
        target_email: targetUser?.user?.email,
        reset_by: callingUserId
      }
    });

    console.log(`Password reset for user ${targetUserId} by owner ${callingUserId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password reset successfully for ${targetUser?.user?.email || targetUserId}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
