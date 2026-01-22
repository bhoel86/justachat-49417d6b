import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const WINDOW_DURATION_MINUTES = 15;

interface RateLimitRequest {
  identifier: string;
  action: "check" | "record_failure" | "reset";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { identifier, action }: RateLimitRequest = await req.json();

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "Identifier is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Rate limit ${action} for identifier: ${identifier.substring(0, 5)}...`);

    if (action === "check") {
      // Check if user is currently locked out
      const { data: attempt } = await supabase
        .from("login_attempts")
        .select("*")
        .eq("identifier", identifier)
        .single();

      if (!attempt) {
        return new Response(
          JSON.stringify({ allowed: true, remainingAttempts: MAX_ATTEMPTS }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if locked
      if (attempt.locked_until && new Date(attempt.locked_until) > new Date()) {
        const lockRemaining = Math.ceil(
          (new Date(attempt.locked_until).getTime() - Date.now()) / 60000
        );
        return new Response(
          JSON.stringify({
            allowed: false,
            locked: true,
            lockoutMinutesRemaining: lockRemaining,
            message: `Too many failed attempts. Please try again in ${lockRemaining} minute(s).`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if window has expired (reset if so)
      const windowStart = new Date(attempt.first_attempt_at);
      const windowExpiry = new Date(windowStart.getTime() + WINDOW_DURATION_MINUTES * 60000);
      
      if (new Date() > windowExpiry) {
        // Window expired, reset
        await supabase.from("login_attempts").delete().eq("identifier", identifier);
        return new Response(
          JSON.stringify({ allowed: true, remainingAttempts: MAX_ATTEMPTS }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const remainingAttempts = MAX_ATTEMPTS - attempt.attempt_count;
      return new Response(
        JSON.stringify({ allowed: remainingAttempts > 0, remainingAttempts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "record_failure") {
      const { data: existing } = await supabase
        .from("login_attempts")
        .select("*")
        .eq("identifier", identifier)
        .single();

      if (!existing) {
        // First failure
        await supabase.from("login_attempts").insert({
          identifier,
          attempt_count: 1,
          first_attempt_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
        });
        return new Response(
          JSON.stringify({ remainingAttempts: MAX_ATTEMPTS - 1 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if window expired
      const windowStart = new Date(existing.first_attempt_at);
      const windowExpiry = new Date(windowStart.getTime() + WINDOW_DURATION_MINUTES * 60000);
      
      if (new Date() > windowExpiry) {
        // Reset and start new window
        await supabase
          .from("login_attempts")
          .update({
            attempt_count: 1,
            first_attempt_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString(),
            locked_until: null,
          })
          .eq("identifier", identifier);
        return new Response(
          JSON.stringify({ remainingAttempts: MAX_ATTEMPTS - 1 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newCount = existing.attempt_count + 1;
      const shouldLock = newCount >= MAX_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000).toISOString()
        : null;

      await supabase
        .from("login_attempts")
        .update({
          attempt_count: newCount,
          last_attempt_at: new Date().toISOString(),
          locked_until: lockedUntil,
        })
        .eq("identifier", identifier);

      if (shouldLock) {
        console.log(`Account locked for identifier: ${identifier.substring(0, 5)}...`);
        return new Response(
          JSON.stringify({
            locked: true,
            lockoutMinutesRemaining: LOCKOUT_DURATION_MINUTES,
            message: `Too many failed attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ remainingAttempts: MAX_ATTEMPTS - newCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset") {
      await supabase.from("login_attempts").delete().eq("identifier", identifier);
      console.log(`Rate limit reset for identifier: ${identifier.substring(0, 5)}...`);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Rate limit error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
