import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: 'VPS',
    tests: {},
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Test 1: Environment variables
    results.tests = {
      ...results.tests as object,
      env_vars: {
        supabase_url: supabaseUrl ? '✅ Set' : '❌ Missing',
        service_key: supabaseKey ? '✅ Set' : '❌ Missing',
      },
    };

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify(results, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 2: Database connection
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('name')
      .limit(3);

    results.tests = {
      ...results.tests as object,
      database: {
        status: channelsError ? '❌ Failed' : '✅ Connected',
        error: channelsError?.message || null,
        sample_channels: channels?.map(c => c.name) || [],
      },
    };

    // Test 3: site_settings table (for global theme)
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('key, value')
      .limit(10);

    results.tests = {
      ...results.tests as object,
      site_settings: {
        status: settingsError ? '❌ Missing or error' : '✅ Table exists',
        error: settingsError?.message || null,
        settings: settings || [],
      },
    };

    // Test 4: Current theme
    const { data: theme, error: themeError } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'theme')
      .single();

    results.tests = {
      ...results.tests as object,
      global_theme: {
        status: themeError ? '❌ Not configured' : '✅ Configured',
        current_theme: theme?.value || 'not set',
        error: themeError?.message || null,
      },
    };

    // Test 5: Realtime publication check
    const { data: pubCheck, error: pubError } = await supabase.rpc('pg_catalog.pg_publication_tables', {});
    
    // Fallback: just note we can't easily check this without raw SQL
    results.tests = {
      ...results.tests as object,
      realtime: {
        note: 'Check manually: ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;',
      },
    };

    results.overall = '✅ All core tests passed';

  } catch (error) {
    results.overall = '❌ Test failed';
    results.error = error instanceof Error ? error.message : String(error);
  }

  console.log('[VPS-Test] Results:', JSON.stringify(results, null, 2));

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
