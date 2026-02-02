import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Decrypt using Web Crypto API
async function decryptMessage(ciphertext: string, iv: string, masterKey: string): Promise<string> {
  try {
    // Derive a 256-bit key from the master key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(masterKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decode base64 ciphertext and IV
    const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      cryptoKey,
      ciphertextBytes
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated (signing-keys compatible)
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  const userId = claimsData.claims.sub;

  // Create service client for lookups
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Parse request body
  const { messageId, encrypted_content, iv } = await req.json();

  if (!encrypted_content || !iv) {
    return new Response(
      JSON.stringify({ error: 'Missing encrypted_content or iv' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if user is admin/owner
  const { data: roleData } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  const isAdmin = roleData?.role === 'admin' || roleData?.role === 'owner';

  // If not admin, verify user is a participant in this message
  if (!isAdmin) {
    if (!messageId) {
      return new Response(
        JSON.stringify({ error: 'Message ID required for non-admin decryption' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is sender or recipient
    const { data: messageData, error: msgError } = await serviceClient
      .from('private_messages')
      .select('sender_id, recipient_id')
      .eq('id', messageId)
      .single();

    if (msgError || !messageData) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messageData.sender_id !== userId && messageData.recipient_id !== userId) {
      console.log(`User ${userId} attempted to decrypt message ${messageId} they don't own`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - not a participant in this message' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

    // Get master key from secrets
    const masterKey = Deno.env.get('PM_MASTER_KEY');
    if (!masterKey) {
      console.error('PM_MASTER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Decryption service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the message
    const decryptedContent = await decryptMessage(encrypted_content, iv, masterKey);

  // Log the decryption action for audit (only for admin decryptions, not regular user reads)
  if (isAdmin) {
    await serviceClient.from('audit_logs').insert({
      user_id: userId,
      action: 'decrypt_pm',
      resource_type: 'private_message',
      resource_id: messageId || null,
      details: { decrypted_at: new Date().toISOString(), admin_access: true }
    });
    console.log(`Admin ${userId} decrypted message ${messageId || 'unknown'}`);
  }

    return new Response(
      JSON.stringify({ 
        success: true, 
        decrypted_content: decryptedContent 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Decrypt PM error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
