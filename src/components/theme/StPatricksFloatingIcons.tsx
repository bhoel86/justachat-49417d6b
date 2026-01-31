import { useTheme } from "@/contexts/ThemeContext";
import { Sparkles } from "lucide-react";

/**
 * St. Patrick's Day floating shamrocks for login/home pages
 * Similar to ValentinesFloatingHearts but with shamrocks and gold coins
 */

const Shamrock: React.FC<{ size: number; className?: string; color?: string }> = ({ size, className, color = '#228B22' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    className={className}
    style={{ filter: `drop-shadow(0 0 ${size/3}px ${color}50)` }}
  >
    <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 1.5 1 2.5 2 3-2 0-4.5 1-4.5 3.5S8.5 15.5 10 15c-1 1-2 3-2 4.5 0 1.5 1.5 2.5 3 2.5s2-1 2-2v-6c0 0 0 2 0 2v4c0 1 .5 2 2 2s3-1 3-2.5c0-1.5-1-3.5-2-4.5 1.5.5 3.5-.5 3.5-3S16 9.5 14 9.5c1-0.5 2-1.5 2-3C16 3.5 14.5 2 13 2c-0.5 0-1 0.5-1 1.5V5c0-1.5-.5-3-1-3z" />
  </svg>
);

// Shamrock colors
const shamrockColors = ['#228B22', '#2E8B57', '#32CD32', '#3CB371', '#90EE90', '#00FF7F'];
const goldColors = ['#FFD700', '#DAA520', '#FFA500', '#FFBF00'];

// Floating positions
const floatingShamrocks = [
  { top: '8%', left: '5%', size: 28, delay: 0, duration: 5, isGold: false },
  { top: '12%', right: '8%', size: 24, delay: 0.5, duration: 4.5, isGold: false },
  { top: '25%', left: '10%', size: 18, delay: 1, duration: 4, isGold: false },
  { top: '30%', right: '12%', size: 22, delay: 1.5, duration: 5.5, isGold: true },
  { bottom: '25%', left: '8%', size: 20, delay: 2, duration: 4.2, isGold: false },
  { bottom: '30%', right: '10%', size: 26, delay: 0.3, duration: 5, isGold: false },
  { top: '50%', left: '3%', size: 16, delay: 0.8, duration: 4.8, isGold: false },
  { top: '55%', right: '5%', size: 14, delay: 1.2, duration: 4.3, isGold: true },
  { bottom: '15%', left: '12%', size: 18, delay: 1.8, duration: 4.6, isGold: false },
  { bottom: '20%', right: '15%', size: 16, delay: 2.2, duration: 5.2, isGold: false },
];

export const StPatricksFloatingIcons = () => {
  const { theme } = useTheme();
  
  if (theme !== 'stpatricks') return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {floatingShamrocks.map((item, index) => {
        const shamrockColor = shamrockColors[index % shamrockColors.length];
        const { size, delay, duration, isGold, ...position } = item;
        
        return (
          <div
            key={`stpatrick-${index}`}
            className="absolute"
            style={{ 
              ...position,
              animation: `stpatricksFloat ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            {isGold ? (
              // Gold coin
              <div 
                style={{ 
                  width: size, 
                  height: size, 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${goldColors[0]}, ${goldColors[1]})`,
                  border: `2px solid ${goldColors[2]}`,
                  boxShadow: `0 0 ${size/2}px ${goldColors[0]}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: size * 0.4,
                }}
              >
                ☘
              </div>
            ) : (
              <Shamrock 
                size={size} 
                color={shamrockColor}
              />
            )}
          </div>
        );
      })}
      
      {/* Ambient glow in corners */}
      <div 
        className="absolute top-0 left-0 w-64 h-64 opacity-15"
        style={{
          background: 'radial-gradient(circle, hsl(142 76% 36%) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 opacity-15"
        style={{
          background: 'radial-gradient(circle, hsl(45 93% 47%) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* Sparkles */}
      <Sparkles 
        className="absolute top-[15%] left-[20%] text-accent opacity-50" 
        size={12}
        style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite' }}
      />
      <Sparkles 
        className="absolute top-[40%] right-[18%] text-accent opacity-40" 
        size={10}
        style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite 0.5s' }}
      />
      <Sparkles 
        className="absolute bottom-[35%] left-[15%] text-accent opacity-50" 
        size={14}
        style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite 1s' }}
      />

      <style>{`
        @keyframes stpatricksFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes stpatricksSparkle {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
