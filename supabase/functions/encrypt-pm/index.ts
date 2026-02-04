import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Encrypt using Web Crypto API with the server-side master key
async function encryptMessage(message: string, masterKey: string): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Derive a 256-bit key from the master key
  const keyData = encoder.encode(masterKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
         JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated - use getUser() for VPS compatibility
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user?.id) {
      console.error('Auth error:', userError?.message || 'No user');
      return new Response(
         JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

     // Parse request body (accept both old + new payload shapes)
     const body = await req.json().catch(() => ({} as Record<string, unknown>));
     const message = (body as any).message ?? (body as any).content;
     const recipient_id = (body as any).recipient_id ?? (body as any).recipientId;

     if (!message || !recipient_id) {
      return new Response(
         JSON.stringify({ success: false, error: 'Missing message or recipient_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get master key from secrets
    const masterKey = Deno.env.get('PM_MASTER_KEY');
    if (!masterKey) {
      console.error('PM_MASTER_KEY not configured');
      return new Response(
         JSON.stringify({ success: false, error: 'Encryption service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt the message server-side
     const { ciphertext, iv } = await encryptMessage(String(message), masterKey);

    // Store in database using service role
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: insertData, error: dbError } = await serviceClient
      .from('private_messages')
      .insert({
        sender_id: userId,
        recipient_id: recipient_id,
        encrypted_content: ciphertext,
        iv: iv
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
       return new Response(
         JSON.stringify({ success: false, error: 'Failed to store message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`PM stored: ${userId} -> ${recipient_id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message_id: insertData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Encrypt PM error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});