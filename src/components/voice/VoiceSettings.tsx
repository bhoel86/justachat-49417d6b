import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Mic, Camera, Sparkles } from 'lucide-react';

interface VoiceSettingsProps {
  isPushToTalk: boolean;
  setIsPushToTalk: (value: boolean) => void;
  backgroundEffect: 'none' | 'blur' | 'green';
  setBackgroundEffect: (value: 'none' | 'blur' | 'green') => void;
  onClose: () => void;
}

export default function VoiceSettings({
  isPushToTalk,
  setIsPushToTalk,
  backgroundEffect,
  setBackgroundEffect,
  onClose,
}: VoiceSettingsProps) {
  return (
    <div className="border-b border-border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Voice & Video Settings
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Voice Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mic className="h-4 w-4" />
            Voice Mode
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <Label htmlFor="ptt" className="cursor-pointer">
              <div className="font-medium">Push to Talk</div>
              <div className="text-xs text-muted-foreground">
                Hold Space or button to speak
              </div>
            </Label>
            <Switch
              id="ptt"
              checked={isPushToTalk}
              onCheckedChange={setIsPushToTalk}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <Label htmlFor="vad" className="cursor-pointer">
              <div className="font-medium">Voice Activity</div>
              <div className="text-xs text-muted-foreground">
                Auto-detect when you speak
              </div>
            </Label>
            <Switch
              id="vad"
              checked={!isPushToTalk}
              onCheckedChange={(v) => setIsPushToTalk(!v)}
            />
          </div>
        </div>

        {/* Video Effects */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Camera className="h-4 w-4" />
            Video Effects
          </div>
          
          <RadioGroup
            value={backgroundEffect}
            onValueChange={(v) => setBackgroundEffect(v as typeof backgroundEffect)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="cursor-pointer flex-1">
                <div className="font-medium">No Effect</div>
                <div className="text-xs text-muted-foreground">
                  Show your real background
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
              <RadioGroupItem value="blur" id="blur" />
              <Label htmlFor="blur" className="cursor-pointer flex-1">
                <div className="font-medium">Background Blur</div>
                <div className="text-xs text-muted-foreground">
                  Blur your background for privacy
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
              <RadioGroupItem value="green" id="green" />
              <Label htmlFor="green" className="cursor-pointer flex-1">
                <div className="font-medium">Green Screen</div>
                <div className="text-xs text-muted-foreground">
                  Remove green background
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        💡 Tip: AI-powered background effects coming soon!
      </p>
    </div>
  );
}
