import React, { createContext, useContext, useEffect, useState, useLayoutEffect } from 'react';

export type ThemeName = 'jac' | 'retro80s';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: { id: ThemeName; name: string; description: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEMES = [
  { id: 'jac' as ThemeName, name: 'JAC Modern', description: 'Clean, dark modern chat theme' },
  { id: 'retro80s' as ThemeName, name: '80s Retro', description: 'Retro Windows 95/98 aesthetic' },
];

const getStoredTheme = (): ThemeName => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('jac-theme');
      if (saved === 'jac' || saved === 'retro80s') {
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
    document.documentElement.classList.remove('theme-jac', 'theme-retro80s');
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
