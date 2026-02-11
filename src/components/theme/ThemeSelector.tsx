/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Check, Circle, RotateCcw } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, globalTheme, setTheme, setPersonalTheme, themes, personalTheme } = useTheme();
  const { isOwner, user } = useAuth();

  // Only show to logged-in users
  if (!user) return null;

  const handleSetGlobalTheme = (themeId: typeof theme) => {
    console.log('[ThemeSelector] Owner setting global theme to:', themeId);
    setTheme(themeId);
  };

  const handleSetPersonalTheme = (themeId: typeof theme) => {
    console.log('[ThemeSelector] User setting personal theme to:', themeId);
    setPersonalTheme(themeId);
  };

  const handleResetToGlobal = () => {
    console.log('[ThemeSelector] Resetting to global theme');
    setPersonalTheme(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Select theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        {/* Owner: Global theme section */}
        {isOwner && (
          <>
            <div className="text-sm font-semibold text-muted-foreground mb-2 px-2">
              🌐 Global Site Theme
            </div>
            <ScrollArea className="h-[200px] pr-2">
              <div className="space-y-1 pr-2">
                {themes.map((t) => {
                  const isActive = globalTheme === t.id;
                  return (
                    <div
                      key={`global-${t.id}`}
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && <Check className="h-4 w-4 text-primary" />}
                        <Button
                          size="sm"
                          variant={isActive ? "secondary" : "default"}
                          onClick={() => handleSetGlobalTheme(t.id)}
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
            <div className="text-xs text-muted-foreground mt-2 px-2 border-t pt-2 mb-2">
              Changes apply to all users site-wide
            </div>
          </>
        )}

        {/* Personal theme section (all logged-in users) */}
        <div className="text-sm font-semibold text-muted-foreground mb-2 px-2 flex items-center justify-between">
          <span>🎨 My Theme</span>
          {personalTheme && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetToGlobal}
              className="text-xs h-6 px-2 gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Use Default
            </Button>
          )}
        </div>
        <ScrollArea className={isOwner ? "h-[150px] pr-2" : "h-[300px] pr-2"}>
          <div className="space-y-1 pr-2">
            {themes.map((t) => {
              const isActive = theme === t.id;
              const isPersonalChoice = personalTheme === t.id;
              return (
                <div
                  key={`personal-${t.id}`}
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
                    {isPersonalChoice && <Check className="h-4 w-4 text-primary" />}
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "default"}
                      onClick={() => handleSetPersonalTheme(t.id)}
                      disabled={isPersonalChoice}
                      className="text-xs h-7 px-3"
                    >
                      {isPersonalChoice ? 'Mine' : 'Use'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="text-xs text-muted-foreground mt-2 px-2 border-t pt-2">
          {personalTheme
            ? 'Your personal theme overrides the site default'
            : `Using site default: ${themes.find(t => t.id === globalTheme)?.name ?? globalTheme}`
          }
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
