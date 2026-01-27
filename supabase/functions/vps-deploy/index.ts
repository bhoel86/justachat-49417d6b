import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VPS IRC Proxy admin endpoint
const VPS_ADMIN_URL = "http://157.245.174.197:6680";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated and is an owner
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is owner
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    if (roleError || !roleData) {
      console.log("User is not owner:", user.id);
      return new Response(
        JSON.stringify({ error: "Owner access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin token from secrets
    const adminToken = Deno.env.get("IRC_PROXY_ADMIN_TOKEN");
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: "IRC proxy admin token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";

    let endpoint = "/deploy/status";
    let method = "GET";

    if (action === "deploy") {
      endpoint = "/deploy";
      method = "POST";
    }

    console.log(`VPS Deploy: ${action} requested by owner ${user.email}`);

    // Call the VPS IRC proxy admin API
    const response = await fetch(`${VPS_ADMIN_URL}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Log the action
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: `vps_${action}`,
      resource_type: "vps_deploy",
      details: { 
        success: response.ok,
        status: response.status,
        result: data 
      },
    });

    return new Response(
      JSON.stringify({ 
        success: response.ok,
        action,
        ...data 
      }),
      { 
        status: response.status, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("VPS Deploy error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
