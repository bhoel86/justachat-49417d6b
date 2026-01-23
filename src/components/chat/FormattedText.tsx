import { decodeFormat, TextFormat } from "./TextFormatMenu";

interface FormattedTextProps {
  text: string;
  className?: string;
}

// Rainbow animation CSS for individual characters
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
  
  switch (format.type) {
    case 'rainbow':
      return (
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
      );
    
    case 'gradient':
      return (
        <span
          className={`bg-clip-text text-transparent font-medium ${className}`}
          style={{ backgroundImage: format.value }}
        >
          {content}
        </span>
      );
    
    case 'color':
      return (
        <span className={className} style={{ color: format.value, fontWeight: 500 }}>
          {content}
        </span>
      );
    
    case 'bg':
      return (
        <span
          className={`px-1 rounded text-white font-medium ${className}`}
          style={{ backgroundColor: format.value }}
        >
          {content}
        </span>
      );
    
    default:
      return <span className={className}>{content}</span>;
  }
};

export default FormattedText;
