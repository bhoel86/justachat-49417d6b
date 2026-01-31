import React, { createContext, useContext, useEffect, useState, useLayoutEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeName = 'jac' | 'retro80s' | 'valentines' | 'stpatricks' | 'matrix';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { id: ThemeName; name: string; description: string }[];
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES = [
  { id: 'jac' as ThemeName, name: 'OG Theme', description: 'The original Justachat look' },
  { id: 'retro80s' as ThemeName, name: '80s Retro', description: 'Retro Windows 95/98 aesthetic' },
  { id: 'valentines' as ThemeName, name: "Valentine's", description: 'Romantic pink hearts theme' },
  { id: 'stpatricks' as ThemeName, name: "St. Patrick's", description: 'Irish shamrocks & gold' },
  { id: 'matrix' as ThemeName, name: 'The Matrix', description: 'Follow the white rabbit' },
];

const isValidTheme = (value: string): value is ThemeName => {
  return ['jac', 'retro80s', 'valentines', 'stpatricks', 'matrix'].includes(value);
};

const applyThemeClass = (theme: ThemeName) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('theme-jac', 'theme-retro80s', 'theme-valentines', 'theme-stpatricks', 'theme-matrix');
    document.documentElement.classList.add(`theme-${theme}`);
    console.log('[Theme] Applied:', theme);
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>('jac');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch global theme from database on mount
  useEffect(() => {
    let isMounted = true;

    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'theme')
          .single();

        if (error) {
          console.warn('[Theme] Failed to fetch from DB:', error.message);
          return;
        }

        if (!isMounted) return;

        if (data && isValidTheme(data.value)) {
          const nextTheme: ThemeName = data.value;
          console.log('[Theme] Loaded from DB:', nextTheme);
          setThemeState((prev) => {
            if (prev !== nextTheme) applyThemeClass(nextTheme);
            return nextTheme;
          });
        }
      } catch (err) {
        console.warn('[Theme] Error fetching theme:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTheme();

    // Subscribe to realtime changes so all users see updates instantly (when realtime is available)
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
          console.log('[Theme] Realtime update:', payload);
          const newValue = (payload.new as { value?: string })?.value;
          if (newValue && isValidTheme(newValue)) {
            setThemeState(newValue);
            applyThemeClass(newValue);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Theme] Realtime status:', status);
      });

    // VPS-safe fallback: poll occasionally in case websocket/realtime isn't working.
    // This ensures cross-browser/device sync still happens (just not instant).
    const pollInterval = window.setInterval(() => {
      fetchTheme();
    }, 10_000);

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply theme class whenever theme changes
  useLayoutEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const setTheme = async (newTheme: ThemeName) => {
    console.log('[Theme] Owner setting theme to:', newTheme);
    
    // Optimistically update local state
    setThemeState(newTheme);
    applyThemeClass(newTheme);

    // Persist to database (only owners can do this due to RLS)
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: 'theme', value: newTheme, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('[Theme] Failed to save to DB:', error.message);
      // Note: Non-owners will get an RLS error, which is expected
    } else {
      console.log('[Theme] Saved to DB');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, isLoading }}>
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
