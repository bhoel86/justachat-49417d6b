import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoData {
  ip: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create supabase client with user's token to get their ID
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the client's IP from headers (Cloudflare/proxy) or request
    let clientIp = req.headers.get('cf-connecting-ip') || 
                   req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('x-real-ip') ||
                   '8.8.8.8'; // fallback for testing

    console.log(`Getting geolocation for user ${user.id}, IP: ${clientIp}`);

    // Use ip-api.com (free, no API key required)
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,query`);
    const geoData = await geoResponse.json();

    console.log('Geo API response:', geoData);

    if (geoData.status !== 'success') {
      console.error('Geo API error:', geoData.message);
      return new Response(
        JSON.stringify({ error: 'Could not determine location', details: geoData.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client to upsert location
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a location record
    const { data: existingLocation } = await serviceClient
      .from('user_locations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const locationData = {
      user_id: user.id,
      ip_address: geoData.query,
      latitude: geoData.lat,
      longitude: geoData.lon,
      city: geoData.city,
      region: geoData.regionName,
      country: geoData.country,
      country_code: geoData.countryCode,
      timezone: geoData.timezone,
      isp: geoData.isp,
      last_seen: new Date().toISOString(),
    };

    let result;
    if (existingLocation) {
      // Update existing record
      result = await serviceClient
        .from('user_locations')
        .update(locationData)
        .eq('id', existingLocation.id)
        .select()
        .single();
    } else {
      // Insert new record
      result = await serviceClient
        .from('user_locations')
        .insert(locationData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return new Response(
        JSON.stringify({ error: 'Failed to save location', details: result.error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Location saved successfully:', result.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        location: result.data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Geolocate function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});