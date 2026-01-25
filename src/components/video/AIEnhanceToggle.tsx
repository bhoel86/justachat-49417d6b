import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AIEnhanceToggleProps {
  isEnabled: boolean;
  strength: number;
  isLoading?: boolean;
  onToggle: () => void;
  onStrengthChange: (value: number) => void;
}

const AIEnhanceToggle = ({ 
  isEnabled, 
  strength,
  isLoading = false, 
  onToggle,
  onStrengthChange 
}: AIEnhanceToggleProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={isEnabled ? "default" : "outline"}
          size="sm"
          disabled={isLoading}
          className={`h-7 text-xs ${isEnabled ? 'bg-primary hover:bg-primary/90' : ''}`}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          AI {isEnabled ? `${strength}%` : 'Enhance'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-popover border border-border z-50" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Enhancement</span>
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggle}
              className="h-6 text-xs px-2"
            >
              {isEnabled ? 'On' : 'Off'}
            </Button>
          </div>
          
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
              disabled={!isEnabled}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Subtle</span>
              <span>Medium</span>
              <span>Strong</span>
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground">
            Enhances contrast, saturation & brightness for clearer video.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AIEnhanceToggle;
