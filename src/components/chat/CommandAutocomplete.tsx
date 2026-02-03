/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Terminal, User, Music, HelpCircle, MessageSquare, 
  Shield, UserX, VolumeX, Crown, Globe, Radio
} from 'lucide-react';

// Command definitions with metadata
export interface CommandDefinition {
  command: string;
  description: string;
  usage: string;
  category: 'general' | 'radio' | 'moderation' | 'admin' | 'services';
  requiresUser?: boolean; // If true, shows user picker after command selection
  icon?: React.ReactNode;
}

export const COMMANDS: CommandDefinition[] = [
  // General
  { command: '/help', description: 'Show all commands', usage: '/help', category: 'general', icon: <HelpCircle className="h-3 w-3" /> },
  { command: '/me', description: 'Send action message', usage: '/me <action>', category: 'general', icon: <MessageSquare className="h-3 w-3" /> },
  { command: '/nick', description: 'Change your display name', usage: '/nick <newname>', category: 'general', icon: <User className="h-3 w-3" /> },
  { command: '/pm', description: 'Start private chat', usage: '/pm <username>', category: 'general', requiresUser: true, icon: <MessageSquare className="h-3 w-3" /> },
  { command: '/invite', description: 'Invite user to room', usage: '/invite <username>', category: 'general', requiresUser: true, icon: <User className="h-3 w-3" /> },
  { command: '/clear', description: 'Clear your chat', usage: '/clear', category: 'general', icon: <Terminal className="h-3 w-3" /> },
  { command: '/users', description: 'List online users', usage: '/users', category: 'general', icon: <User className="h-3 w-3" /> },
  { command: '/whois', description: 'View user info', usage: '/whois <username>', category: 'general', requiresUser: true, icon: <User className="h-3 w-3" /> },
  
  // Radio
  { command: '/radio', description: 'Toggle radio player', usage: '/radio', category: 'radio', icon: <Radio className="h-3 w-3" /> },
  { command: '/play', description: 'Play radio', usage: '/play', category: 'radio', icon: <Music className="h-3 w-3" /> },
  { command: '/pause', description: 'Pause radio', usage: '/pause', category: 'radio', icon: <Music className="h-3 w-3" /> },
  { command: '/skip', description: 'Vote to skip song', usage: '/skip', category: 'radio', icon: <Music className="h-3 w-3" /> },
  { command: '/nowplaying', description: 'Show current song', usage: '/nowplaying', category: 'radio', icon: <Music className="h-3 w-3" /> },
  
  // Services
  { command: '/ns register', description: 'Register nickname', usage: '/ns register', category: 'services', icon: <Shield className="h-3 w-3" /> },
  { command: '/ns identify', description: 'Identify as nick owner', usage: '/ns identify', category: 'services', icon: <Shield className="h-3 w-3" /> },
  { command: '/ns info', description: 'View nick info', usage: '/ns info <nick>', category: 'services', requiresUser: true, icon: <Shield className="h-3 w-3" /> },
  { command: '/ns drop', description: 'Drop your nickname', usage: '/ns drop', category: 'services', icon: <Shield className="h-3 w-3" /> },
  { command: '/cs register', description: 'Register channel', usage: '/cs register [desc]', category: 'services', icon: <Shield className="h-3 w-3" /> },
  { command: '/cs info', description: 'View channel info', usage: '/cs info', category: 'services', icon: <Shield className="h-3 w-3" /> },
  { command: '/stats', description: 'View network stats', usage: '/stats', category: 'services', icon: <Globe className="h-3 w-3" /> },
  { command: '/ghost', description: 'Toggle invisible mode', usage: '/ghost', category: 'services', icon: <User className="h-3 w-3" /> },
  
  // Moderation
  { command: '/op', description: 'Give moderator status', usage: '/op <username>', category: 'moderation', requiresUser: true, icon: <Shield className="h-3 w-3" /> },
  { command: '/deop', description: 'Remove moderator status', usage: '/deop <username>', category: 'moderation', requiresUser: true, icon: <Shield className="h-3 w-3" /> },
  { command: '/kick', description: 'Kick user from chat', usage: '/kick <username> [reason]', category: 'moderation', requiresUser: true, icon: <UserX className="h-3 w-3" /> },
  { command: '/ban', description: 'Ban user permanently', usage: '/ban <username> [reason]', category: 'moderation', requiresUser: true, icon: <UserX className="h-3 w-3" /> },
  { command: '/unban', description: 'Remove ban', usage: '/unban <username>', category: 'moderation', requiresUser: true, icon: <UserX className="h-3 w-3" /> },
  { command: '/mute', description: 'Mute user', usage: '/mute <username> [reason]', category: 'moderation', requiresUser: true, icon: <VolumeX className="h-3 w-3" /> },
  { command: '/unmute', description: 'Unmute user', usage: '/unmute <username>', category: 'moderation', requiresUser: true, icon: <VolumeX className="h-3 w-3" /> },
  { command: '/topic', description: 'Set channel topic', usage: '/topic <new topic>', category: 'moderation', icon: <Terminal className="h-3 w-3" /> },
  { command: '/roomban', description: 'Ban from this room', usage: '/roomban <username> [reason]', category: 'moderation', requiresUser: true, icon: <UserX className="h-3 w-3" /> },
  { command: '/roomunban', description: 'Unban from room', usage: '/roomunban <username>', category: 'moderation', requiresUser: true, icon: <UserX className="h-3 w-3" /> },
  { command: '/roommute', description: 'Mute in room', usage: '/roommute <username> [duration]', category: 'moderation', requiresUser: true, icon: <VolumeX className="h-3 w-3" /> },
  { command: '/roomunmute', description: 'Unmute in room', usage: '/roomunmute <username>', category: 'moderation', requiresUser: true, icon: <VolumeX className="h-3 w-3" /> },
  { command: '/roomkick', description: 'Kick from room', usage: '/roomkick <username>', category: 'moderation', requiresUser: true, icon: <UserX className="h-3 w-3" /> },
  { command: '/roomadmin', description: 'Become room admin', usage: '/roomadmin <password>', category: 'moderation', icon: <Crown className="h-3 w-3" /> },
  { command: '/oper', description: 'Authenticate as operator', usage: '/oper <username> <password>', category: 'moderation', icon: <Crown className="h-3 w-3" /> },
  { command: '/deoper', description: 'Remove operator status', usage: '/deoper <username> <password>', category: 'moderation', icon: <Crown className="h-3 w-3" /> },
  
  // Admin
  { command: '/admin', description: 'Promote to admin', usage: '/admin <username>', category: 'admin', requiresUser: true, icon: <Crown className="h-3 w-3" /> },
  { command: '/deadmin', description: 'Demote admin', usage: '/deadmin <username>', category: 'admin', requiresUser: true, icon: <Crown className="h-3 w-3" /> },
  { command: '/kline', description: 'Add global IP ban', usage: '/kline <ip_pattern> [reason]', category: 'admin', icon: <Shield className="h-3 w-3" /> },
  { command: '/unkline', description: 'Remove IP ban', usage: '/unkline <ip_pattern>', category: 'admin', icon: <Shield className="h-3 w-3" /> },
  { command: '/klines', description: 'List all K-lines', usage: '/klines', category: 'admin', icon: <Shield className="h-3 w-3" /> },
  
  // Trivia
  { command: '/trivia', description: 'Start trivia game', usage: '/trivia', category: 'general', icon: <HelpCircle className="h-3 w-3" /> },
  { command: '/score', description: 'View trivia stats', usage: '/score', category: 'general', icon: <HelpCircle className="h-3 w-3" /> },
  { command: '/leaderboard', description: 'View top players', usage: '/leaderboard', category: 'general', icon: <HelpCircle className="h-3 w-3" /> },
  { command: '/skipq', description: 'Skip trivia question', usage: '/skipq', category: 'general', icon: <HelpCircle className="h-3 w-3" /> },
];

