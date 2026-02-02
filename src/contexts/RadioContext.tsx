import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { MUSIC_LIBRARY, getAllSongs, getAlbumArt, type Song } from '@/lib/musicLibrary';

interface RadioContextType {
  isPlaying: boolean;
  currentSong: Song | null;
  currentGenre: string;
  genres: string[];
  isEnabled: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: () => void;
  pause: () => void;
  skip: () => void;
  skipGenre: () => void;
  previous: () => void;
  toggle: () => void;
  shuffle: () => void;
  setGenre: (genre: string) => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  resetRadio: () => void;
  albumArt: string | null;
  enableRadio: () => void;
  disableRadio: () => void;
}

const RadioContext = createContext<RadioContextType | null>(null);

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};

export const useRadioOptional = () => {
  return useContext(RadioContext);
};

interface YTPlayer {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  loadVideoById: (videoId: string) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
}

interface YTWindow extends Window {
  YT?: {
    Player: new (elementId: string, config: unknown) => YTPlayer;
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; UNSTARTED: number; CUED: number };
  };
  onYouTubeIframeAPIReady?: () => void;
}

interface RadioProviderProps {
  children: React.ReactNode;
}

// localStorage keys for persistence
const STORAGE_KEYS = {
  enabled: 'jac-radio-enabled',
  genre: 'jac-radio-genre',
  volume: 'jac-radio-volume',
};

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const RadioProvider: React.FC<RadioProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentGenre, setCurrentGenre] = useState(() => {
    // Restore genre from localStorage - default to last played, not 'All'
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.genre);
      // Validate stored genre exists in library
      if (stored && (stored === 'All' || MUSIC_LIBRARY.some(g => g.name === stored))) {
        return stored;
      }
      return 'All';
    } catch {
      return 'All';
    }
  });
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    // Restore volume from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.volume);
      return stored ? parseInt(stored, 10) : 50;
    } catch {
      return 50;
    }
  });
  const progressInterval = useRef<number | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  const safeGetPlayerTimes = useCallback(() => {
    const p = playerRef.current as Partial<YTPlayer> | null;
    if (!p) return { currentTime: 0, duration: 0 };

    const currentTime = typeof p.getCurrentTime === 'function' ? (p.getCurrentTime() ?? 0) : 0;
    const duration = typeof p.getDuration === 'function' ? (p.getDuration() ?? 0) : 0;

    return {
      currentTime: Number.isFinite(currentTime) ? currentTime : 0,
      duration: Number.isFinite(duration) ? duration : 0,
    };
  }, []);
  
  // Track broken videos for this session (don't persist - give them another chance next session)
  const brokenVideosRef = useRef<Set<string>>(new Set());
  // Track load attempts to detect stuck videos
  const loadAttemptRef = useRef<{ videoId: string; timestamp: number } | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);
  
  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    const isMountedRef = { current: true };
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Persist genre to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.genre, currentGenre);
    } catch {
      // Ignore storage errors
    }
  }, [currentGenre]);

  // Persist volume to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.volume, String(volume));
    } catch {
      // Ignore storage errors
    }
  }, [volume]);

  const genres = ['All', ...MUSIC_LIBRARY.map(g => g.name)];
  
  // Get base playlist for current genre (memoized to avoid recreating on every render)
  const getBasePlaylist = useCallback((genre: string) => {
    return genre === 'All' 
      ? getAllSongs() 
      : MUSIC_LIBRARY.find(g => g.name === genre)?.songs || getAllSongs();
  }, []);
  
  // Shuffle playlist on mount and when genre changes (only re-shuffle when genre changes, not isInitialized)
  useEffect(() => {
    const basePlaylist = getBasePlaylist(currentGenre);
    const shuffled = shuffleArray(basePlaylist);
    setShuffledPlaylist(shuffled);
    setCurrentSongIndex(0);
  }, [currentGenre, getBasePlaylist]);
  
  // When shuffled playlist changes and player is ready, load the first song
  useEffect(() => {
    if (playerRef.current && isInitialized && shuffledPlaylist.length > 0 && typeof playerRef.current.loadVideoById === 'function') {
      try {
        playerRef.current.loadVideoById(shuffledPlaylist[0].videoId);
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.log('Error loading video:', e);
      }
    }
  }, [shuffledPlaylist, isInitialized]);
  
  // Use shuffled playlist, fall back to base if not yet shuffled
  const basePlaylist = getBasePlaylist(currentGenre);
  const currentPlaylist = shuffledPlaylist.length > 0 ? shuffledPlaylist : basePlaylist;
  const currentSong = currentPlaylist[currentSongIndex] || currentPlaylist[0];
  const albumArt = currentSong ? getAlbumArt(currentSong.videoId) : null;
  
  const ytWindow = window as YTWindow;

  // Load YouTube IFrame API
  useEffect(() => {
    if (!ytWindow.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize player when enabled
  useEffect(() => {
    if (!isEnabled || !currentSong) return;

    if (ytWindow.YT?.Player) {
      // API ready, init immediately
      initPlayer();
    } else {
      // Set up callback for when API loads
      ytWindow.onYouTubeIframeAPIReady = () => {
        if (isEnabled && currentSong) {
          initPlayer();
        }
      };
    }
  }, [isEnabled, currentSong]);

  const initPlayer = useCallback(() => {
    // Clear any existing progress interval before swapping players
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // Cleanup existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.log('Error destroying player:', e);
      }
      // Ensure we don't keep a stale reference
      playerRef.current = null;
    }

    if (!ytWindow.YT?.Player || !currentSong) return;

    // Create hidden container for player if it doesn't exist
    let container = document.getElementById('youtube-radio-player');
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-radio-player';
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    // Track this load attempt
    loadAttemptRef.current = { videoId: currentSong.videoId, timestamp: Date.now() };
    
    // Set timeout to detect videos that fail to load (stuck in UNSTARTED state)
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = window.setTimeout(() => {
      if (loadAttemptRef.current?.videoId === currentSong.videoId) {
        // Video hasn't started playing after 10 seconds - mark as broken and skip
        console.log(`Radio: Video ${currentSong.videoId} failed to load, marking as broken and skipping`);
        brokenVideosRef.current.add(currentSong.videoId);
        skipBroken();
      }
    }, 10000);

    playerRef.current = new ytWindow.YT.Player('youtube-radio-player', {
      height: '0',
      width: '0',
      videoId: currentSong.videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: { target: YTPlayer }) => {
          // Use the event target as the canonical player instance
          playerRef.current = event.target;

          event.target.setVolume(volume);
          event.target.playVideo();
          setIsPlaying(true);
          setIsInitialized(true);
          // Start tracking progress
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          progressInterval.current = window.setInterval(() => {
            try {
              const { currentTime, duration } = safeGetPlayerTimes();
              setCurrentTime(currentTime);
              setDuration(duration);
            } catch (e) {
              // If the player is in a weird transient state (destroyed/recreated), don't crash the app.
              // This prevents: "getCurrentTime is not a function"
              // eslint-disable-next-line no-console
              console.log('Radio: progress tick error', e);
            }
          }, 500);
        },
        onStateChange: (event: { data: number }) => {
          if (ytWindow.YT?.PlayerState) {
            if (event.data === ytWindow.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Clear timeout - video is playing successfully
              if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
              }
              loadAttemptRef.current = null;
            } else if (event.data === ytWindow.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === ytWindow.YT.PlayerState.ENDED) {
              skip();
            }
          }
        },
        onError: (event: { data: number }) => {
          // YouTube error codes: 2 = invalid param, 5 = HTML5 error, 100 = not found, 101/150 = embedding disabled
          console.log(`Radio: Video error ${event.data} for ${currentSong?.videoId}, marking as broken`);
          if (currentSong) {
            brokenVideosRef.current.add(currentSong.videoId);
          }
          // Clear timeout and skip to next
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          skipBroken();
        },
      },
    });
  }, [currentSong, safeGetPlayerTimes, volume]);
  
  // Skip to next non-broken song
  const skipBroken = useCallback(() => {
    let nextIndex = (currentSongIndex + 1) % currentPlaylist.length;
    let attempts = 0;
    const maxAttempts = currentPlaylist.length;
    
    // Find next song that isn't marked as broken
    while (brokenVideosRef.current.has(currentPlaylist[nextIndex].videoId) && attempts < maxAttempts) {
      nextIndex = (nextIndex + 1) % currentPlaylist.length;
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log('Radio: All songs in playlist appear broken, resetting broken list');
      brokenVideosRef.current.clear();
    }
    
    setCurrentSongIndex(nextIndex);
    
    if (playerRef.current && isInitialized) {
      playerRef.current.loadVideoById(currentPlaylist[nextIndex].videoId);
      playerRef.current.playVideo();
    }
  }, [currentSongIndex, currentPlaylist, isInitialized]);

  const play = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    } else if (isEnabled && ytWindow.YT?.Player) {
      initPlayer();
    }
  }, [isEnabled, initPlayer]);

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const skip = useCallback(() => {
    let nextIndex = (currentSongIndex + 1) % currentPlaylist.length;
    
    // Skip any songs marked as broken
    let attempts = 0;
    while (brokenVideosRef.current.has(currentPlaylist[nextIndex].videoId) && attempts < currentPlaylist.length) {
      nextIndex = (nextIndex + 1) % currentPlaylist.length;
      attempts++;
    }
    
    setCurrentSongIndex(nextIndex);
    
    // Track load attempt for timeout detection
    loadAttemptRef.current = { videoId: currentPlaylist[nextIndex].videoId, timestamp: Date.now() };
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = window.setTimeout(() => {
      if (loadAttemptRef.current?.videoId === currentPlaylist[nextIndex].videoId) {
        console.log(`Radio: Video ${currentPlaylist[nextIndex].videoId} failed to load on skip`);
        brokenVideosRef.current.add(currentPlaylist[nextIndex].videoId);
        skipBroken();
      }
    }, 10000);
    
    if (playerRef.current && isInitialized) {
      playerRef.current.loadVideoById(currentPlaylist[nextIndex].videoId);
      playerRef.current.playVideo();
    }
  }, [currentSongIndex, currentPlaylist, isInitialized, skipBroken]);

  const previous = useCallback(() => {
    let prevIndex = currentSongIndex === 0 ? currentPlaylist.length - 1 : currentSongIndex - 1;
    
    // Skip any songs marked as broken (going backwards)
    let attempts = 0;
    while (brokenVideosRef.current.has(currentPlaylist[prevIndex].videoId) && attempts < currentPlaylist.length) {
      prevIndex = prevIndex === 0 ? currentPlaylist.length - 1 : prevIndex - 1;
      attempts++;
    }
    
    setCurrentSongIndex(prevIndex);
    
    // Track load attempt
    loadAttemptRef.current = { videoId: currentPlaylist[prevIndex].videoId, timestamp: Date.now() };
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = window.setTimeout(() => {
      if (loadAttemptRef.current?.videoId === currentPlaylist[prevIndex].videoId) {
        console.log(`Radio: Video ${currentPlaylist[prevIndex].videoId} failed to load on previous`);
        brokenVideosRef.current.add(currentPlaylist[prevIndex].videoId);
        skipBroken();
      }
    }, 10000);
    
    if (playerRef.current && isInitialized) {
      playerRef.current.loadVideoById(currentPlaylist[prevIndex].videoId);
      playerRef.current.playVideo();
    }
  }, [currentSongIndex, currentPlaylist, isInitialized, skipBroken]);

  const skipGenre = useCallback(() => {
    const currentGenreIndex = genres.indexOf(currentGenre);
    const nextGenreIndex = (currentGenreIndex + 1) % genres.length;
    const nextGenre = genres[nextGenreIndex];
    
    // Setting genre will trigger the useEffect to shuffle
    setCurrentGenre(nextGenre);
  }, [currentGenre, genres]);

  const shuffle = useCallback(() => {
    const currentBase = getBasePlaylist(currentGenre);
    const newShuffled = shuffleArray(currentBase);
    setShuffledPlaylist(newShuffled);
    setCurrentSongIndex(0);
    
    if (playerRef.current && isInitialized && newShuffled.length > 0) {
      playerRef.current.loadVideoById(newShuffled[0].videoId);
      playerRef.current.playVideo();
    }
  }, [currentGenre, getBasePlaylist, isInitialized]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleSetGenre = useCallback((genre: string) => {
    setCurrentGenre(genre);
  }, []);

  const enableRadio = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableRadio = useCallback(() => {
    // Stop playback and cleanup
    setIsEnabled(false);
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {
        console.log('Pause error during disable:', e);
      }
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setIsPlaying(false);
    setIsInitialized(false);
    
    // Destroy player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
        playerRef.current = null;
      } catch (e) {
        console.log('Error cleaning up player:', e);
      }
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && isInitialized) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  }, [isInitialized]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(clampedVolume);
    }
  }, []);

  const resetRadio = useCallback(() => {
    disableRadio();
    setTimeout(() => enableRadio(), 100);
  }, [disableRadio, enableRadio]);

  // Cleanup interval, player, and timeouts on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      // Clean up player on unmount
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        playerRef.current = null;
      }
      // Clean up global callback
      const ytWin = window as YTWindow;
      if (ytWin.onYouTubeIframeAPIReady) {
        ytWin.onYouTubeIframeAPIReady = undefined;
      }
    };
  }, []);

  return (
    <RadioContext.Provider value={{
      isPlaying,
      currentSong: isInitialized ? currentSong : null,
      currentGenre,
      genres,
      isEnabled,
      currentTime,
      duration,
      volume,
      play,
      pause,
      skip,
      skipGenre,
      previous,
      toggle,
      shuffle,
      setGenre: handleSetGenre,
      seekTo,
      setVolume,
      resetRadio,
      albumArt: isInitialized ? albumArt : null,
      enableRadio,
      disableRadio,
    }}>
      {children}
    </RadioContext.Provider>
  );
};
