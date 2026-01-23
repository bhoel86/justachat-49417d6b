import { useState } from "react";
import { Palette, Sparkles, ChevronDown } from "lucide-react";
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
  type: 'none' | 'color' | 'bg' | 'gradient' | 'rainbow';
  value?: string;
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
  { name: 'Black', value: '#18181b', class: 'bg-zinc-900' },
  { name: 'Gray', value: '#52525b', class: 'bg-zinc-600' },
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
  const getFormatPreview = () => {
    switch (currentFormat.type) {
      case 'rainbow':
        return (
          <span className="text-[10px] font-bold bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            ABC
          </span>
        );
      case 'gradient':
        return (
          <span 
            className="text-[10px] font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: currentFormat.value }}
          >
            ABC
          </span>
        );
      case 'color':
        return (
          <span className="text-[10px] font-bold" style={{ color: currentFormat.value }}>
            ABC
          </span>
        );
      case 'bg':
        return (
          <span 
            className="text-[10px] font-bold px-1 rounded text-white"
            style={{ backgroundColor: currentFormat.value }}
          >
            ABC
          </span>
        );
      default:
        return <Palette className="h-4 w-4" />;
    }
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
          Text Effects
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Rainbow */}
        <DropdownMenuItem
          onClick={() => onFormatChange({ type: 'rainbow' })}
          className="cursor-pointer"
        >
          <span className="mr-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent font-bold">
            🌈
          </span>
          Rainbow Text
          {currentFormat.type === 'rainbow' && <span className="ml-auto text-primary">✓</span>}
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
                onClick={() => onFormatChange({ type: 'gradient', value: gradient.value })}
                className="cursor-pointer"
              >
                <span 
                  className={`mr-2 w-4 h-4 rounded bg-gradient-to-r ${gradient.preview}`}
                />
                {gradient.name}
                {currentFormat.type === 'gradient' && currentFormat.value === gradient.value && (
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
                  onClick={() => onFormatChange({ type: 'color', value: color.value })}
                  className={`w-6 h-6 rounded ${color.class} hover:scale-110 transition-transform ${
                    currentFormat.type === 'color' && currentFormat.value === color.value 
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-background' 
                      : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* Background Color submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <span className="mr-2">🖌️</span>
            Background Color
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-popover border border-border">
            <div className="grid grid-cols-4 gap-1 p-2">
              {BG_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onFormatChange({ type: 'bg', value: color.value })}
                  className={`w-6 h-6 rounded ${color.class} hover:scale-110 transition-transform ${
                    currentFormat.type === 'bg' && currentFormat.value === color.value 
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
          onClick={() => onFormatChange({ type: 'none' })}
          className="cursor-pointer text-muted-foreground"
        >
          <span className="mr-2">❌</span>
          Clear Formatting
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Export format encoding/decoding utilities
export const encodeFormat = (format: TextFormat, text: string): string => {
  if (format.type === 'none' || !text) return text;
  
  const formatCode = {
    rainbow: 'R',
    gradient: `G:${format.value}`,
    color: `C:${format.value}`,
    bg: `B:${format.value}`,
  }[format.type];
  
  return `[FMT:${formatCode}]${text}[/FMT]`;
};

export const decodeFormat = (text: string): { format: TextFormat; text: string } | null => {
  const match = text.match(/^\[FMT:([^\]]+)\](.*)\[\/FMT\]$/s);
  if (!match) return null;
  
  const [, formatCode, content] = match;
  
  if (formatCode === 'R') {
    return { format: { type: 'rainbow' }, text: content };
  }
  if (formatCode.startsWith('G:')) {
    return { format: { type: 'gradient', value: formatCode.slice(2) }, text: content };
  }
  if (formatCode.startsWith('C:')) {
    return { format: { type: 'color', value: formatCode.slice(2) }, text: content };
  }
  if (formatCode.startsWith('B:')) {
    return { format: { type: 'bg', value: formatCode.slice(2) }, text: content };
  }
  
  return null;
};

export default TextFormatMenu;
