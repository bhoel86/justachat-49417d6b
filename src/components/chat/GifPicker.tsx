import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GifResult {
  id: string;
  title: string;
  preview: string;
  url: string;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  children: React.ReactNode;
}

const GifPicker = ({ onSelect, children }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  const searchGifs = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gif-search', {
        body: { query: searchQuery, limit: 20 }
      });
      
      if (error) throw error;
      setGifs(data?.results || []);
    } catch (err) {
      console.error('GIF search error:', err);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrending = useCallback(async () => {
    if (trendingLoaded) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gif-search', {
        body: { trending: true, limit: 20 }
      });
      
      if (error) throw error;
      setGifs(data?.results || []);
      setTrendingLoaded(true);
    } catch (err) {
      console.error('Trending GIFs error:', err);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, [trendingLoaded]);

  useEffect(() => {
    if (open && !query && !trendingLoaded) {
      loadTrending();
    }
  }, [open, query, trendingLoaded, loadTrending]);

  useEffect(() => {
    if (!query) return;
    
    const timeout = setTimeout(() => {
      searchGifs(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchGifs]);

  const handleSelect = (gifUrl: string) => {
    onSelect(gifUrl);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-2 bg-popover border border-border z-[100]" 
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search GIFs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 text-xs"
            autoFocus
          />
        </div>
        
        <ScrollArea className="h-64">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
              <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
              <p>{query ? 'No GIFs found' : 'Search for GIFs'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif.url)}
                  className="relative overflow-hidden rounded hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-2 text-[9px] text-muted-foreground text-center">
          Powered by Klipy
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GifPicker;
