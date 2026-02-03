/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useMemo } from 'react';
import VideoTile from './VideoTile';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Users } from 'lucide-react';

interface Broadcaster {
  odious: string;
  username: string;
  avatarUrl?: string | null;
  isBroadcasting: boolean;
  stream?: MediaStream;
}

interface VideoGridProps {
  broadcasters: Broadcaster[];
  localBroadcaster?: {
    odious: string;
    username: string;
    avatarUrl?: string | null;
    stream: MediaStream;
  } | null;
  currentUserId: string;
  getRoleBadge: (odious: string) => React.ReactNode;
  getRemoteStream: (odious: string) => MediaStream | undefined;
  aiEnhanced?: boolean;
  enhanceStrength?: number;
  beautyMode?: boolean;
  softFocus?: number;
  warmth?: number;
  maxSlots?: number;
}

const VideoGrid = ({
  broadcasters,
  localBroadcaster,
  currentUserId,
  getRoleBadge,
  getRemoteStream,
  aiEnhanced = false,
  enhanceStrength = 50,
  beautyMode = false,
  softFocus = 40,
  warmth = 30,
  maxSlots = 6,
}: VideoGridProps) => {
  // Combine local and remote broadcasters
  const allBroadcasters = useMemo(() => {
    const list: Array<Broadcaster & { isLocal?: boolean }> = [];
    
    // Add local first if broadcasting
    if (localBroadcaster) {
      list.push({
        odious: localBroadcaster.odious,
        username: localBroadcaster.username,
        avatarUrl: localBroadcaster.avatarUrl,
        isBroadcasting: true,
        stream: localBroadcaster.stream,
        isLocal: true,
      });
    }
    
    // Add remote broadcasters (excluding self)
    broadcasters
      .filter(b => b.odious !== currentUserId)
      .forEach(b => {
        list.push({
          ...b,
          stream: getRemoteStream(b.odious),
          isLocal: false,
        });
      });
    
    return list;
  }, [broadcasters, localBroadcaster, currentUserId, getRemoteStream]);

  // Split into visible and waiting queue
  const visibleBroadcasters = allBroadcasters.slice(0, maxSlots);
  const waitingQueue = allBroadcasters.slice(maxSlots);

  // Calculate grid layout based on number of broadcasters
  const getGridClass = (count: number): string => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3'; // 5-6 broadcasters
  };

  const totalCount = allBroadcasters.length;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Main Video Grid - Equal sizing */}
      <div className={`flex-1 min-h-0 grid ${getGridClass(visibleBroadcasters.length)} gap-2 auto-rows-fr`}>
        {visibleBroadcasters.map((broadcaster) => (
          <VideoTile
            key={broadcaster.odious}
            stream={broadcaster.stream}
            username={broadcaster.username}
            avatarUrl={broadcaster.avatarUrl}
            isLocal={broadcaster.isLocal}
            isBroadcasting={true}
            roleBadge={getRoleBadge(broadcaster.odious)}
            aiEnhanced={broadcaster.isLocal ? aiEnhanced : false}
            enhanceStrength={enhanceStrength}
            beautyMode={broadcaster.isLocal ? beautyMode : false}
            softFocus={softFocus}
            warmth={warmth}
          />
        ))}
      </div>

      {/* Waiting Queue */}
      {waitingQueue.length > 0 && (
        <div className="shrink-0 bg-card/50 rounded-lg border border-border p-2">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Waiting Queue
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {waitingQueue.length} waiting
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {waitingQueue.map((broadcaster, idx) => (
              <div
                key={broadcaster.odious}
                className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1"
              >
                <span className="text-[10px] text-muted-foreground font-mono">
                  #{idx + 1}
                </span>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={broadcaster.avatarUrl || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {broadcaster.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate max-w-[60px]">
                  {broadcaster.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Users className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">No streams yet</p>
          <p className="text-xs">Hold the Stream button to go live</p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
