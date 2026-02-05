/**
  * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
  * ╚═ Proprietary software. All rights reserved. ══════════════╝
  */
 
 import React from 'react';
 import { useTheme } from '@/contexts/ThemeContext';
 
 /**
  * OG Theme Watermark - Minimalist abstract design
  * Interconnected circles representing connection/chat in an artistic way
  */
 export const OGWatermark: React.FC = () => {
   const { theme } = useTheme();
 
   // Only show for OG/jac theme (default theme)
   if (theme !== 'jac') {
     return null;
   }
 
   return (
     <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
       {/* Minimalist abstract - interconnected circles */}
       <svg
         viewBox="0 0 400 200"
         className="w-[280px] sm:w-[360px] md:w-[440px] h-auto select-none"
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
         
         {/* Abstract interconnected circles - representing connection */}
         <g filter="url(#ogGlow)" transform="translate(200, 100)">
           {/* Large outer ring */}
           <circle 
             cx="0" 
             cy="0" 
             r="70" 
             fill="none" 
             stroke="url(#ogGradient)" 
             strokeWidth="2"
             opacity="0.8"
           />
           
           {/* Left conversation bubble - abstract */}
           <circle 
             cx="-40" 
             cy="-15" 
             r="35" 
             fill="url(#ogGradient)" 
             opacity="0.4"
           />
           
           {/* Right conversation bubble - abstract */}
           <circle 
             cx="40" 
             cy="15" 
             r="35" 
             fill="url(#ogGradient)" 
             opacity="0.4"
           />
           
           {/* Intersection highlight - the "connection" */}
           <ellipse 
             cx="0" 
             cy="0" 
             rx="18" 
             ry="25" 
             fill="url(#ogGradient)" 
             opacity="0.7"
           />
           
           {/* Small accent dots - representing messages flowing */}
           <circle cx="-65" cy="-35" r="6" fill="url(#ogGradient)" opacity="0.5" />
           <circle cx="-80" cy="-20" r="4" fill="url(#ogGradient)" opacity="0.35" />
           <circle cx="-88" cy="-5" r="2.5" fill="url(#ogGradient)" opacity="0.25" />
           
           <circle cx="65" cy="35" r="6" fill="url(#ogGradient)" opacity="0.5" />
           <circle cx="80" cy="20" r="4" fill="url(#ogGradient)" opacity="0.35" />
           <circle cx="88" cy="5" r="2.5" fill="url(#ogGradient)" opacity="0.25" />
           
           {/* Inner connection arcs */}
           <path 
             d="M -25 -30 Q 0 -45 25 -30" 
             fill="none" 
             stroke="url(#ogGradient)" 
             strokeWidth="1.5"
             opacity="0.5"
           />
           <path 
             d="M -25 30 Q 0 45 25 30" 
             fill="none" 
             stroke="url(#ogGradient)" 
             strokeWidth="1.5"
             opacity="0.5"
           />
         </g>
       
       </svg>
     </div>
   );
 };