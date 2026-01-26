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

    // Klipy API format: https://api.klipy.com/api/v1/{API_KEY}/gifs/{endpoint}
    let url: string;
    if (trending) {
      url = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/gifs/trending?limit=${limit}`;
    } else {
      url = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/gifs/search?q=${encodeURIComponent(query || '')}&limit=${limit}`;
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
    // Klipy returns data.gifs array with each gif having urls object
    const gifs = data.gifs || data.results || [];
    const results = gifs.map((item: any) => ({
      id: item.id || item.slug || crypto.randomUUID(),
      title: item.title || item.alt || '',
      preview: item.urls?.thumbnail || item.urls?.fixed_width || item.urls?.original || '',
      url: item.urls?.original || item.urls?.fixed_width || item.urls?.thumbnail || '',
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
