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
import { AtSign, ImagePlus, Heart, Star, Skull, Cat, Dog, Fish, Coffee, Music, Sparkles, Flame, Moon, Sun, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ASCII characters from dark to light
const ASCII_CHARS = '@%#*+=-:. ';

// Convert image to ASCII art
const imageToAscii = (img: HTMLImageElement, maxWidth: number = 60, maxHeight: number = 30): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Calculate aspect ratio and dimensions
  const aspectRatio = img.width / img.height;
  let width = maxWidth;
  let height = Math.floor(width / aspectRatio / 2); // Divide by 2 because chars are taller than wide
  
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.floor(height * aspectRatio * 2);
  }

  canvas.width = width;
  canvas.height = height;
  
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  let ascii = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];
      
      // Calculate brightness (0-255)
      const brightness = a < 128 ? 255 : (0.299 * r + 0.587 * g + 0.114 * b);
      
      // Map brightness to ASCII character
      const charIndex = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
      ascii += ASCII_CHARS[charIndex];
    }
    ascii += '\n';
  }

  return ascii.trim();
};

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

const AsciiArtPicker = ({ onArtSelect }: AsciiArtPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleArtClick = (art: string) => {
    onArtSelect(art);
    setIsOpen(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image file",
      });
      return;
    }

    setIsConverting(true);

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const asciiArt = imageToAscii(img, 50, 25);
          if (asciiArt) {
            onArtSelect(asciiArt);
            toast({
              title: "Image converted!",
              description: "Your image has been converted to ASCII art",
            });
          }
          setIsConverting(false);
          setIsOpen(false);
        };
        img.onerror = () => {
          toast({
            variant: "destructive",
            title: "Failed to load image",
            description: "Could not process the image",
          });
          setIsConverting(false);
        };
        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Failed to read file",
          description: "Could not read the image file",
        });
        setIsConverting(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: err instanceof Error ? err.message : "Failed to convert image",
      });
      setIsConverting(false);
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
            title="ASCII Art"
          >
            <AtSign className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-64 bg-popover border-border z-[200]"
          sideOffset={5}
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-xs">
            <AtSign className="w-3 h-3" />
            ASCII Art
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Image to ASCII Option */}
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 cursor-pointer"
            disabled={isConverting}
          >
            {isConverting ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 text-primary" />
            )}
            <span>{isConverting ? 'Converting...' : 'Convert Image to ASCII'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
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
