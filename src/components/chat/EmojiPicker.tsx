/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Smile, Search, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface GifResult {
  id: string;
  title: string;
  preview: string;
  url: string;
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onGifSelect?: (gifUrl: string) => void;
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '❤️‍🔥', '❤️‍🩹'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🦭', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🔥', '✨', '🌟', '💫', '⭐', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌊', '💧', '💦', '☔', '⚡', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '✅', '❌', '❓', '❔', '❕', '❗', '⭕'],
  'Hacker': ['💻', '🖥️', '⌨️', '🖱️', '📟', '📡', '🔐', '🔒', '🔓', '🔑', '🗝️', '💀', '☠️', '👾', '🤖', '🎮', '🕹️', '💾', '💿', '📀', '🔌', '🔋', '⚡', '🌐', '📶', '📲', '🛡️', '⚔️', '🔫', '💣', '🧨', '🪓', '🔧', '🔨', '⚙️', '🧲', '🔬', '🔭', '📊', '📈', '📉', '🧮', '🗄️', '📁', '📂', '🗂️', '📋', '📝', '✏️', '🖊️', '🖋️', '✒️', '📎', '🔗', '📌', '📍', '🏴‍☠️', '🕵️', '🥷', '🦾', '🦿', '🧠', '👁️', '🌑', '🌚']
};

const EmojiPicker = ({ onEmojiSelect, onGifSelect }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const [activeTab, setActiveTab] = useState<'emoji' | 'gif'>('emoji');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
 const trendingLoadedRef = useRef(false);
 const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

 const searchGifs = async (query: string) => {
    if (!onGifSelect) return;
    setGifLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gif-search', {
        body: { query, limit: 20 }
      });
      if (error) throw error;
      setGifs(data?.results || []);
    } catch (err) {
      console.error('GIF search error:', err);
      setGifs([]);
    } finally {
      setGifLoading(false);
    }
 };

 const loadTrending = async () => {
   if (!onGifSelect || trendingLoadedRef.current) return;
    setGifLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gif-search', {
        body: { trending: true, limit: 20 }
      });
      if (error) throw error;
      setGifs(data?.results || []);
     trendingLoadedRef.current = true;
    } catch (err) {
      console.error('Trending GIFs error:', err);
      setGifs([]);
    } finally {
      setGifLoading(false);
    }
 };

  useEffect(() => {
   if (isOpen && activeTab === 'gif' && !searchQuery && !trendingLoadedRef.current) {
      loadTrending();
    }
 }, [isOpen, activeTab, searchQuery]);

  useEffect(() => {
   // Clear any pending search
   if (searchTimeoutRef.current) {
     clearTimeout(searchTimeoutRef.current);
     searchTimeoutRef.current = null;
   }
   
    if (activeTab !== 'gif' || !searchQuery) return;
   
   searchTimeoutRef.current = setTimeout(() => {
      searchGifs(searchQuery);
    }, 300);
   
   return () => {
     if (searchTimeoutRef.current) {
       clearTimeout(searchTimeoutRef.current);
       searchTimeoutRef.current = null;
     }
   };
 }, [searchQuery, activeTab, onGifSelect]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  const handleGifClick = (gifUrl: string) => {
    onGifSelect?.(gifUrl);
    setIsOpen(false);
    setSearchQuery('');
   trendingLoadedRef.current = false; // Reset for next open
  };

  const filteredEmojis = searchQuery
    ? Object.values(EMOJI_CATEGORIES).flat().filter(emoji => 
        emoji.includes(searchQuery) || 
        Object.entries(EMOJI_CATEGORIES).some(([cat, emojis]) => 
          emojis.includes(emoji) && cat.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <Smile className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-card border border-border rounded-xl shadow-lg z-[9999] overflow-hidden">
          {/* Tab Switcher */}
          {onGifSelect && (
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab('emoji')}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'emoji' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                😀 Emoji
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gif')}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'gif' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                GIF
              </button>
            </div>
          )}

          {activeTab === 'emoji' ? (
            <>
              {/* Search */}
              <div className="p-2 border-b border-border">
                <Input
                  placeholder="Search emojis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Category Tabs */}
              {!searchQuery && (
                <div className="flex overflow-x-auto border-b border-border p-1 gap-1 scrollbar-none">
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                        activeCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              {/* Emoji Grid */}
              <ScrollArea className="h-48">
                <div className="grid grid-cols-8 gap-1 p-2">
                  {filteredEmojis.map((emoji, index) => (
                    <button
                      type="button"
                      key={`${emoji}-${index}`}
                      onClick={() => handleEmojiClick(emoji)}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* Quick Access */}
              <div className="border-t border-border p-2">
                <div className="flex gap-1">
                  {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💯'].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* GIF Search */}
              <div className="p-2 border-b border-border flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search GIFs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>

              {/* GIF Grid */}
              <ScrollArea className="h-64">
                {gifLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : gifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p>{searchQuery ? 'No GIFs found' : 'Search for GIFs'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {gifs.map((gif) => (
                      <button
                        type="button"
                        key={gif.id}
                        onClick={() => handleGifClick(gif.url)}
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

              {/* Klipy Attribution */}
              <div className="border-t border-border p-1 text-[9px] text-muted-foreground text-center">
                Powered by Klipy
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
