import { useTheme } from "@/contexts/ThemeContext";
import { Sparkles } from "lucide-react";

/**
 * St. Patrick's Day welcome banner with bold Irish flair
 * Full-width themed banner with rainbow, shamrocks, pot of gold, and Celtic styling
 */

const Shamrock: React.FC<{ size: number; className?: string; style?: React.CSSProperties }> = ({ size, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={style}
  >
    <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 1.5 1 2.5 2 3-2 0-4.5 1-4.5 3.5S8.5 15.5 10 15c-1 1-2 3-2 4.5 0 1.5 1.5 2.5 3 2.5s2-1 2-2v-6c0 0 0 2 0 2v4c0 1 .5 2 2 2s3-1 3-2.5c0-1.5-1-3.5-2-4.5 1.5.5 3.5-.5 3.5-3S16 9.5 14 9.5c1-0.5 2-1.5 2-3C16 3.5 14.5 2 13 2c-0.5 0-1 0.5-1 1.5V5c0-1.5-.5-3-1-3z" />
  </svg>
);

// Gold coin component
const GoldCoin: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <div 
    className={className}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #DAA520 100%)',
      border: '2px solid #B8860B',
      boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5), inset 0 -2px 4px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span style={{ fontSize: size * 0.5, color: '#228B22' }}>☘</span>
  </div>
);

export const StPatricksWelcomeBanner = () => {
  const { theme } = useTheme();
  
  if (theme !== 'stpatricks') return null;
  
  return (
    <div className="relative w-full h-24 sm:h-32 md:h-40 overflow-hidden rounded-xl sm:rounded-2xl border-2 border-emerald-500/30">
      {/* Rainbow gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, 
              hsl(142 60% 20%) 0%,
              hsl(142 50% 15%) 100%
            )
          `,
        }}
      />
      
      {/* Rainbow arc at top */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[150%] h-48 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 50% 100% at 50% 100%,
              transparent 60%,
              #ff0000 62%, #ff0000 64%,
              #ff7f00 66%, #ff7f00 68%,
              #ffff00 70%, #ffff00 72%,
              #00ff00 74%, #00ff00 76%,
              #0000ff 78%, #0000ff 80%,
              #4b0082 82%, #4b0082 84%,
              #9400d3 86%, #9400d3 88%,
              transparent 90%
            )
          `,
        }}
      />
      
      {/* Shamrock pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(12)].map((_, i) => (
          <Shamrock 
            key={i}
            size={20 + (i % 3) * 8}
            className="absolute text-emerald-400"
            style={{
              left: `${(i * 8.5) % 100}%`,
              top: `${(i * 15 + 10) % 80}%`,
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>
      
      {/* Gold coins scattered */}
      <GoldCoin size={16} className="absolute top-3 left-[10%] opacity-70" />
      <GoldCoin size={12} className="absolute top-6 left-[15%] opacity-50" />
      <GoldCoin size={14} className="absolute bottom-4 right-[12%] opacity-60" />
      <GoldCoin size={10} className="absolute bottom-6 right-[18%] opacity-40" />
      
      {/* Large decorative shamrocks on sides */}
      <Shamrock 
        size={60} 
        className="absolute -left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-40"
        style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))' }}
      />
      <Shamrock 
        size={60} 
        className="absolute -right-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-40"
        style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))' }}
      />
      
      {/* Sparkles */}
      <Sparkles 
        size={18} 
        className="absolute top-4 left-[25%] text-yellow-400 opacity-70"
        style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite' }}
      />
      <Sparkles 
        size={14} 
        className="absolute bottom-5 right-[25%] text-yellow-400 opacity-60"
        style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite 0.5s' }}
      />
      <Sparkles 
        size={12} 
        className="absolute top-8 right-[30%] text-emerald-300 opacity-50"
        style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite 1s' }}
      />
      
      {/* Main content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center relative z-10">
          {/* Shamrock + Title + Shamrock */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <Shamrock 
              size={36} 
              className="text-emerald-400 hidden sm:block"
              style={{ 
                filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))',
                animation: 'stpatricksFloat 3s ease-in-out infinite',
              }}
            />
            
            <div>
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #00ff00 0%, #FFD700 30%, #32CD32 60%, #FFD700 100%)',
                  backgroundSize: '300% 300%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'stpatricksGoldShimmer 3s ease-in-out infinite',
                  textShadow: '0 0 30px rgba(34, 197, 94, 0.5)',
                }}
              >
                ☘️ Justachat™ ☘️
              </h1>
              <p 
                className="text-sm sm:text-base md:text-lg font-semibold mt-1 sm:mt-2 tracking-wide"
                style={{
                  color: '#90EE90',
                  textShadow: '0 0 10px rgba(144, 238, 144, 0.5)',
                }}
              >
                🍀 Luck of the Irish in Every Chat 🍀
              </p>
            </div>
            
            <Shamrock 
              size={36} 
              className="text-emerald-400 hidden sm:block"
              style={{ 
                filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))',
                animation: 'stpatricksFloat 3s ease-in-out infinite 0.5s',
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Bottom gold bar accent */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, #FFD700, #FFA500, #FFD700, transparent)',
        }}
      />
      
      {/* Celtic knot corner decorations */}
      <div 
        className="absolute top-2 left-2 w-6 h-6 sm:w-8 sm:h-8 border-2 border-emerald-500/40 rounded-tl-lg"
        style={{ borderRight: 'none', borderBottom: 'none' }}
      />
      <div 
        className="absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 border-2 border-emerald-500/40 rounded-tr-lg"
        style={{ borderLeft: 'none', borderBottom: 'none' }}
      />
      <div 
        className="absolute bottom-2 left-2 w-6 h-6 sm:w-8 sm:h-8 border-2 border-emerald-500/40 rounded-bl-lg"
        style={{ borderRight: 'none', borderTop: 'none' }}
      />
      <div 
        className="absolute bottom-2 right-2 w-6 h-6 sm:w-8 sm:h-8 border-2 border-emerald-500/40 rounded-br-lg"
        style={{ borderLeft: 'none', borderTop: 'none' }}
      />
    </div>
  );
};
