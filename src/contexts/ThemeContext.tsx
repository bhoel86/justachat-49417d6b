/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isPreviewHost } from '@/lib/previewHost';

export type ThemeName = 'jac' | 'retro80s' | 'valentines' | 'stpatricks' | 'matrix' | 'vapor' | 'arcade' | 'dieselpunk' | 'cyberpunk' | 'jungle';

interface ThemeContextType {
  theme: ThemeName;
  globalTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  setPersonalTheme: (theme: ThemeName | null) => void;
  themes: { id: ThemeName; name: string; description: string }[];
  isLoading: boolean;
  personalTheme: ThemeName | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES = [
  { id: 'jac' as ThemeName, name: 'OG Theme', description: 'The original Justachat look' },
  { id: 'retro80s' as ThemeName, name: '80s Retro', description: 'Retro Windows 95/98 aesthetic' },
  { id: 'valentines' as ThemeName, name: "Valentine's", description: 'Romantic pink hearts theme' },
  { id: 'stpatricks' as ThemeName, name: "St. Patrick's", description: 'Irish shamrocks & gold' },
  { id: 'matrix' as ThemeName, name: 'Simulation', description: 'Follow the white rabbit' },
  { id: 'vapor' as ThemeName, name: 'Vaporwave OS', description: '1990s cyber OS aesthetic' },
  { id: 'arcade' as ThemeName, name: 'Retro Arcade', description: 'Neon arcade cabinet vibes' },
  { id: 'dieselpunk' as ThemeName, name: 'Dieselpunk', description: 'Medieval steampunk brass' },
  { id: 'cyberpunk' as ThemeName, name: 'Cyberpunk City', description: 'Neon city glitch effects' },
  { id: 'jungle' as ThemeName, name: 'Jungle Expedition', description: 'Tropical wildlife adventure' },
];

const isValidTheme = (value: string): value is ThemeName => {
  return ['jac', 'retro80s', 'valentines', 'stpatricks', 'matrix', 'vapor', 'arcade', 'dieselpunk', 'cyberpunk', 'jungle'].includes(value);
};

// Session storage key for local preview mode (set by LoginThemeSelector)
const LOCAL_PREVIEW_KEY = 'jac_local_theme_preview';
// localStorage key for personal theme (persists across tabs but cleared on logout)
const PERSONAL_THEME_KEY = 'jac_personal_theme';

const getLocalPreviewTheme = (): ThemeName | null => {
  if (typeof sessionStorage === 'undefined') return null;
  const localPreview = sessionStorage.getItem(LOCAL_PREVIEW_KEY);
  if (localPreview && isValidTheme(localPreview)) return localPreview;
  return null;
};

const isLocalPreviewActive = () => {
  if (typeof sessionStorage === 'undefined') return false;
  if (!isPreviewHost()) return false;
  return !!getLocalPreviewTheme();
};

const applyThemeClass = (theme: ThemeName) => {
  if (typeof document !== 'undefined') {
    if (isLocalPreviewActive()) {
      console.log('[Theme] Skipping apply - local preview active');
      return;
    }
    document.documentElement.classList.remove('theme-jac', 'theme-retro80s', 'theme-valentines', 'theme-stpatricks', 'theme-matrix', 'theme-vapor', 'theme-arcade', 'theme-dieselpunk', 'theme-cyberpunk', 'theme-jungle');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('jac-theme', theme);
    console.log('[Theme] Applied:', theme);
  }
};

const getInitialTheme = (): ThemeName => {
  const localPreview = getLocalPreviewTheme();
  if (localPreview) return localPreview;
  // Check for cached personal theme (fast hydration for logged-in users)
  if (typeof localStorage !== 'undefined') {
    const personal = localStorage.getItem(PERSONAL_THEME_KEY);
    if (personal && isValidTheme(personal)) return personal;
    const cached = localStorage.getItem('jac-theme');
    if (cached && isValidTheme(cached)) return cached;
  }
  return 'jac';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);
  const [globalTheme, setGlobalTheme] = useState<ThemeName>('jac');
  const [personalTheme, setPersonalThemeState] = useState<ThemeName | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastUserChangeRef = React.useRef<number>(0);

  // Listen for local preview changes from LoginThemeSelector
  useEffect(() => {
    const handleStorageChange = () => {
      const localPreview = sessionStorage.getItem(LOCAL_PREVIEW_KEY);
      if (localPreview && isValidTheme(localPreview)) {
        setThemeState(localPreview);
      }
    };
    const interval = setInterval(handleStorageChange, 500);
    return () => clearInterval(interval);
  }, []);

  // Determine the effective theme: personal > global
  const resolveEffectiveTheme = (personal: ThemeName | null, global: ThemeName): ThemeName => {
    return personal ?? global;
  };

