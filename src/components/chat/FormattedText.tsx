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
          className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover mt-1"
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

const FormattedText = ({ text, className = '' }: FormattedTextProps) => {
  // First check for images
  const { hasImage, imageUrl, textContent } = extractImage(text);
  
  // If there's no text content, just show the image
  if (hasImage && !textContent) {
    return imageUrl ? <ImagePreview url={imageUrl} /> : null;
  }
  
  const decoded = decodeFormat(textContent);
  
  const renderText = () => {
    if (!decoded) {
      return <span className={className}>{textContent}</span>;
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
        return (
          <BgWrapper>
            <span className={className}>
              {content.split('').map((char, i) => (
                <span
                  key={i}
                  style={{
                    color: rainbowColors[i % rainbowColors.length],
                    fontWeight: 500,
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
          </BgWrapper>
        );
      
      case 'gradient':
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
        return (
          <BgWrapper>
            <span 
              className={`font-medium ${className}`} 
              style={{ color: format.textValue }}
            >
              {content}
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
              {content}
            </span>
          );
        }
        return <span className={className}>{content}</span>;
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
