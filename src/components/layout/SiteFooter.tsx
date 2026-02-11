import { Link } from "react-router-dom";
import { ThemedMascot } from "@/components/theme/ThemedMascot";
import { useTheme } from "@/contexts/ThemeContext";

const SiteFooter = () => {
  const { theme } = useTheme();
  const isRetro = theme === 'retro80s';

  return (
    <footer className={`border-t py-6 relative overflow-visible ${
      isRetro 
        ? 'bg-[hsl(50_100%_70%)] border-t-[3px] border-black' 
        : 'border-border bg-card/30'
    }`}>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-center relative">
          {/* Spacer on left to help center */}
          <div className="flex-1" />
          
          <div className="flex items-center">
            {/* Left mascot - theme aware */}
            <ThemedMascot side="left" />
            
            {/* Social Media Links + Copyright centered */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <a 
                  href="https://www.facebook.com/profile.php?id=61587064682802" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                    isRetro 
                      ? 'bg-[hsl(185_90%_50%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                      : 'rounded-lg bg-secondary hover:bg-primary/20'
                  }`}
                  title="Facebook"
                >
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/justachatunix/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                    isRetro 
                      ? 'bg-[hsl(330_90%_55%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                      : 'rounded-lg bg-secondary hover:bg-primary/20'
                  }`}
                  title="Instagram"
                >
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.tiktok.com/@0justachat0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                    isRetro 
                      ? 'bg-[hsl(270_50%_60%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                      : 'rounded-lg bg-secondary hover:bg-primary/20'
                  }`}
                  title="TikTok"
                >
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/UnixJustachat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                    isRetro 
                      ? 'bg-[hsl(185_90%_50%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                      : 'rounded-lg bg-secondary hover:bg-primary/20'
                  }`}
                  title="X (Twitter)"
                >
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
              
              {/* Copyright & Version - directly under social links */}
              <div className="text-center mt-2">
                <p className={`text-xs ${
                  isRetro 
                    ? 'font-["Press_Start_2P"] text-[8px] text-black' 
                    : 'text-muted-foreground'
                }`}>
                  <span className={isRetro ? 'text-[hsl(330_90%_45%)]' : ''}>Justachat™</span> Est. Jan 22, 2026 · 1:03 PM · © Unix
                </p>
                <p className={`text-xs mt-0.5 ${
                  isRetro 
                    ? 'font-["Press_Start_2P"] text-[6px] text-black/70' 
                    : 'text-muted-foreground/70'
                }`}>
                  Proprietary software. All rights reserved.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <a 
                    href="https://justachat.net" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    justachat.net
                  </a>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/legal" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Legal
                  </Link>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/cookies" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Privacy
                  </Link>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/about" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    About
                  </Link>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/features" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Features
                  </Link>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/faq" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    FAQ
                  </Link>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/free-chat" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Free Chat
                  </Link>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/chat-rooms" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Chat Rooms
                  </Link>
                  <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                  <Link 
                    to="/online-chat" 
                    className={`text-xs transition-colors ${
                      isRetro 
                        ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Online Chat
                  </Link>
                   <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                   <Link 
                     to="/site-index" 
                     className={`text-xs transition-colors ${
                       isRetro 
                         ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                         : 'text-muted-foreground hover:text-primary'
                     }`}
                   >
                     Site Index
                   </Link>
                </div>
              </div>
            </div>
            
            {/* Right mascot - theme aware */}
            <ThemedMascot side="right" />
          </div>
          
          {/* Spacer on right to balance */}
          <div className="flex-1" />
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
