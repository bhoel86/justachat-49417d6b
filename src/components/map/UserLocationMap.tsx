/// <reference types="@types/google.maps" />
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, Users, Globe, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  country_code: string;
  last_seen: string;
  profiles?: { username: string };
}

interface UserLocationMapProps {
  showControls?: boolean;
  height?: string;
}

const UserLocationMap = ({ showControls = true, height = "400px" }: UserLocationMapProps) => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        toast({
          title: "Map Error",
          description: "Failed to load Google Maps. Check your API key.",
          variant: "destructive"
        });
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8b5cf6" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f0f1a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
  }, [mapLoaded]);

  // Update markers when locations change
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;

      const isCurrentUser = loc.user_id === user?.id;
      
      const marker = new google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapInstanceRef.current!,
        title: loc.profiles?.username || 'Unknown User',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isCurrentUser ? 12 : 8,
          fillColor: isCurrentUser ? '#22c55e' : '#8b5cf6',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        animation: isCurrentUser ? google.maps.Animation.BOUNCE : undefined,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #1a1a2e; padding: 8px;">
            <strong>${loc.profiles?.username || 'Unknown'}</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
              ${loc.city}, ${loc.country}
            </p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #999;">
              Last seen: ${new Date(loc.last_seen).toLocaleString()}
            </p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });
  }, [locations, user?.id]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select(`
          id,
          user_id,
          latitude,
          longitude,
          city,
          region,
          country,
          country_code,
          last_seen
        `)
        .order('last_seen', { ascending: false });

      if (error) throw error;

      // Fetch usernames separately
      const userIds = data?.map(l => l.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const locationsWithProfiles = data?.map(loc => ({
        ...loc,
        profiles: profiles?.find(p => p.user_id === loc.user_id)
      })) || [];

      setLocations(locationsWithProfiles);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update current user's location
  const updateMyLocation = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to share your location.",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('geolocate', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Location Updated",
        description: `Your location has been updated: ${response.data.location.city}, ${response.data.location.country}`,
      });

      fetchLocations();
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: "Location Error",
        description: error.message || "Failed to update your location.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchLocations();

    const channel = supabase
      .channel('user_locations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_locations' },
        () => fetchLocations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLocations]);

  // Auto-update location on mount
  useEffect(() => {
    if (user) {
      updateMyLocation();
    }
  }, [user]);

  const uniqueCountries = [...new Set(locations.map(l => l.country))].length;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Live User Map
          </CardTitle>
          {showControls && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mr-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {locations.length} online
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {uniqueCountries} countries
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={updateMyLocation}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Update Location</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef} 
          style={{ height, width: '100%', borderRadius: '0.5rem' }}
          className="bg-secondary"
        >
          {!mapLoaded && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserLocationMap;