/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/avatar/UserAvatar";

interface MentionAutocompleteProps {
  query: string;
  users: { username: string; avatarUrl?: string | null }[];
  onSelect: (username: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const MentionAutocomplete = ({
  query,
  users,
  onSelect,
  onClose,
  position,
}: MentionAutocompleteProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users based on query
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8); // Limit to 8 suggestions

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredUsers.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex].username);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect, onClose]);

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px] max-w-[280px]"
      style={{ bottom: position.top, left: position.left }}
    >
      <div className="py-1 max-h-[240px] overflow-y-auto">
        <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wide">
          Users
        </div>
        {filteredUsers.map((user, index) => (
          <button
            key={user.username}
            onClick={() => onSelect(user.username)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
              index === selectedIndex
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent/50"
            )}
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              username={user.username}
              size="sm"
            />
            <span className="truncate">@{user.username}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MentionAutocomplete;
