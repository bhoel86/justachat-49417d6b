import { useState } from "react";
import { Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500' },
  { name: 'Lime', value: '#84cc16', class: 'bg-lime-500' },
  { name: 'Green', value: '#22c55e', class: 'bg-green-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
  { name: 'Purple', value: '#a855f7', class: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
  { name: 'Rose', value: '#f43f5e', class: 'bg-rose-500' },
];

const BG_COLORS = [
  { name: 'White', value: '#ffffff', class: 'bg-white border border-border' },
  { name: 'Light Gray', value: '#e4e4e7', class: 'bg-zinc-200' },
  { name: 'Black', value: '#18181b', class: 'bg-zinc-900' },
  { name: 'Dark Gray', value: '#3f3f46', class: 'bg-zinc-700' },
  { name: 'Slate', value: '#475569', class: 'bg-slate-600' },
  { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500' },
  { name: 'Green', value: '#22c55e', class: 'bg-green-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Purple', value: '#a855f7', class: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
];

const GRADIENTS = [
  { name: 'Sunset', value: 'linear-gradient(90deg, #f97316, #ec4899)', preview: 'from-orange-500 to-pink-500' },
  { name: 'Ocean', value: 'linear-gradient(90deg, #06b6d4, #3b82f6)', preview: 'from-cyan-500 to-blue-500' },
  { name: 'Forest', value: 'linear-gradient(90deg, #22c55e, #06b6d4)', preview: 'from-green-500 to-cyan-500' },
  { name: 'Aurora', value: 'linear-gradient(90deg, #a855f7, #06b6d4)', preview: 'from-purple-500 to-cyan-500' },
  { name: 'Fire', value: 'linear-gradient(90deg, #ef4444, #f59e0b)', preview: 'from-red-500 to-amber-500' },
  { name: 'Royal', value: 'linear-gradient(90deg, #6366f1, #a855f7)', preview: 'from-indigo-500 to-purple-500' },
  { name: 'Cotton Candy', value: 'linear-gradient(90deg, #ec4899, #a855f7)', preview: 'from-pink-500 to-purple-500' },
  { name: 'Lime Rush', value: 'linear-gradient(90deg, #84cc16, #22c55e)', preview: 'from-lime-500 to-green-500' },
];

const TextFormatMenu = ({ currentFormat, onFormatChange }: TextFormatMenuProps) => {
  const hasAnyFormat = currentFormat.textStyle !== 'none' || currentFormat.bgColor;
  
  const getFormatPreview = () => {
    if (currentFormat.textStyle === 'rainbow') {
      return (
        <span 
          className="text-[10px] font-bold bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent px-0.5 rounded"
          style={{ backgroundColor: currentFormat.bgColor ? `${currentFormat.bgColor}60` : undefined }}
        >
          ABC
        </span>
      );
    }
    if (currentFormat.textStyle === 'gradient') {
      return (
        <span 
          className="text-[10px] font-bold bg-clip-text text-transparent px-0.5 rounded"
          style={{ 
            backgroundImage: currentFormat.textValue,
            backgroundColor: currentFormat.bgColor ? `${currentFormat.bgColor}60` : undefined 
          }}
        >
          ABC
        </span>
      );
    }
    if (currentFormat.textStyle === 'color' || currentFormat.bgColor) {
      return (
        <span 
          className="text-[10px] font-bold px-0.5 rounded"
          style={{ 
            color: currentFormat.textValue || undefined,
            backgroundColor: currentFormat.bgColor ? `${currentFormat.bgColor}60` : undefined 
          }}
        >
          ABC
        </span>
      );
    }
    return <Palette className="h-4 w-4" />;
  };

  const updateFormat = (updates: Partial<TextFormat>) => {
    onFormatChange({ ...currentFormat, ...updates });
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0"
            >
              {getFormatPreview()}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Text Formatting</TooltipContent>
      </Tooltip>
      
      <DropdownMenuContent align="start" className="w-56 bg-popover border border-border z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Text Style
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Rainbow */}
        <DropdownMenuItem
          onClick={() => updateFormat({ textStyle: 'rainbow', textValue: undefined })}
          className="cursor-pointer"
        >
          <span className="mr-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent font-bold">
            🌈
          </span>
          Rainbow Text
          {currentFormat.textStyle === 'rainbow' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        
        {/* Gradient submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <span className="mr-2">🎨</span>
            Gradient Text
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-popover border border-border">
            {GRADIENTS.map((gradient) => (
              <DropdownMenuItem
                key={gradient.name}
                onClick={() => updateFormat({ textStyle: 'gradient', textValue: gradient.value })}
                className="cursor-pointer"
              >
                <span 
                  className={`mr-2 w-4 h-4 rounded bg-gradient-to-r ${gradient.preview}`}
                />
                {gradient.name}
                {currentFormat.textStyle === 'gradient' && currentFormat.textValue === gradient.value && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* Text Color submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <span className="mr-2">✏️</span>
            Text Color
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-popover border border-border">
            <div className="grid grid-cols-4 gap-1 p-2">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateFormat({ textStyle: 'color', textValue: color.value })}
                  className={`w-6 h-6 rounded ${color.class} hover:scale-110 transition-transform ${
                    currentFormat.textStyle === 'color' && currentFormat.textValue === color.value 
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-background' 
                      : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
          <Palette className="h-3 w-3" />
          Background Color
        </DropdownMenuLabel>
        
        {/* Background Color submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <span className="mr-2">🖌️</span>
            Background
            {currentFormat.bgColor && <span className="ml-auto text-primary text-xs">Active</span>}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-popover border border-border">
            <DropdownMenuItem
              onClick={() => updateFormat({ bgColor: undefined })}
              className="cursor-pointer text-muted-foreground"
            >
              None
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-4 gap-1 p-2">
              {BG_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateFormat({ bgColor: color.value })}
                  className={`w-6 h-6 rounded ${color.class} hover:scale-110 transition-transform ${
                    currentFormat.bgColor === color.value 
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-background' 
                      : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        {/* Clear formatting */}
        <DropdownMenuItem
          onClick={() => onFormatChange({ textStyle: 'none' })}
          className="cursor-pointer text-muted-foreground"
          disabled={!hasAnyFormat}
        >
          <span className="mr-2">❌</span>
          Clear All Formatting
        </DropdownMenuItem>
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
