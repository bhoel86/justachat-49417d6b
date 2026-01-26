import { useState } from "react";
import { decodeFormat, TextFormat } from "./TextFormatMenu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface FormattedTextProps {
  text: string;
  className?: string;
}

// Rainbow colors for individual characters
const rainbowColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'
];

// Extended IRC 99-color palette
const getIrcColor = (code: string): string => {
  const num = parseInt(code, 10);
  
  // Standard 16 colors
  const standard: { [key: number]: string } = {
    0: '#FFFFFF', 1: '#000000', 2: '#00007F', 3: '#009300',
    4: '#FF0000', 5: '#7F0000', 6: '#9C009C', 7: '#FC7F00',
    8: '#FFFF00', 9: '#00FC00', 10: '#009393', 11: '#00FFFF',
    12: '#0000FC', 13: '#FF00FF', 14: '#7F7F7F', 15: '#D2D2D2',
  };
  
  if (num <= 15) return standard[num] || '#FFFFFF';
  
  // Extended palette: 6x6x6 color cube (16-87)
  if (num >= 16 && num <= 87) {
    const idx = num - 16;
    const levels = [0, 51, 102, 153, 204, 255];
    const r = levels[Math.floor(idx / 36)];
    const g = levels[Math.floor((idx % 36) / 6)];
    const b = levels[idx % 6];
    return `rgb(${r},${g},${b})`;
  }
  
  // Grayscale (88-98)
  if (num >= 88 && num <= 98) {
    const v = Math.round((num - 88) * 25.5);
    return `rgb(${v},${v},${v})`;
  }
  
  return '#FFFFFF';
};

// Parse RGB color codes [rgb:R,G,B] format
const parseRgbColors = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  
  // Split by [rgb:R,G,B] patterns and newlines
  const segments = text.split(/(\[rgb:\d+,\d+,\d+\]|\n)/);
  
  let currentColor: string | null = null;
  
  segments.forEach((segment, i) => {
    if (!segment) return;
    
    if (segment === '\n') {
      parts.push(<br key={`br-${i}`} />);
      return;
    }
    
    // Check if this is a color code
    const colorMatch = segment.match(/^\[rgb:(\d+),(\d+),(\d+)\]$/);
    if (colorMatch) {
      const r = colorMatch[1];
      const g = colorMatch[2];
      const b = colorMatch[3];
      currentColor = `rgb(${r},${g},${b})`;
      return;
    }
    
    // Regular text - apply current color
    if (currentColor && segment.includes('█')) {
      parts.push(
        <span
          key={`text-${i}`}
          style={{
            color: currentColor,
            backgroundColor: currentColor,
          }}
        >
          {segment}
        </span>
      );
    } else if (segment.trim()) {
      parts.push(<span key={`text-${i}`}>{segment}</span>);
    }
  });
  
  return parts;
};

// Check if text contains RGB color codes
const hasRgbColors = (text: string): boolean => {
  return text.includes('[rgb:');
};

// Extract image URL from [img:url] format
const extractImage = (text: string): { hasImage: boolean; imageUrl: string | null; textContent: string } => {
  const imgMatch = text.match(/\[img:(https?:\/\/[^\]]+)\]/);
  if (imgMatch) {
    return {
      hasImage: true,
      imageUrl: imgMatch[1],
      textContent: text.replace(imgMatch[0], '').trim(),
    };
  }
  return { hasImage: false, imageUrl: null, textContent: text };
};

