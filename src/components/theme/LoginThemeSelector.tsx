import React, { useState, useEffect } from 'react';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Check, Circle } from 'lucide-react';
import { isPreviewHost } from '@/lib/previewHost';

// Session storage key to mark local preview mode
const LOCAL_PREVIEW_KEY = 'jac_local_theme_preview';

// Only show in preview environments
const isPreview = () => {
  return isPreviewHost();
};

// Apply theme class locally without database persistence
const applyLocalTheme = (theme: ThemeName) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove(
      'theme-jac', 'theme-retro80s', 'theme-valentines', 'theme-stpatricks', 
      'theme-matrix', 'theme-vapor', 'theme-arcade', 'theme-dieselpunk', 
      'theme-cyberpunk', 'theme-jungle'
    );
    document.documentElement.classList.add(`theme-${theme}`);
    // Store in sessionStorage so ThemeContext knows not to overwrite
    sessionStorage.setItem(LOCAL_PREVIEW_KEY, theme);
    console.log('[LoginThemeSelector] Applied local theme:', theme);
  }
};

export const LoginThemeSelector: React.FC = () => {
  const { theme: globalTheme, themes } = useTheme();
  const [localTheme, setLocalTheme] = useState<ThemeName>(() => {
    // Check if there's already a local preview theme
    const stored = sessionStorage.getItem(LOCAL_PREVIEW_KEY);
    return (stored as ThemeName) || globalTheme;
  });

  // On mount, re-apply the local theme if one was set
  useEffect(() => {
    const stored = sessionStorage.getItem(LOCAL_PREVIEW_KEY);
    if (stored && isPreview()) {
      applyLocalTheme(stored as ThemeName);
    }
  }, []);

  // Only render in preview
  if (!isPreview()) {
    return null;
  }

  const handleSetTheme = (themeId: ThemeName) => {
    console.log('[LoginThemeSelector] Preview-only theme:', themeId);
    setLocalTheme(themeId);
    applyLocalTheme(themeId);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm border-primary/30">
            <Palette className="h-5 w-5" />
            <span className="sr-only">Preview themes</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-2">
          <div className="text-sm font-semibold text-muted-foreground mb-2 px-2">
            Preview Themes (Local Only)
          </div>
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-1 pr-2">
              {themes.map((t) => {
                const isActive = localTheme === t.id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Circle 
                        className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                        fill="currentColor"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{t.name}</span>
                        <span className="text-xs text-muted-foreground">{t.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                      <Button
                        size="sm"
                        variant={isActive ? "secondary" : "default"}
                        onClick={() => handleSetTheme(t.id)}
                        disabled={isActive}
                        className="text-xs h-7 px-3"
                      >
                        {isActive ? 'Active' : 'Set'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="text-xs text-muted-foreground mt-3 px-2 border-t pt-2">
            Preview only – won't affect production
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
