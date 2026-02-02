import { useState } from 'react';
import { useSimulationPill, PillChoice } from '@/hooks/useSimulationPill';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import matrixPillsImg from '@/assets/matrix/matrix-pills.jpg';
import redPillChoiceImg from '@/assets/matrix/red-pill-choice.png';
import bluePillChoiceImg from '@/assets/matrix/blue-pill-choice.png';

interface SimulationPillSelectorProps {
  onComplete?: () => void;
}

/**
 * Red pill / Blue pill selector shown on the login page when Simulation theme is active
 * "You take the blue pill... the story ends. You take the red pill... you stay in Wonderland."
 */
export const SimulationPillSelector = ({ onComplete }: SimulationPillSelectorProps) => {
  const { theme } = useTheme();
  const { pill, setPill, hasPill } = useSimulationPill();
  const [hovering, setHovering] = useState<PillChoice>(null);
  const [selected, setSelected] = useState<PillChoice>(null);
  const [animating, setAnimating] = useState(false);
  const [showChoiceImage, setShowChoiceImage] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Only show for Simulation theme
  if (theme !== 'matrix') return null;
  
  // If fully completed (after image shown), don't render anything
  if (completed) return null;

  const handleSelect = (choice: PillChoice) => {
    if (animating || !choice) return;
    
    setSelected(choice);
    setAnimating(true);
    
    // First phase: fade out the selector (800ms), then show the pill choice image
    setTimeout(() => {
      setShowChoiceImage(true);
    }, 800);
    
    // Second phase: after showing the image for ~3 seconds, save and complete
    setTimeout(() => {
      setPill(choice);
      setShowChoiceImage(false);
      setAnimating(false);
      setCompleted(true);
      onComplete?.();
    }, 4000);
  };

  // If already has pill (from previous session) and not in the middle of animation, show indicator
  if (hasPill && !animating && !showChoiceImage) {
    return (
      <button
        onClick={() => setPill(null)} // Reset to allow re-selection
        className="flex items-center gap-2 px-3 py-1.5 rounded border border-green-500/30 bg-black/50 hover:bg-green-900/20 transition-colors group"
        title="Click to choose again"
      >
        {/* Cropped pill image */}
        <div 
          className="w-6 h-4 bg-cover bg-no-repeat rounded-sm"
          style={{
            backgroundImage: `url(${matrixPillsImg})`,
            backgroundPosition: pill === 'red' ? '0% 50%' : '100% 50%',
            backgroundSize: '200% 100%',
          }}
        />
        <span className="text-xs text-green-400/70 font-mono group-hover:text-green-400">
          {pill === 'red' ? 'RED PILL' : 'BLUE PILL'}
        </span>
      </button>
    );
  }

  // Show the full-screen choice image when pill is selected
  if (showChoiceImage && selected) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
        <img
          src={selected === 'red' ? redPillChoiceImg : bluePillChoiceImg}
          alt={selected === 'red' ? 'You chose the red pill' : 'You chose the blue pill'}
          className="w-full h-full object-cover"
          style={{
            animation: 'pillChoiceFadeIn 0.5s ease-out forwards',
          }}
        />
        {/* CRT scanline effect overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
          }}
        />
        {/* Add keyframes */}
        <style>{`
          @keyframes pillChoiceFadeIn {
            from { opacity: 0; transform: scale(1.05); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }
  
  // If hasPill is already set (returning user), don't show the selector
  if (hasPill) return null;

  return (
    <>
      <div className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/95 transition-opacity duration-500",
        animating && "opacity-0 pointer-events-none"
      )}>
        {/* CRT scanline effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)'
          }}
        />
        
        <div className="text-center space-y-8 px-4">
          {/* Morpheus quote */}
          <div className="space-y-2">
            <p className="text-green-400 font-mono text-sm md:text-base animate-pulse">
              This is your last chance.
            </p>
            <p className="text-green-500/80 font-mono text-xs md:text-sm max-w-md mx-auto leading-relaxed">
              After this, there is no turning back.
            </p>
          </div>

          {/* Pills - using actual image */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {/* Red Pill - left side of image */}
            <button
              onClick={() => handleSelect('red')}
              onMouseEnter={() => setHovering('red')}
              onMouseLeave={() => setHovering(null)}
              className={cn(
                "relative group transition-all duration-300",
                selected === 'red' && "scale-125",
                selected === 'blue' && "opacity-0 scale-75"
              )}
            >
              <div 
                className={cn(
                  "w-20 h-14 md:w-28 md:h-20 bg-cover bg-no-repeat rounded-lg transition-all duration-300",
                  "shadow-lg group-hover:shadow-red-500/50 group-hover:shadow-xl",
                  hovering === 'red' && "scale-110"
                )}
                style={{
                  backgroundImage: `url(${matrixPillsImg})`,
                  backgroundPosition: '0% 50%',
                  backgroundSize: '200% 100%',
                }}
              />
              
              {/* Glow effect */}
              <div className={cn(
                "absolute -inset-4 rounded-full bg-red-500/20 blur-xl transition-opacity",
                hovering === 'red' ? "opacity-100" : "opacity-0"
              )} />
            </button>

            {/* Divider */}
            <div className="text-green-500/50 font-mono text-2xl">|</div>

            {/* Blue Pill - right side of image */}
            <button
              onClick={() => handleSelect('blue')}
              onMouseEnter={() => setHovering('blue')}
              onMouseLeave={() => setHovering(null)}
              className={cn(
                "relative group transition-all duration-300",
                selected === 'blue' && "scale-125",
                selected === 'red' && "opacity-0 scale-75"
              )}
            >
              <div 
                className={cn(
                  "w-20 h-14 md:w-28 md:h-20 bg-cover bg-no-repeat rounded-lg transition-all duration-300",
                  "shadow-lg group-hover:shadow-blue-500/50 group-hover:shadow-xl",
                  hovering === 'blue' && "scale-110"
                )}
                style={{
                  backgroundImage: `url(${matrixPillsImg})`,
                  backgroundPosition: '100% 50%',
                  backgroundSize: '200% 100%',
                }}
              />
              
              {/* Glow effect */}
              <div className={cn(
                "absolute -inset-4 rounded-full bg-blue-500/20 blur-xl transition-opacity",
                hovering === 'blue' ? "opacity-100" : "opacity-0"
              )} />
            </button>
          </div>

          {/* Description based on hover */}
          <div className="h-16 flex items-center justify-center">
            {hovering === 'blue' && (
              <p className="text-blue-400 font-mono text-xs md:text-sm max-w-xs animate-fade-in">
                The story ends. You wake up and believe whatever you want to believe.
              </p>
            )}
            {hovering === 'red' && (
              <p className="text-red-400 font-mono text-xs md:text-sm max-w-xs animate-fade-in">
                You stay in Wonderland, and I show you how deep the rabbit hole goes.
              </p>
            )}
            {!hovering && !selected && (
              <p className="text-green-500/50 font-mono text-xs">
                Choose wisely...
              </p>
            )}
            {selected && (
              <p className={cn(
                "font-mono text-sm animate-pulse",
                selected === 'red' ? "text-red-400" : "text-blue-400"
              )}>
                {selected === 'red' ? "Welcome to the real world..." : "Sweet dreams..."}
              </p>
            )}
          </div>

          {/* Skip option */}
          {!selected && (
            <button
              onClick={() => {
                setPill('blue'); // Default to blue if skipped
                setCompleted(true);
                onComplete?.();
              }}
              className="text-green-500/30 hover:text-green-500/60 font-mono text-xs transition-colors"
            >
              [skip]
            </button>
          )}
        </div>
      </div>
    </>
  );
};
