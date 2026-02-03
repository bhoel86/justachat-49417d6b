/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users, FlaskConical } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface TestViewer {
  odious: string;
  username: string;
  avatarUrl: string | null;
  isBroadcasting: boolean;
  role?: string;
}

const TEST_VIEWERS: TestViewer[] = [
  {
    odious: 'test-user-1',
    username: 'RegularUser',
    avatarUrl: null,
    isBroadcasting: false,
    role: undefined,
  },
  {
    odious: 'test-user-2',
    username: 'ModeratorMike',
    avatarUrl: null,
    isBroadcasting: false,
    role: 'moderator',
  },
  {
    odious: 'test-user-3',
    username: 'AdminAlice',
    avatarUrl: null,
    isBroadcasting: false,
    role: 'admin',
  },
  {
    odious: 'test-user-4',
    username: 'NewbieTester',
    avatarUrl: null,
    isBroadcasting: false,
    role: undefined,
  },
];

const TEST_BROADCASTERS: TestViewer[] = [
  {
    odious: 'test-broadcaster-1',
    username: 'StreamerSam',
    avatarUrl: null,
    isBroadcasting: true,
    role: undefined,
  },
  {
    odious: 'test-broadcaster-2',
    username: 'ModCaster',
    avatarUrl: null,
    isBroadcasting: true,
    role: 'moderator',
  },
];

interface TestViewersToggleProps {
  isOwner: boolean;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  testViewers: TestViewer[];
  testBroadcasters: TestViewer[];
}

export function TestViewersToggle({
  isOwner,
  enabled,
  onToggle,
  testViewers,
  testBroadcasters,
}: TestViewersToggleProps) {
  const [open, setOpen] = useState(false);
  const totalCount = testViewers.length + testBroadcasters.length;

  if (!isOwner) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          className={`gap-1.5 ${enabled ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
        >
          <FlaskConical className="w-4 h-4" />
          <span className="hidden sm:inline">Test Users</span>
          {enabled && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
              {totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-popover border-border" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="test-users-toggle" className="font-medium">
                Spawn Test Users
              </Label>
            </div>
            <Switch
              id="test-users-toggle"
              checked={enabled}
              onCheckedChange={onToggle}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Adds fake viewers and broadcasters with different roles so you can test moderation menus.
          </p>

          {enabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              {testBroadcasters.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Test Broadcasters:</p>
                  <ul className="space-y-1">
                    {testBroadcasters.map((v) => (
                      <li key={v.odious} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          {v.username}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {v.role || 'user'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Test Viewers:</p>
                <ul className="space-y-1">
                  {testViewers.map((v) => (
                    <li key={v.odious} className="flex items-center justify-between text-sm">
                      <span>{v.username}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {v.role || 'user'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { TEST_VIEWERS, TEST_BROADCASTERS };
