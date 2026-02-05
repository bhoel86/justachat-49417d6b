/**
  * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
  * ╚═ Proprietary software. All rights reserved. ══════════════╝
  */
 
 import React from 'react';
 import { useTheme } from '@/contexts/ThemeContext';
 
 /**
  * OG Theme Watermark - Minimalist abstract with JAC™ branding
  * Clean geometric design with prominent trademark
  */
 export const OGWatermark: React.FC = () => {
   const { theme } = useTheme();
 
   // Only show for OG/jac theme (default theme)
   if (theme !== 'jac') {
     return null;
   }
 
   return (
     <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
       {/* Minimalist abstract with JAC™ branding */}
       <svg
         viewBox="0 0 300 180"
         className="w-[320px] sm:w-[400px] md:w-[500px] h-auto select-none"
         style={{ opacity: 0.06 }}
       >
         <defs>
           {/* Gradient for the main shapes */}
           <linearGradient id="ogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
             <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
             <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
           </linearGradient>
           
           {/* Soft glow filter */}
           <filter id="ogGlow" x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="4" result="blur" />
             <feMerge>
               <feMergeNode in="blur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
           </filter>
         </defs>
         
         <g filter="url(#ogGlow)" transform="translate(150, 90)">
           {/* Outer decorative ring */}
           <circle cx="0" cy="0" r="75" fill="none" stroke="url(#ogGradient)" strokeWidth="1.5" opacity="0.4" />
           <circle cx="0" cy="0" r="85" fill="none" stroke="url(#ogGradient)" strokeWidth="0.5" opacity="0.25" />
           
           {/* JAC text - bold and centered */}
           <text
             x="0"
             y="8"
             textAnchor="middle"
             dominantBaseline="middle"
             fill="url(#ogGradient)"
             fontSize="58"
             fontWeight="900"
             fontFamily="system-ui, -apple-system, sans-serif"
             letterSpacing="-2"
           >
             JAC
           </text>
           
           {/* Trademark symbol */}
           <text
             x="58"
             y="-18"
             textAnchor="start"
             fill="url(#ogGradient)"
             fontSize="16"
             fontWeight="700"
             fontFamily="system-ui, -apple-system, sans-serif"
           >
             ™
           </text>
           
           {/* Subtle underline accent */}
           <line x1="-45" y1="32" x2="45" y2="32" stroke="url(#ogGradient)" strokeWidth="2" opacity="0.6" />
           
           {/* Corner accents */}
           <circle cx="-70" cy="-55" r="4" fill="url(#ogGradient)" opacity="0.5" />
           <circle cx="70" cy="-55" r="4" fill="url(#ogGradient)" opacity="0.5" />
           <circle cx="-70" cy="55" r="4" fill="url(#ogGradient)" opacity="0.5" />
           <circle cx="70" cy="55" r="4" fill="url(#ogGradient)" opacity="0.5" />
           
           {/* Small flowing dots */}
           <circle cx="-90" cy="0" r="3" fill="url(#ogGradient)" opacity="0.35" />
           <circle cx="90" cy="0" r="3" fill="url(#ogGradient)" opacity="0.35" />
         </g>
       
       </svg>
     </div>
   );
 };