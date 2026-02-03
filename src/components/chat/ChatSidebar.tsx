/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import ChannelList, { Channel } from './ChannelList';

interface ChatSidebarProps {
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  autoSelectFirst?: boolean;
}

const ChatSidebar = ({
  currentChannelId,
  onChannelSelect,
  autoSelectFirst,
}: ChatSidebarProps) => {
  return (
    <div className="w-40 shrink-0 h-full bg-card/50 border-r border-border flex flex-col">
      <ChannelList
        currentChannelId={currentChannelId}
        onChannelSelect={onChannelSelect}
        autoSelectFirst={autoSelectFirst}
      />
    </div>
  );
};

export default ChatSidebar;
