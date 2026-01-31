import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Sparkles, Folder, MessageSquare, FileText, Hourglass, Disc, 
  Star, Search, ThumbsUp, StickyNote
} from 'lucide-react';

// Icons positioned with safe margins (8% from edges minimum) and consistent sizing
const floatingIcons = [
  // Top section - safe from header
  { Icon: Star, top: '15%', left: '8%', color: 'text-cyan-400', size: 18, rotate: 0 },
  { Icon: Sparkles, top: '18%', right: '10%', color: 'text-purple-400', size: 16, rotate: 15 },
  { Icon: Folder, top: '22%', left: '15%', color: 'text-yellow-400', size: 20, rotate: -10 },
  
  // Upper-middle section
  { Icon: MessageSquare, top: '30%', right: '12%', color: 'text-pink-400', size: 18, rotate: 5 },
  { Icon: FileText, top: '35%', left: '10%', color: 'text-cyan-300', size: 16, rotate: -5 },
  { Icon: Star, top: '40%', right: '8%', color: 'text-yellow-300', size: 14, rotate: 20 },
  
  // Middle section
  { Icon: Disc, top: '50%', left: '8%', color: 'text-purple-300', size: 20, rotate: 0 },
  { Icon: Sparkles, top: '55%', right: '10%', color: 'text-cyan-400', size: 14, rotate: 30 },
  
  // Lower-middle section
  { Icon: Hourglass, bottom: '35%', left: '12%', color: 'text-yellow-400', size: 18, rotate: 0 },
  { Icon: Search, bottom: '40%', right: '10%', color: 'text-pink-300', size: 16, rotate: -10 },
  
  // Bottom section - safe from footer
  { Icon: StickyNote, bottom: '22%', left: '10%', color: 'text-yellow-300', size: 16, rotate: -15 },
  { Icon: ThumbsUp, bottom: '25%', right: '12%', color: 'text-cyan-400', size: 18, rotate: 10 },
  { Icon: Star, bottom: '18%', left: '18%', color: 'text-purple-400', size: 12, rotate: 30 },
  { Icon: Sparkles, bottom: '15%', right: '15%', color: 'text-pink-400', size: 14, rotate: 0 },
];

// 80s confetti pieces with neon colors
const confettiPieces = [
  // Scattered across the viewport
  { top: '10%', left: '5%', color: '#FF00FF', shape: 'square', size: 8, delay: 0 },
  { top: '12%', left: '20%', color: '#00FFFF', shape: 'rect', size: 6, delay: 0.5 },
  { top: '8%', right: '15%', color: '#FFFF00', shape: 'square', size: 10, delay: 1 },
  { top: '15%', right: '5%', color: '#FF6B9D', shape: 'rect', size: 7, delay: 0.3 },
  { top: '20%', left: '30%', color: '#9D4EDD', shape: 'square', size: 6, delay: 0.8 },
  
  { top: '25%', right: '25%', color: '#00FFFF', shape: 'square', size: 9, delay: 1.2 },
  { top: '30%', left: '8%', color: '#FF00FF', shape: 'rect', size: 5, delay: 0.2 },
  { top: '35%', right: '8%', color: '#FFFF00', shape: 'square', size: 8, delay: 0.7 },
  { top: '38%', left: '22%', color: '#FF6B9D', shape: 'rect', size: 6, delay: 1.5 },
  
  { top: '45%', right: '18%', color: '#9D4EDD', shape: 'square', size: 7, delay: 0.4 },
  { top: '50%', left: '12%', color: '#00FFFF', shape: 'rect', size: 8, delay: 0.9 },
  { top: '55%', right: '6%', color: '#FF00FF', shape: 'square', size: 6, delay: 1.1 },
  { top: '58%', left: '28%', color: '#FFFF00', shape: 'rect', size: 5, delay: 0.6 },
  
  { top: '65%', right: '22%', color: '#FF6B9D', shape: 'square', size: 9, delay: 1.3 },
  { top: '70%', left: '6%', color: '#9D4EDD', shape: 'rect', size: 7, delay: 0.1 },
  { top: '72%', right: '12%', color: '#00FFFF', shape: 'square', size: 6, delay: 0.8 },
  { top: '78%', left: '18%', color: '#FF00FF', shape: 'rect', size: 8, delay: 1.4 },
  
  { top: '82%', right: '28%', color: '#FFFF00', shape: 'square', size: 5, delay: 0.5 },
  { top: '85%', left: '25%', color: '#FF6B9D', shape: 'rect', size: 7, delay: 1.0 },
  { top: '88%', right: '8%', color: '#9D4EDD', shape: 'square', size: 6, delay: 0.3 },
];

export const RetroFloatingIcons: React.FC = () => {
  const { theme } = useTheme();

  // Only show for retro80s theme
  if (theme !== 'retro80s') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating icons */}
      {floatingIcons.map((item, index) => {
        const { Icon, color, size, rotate, ...position } = item;
        return (
          <div
            key={`icon-${index}`}
            className={`absolute ${color} opacity-50`}
            style={{ 
              ...position,
              transform: `rotate(${rotate}deg)`,
              animation: `pulse ${2 + (index % 2)}s ease-in-out infinite`,
              animationDelay: `${index * 0.3}s`,
            }}
          >
            <Icon size={size} strokeWidth={2} />
          </div>
        );
      })}
      
      {/* 80s Confetti pieces */}
      {confettiPieces.map((piece, index) => {
        const { color, shape, size, delay, ...position } = piece;
        const isRect = shape === 'rect';
        return (
          <div
            key={`confetti-${index}`}
            className="absolute"
            style={{
              ...position,
              width: isRect ? size * 2 : size,
              height: isRect ? size : size,
              backgroundColor: color,
              opacity: 0.6,
              boxShadow: `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}`,
              transform: `rotate(${45 + index * 15}deg)`,
              animation: `retroConfettiFall 4s ease-in-out infinite, retroConfettiGlow 2s ease-in-out infinite`,
              animationDelay: `${delay}s, ${delay}s`,
            }}
          />
        );
      })}
      
      {/* CSS animations */}
      <style>{`
        @keyframes retroConfettiFall {
          0%, 100% {
            transform: translateY(0) rotate(45deg);
          }
          50% {
            transform: translateY(10px) rotate(60deg);
          }
        }
        
        @keyframes retroConfettiGlow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};
