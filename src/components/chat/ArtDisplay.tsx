/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState } from 'react';
import { ExternalLink, ZoomIn, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface ArtDisplayProps {
  imageUrl: string;
  title: string;
  artist: string;
  year?: string | null;
  period?: string | null;
  medium?: string | null;
  commentary: string;
}

const ArtDisplay = ({
  imageUrl,
  title,
  artist,
  year,
  period,
  medium,
  commentary
}: ArtDisplayProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-br from-rose-500/10 to-amber-500/10 border border-rose-500/30 rounded-lg p-3 max-w-md">
        {/* Art Image */}
        <div className="relative group mb-2 rounded-lg overflow-hidden bg-muted/50">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={`${title} by ${artist}`}
              className="w-full h-auto max-h-64 object-contain cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => setIsZoomed(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
              <span className="text-sm">Image unavailable</span>
            </div>
          )}
          {!imageError && (
            <button
              onClick={() => setIsZoomed(true)}
              className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Art Info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-foreground leading-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            <span className="text-rose-400">{artist}</span>
            {year && <span> • {year}</span>}
          </p>
          {(period || medium) && (
            <p className="text-xs text-muted-foreground/80">
              {period && <span className="italic">{period}</span>}
              {period && medium && ' | '}
              {medium && <span>{medium}</span>}
            </p>
          )}
        </div>

        {/* Commentary */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-foreground leading-relaxed">
            {commentary}
          </p>
        </div>

        {/* External Link */}
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 mt-2 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View full resolution
        </a>
      </div>

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">{title} by {artist}</DialogTitle>
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-2 right-2 z-10 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative">
            <img
              src={imageUrl}
              alt={`${title} by ${artist}`}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {artist}{year ? ` • ${year}` : ''}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ArtDisplay;