  // Fetch global theme + personal theme on mount
  useEffect(() => {
    let isMounted = true;

    const fetchThemes = async () => {
      const localPreview = getLocalPreviewTheme();
      if (localPreview) {
        if (isMounted) {
          setThemeState(localPreview);
          setIsLoading(false);
        }
        return;
      }

      const timeSinceUserChange = Date.now() - lastUserChangeRef.current;
      if (timeSinceUserChange < 5000) {
        console.log('[Theme] Skipping poll - user changed theme recently');
        return;
      }

      try {
        // Fetch global site theme
        const { data: siteData, error: siteError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'theme')
          .maybeSingle();

        if (siteError) {
          console.warn('[Theme] Failed to fetch global theme:', siteError.message);
        }

        let fetchedGlobal: ThemeName = 'jac';
        if (siteData && isValidTheme(siteData.value)) {
          fetchedGlobal = siteData.value;
        }

        if (!isMounted) return;
        setGlobalTheme(fetchedGlobal);

        // Fetch personal theme if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        let fetchedPersonal: ThemeName | null = null;

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('preferred_theme')
            .eq('user_id', session.user.id)
            .single();

          if (profileData?.preferred_theme && isValidTheme(profileData.preferred_theme)) {
            fetchedPersonal = profileData.preferred_theme;
          }
        }

        if (!isMounted) return;
        setPersonalThemeState(fetchedPersonal);

        // Cache personal theme for fast hydration
        if (fetchedPersonal) {
          localStorage.setItem(PERSONAL_THEME_KEY, fetchedPersonal);
        } else {
          localStorage.removeItem(PERSONAL_THEME_KEY);
        }

        const effective = resolveEffectiveTheme(fetchedPersonal, fetchedGlobal);
        console.log('[Theme] Resolved:', { global: fetchedGlobal, personal: fetchedPersonal, effective });
        setThemeState(effective);
        applyThemeClass(effective);
      } catch (err) {
        console.warn('[Theme] Error fetching themes:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchThemes();

    // Realtime for global theme changes
    const channel = supabase
      .channel('site-settings-theme')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.theme'
        },
        (payload) => {
          if (getLocalPreviewTheme()) return;
          const timeSinceUserChange = Date.now() - lastUserChangeRef.current;
          if (timeSinceUserChange < 5000) return;

          const newValue = (payload.new as { value?: string })?.value;
          if (newValue && isValidTheme(newValue)) {
            console.log('[Theme] Realtime global update:', newValue);
            setGlobalTheme(newValue);
            // Only apply if user has no personal theme
            setPersonalThemeState(current => {
              if (!current) {
                setThemeState(newValue);
                applyThemeClass(newValue);
              }
              return current;
            });
          }
        }
      )
      .subscribe();

    // Listen for auth changes to load/clear personal theme
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        console.log('[Theme] User signed out, reverting to global theme');
        setPersonalThemeState(null);
        localStorage.removeItem(PERSONAL_THEME_KEY);
        setThemeState(prev => {
          // Use current globalTheme
          setGlobalTheme(g => {
            applyThemeClass(g);
            setThemeState(g);
            return g;
          });
          return prev;
        });
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Fetch personal theme for newly signed-in user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('preferred_theme')
          .eq('user_id', session.user.id)
          .single();

        if (!isMounted) return;

        if (profileData?.preferred_theme && isValidTheme(profileData.preferred_theme)) {
          const personal = profileData.preferred_theme;
          setPersonalThemeState(personal);
          localStorage.setItem(PERSONAL_THEME_KEY, personal);
          setThemeState(personal);
          applyThemeClass(personal);
          console.log('[Theme] Loaded personal theme on login:', personal);
        }
      }
    });

    const pollInterval = window.setInterval(() => {
      fetchThemes();
    }, 10_000);

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  // Owner sets GLOBAL theme (affects all users)
  const setTheme = async (newTheme: ThemeName) => {
    console.log('[Theme] Owner setting global theme to:', newTheme);
    const previousGlobal = globalTheme;
    lastUserChangeRef.current = Date.now();

    setGlobalTheme(newTheme);
    // If this user has no personal theme, apply immediately
    if (!personalTheme) {
      setThemeState(newTheme);
      applyThemeClass(newTheme);
    }

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'theme', value: newTheme, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('[Theme] Failed to save global theme:', error.message);
      setGlobalTheme(previousGlobal);
      if (!personalTheme) {
        setThemeState(previousGlobal);
        applyThemeClass(previousGlobal);
      }
      toast.error('Could not set global theme', { description: error.message, duration: 6000 });
    } else {
      toast.success('Global theme updated', { description: 'Changes apply to all users site-wide.', duration: 4000 });
    }
  };

  // User sets PERSONAL theme (affects only them)
  const setPersonalTheme = async (newTheme: ThemeName | null) => {
    console.log('[Theme] User setting personal theme to:', newTheme);
    lastUserChangeRef.current = Date.now();

    const previousPersonal = personalTheme;
    setPersonalThemeState(newTheme);

    const effective = resolveEffectiveTheme(newTheme, globalTheme);
    setThemeState(effective);
    applyThemeClass(effective);

    if (newTheme) {
      localStorage.setItem(PERSONAL_THEME_KEY, newTheme);
    } else {
      localStorage.removeItem(PERSONAL_THEME_KEY);
    }

    // Save to profile
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_theme: newTheme })
      .eq('user_id', session.user.id);

    if (error) {
      console.error('[Theme] Failed to save personal theme:', error.message);
      setPersonalThemeState(previousPersonal);
      const reverted = resolveEffectiveTheme(previousPersonal, globalTheme);
      setThemeState(reverted);
      applyThemeClass(reverted);
      toast.error('Could not save your theme preference', { description: error.message, duration: 4000 });
    } else {
      if (newTheme) {
        toast.success('Personal theme saved', { description: 'This theme applies only to you.', duration: 3000 });
      } else {
        toast.success('Using site default theme', { description: 'Your theme now matches the global setting.', duration: 3000 });
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, globalTheme, setTheme, setPersonalTheme, themes: THEMES, isLoading, personalTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
