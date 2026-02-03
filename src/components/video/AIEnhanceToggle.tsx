/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

interface AIEnhanceToggleProps {
  isEnabled: boolean;
  strength: number;
  beautyMode: boolean;
  softFocus: number;
  warmth: number;
  isLoading?: boolean;
  onToggle: () => void;
  onStrengthChange: (value: number) => void;
  onBeautyModeToggle: () => void;
  onSoftFocusChange: (value: number) => void;
  onWarmthChange: (value: number) => void;
}

const AIEnhanceToggle = ({ 
  isEnabled, 
  strength,
  beautyMode,
  softFocus,
  warmth,
  isLoading = false, 
  onToggle,
  onStrengthChange,
  onBeautyModeToggle,
  onSoftFocusChange,
  onWarmthChange,
}: AIEnhanceToggleProps) => {
  const isActive = isEnabled || beautyMode;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          disabled={isLoading}
          className={`h-7 text-xs ${isActive ? 'bg-primary hover:bg-primary/90' : ''}`}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          AI Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-popover border border-border z-50" align="end">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">AI Video Filters</h4>
          
          {/* Enhancement Section */}
          <div className="space-y-3 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="enhance" className="text-xs font-medium">Enhancement</Label>
              <Switch
                id="enhance"
                checked={isEnabled}
                onCheckedChange={onToggle}
              />
            </div>
            
            {isEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Strength</span>
                  <span className="font-mono">{strength}%</span>
                </div>
                <Slider
                  value={[strength]}
                  onValueChange={(v) => onStrengthChange(v[0])}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-[10px] text-muted-foreground">
                  Boosts contrast, saturation & clarity
                </p>
              </div>
            )}
          </div>
          
          {/* Beauty Mode Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="beauty" className="text-xs font-medium">✨ Beauty Mode</Label>
              <Switch
                id="beauty"
                checked={beautyMode}
                onCheckedChange={onBeautyModeToggle}
              />
            </div>
            
            {beautyMode && (
              <div className="space-y-3">
                {/* Soft Focus - for blemishes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Soft Focus</span>
                    <span className="font-mono">{softFocus}%</span>
                  </div>
                  <Slider
                    value={[softFocus]}
                    onValueChange={(v) => onSoftFocusChange(v[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Smooths skin & reduces blemishes
                  </p>
                </div>
                
                {/* Warmth - for dark circles */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Warmth</span>
                    <span className="font-mono">{warmth}%</span>
                  </div>
                  <Slider
                    value={[warmth]}
                    onValueChange={(v) => onWarmthChange(v[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Warms shadows & reduces dark circles
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AIEnhanceToggle;
