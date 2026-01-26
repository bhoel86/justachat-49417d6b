import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, ImagePlus, Heart, Star, Skull, Cat, Dog, Fish, Coffee, Music, Sparkles, Flame, Moon, Sun, Zap } from 'lucide-react';

// Premade ASCII art collection
const ASCII_ART = [
  {
    name: "Heart",
    icon: Heart,
    art: `  ♥♥   ♥♥
 ♥♥♥♥ ♥♥♥♥
♥♥♥♥♥♥♥♥♥♥
 ♥♥♥♥♥♥♥♥
  ♥♥♥♥♥♥
   ♥♥♥♥
    ♥♥`
  },
  {
    name: "Star",
    icon: Star,
    art: `    ★
   ★★★
  ★★★★★
 ★★★★★★★
★★★★★★★★★
 ★★★★★★★
  ★★★★★
   ★★★
    ★`
  },
  {
    name: "Cat",
    icon: Cat,
    art: ` /\\_/\\  
( o.o ) 
 > ^ <`
  },
  {
    name: "Dog",
    icon: Dog,
    art: `  / \\__
 (    @\\___
 /         O
/   (_____/
/_____/   U`
  },
  {
    name: "Fish",
    icon: Fish,
    art: `><(((º>`
  },
  {
    name: "Coffee",
    icon: Coffee,
    art: `   ) (
  (   ) )
   ) _ (
  (_)_(_)
  |_____|
  /_____\\`
  },
  {
    name: "Music",
    icon: Music,
    art: `♪♫•*¨*•.¸¸♪♫`
  },
  {
    name: "Sparkles",
    icon: Sparkles,
    art: `✧･ﾟ: *✧･ﾟ:*`
  },
  {
    name: "Skull",
    icon: Skull,
    art: `  ___
 /o o\\
|  <  |
 \\___/`
  },
  {
    name: "Flame",
    icon: Flame,
    art: `   )
  ) \\
 / ) (
 \\(_)/`
  },
  {
    name: "Moon",
    icon: Moon,
    art: `   🌙
 ☆  ★  ☆
★   ☆   ★`
  },
  {
    name: "Sun",
    icon: Sun,
    art: ` \\ | /
-- ☀ --
 / | \\`
  },
  {
    name: "Shrug",
    icon: Zap,
    art: `¯\\_(ツ)_/¯`
  },
  {
    name: "Table Flip",
    icon: Zap,
    art: `(╯°□°)╯︵ ┻━┻`
  },
  {
    name: "Lenny",
    icon: Zap,
    art: `( ͡° ͜ʖ ͡°)`
  },
  {
    name: "Bear",
    icon: Zap,
    art: `ʕ•ᴥ•ʔ`
  },
  {
    name: "Disapproval",
    icon: Zap,
    art: `ಠ_ಠ`
  },
  {
    name: "Happy",
    icon: Sparkles,
    art: `(◕‿◕)`
  },
  {
    name: "Sad",
    icon: Zap,
    art: `(╥﹏╥)`
  },
  {
    name: "Rose",
    icon: Sparkles,
    art: `@}-,-'---`
  },
];

interface AsciiArtPickerProps {
  onArtSelect: (art: string) => void;
  onImageUpload?: (file: File) => void;
}

const AsciiArtPicker = ({ onArtSelect, onImageUpload }: AsciiArtPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleArtClick = (art: string) => {
    onArtSelect(art);
    setIsOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
      setIsOpen(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            title="ASCII Art & Images"
          >
            <Palette className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64 bg-popover border-border z-[200]"
          sideOffset={5}
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
            <Palette className="w-3 h-3" />
            ASCII Art & Images
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Image Upload Option */}
          {onImageUpload && (
            <>
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ImagePlus className="w-4 h-4 text-primary" />
                <span>Upload Custom Image</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* ASCII Art Grid */}
          <ScrollArea className="h-64">
            <div className="grid grid-cols-2 gap-1 p-1">
              {ASCII_ART.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleArtClick(item.art)}
                    className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent transition-colors text-left group"
                  >
                    <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                      {item.name}
                    </span>
                    <pre className="text-[8px] leading-tight text-muted-foreground group-hover:text-foreground font-mono whitespace-pre max-w-full overflow-hidden">
                      {item.art.split('\n').slice(0, 3).join('\n')}
                    </pre>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default AsciiArtPicker;
