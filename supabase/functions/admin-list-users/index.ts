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

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller has admin/owner role
    const { data: callerIsOwner } = await adminClient.rpc('is_owner', { _user_id: caller.id });
    const { data: callerIsAdmin } = await adminClient.rpc('has_role', { _user_id: caller.id, _role: 'admin' });
    
    if (!callerIsOwner && !callerIsAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins/owners can list users with emails" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all users from auth.users using admin API
    const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("Failed to list users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to list users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profiles to get usernames
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, username, created_at, avatar_url, bio, age");

    // Fetch roles
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("user_id, role");

    // Create lookup maps
    const profileMap = new Map(
      profiles?.map((p) => [p.user_id, p]) || []
    );
    const roleMap = new Map(
      roles?.map((r) => [r.user_id, r.role]) || []
    );

    // Combine data
    const users = authUsers.users.map((authUser) => {
      const profile = profileMap.get(authUser.id);
      return {
        user_id: authUser.id,
        email: authUser.email,
        username: profile?.username || authUser.user_metadata?.username || 'Unknown',
        role: roleMap.get(authUser.id) || 'user',
        created_at: profile?.created_at || authUser.created_at,
        avatar_url: profile?.avatar_url,
        bio: profile?.bio,
        age: profile?.age,
        email_confirmed_at: authUser.email_confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at,
      };
    });

    // Sort by role priority
    const rolePriority: Record<string, number> = { owner: 0, admin: 1, moderator: 2, user: 3 };
    users.sort((a, b) => (rolePriority[a.role] ?? 3) - (rolePriority[b.role] ?? 3));

    console.log(`[admin-list-users] Admin ${caller.id} fetched ${users.length} users`);

    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in admin-list-users:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
