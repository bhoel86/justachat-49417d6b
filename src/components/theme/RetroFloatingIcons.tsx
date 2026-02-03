/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

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

// 80s confetti pieces with neon colors - star and geometric shapes
const confettiPieces = [
  // Scattered across the viewport - varied shapes
  { top: '10%', left: '5%', color: '#FF00FF', shape: 'star', size: 12, delay: 0 },
  { top: '12%', left: '20%', color: '#00FFFF', shape: 'diamond', size: 10, delay: 0.5 },
  { top: '8%', right: '15%', color: '#FFFF00', shape: 'star', size: 14, delay: 1 },
  { top: '15%', right: '5%', color: '#FF6B9D', shape: 'triangle', size: 10, delay: 0.3 },
  { top: '20%', left: '30%', color: '#9D4EDD', shape: 'diamond', size: 8, delay: 0.8 },
  
  { top: '25%', right: '25%', color: '#00FFFF', shape: 'star', size: 12, delay: 1.2 },
  { top: '30%', left: '8%', color: '#FF00FF', shape: 'triangle', size: 8, delay: 0.2 },
  { top: '35%', right: '8%', color: '#FFFF00', shape: 'diamond', size: 10, delay: 0.7 },
  { top: '38%', left: '22%', color: '#FF6B9D', shape: 'star', size: 10, delay: 1.5 },
  
  { top: '45%', right: '18%', color: '#9D4EDD', shape: 'triangle', size: 9, delay: 0.4 },
  { top: '50%', left: '12%', color: '#00FFFF', shape: 'diamond', size: 11, delay: 0.9 },
  { top: '55%', right: '6%', color: '#FF00FF', shape: 'star', size: 10, delay: 1.1 },
  { top: '58%', left: '28%', color: '#FFFF00', shape: 'triangle', size: 8, delay: 0.6 },
  
  { top: '65%', right: '22%', color: '#FF6B9D', shape: 'star', size: 14, delay: 1.3 },
  { top: '70%', left: '6%', color: '#9D4EDD', shape: 'diamond', size: 9, delay: 0.1 },
  { top: '72%', right: '12%', color: '#00FFFF', shape: 'triangle', size: 10, delay: 0.8 },
  { top: '78%', left: '18%', color: '#FF00FF', shape: 'star', size: 12, delay: 1.4 },
  
  { top: '82%', right: '28%', color: '#FFFF00', shape: 'diamond', size: 8, delay: 0.5 },
  { top: '85%', left: '25%', color: '#FF6B9D', shape: 'triangle', size: 10, delay: 1.0 },
  { top: '88%', right: '8%', color: '#9D4EDD', shape: 'star', size: 11, delay: 0.3 },
];

// Render confetti shape based on type
const ConfettiShape = ({ shape, size, color }: { shape: string; size: number; color: string }) => {
  if (shape === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  if (shape === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2L22 12L12 22L2 12L12 2Z" />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2L22 22H2L12 2Z" />
      </svg>
    );
  }
  return null;
};

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
      
      {/* 80s Confetti pieces - stars, diamonds, triangles */}
      {confettiPieces.map((piece, index) => {
        const { color, shape, size, delay, ...position } = piece;
        return (
          <div
            key={`confetti-${index}`}
            className="absolute"
            style={{
              ...position,
              opacity: 0.5,
              filter: `drop-shadow(0 0 ${size / 2}px ${color})`,
              transform: `rotate(${index * 25}deg)`,
              animation: `retroConfettiFall 4s ease-in-out infinite, retroConfettiGlow 2s ease-in-out infinite`,
              animationDelay: `${delay}s, ${delay}s`,
            }}
          >
            <ConfettiShape shape={shape} size={size} color={color} />
          </div>
        );
      })}
      
      {/* CSS animations */}
      <style>{`
        @keyframes retroConfettiFall {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(8px) rotate(15deg);
          }
        }
        
        @keyframes retroConfettiGlow {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.65;
          }
        }
      `}</style>
    </div>
  );
};
