import { decodeFormat, TextFormat } from "./TextFormatMenu";

interface FormattedTextProps {
  text: string;
  className?: string;
}

// Rainbow colors for individual characters
const rainbowColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'
];

const FormattedText = ({ text, className = '' }: FormattedTextProps) => {
  const decoded = decodeFormat(text);
  
  if (!decoded) {
    // No formatting, return plain text
    return <span className={className}>{text}</span>;
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
      // Just background color, no text style
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

export default FormattedText;
