import React from 'react';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Monitor, Heart, Terminal, Check, Circle } from 'lucide-react';

// Theme-specific icon component
const ThemeIcon: React.FC<{ theme: ThemeName; className?: string }> = ({ theme, className = '' }) => {
  switch (theme) {
    case 'retro80s':
      return <Monitor className={className} />;
    case 'valentines':
      return <Heart className={className} />;
    case 'stpatricks':
      return <span className={`text-lg ${className}`}>☘️</span>;
    case 'matrix':
      return <Terminal className={className} />;
    default:
      return <Palette className={className} />;
  }
};

// Theme-specific button styling
const getThemeButtonStyles = (theme: ThemeName): string => {
  switch (theme) {
    case 'retro80s':
      return 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_15px_rgba(0,255,255,0.5),0_0_25px_rgba(255,0,255,0.3)]';
    case 'valentines':
      return 'text-pink-400 hover:text-pink-300 hover:bg-pink-400/10 animate-pulse';
    case 'stpatricks':
      return 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    case 'matrix':
      return 'text-green-500 hover:text-green-400 hover:bg-green-500/10 shadow-[0_0_10px_rgba(0,255,0,0.4)]';
    default:
      return 'text-primary hover:text-primary/80 hover:bg-primary/10';
  }
};

export const LoginThemeSelector: React.FC = () => {
  const { theme, previewTheme, themes } = useTheme();

  const handlePreviewTheme = (themeId: ThemeName) => {
    console.log('[LoginThemeSelector] Previewing theme:', themeId);
    previewTheme(themeId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative transition-all duration-300 ${getThemeButtonStyles(theme)}`}
        >
          <ThemeIcon theme={theme} className="h-5 w-5" />
          <span className="sr-only">Preview theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <div className="text-sm font-semibold text-muted-foreground mb-2 px-2">
          Preview Theme
        </div>
        <div className="space-y-1">
          {themes.map((t) => {
            const isActive = theme === t.id;
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                  isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent'
                }`}
                onClick={() => handlePreviewTheme(t.id)}
              >
                <div className="flex items-center gap-2">
                  <ThemeIcon theme={t.id} className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-3 px-2 border-t pt-2">
          Theme preview (local only)
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
