import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLIPY_API_KEY = Deno.env.get('KLIPY_API_KEY');
    if (!KLIPY_API_KEY) {
      throw new Error('KLIPY_API_KEY not configured');
    }

    const { query, trending, limit = 20 } = await req.json();

    let url: string;
    if (trending) {
      url = `https://partner.klipy.com/v1/trending?key=${KLIPY_API_KEY}&limit=${limit}&mediaFilter=gif`;
    } else {
      url = `https://partner.klipy.com/v1/search?key=${KLIPY_API_KEY}&q=${encodeURIComponent(query || '')}&limit=${limit}&mediaFilter=gif`;
    }

    console.log(`Fetching GIFs: ${trending ? 'trending' : `search: ${query}`}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klipy API error:', response.status, errorText);
      throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map Klipy response to our format
    const results = (data.results || []).map((item: any) => ({
      id: item.id || crypto.randomUUID(),
      title: item.title || '',
      preview: item.media_formats?.tinygif?.url || item.media_formats?.gif?.url || '',
      url: item.media_formats?.gif?.url || item.media_formats?.tinygif?.url || '',
    }));

    console.log(`Found ${results.length} GIFs`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('GIF search error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
