import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Check if user is an owner for debug mode
async function isOwner(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) return false;
    
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    return roleData?.role === 'owner';
  } catch {
    return false;
  }
}

// IMPORTANT (VPS router compatibility): this function must call Deno.serve() at module top-level.
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, debug } = await req.json();
    const authHeader = req.headers.get('authorization');
    const isDebugMode = debug && await isOwner(authHeader);

    if (!token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing CAPTCHA token',
          debug: isDebugMode ? { reason: 'No token provided in request body' } : undefined
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CAPTCHA verification not configured',
          debug: isDebugMode ? { reason: 'TURNSTILE_SECRET_KEY environment variable not set' } : undefined
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Cloudflare
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const verifyResult = await verifyResponse.json();
    
    console.log('Turnstile verification result:', verifyResult.success, verifyResult['error-codes']);

    if (verifyResult.success) {
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Map error codes to human-readable messages
      const errorCodeMap: Record<string, string> = {
        'missing-input-secret': 'Server configuration error: Secret key missing',
        'invalid-input-secret': 'Server configuration error: Invalid secret key',
        'missing-input-response': 'CAPTCHA response token missing',
        'invalid-input-response': 'CAPTCHA token invalid or expired',
        'bad-request': 'Malformed verification request',
        'timeout-or-duplicate': 'CAPTCHA expired or already used - please refresh and try again',
        'internal-error': 'Cloudflare internal error - please try again',
      };
      
      const codes = verifyResult['error-codes'] || [];
      const humanErrors = codes.map((code: string) => errorCodeMap[code] || code);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CAPTCHA verification failed',
          codes: codes,
          debug: isDebugMode ? {
            errorCodes: codes,
            humanReadable: humanErrors,
            hostname: verifyResult.hostname,
            challengeTs: verifyResult.challenge_ts,
            action: verifyResult.action,
          } : undefined
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    const authHeader = req.headers.get('authorization');
    const isDebugMode = await isOwner(authHeader);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Verification failed',
        debug: isDebugMode ? { 
          exception: error instanceof Error ? error.message : String(error)
        } : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});