const ImagePreview = ({ url }: { url: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <img
          src={url}
          alt="Chat image"
          className="max-w-[150px] sm:max-w-[200px] max-h-24 sm:max-h-32 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-contain mt-1"
          onClick={() => setIsOpen(true)}
        />
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
        <img
          src={url}
          alt="Chat image full size"
          className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
};

// Parse @mentions in text
const parseMentions = (content: string): (string | { type: 'mention'; username: string })[] => {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | { type: 'mention'; username: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push({ type: 'mention', username: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
};

const MentionSpan = ({ username }: { username: string }) => (
  <span className="text-red-500 font-semibold bg-red-500/10 px-1 rounded cursor-pointer hover:bg-red-500/20 transition-colors">
    @{username}
  </span>
);

const FormattedText = ({ text, className = '' }: FormattedTextProps) => {
  // First check for images
  const { hasImage, imageUrl, textContent } = extractImage(text);
  
  // If there's no text content, just show the image
  if (hasImage && !textContent) {
    return imageUrl ? <ImagePreview url={imageUrl} /> : null;
  }
  
  const decoded = decodeFormat(textContent);
  
  const renderTextWithMentions = (content: string, additionalClassName?: string) => {
    const parts = parseMentions(content);
    return (
      <span className={additionalClassName}>
        {parts.map((part, i) =>
          typeof part === 'string' ? (
            <span key={i}>{part}</span>
          ) : (
            <MentionSpan key={i} username={part.username} />
          )
        )}
      </span>
    );
  };
  
  const renderText = () => {
    // Check for RGB color codes first (colored block art)
    if (hasRgbColors(textContent)) {
      return (
        <div className="flex justify-center w-full">
          <pre 
            className={`whitespace-pre overflow-x-auto inline-block ${className}`}
            style={{ 
              fontSize: '8px', 
              lineHeight: 1,
              letterSpacing: 0,
              wordSpacing: 0,
              fontFamily: '"Courier New", monospace',
              textAlign: 'left',
              margin: 0,
              padding: 0,
            }}
          >
            {parseRgbColors(textContent)}
          </pre>
        </div>
      );
    }
    
    if (!decoded) {
      return renderTextWithMentions(textContent, className);
    }
    
    const { format, text: content } = decoded;
    
    // Wrapper for background color
    const BgWrapper = ({ children }: { children: React.ReactNode }) => {
      if (format.bgColor) {
        return (
          <span 
            className="px-1.5 py-0.5 rounded inline-block"
            style={{ backgroundColor: format.bgColor }}
          >
            {children}
          </span>
        );
      }
      return <>{children}</>;
    };
    
    switch (format.textStyle) {
      case 'rainbow':
        // Rainbow with mentions - parse mentions first, then apply rainbow to non-mention parts
        const rainbowParts = parseMentions(content);
        let charIndex = 0;
        return (
          <BgWrapper>
            <span className={className}>
              {rainbowParts.map((part, partIdx) => {
                if (typeof part !== 'string') {
                  return <MentionSpan key={partIdx} username={part.username} />;
                }
                return part.split('').map((char, i) => {
                  const idx = charIndex++;
                  return (
                    <span
                      key={`${partIdx}-${i}`}
                      style={{
                        color: rainbowColors[idx % rainbowColors.length],
                        fontWeight: 500,
                      }}
                    >
                      {char}
                    </span>
                  );
                });
              })}
            </span>
          </BgWrapper>
        );
      
      case 'gradient':
        // For gradient, show mentions differently since gradient clips
        const gradientParts = parseMentions(content);
        const hasMentions = gradientParts.some(p => typeof p !== 'string');
        if (hasMentions) {
          return (
            <BgWrapper>
              <span className={className}>
                {gradientParts.map((part, i) =>
                  typeof part === 'string' ? (
                    <span
                      key={i}
                      className="bg-clip-text text-transparent font-medium"
                      style={{ backgroundImage: format.textValue }}
                    >
                      {part}
                    </span>
                  ) : (
                    <MentionSpan key={i} username={part.username} />
                  )
                )}
              </span>
            </BgWrapper>
          );
        }
        return (
          <BgWrapper>
            <span
              className={`bg-clip-text text-transparent font-medium ${className}`}
              style={{ backgroundImage: format.textValue }}
            >
              {content}
            </span>
          </BgWrapper>
        );
      
      case 'color':
        const colorParts = parseMentions(content);
        return (
          <BgWrapper>
            <span className={className}>
              {colorParts.map((part, i) =>
                typeof part === 'string' ? (
                  <span 
                    key={i}
                    className="font-medium" 
                    style={{ color: format.textValue }}
                  >
                    {part}
                  </span>
                ) : (
                  <MentionSpan key={i} username={part.username} />
                )
              )}
            </span>
          </BgWrapper>
        );
      
      default:
        if (format.bgColor) {
          return (
            <span 
              className={`px-1.5 py-0.5 rounded inline-block ${className}`}
              style={{ backgroundColor: format.bgColor }}
            >
              {renderTextWithMentions(content)}
            </span>
          );
        }
        return renderTextWithMentions(content, className);
    }
  };
  
  return (
    <div className="inline">
      {renderText()}
      {hasImage && imageUrl && (
        <div className="block">
          <ImagePreview url={imageUrl} />
        </div>
      )}
    </div>
  );
};

export default FormattedText;
