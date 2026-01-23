import { useState } from "react";
import { Palette, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TextFormat {
  textStyle: 'none' | 'color' | 'gradient' | 'rainbow';
  textValue?: string;
  bgColor?: string;
}

interface TextFormatMenuProps {
  currentFormat: TextFormat;
  onFormatChange: (format: TextFormat) => void;
}

// Preset colors
const TEXT_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
];

const BG_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Light', value: '#e4e4e7' },
  { name: 'Black', value: '#18181b' },
  { name: 'Dark', value: '#3f3f46' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

const GRADIENTS = [
  { name: 'Sunset', value: 'linear-gradient(90deg, #f97316, #ec4899)' },
  { name: 'Ocean', value: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
  { name: 'Forest', value: 'linear-gradient(90deg, #22c55e, #06b6d4)' },
  { name: 'Aurora', value: 'linear-gradient(90deg, #a855f7, #06b6d4)' },
  { name: 'Fire', value: 'linear-gradient(90deg, #ef4444, #f59e0b)' },
  { name: 'Royal', value: 'linear-gradient(90deg, #6366f1, #a855f7)' },
  { name: 'Candy', value: 'linear-gradient(90deg, #ec4899, #a855f7)' },
  { name: 'Lime', value: 'linear-gradient(90deg, #84cc16, #22c55e)' },
];

const TextFormatMenu = ({ currentFormat, onFormatChange }: TextFormatMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasAnyFormat = currentFormat.textStyle !== 'none' || currentFormat.bgColor;
  
  const updateFormat = (updates: Partial<TextFormat>) => {
    onFormatChange({ ...currentFormat, ...updates });
  };

  const getPreview = () => {
    const hasBg = !!currentFormat.bgColor;
    const hasText = currentFormat.textStyle !== 'none';
    
    if (currentFormat.textStyle === 'rainbow') {
      return (
        <span 
          className="text-[9px] font-bold px-0.5 rounded"
          style={{ backgroundColor: hasBg ? currentFormat.bgColor : undefined }}
        >
          <span style={{ color: '#ef4444' }}>R</span>
          <span style={{ color: '#eab308' }}>G</span>
          <span style={{ color: '#3b82f6' }}>B</span>
        </span>
      );
    }
    if (currentFormat.textStyle === 'gradient') {
      return (
        <span 
          className="text-[9px] font-bold bg-clip-text text-transparent px-0.5 rounded"
          style={{ 
            backgroundImage: currentFormat.textValue,
            backgroundColor: hasBg ? currentFormat.bgColor : undefined 
          }}
        >
          ABC
        </span>
      );
    }
    if (currentFormat.textStyle === 'color') {
      return (
        <span 
          className="text-[9px] font-bold px-0.5 rounded"
          style={{ 
            color: currentFormat.textValue,
            backgroundColor: hasBg ? currentFormat.bgColor : undefined 
          }}
        >
          ABC
        </span>
      );
    }
    if (hasBg) {
      return (
        <span 
          className="text-[9px] font-bold px-0.5 rounded text-foreground"
          style={{ backgroundColor: currentFormat.bgColor }}
        >
          ABC
        </span>
      );
    }
    return <Palette className="h-4 w-4" />;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-xl shrink-0",
                hasAnyFormat && "ring-2 ring-primary/50"
              )}
            >
              {getPreview()}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Text Formatting</TooltipContent>
      </Tooltip>
      
      <DropdownMenuContent 
        align="start" 
        className="w-64 bg-popover border border-border z-50 p-2"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Text Style Section */}
        <DropdownMenuLabel className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
          <Sparkles className="h-3 w-3" />
          TEXT STYLE
        </DropdownMenuLabel>
        
        <div className="flex flex-wrap gap-1 p-1 mb-2">
          {/* None */}
          <button
            type="button"
            onClick={() => updateFormat({ textStyle: 'none', textValue: undefined })}
            className={cn(
              "px-2 py-1 rounded text-[10px] border transition-colors",
              currentFormat.textStyle === 'none' 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border hover:bg-secondary"
            )}
          >
            None
          </button>
          
          {/* Rainbow */}
          <button
            type="button"
            onClick={() => updateFormat({ textStyle: 'rainbow', textValue: undefined })}
            className={cn(
              "px-2 py-1 rounded text-[10px] border transition-colors font-bold",
              currentFormat.textStyle === 'rainbow' 
                ? "border-primary bg-primary/10" 
                : "border-border hover:bg-secondary"
            )}
          >
            <span className="bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent">
              Rainbow
            </span>
          </button>
        </div>
        
        {/* Gradients */}
        <div className="flex flex-wrap gap-1 p-1 mb-2">
          {GRADIENTS.map((g) => (
            <button
              key={g.name}
              type="button"
              onClick={() => updateFormat({ textStyle: 'gradient', textValue: g.value })}
              className={cn(
                "w-7 h-5 rounded text-[8px] font-bold text-white flex items-center justify-center",
                currentFormat.textStyle === 'gradient' && currentFormat.textValue === g.value
                  ? "ring-2 ring-white ring-offset-1 ring-offset-background"
                  : ""
              )}
              style={{ background: g.value }}
              title={g.name}
            >
              {currentFormat.textStyle === 'gradient' && currentFormat.textValue === g.value && (
                <Check className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>
        
        {/* Text Colors */}
        <div className="flex flex-wrap gap-1 p-1 mb-2">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => updateFormat({ textStyle: 'color', textValue: c.value })}
              className={cn(
                "w-5 h-5 rounded",
                currentFormat.textStyle === 'color' && currentFormat.textValue === c.value
                  ? "ring-2 ring-white ring-offset-1 ring-offset-background"
                  : ""
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Background Section */}
        <DropdownMenuLabel className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
          <Palette className="h-3 w-3" />
          BACKGROUND
          {currentFormat.bgColor && (
            <span 
              className="ml-auto w-3 h-3 rounded" 
              style={{ backgroundColor: currentFormat.bgColor }}
            />
          )}
        </DropdownMenuLabel>
        
        <div className="flex flex-wrap gap-1 p-1">
          {/* None */}
          <button
            type="button"
            onClick={() => updateFormat({ bgColor: undefined })}
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center text-[8px]",
              !currentFormat.bgColor 
                ? "border-primary text-primary" 
                : "border-border text-muted-foreground"
            )}
          >
            ✕
          </button>
          
          {BG_COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => updateFormat({ bgColor: c.value })}
              className={cn(
                "w-5 h-5 rounded",
                c.value === '#ffffff' && "border border-border",
                currentFormat.bgColor === c.value
                  ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  : ""
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Preview */}
        {hasAnyFormat && (
          <div className="p-2 rounded bg-secondary/50 mt-1">
            <p className="text-[9px] text-muted-foreground mb-1">Preview:</p>
            <div 
              className="text-sm font-medium px-1 py-0.5 rounded inline-block"
              style={{ 
                backgroundColor: currentFormat.bgColor || undefined,
              }}
            >
              {currentFormat.textStyle === 'rainbow' ? (
                <span>
                  {'Sample Text'.split('').map((char, i) => (
                    <span 
                      key={i} 
                      style={{ color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'][i % 7] }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              ) : currentFormat.textStyle === 'gradient' ? (
                <span 
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: currentFormat.textValue }}
                >
                  Sample Text
                </span>
              ) : currentFormat.textStyle === 'color' ? (
                <span style={{ color: currentFormat.textValue }}>Sample Text</span>
              ) : (
                <span>Sample Text</span>
              )}
            </div>
          </div>
        )}
        
        {/* Clear All */}
        {hasAnyFormat && (
          <DropdownMenuItem
            onClick={() => onFormatChange({ textStyle: 'none' })}
            className="cursor-pointer text-muted-foreground mt-1 text-xs"
          >
            ❌ Clear All
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Export format encoding/decoding utilities
export const encodeFormat = (format: TextFormat, text: string): string => {
  if ((format.textStyle === 'none' && !format.bgColor) || !text) return text;
  
  const parts: string[] = [];
  
  if (format.textStyle === 'rainbow') {
    parts.push('R');
  } else if (format.textStyle === 'gradient' && format.textValue) {
    parts.push(`G:${format.textValue}`);
  } else if (format.textStyle === 'color' && format.textValue) {
    parts.push(`C:${format.textValue}`);
  }
  
  if (format.bgColor) {
    parts.push(`B:${format.bgColor}`);
  }
  
  if (parts.length === 0) return text;
  
  return `[FMT:${parts.join('|')}]${text}[/FMT]`;
};

export const decodeFormat = (text: string): { format: TextFormat; text: string } | null => {
  const match = text.match(/^\[FMT:([^\]]+)\](.*)\[\/FMT\]$/s);
  if (!match) return null;
  
  const [, formatCode, content] = match;
  const parts = formatCode.split('|');
  
  const format: TextFormat = { textStyle: 'none' };
  
  for (const part of parts) {
    if (part === 'R') {
      format.textStyle = 'rainbow';
    } else if (part.startsWith('G:')) {
      format.textStyle = 'gradient';
      format.textValue = part.slice(2);
    } else if (part.startsWith('C:')) {
      format.textStyle = 'color';
      format.textValue = part.slice(2);
    } else if (part.startsWith('B:')) {
      format.bgColor = part.slice(2);
    }
  }
  
  return { format, text: content };
};

export default TextFormatMenu;
