/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Automatically track user location via IP on login
// Updates every 30 minutes while the user is active
export const useAutoLocation = () => {
  const { user } = useAuth();
  const lastUpdateRef = useRef<number>(0);
  const UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    if (!user) return;

    const updateLocation = async () => {
      const now = Date.now();
      
      // Throttle updates to every 30 minutes
      if (now - lastUpdateRef.current < UPDATE_INTERVAL) {
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        await supabase.functions.invoke('geolocate', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        lastUpdateRef.current = now;
        console.log('Location updated automatically via IP');
      } catch (error) {
        // Silent fail - location tracking is non-critical
        console.error('Auto location update failed:', error);
      }
    };

    // Update on mount (login)
    updateLocation();

    // Update periodically while active
    const interval = setInterval(updateLocation, UPDATE_INTERVAL);

    // Update on visibility change (when tab becomes visible)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateLocation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);
};
