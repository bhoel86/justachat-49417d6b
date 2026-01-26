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
}

interface YTWindow extends Window {
  YT?: {
    Player: new (elementId: string, config: unknown) => YTPlayer;
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
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

export const RadioProvider: React.FC<RadioProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    // Restore enabled state from localStorage
    try {
      return localStorage.getItem(STORAGE_KEYS.enabled) === 'true';
    } catch {
      return false;
    }
  });
  const [currentGenre, setCurrentGenre] = useState(() => {
    // Restore genre from localStorage
    try {
      return localStorage.getItem(STORAGE_KEYS.genre) || 'All';
    } catch {
      return 'All';
    }
  });
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
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
  const isMountedRef = useRef(true);
  
  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Persist enabled state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.enabled, String(isEnabled));
    } catch {
      // Ignore storage errors
    }
  }, [isEnabled]);

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
  
  const currentPlaylist = currentGenre === 'All' 
    ? getAllSongs() 
    : MUSIC_LIBRARY.find(g => g.name === currentGenre)?.songs || getAllSongs();
  
  const currentSong = currentPlaylist[currentSongIndex] || currentPlaylist[0];
  const albumArt = currentSong ? getAlbumArt(currentSong.videoId) : null;
  
  const ytWindow = window as YTWindow;
  const hasAutoStarted = useRef(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!ytWindow.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Start playback only when enabled (inside chat room)
  useEffect(() => {
    if (!isEnabled || hasAutoStarted.current) return;
    
    const startPlayback = () => {
      if (ytWindow.YT?.Player && currentSong && !isInitialized) {
        hasAutoStarted.current = true;
        initPlayer();
      }
    };

    // If YT is already loaded, start immediately
    if (ytWindow.YT?.Player) {
      startPlayback();
    } else {
      // Otherwise, set up callback for when it's ready
      const existingCallback = ytWindow.onYouTubeIframeAPIReady;
      ytWindow.onYouTubeIframeAPIReady = () => {
        existingCallback?.();
        startPlayback();
      };
    }
  }, [isEnabled, currentSong, isInitialized]);

  const initPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
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
          if (!isMountedRef.current) return;
          event.target.setVolume(50);
          event.target.playVideo();
          setIsPlaying(true);
          // Start tracking progress
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          progressInterval.current = window.setInterval(() => {
            if (playerRef.current && isMountedRef.current) {
              setCurrentTime(playerRef.current.getCurrentTime() || 0);
              setDuration(playerRef.current.getDuration() || 0);
            }
          }, 500);
        },
        onStateChange: (event: { data: number }) => {
          if (!isMountedRef.current) return;
          if (ytWindow.YT?.PlayerState) {
            if (event.data === ytWindow.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Resume progress tracking
              if (!progressInterval.current) {
                progressInterval.current = window.setInterval(() => {
                  if (playerRef.current && isMountedRef.current) {
                    setCurrentTime(playerRef.current.getCurrentTime() || 0);
                    setDuration(playerRef.current.getDuration() || 0);
                  }
                }, 500);
              }
            } else if (event.data === ytWindow.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === ytWindow.YT.PlayerState.ENDED) {
              // Auto-skip to next song when current one ends
              skip();
            }
          }
        },
      },
    });
    if (isMountedRef.current) {
      setIsInitialized(true);
    }
  }, [currentSong?.videoId]);

  const play = useCallback(() => {
    if (!isInitialized) {
      if (ytWindow.YT?.Player) {
        initPlayer();
      } else {
        ytWindow.onYouTubeIframeAPIReady = initPlayer;
      }
    } else if (playerRef.current) {
      playerRef.current.playVideo();
    }
  }, [isInitialized, initPlayer]);

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const skip = useCallback(() => {
    const nextIndex = (currentSongIndex + 1) % currentPlaylist.length;
    setCurrentSongIndex(nextIndex);
    
    if (playerRef.current && isInitialized) {
      playerRef.current.loadVideoById(currentPlaylist[nextIndex].videoId);
      playerRef.current.playVideo();
    }
  }, [currentSongIndex, currentPlaylist, isInitialized]);

  const previous = useCallback(() => {
    const prevIndex = currentSongIndex === 0 ? currentPlaylist.length - 1 : currentSongIndex - 1;
    setCurrentSongIndex(prevIndex);
    
    if (playerRef.current && isInitialized) {
      playerRef.current.loadVideoById(currentPlaylist[prevIndex].videoId);
      playerRef.current.playVideo();
    }
  }, [currentSongIndex, currentPlaylist, isInitialized]);

  const skipGenre = useCallback(() => {
    const currentGenreIndex = genres.indexOf(currentGenre);
    const nextGenreIndex = (currentGenreIndex + 1) % genres.length;
    const nextGenre = genres[nextGenreIndex];
    
    setCurrentGenre(nextGenre);
    setCurrentSongIndex(0);
    
    const newPlaylist = nextGenre === 'All' 
      ? getAllSongs() 
      : MUSIC_LIBRARY.find(g => g.name === nextGenre)?.songs || getAllSongs();
    
    if (playerRef.current && isInitialized && newPlaylist.length > 0) {
      playerRef.current.loadVideoById(newPlaylist[0].videoId);
      playerRef.current.playVideo();
    }
  }, [currentGenre, genres, isInitialized]);

  const shuffle = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * currentPlaylist.length);
    setCurrentSongIndex(randomIndex);
    
    if (playerRef.current && isInitialized) {
      playerRef.current.loadVideoById(currentPlaylist[randomIndex].videoId);
      playerRef.current.playVideo();
    }
  }, [currentPlaylist, isInitialized]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleSetGenre = useCallback((genre: string) => {
    setCurrentGenre(genre);
    setCurrentSongIndex(0);
    
    const newPlaylist = genre === 'All' 
      ? getAllSongs() 
      : MUSIC_LIBRARY.find(g => g.name === genre)?.songs || getAllSongs();
    
    if (playerRef.current && isInitialized && newPlaylist.length > 0) {
      playerRef.current.loadVideoById(newPlaylist[0].videoId);
      playerRef.current.playVideo();
    }
  }, [isInitialized]);

  const enableRadio = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableRadio = useCallback(() => {
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
    // Clean up existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.log('Player destroy error:', e);
      }
      playerRef.current = null;
    }
    
    // Clear progress tracking
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    // Reset state
    setIsPlaying(false);
    setIsInitialized(false);
    setCurrentTime(0);
    setDuration(0);
    hasAutoStarted.current = false;
    
    // Remove old player container
    const oldContainer = document.getElementById('youtube-radio-player');
    if (oldContainer) {
      oldContainer.remove();
    }
    
    // Reinitialize after short delay
    setTimeout(() => {
      if (isEnabled && ytWindow.YT?.Player) {
        initPlayer();
      }
    }, 500);
  }, [isEnabled, initPlayer]);

  // Cleanup interval and player on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
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