const CATEGORY_ORDER: CommandDefinition['category'][] = ['general', 'radio', 'services', 'moderation', 'admin'];
const CATEGORY_LABELS: Record<CommandDefinition['category'], string> = {
  general: 'General',
  radio: 'Radio',
  services: 'Services',
  moderation: 'Moderation',
  admin: 'Admin',
};

interface CommandAutocompleteProps {
  query: string; // The text after "/" 
  onSelect: (command: CommandDefinition) => void;
  onSelectUser: (command: CommandDefinition, username: string) => void;
  onClose: () => void;
  users: { username: string; avatarUrl?: string | null }[];
}

const CommandAutocomplete = ({ query, onSelect, onSelectUser, onClose, users }: CommandAutocompleteProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState<CommandDefinition | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(('/' + query).toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  // Group by category
  const groupedCommands = CATEGORY_ORDER.reduce((acc, category) => {
    const cmds = filteredCommands.filter(c => c.category === category);
    if (cmds.length > 0) acc[category] = cmds;
    return acc;
  }, {} as Record<CommandDefinition['category'], CommandDefinition[]>);

  // Flatten for keyboard navigation
  const flatCommands = CATEGORY_ORDER.flatMap(cat => groupedCommands[cat] || []);

  // Filter users when in user selection mode
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userQuery.toLowerCase())
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCommand]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedCommand) {
      // User selection mode
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredUsers[selectedIndex]) {
        e.preventDefault();
        onSelectUser(selectedCommand, filteredUsers[selectedIndex].username);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedCommand(null);
        setUserQuery('');
      } else if (e.key === 'Backspace' && userQuery === '') {
        e.preventDefault();
        setSelectedCommand(null);
      }
    } else {
      // Command selection mode
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && flatCommands[selectedIndex]) {
        e.preventDefault();
        const cmd = flatCommands[selectedIndex];
        if (cmd.requiresUser) {
          setSelectedCommand(cmd);
          setSelectedIndex(0);
        } else {
          onSelect(cmd);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && flatCommands[selectedIndex]) {
        e.preventDefault();
        const cmd = flatCommands[selectedIndex];
        if (cmd.requiresUser) {
          setSelectedCommand(cmd);
          setSelectedIndex(0);
        } else {
          onSelect(cmd);
        }
      }
    }
  }, [flatCommands, filteredUsers, selectedIndex, selectedCommand, userQuery, onSelect, onSelectUser, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // If in user selection mode
  if (selectedCommand) {
    return (
      <div
        ref={containerRef}
        className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
      >
        <div className="px-3 py-2 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary font-mono">{selectedCommand.command}</span>
            <span className="text-muted-foreground">→ Select user:</span>
          </div>
        </div>
        <ScrollArea className="max-h-48">
          {filteredUsers.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No users found
            </div>
          ) : (
            filteredUsers.map((user, idx) => (
              <button
                key={user.username}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                  idx === selectedIndex ? 'bg-accent' : ''
                }`}
                onClick={() => onSelectUser(selectedCommand, user.username)}
              >
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">@{user.username}</span>
              </button>
            ))
          )}
        </ScrollArea>
        <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex justify-between">
          <span>↑↓ Navigate • Enter Select • Esc Back</span>
        </div>
      </div>
    );
  }

  // Command selection mode
  if (flatCommands.length === 0) {
    return (
      <div
        ref={containerRef}
        className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
      >
        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
          No commands found for "/{query}"
        </div>
      </div>
    );
  }

  let itemIndex = 0;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <ScrollArea className="max-h-64">
        {CATEGORY_ORDER.map(category => {
          const cmds = groupedCommands[category];
          if (!cmds) return null;
          
          return (
            <div key={category}>
              <div className="px-3 py-1.5 bg-muted/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wide sticky top-0">
                {CATEGORY_LABELS[category]}
              </div>
              {cmds.map(cmd => {
                const currentIndex = itemIndex++;
                return (
                  <button
                    key={cmd.command}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors ${
                      currentIndex === selectedIndex ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      if (cmd.requiresUser) {
                        setSelectedCommand(cmd);
                        setSelectedIndex(0);
                      } else {
                        onSelect(cmd);
                      }
                    }}
                  >
                    <span className="text-primary">{cmd.icon}</span>
                    <span className="font-mono text-sm text-primary">{cmd.command}</span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">{cmd.description}</span>
                    {cmd.requiresUser && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">+user</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </ScrollArea>
      <div className="px-3 py-1.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex justify-between">
        <span>↑↓ Navigate • Tab/Enter Select • Esc Close</span>
        <span className="font-mono">{flatCommands.length} commands</span>
      </div>
    </div>
  );
};

export default CommandAutocomplete;
