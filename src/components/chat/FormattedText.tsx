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
  const bgStyle = format.bgColor ? { backgroundColor: `${format.bgColor}60` } : {};
  const bgClass = format.bgColor ? 'px-1 rounded' : '';
  
  switch (format.textStyle) {
    case 'rainbow':
      return (
        <span className={`${bgClass} ${className}`} style={bgStyle}>
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
      );
    
    case 'gradient':
      return (
        <span
          className={`bg-clip-text text-transparent font-medium ${bgClass} ${className}`}
          style={{ 
            backgroundImage: format.textValue,
            ...bgStyle 
          }}
        >
          {content}
        </span>
      );
    
    case 'color':
      return (
        <span 
          className={`font-medium ${bgClass} ${className}`} 
          style={{ color: format.textValue, ...bgStyle }}
        >
          {content}
        </span>
      );
    
    default:
      // Just background color, no text style
      if (format.bgColor) {
        return (
          <span className={`px-1 rounded ${className}`} style={bgStyle}>
            {content}
          </span>
        );
      }
      return <span className={className}>{content}</span>;
  }
};

export default FormattedText;
