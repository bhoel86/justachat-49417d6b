import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { username, password, action = 'oper' } = await req.json();

    // Get oper password from secure environment variable
    const operPassword = Deno.env.get('OPER_PASSWORD');
    if (!operPassword) {
      console.error('OPER_PASSWORD secret not configured');
      return new Response(
        JSON.stringify({ error: 'Operator authentication not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password
    if (password !== operPassword) {
      console.log(`Oper auth failed for user ${user.id} - invalid password`);
      return new Response(
        JSON.stringify({ error: 'Invalid operator password' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile to verify username
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.username.toLowerCase() !== username.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Username does not match your current nick' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check current role
    const { data: currentRole } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    // Handle DEOPER action
    if (action === 'deoper') {
      if (!currentRole || currentRole.role === 'user') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'You are not currently an operator.',
            alreadyUser: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Cannot deoper an owner
      if (currentRole.role === 'owner') {
        return new Response(
          JSON.stringify({ error: 'Owners cannot remove their own status' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Demote to user
      const { error: updateError } = await serviceClient
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to remove oper status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to remove operator status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the action
      await serviceClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'deoper_auth',
        resource_type: 'moderation',
        resource_id: user.id,
        details: { method: 'password_auth', previous_role: currentRole.role, new_role: 'user', username: profile.username }
      });

      console.log(`Deoper successful for user ${user.id} (${profile.username})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `*** ${profile.username} is no longer an IRC Operator`,
          username: profile.username
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle OPER action (default)
    if (currentRole?.role === 'owner' || currentRole?.role === 'admin') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `You already have operator privileges (${currentRole.role})`,
          alreadyOper: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grant admin status using service role (bypasses RLS)
    const { error: upsertError } = await serviceClient
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Failed to grant oper status:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to grant operator status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the action
    await serviceClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'oper_auth',
      resource_type: 'moderation',
      resource_id: user.id,
      details: { method: 'password_auth', new_role: 'admin', username: profile.username }
    });

    console.log(`Oper auth successful for user ${user.id} (${profile.username})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `*** ${profile.username} is now an IRC Operator`,
        username: profile.username
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Oper auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
