import React, { createContext, useContext, useEffect, useState, useLayoutEffect } from 'react';

export type ThemeName = 'jac' | 'retro80s' | 'valentines' | 'stpatricks' | 'matrix';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { id: ThemeName; name: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES = [
  { id: 'jac' as ThemeName, name: 'OG Theme', description: 'The original Justachat look' },
  { id: 'retro80s' as ThemeName, name: '80s Retro', description: 'Retro Windows 95/98 aesthetic' },
  { id: 'valentines' as ThemeName, name: "Valentine's", description: 'Romantic pink hearts theme' },
  { id: 'stpatricks' as ThemeName, name: "St. Patrick's", description: 'Irish shamrocks & gold' },
  { id: 'matrix' as ThemeName, name: 'The Matrix', description: 'Follow the white rabbit' },
];

const getStoredTheme = (): ThemeName => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('jac-theme');
      if (saved === 'jac' || saved === 'retro80s' || saved === 'valentines' || saved === 'stpatricks' || saved === 'matrix') {
        return saved;
      }
    } catch (e) {
      // localStorage not available
    }
  }
  return 'jac';
};

const applyThemeClass = (theme: ThemeName) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('theme-jac', 'theme-retro80s', 'theme-valentines', 'theme-stpatricks', 'theme-matrix');
    document.documentElement.classList.add(`theme-${theme}`);
    console.log('[Theme] Applied:', theme, document.documentElement.classList.toString());
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>('jac');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage on mount
  useLayoutEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyThemeClass(stored);
    setIsInitialized(true);
  }, []);

  // Apply theme class whenever theme changes
  useLayoutEffect(() => {
    if (isInitialized) {
      applyThemeClass(theme);
    }
  }, [theme, isInitialized]);

  const setTheme = (newTheme: ThemeName) => {
    console.log('[Theme] Setting theme to:', newTheme);
    setThemeState(newTheme);
    try {
      localStorage.setItem('jac-theme', newTheme);
      console.log('[Theme] Saved to localStorage');
    } catch (e) {
      console.warn('[Theme] Failed to save to localStorage:', e);
    }
    applyThemeClass(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
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
