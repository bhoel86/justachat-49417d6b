import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VPS Deploy server endpoint (runs on localhost on the VPS)
const VPS_DEPLOY_URL = "http://157.245.174.197:6680";

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

    // Get deploy token from secrets - support both old and new secret names
    const deployToken = Deno.env.get("VPS_DEPLOY_TOKEN") || Deno.env.get("IRC_PROXY_ADMIN_TOKEN");
    if (!deployToken) {
      return new Response(
        JSON.stringify({ error: "VPS deploy token not configured. Add VPS_DEPLOY_TOKEN secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body to get action
    let action = "status";
    try {
      const body = await req.json();
      if (body?.action) {
        action = body.action;
      }
    } catch {
      // No body or invalid JSON, default to status
    }

    let endpoint = "/deploy/status";
    let method = "GET";
    let body: any = { action };

    // Parse request body
    let requestBody: any = {};
    try {
      requestBody = await req.json();
      if (requestBody?.action) {
        action = requestBody.action;
        body.action = action;
      }
      if (requestBody?.frequency) {
        body.frequency = requestBody.frequency;
      }
    } catch {
      // No body or invalid JSON, default to status
    }

    if (action !== "status") {
      endpoint = "/deploy";
      method = "POST";
    }

    console.log(`VPS Deploy: ${action} requested by owner ${user.email}`);

    // Call the VPS deploy server
    const response = await fetch(`${VPS_DEPLOY_URL}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${deployToken}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = { error: "Invalid response from VPS" };
    }

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
        status: response.ok ? 200 : response.status, 
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
