import React from 'react';
import { Cpu, Wifi } from 'lucide-react';

interface CyberpunkWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const CyberpunkWelcomeBanner: React.FC<CyberpunkWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${isMobile ? 'py-4 px-3' : 'py-6 px-4'}`}
      style={{
        background: 'linear-gradient(180deg, hsl(220 50% 5%) 0%, hsl(220 45% 8%) 50%, hsl(220 50% 5%) 100%)',
      }}
    >
      {/* Circuit board pattern */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(90deg, hsl(200 100% 55% / 0.3) 1px, transparent 1px),
            linear-gradient(hsl(200 100% 55% / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />
      
      {/* Neon light beams */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 30% at 50% 0%, hsl(200 100% 55% / 0.2) 0%, transparent 70%)',
        }}
      />
      
      {/* Scan line effect */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(200 100% 55% / 0.1) 2px, hsl(200 100% 55% / 0.1) 4px)',
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Tech icons */}
        <div className="flex items-center gap-3">
          <Cpu className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[hsl(200_100%_55%)]`} />
          <div 
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded flex items-center justify-center`}
            style={{
              background: 'linear-gradient(135deg, hsl(200 100% 55%) 0%, hsl(280 100% 65%) 100%)',
              boxShadow: '0 0 30px hsl(200 100% 55% / 0.6), 0 0 60px hsl(200 100% 55% / 0.3)',
            }}
          >
            <Wifi className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
          </div>
          <Cpu className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[hsl(280_100%_65%)]`} />
        </div>
        
        {/* Title with glitch styling */}
        <h1 
          className={`font-mono font-bold tracking-widest ${isMobile ? 'text-lg' : 'text-2xl sm:text-3xl'}`}
          style={{
            color: 'hsl(200 100% 55%)',
            textShadow: '0 0 10px hsl(200 100% 55%), 0 0 20px hsl(200 100% 55%), 2px 0 0 hsl(280 100% 65% / 0.5), -2px 0 0 hsl(200 100% 55% / 0.5)',
          }}
        >
          JUSTACHAT
        </h1>
        
        {/* Status bar */}
        <div 
          className={`flex items-center gap-2 font-mono ${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
          style={{ color: 'hsl(200 100% 70%)' }}
        >
          <span className="animate-pulse">●</span>
          <span>CONNECTED TO JUSTACHAT.NET</span>
        </div>
        
        {/* CTA hint */}
        {onJoinClick && (
          <p 
            className={`font-mono ${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
            style={{ color: 'hsl(280 100% 65%)' }}
          >
            [ENTER_SYSTEM] →
          </p>
        )}
      </div>
    </div>
  );
};
