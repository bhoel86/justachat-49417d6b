import React from 'react';
import { MessagesSquare } from 'lucide-react';

const VaporWelcomeBanner: React.FC = () => {
  return (
    <div className="vapor-welcome-banner mb-6 mx-4 sm:mx-0">
      {/* OS-style window */}
      <div className="vapor-window">
        {/* Title bar */}
        <div className="vapor-title-bar">
          <div className="vapor-window-controls">
            <div className="vapor-btn-close">×</div>
            <div className="vapor-btn-minimize">−</div>
            <div className="vapor-btn-maximize">□</div>
          </div>
          <span className="vapor-title-text">welcome.exe</span>
          <div className="w-16" />
        </div>
        
        {/* Window content */}
        <div className="vapor-window-content">
          <div className="flex items-center justify-center gap-4 mb-3">
            <MessagesSquare className="w-10 h-10 text-[#2EF2C2]" />
            <h1 className="vapor-title">JUSTACHAT</h1>
          </div>
          
          <div className="vapor-subtitle mb-4">
            <span className="vapor-blink">▶</span> CONNECTED TO JUSTACHAT.NET
          </div>
          
          <div className="vapor-message-box">
            <p className="vapor-message-text">
              Welcome to the retro chatroom experience!<br />
              Select a room to begin chatting.
            </p>
          </div>
          
          <div className="vapor-status-bar mt-4">
            <span>STATUS: ONLINE</span>
            <span className="vapor-status-indicator">●</span>
            <span>USERS: 42</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaporWelcomeBanner;
