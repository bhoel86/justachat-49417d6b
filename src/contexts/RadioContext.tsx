import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { MUSIC_LIBRARY, getAllSongs, getAlbumArt, type Song } from '@/lib/musicLibrary';

interface RadioContextType {
  isPlaying: boolean;
  currentSong: Song | null;
  currentGenre: string;
  genres: string[];
  play: () => void;
  pause: () => void;
  skip: () => void;
  previous: () => void;
  toggle: () => void;
  shuffle: () => void;
  setGenre: (genre: string) => void;
  albumArt: string | null;
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

export const RadioProvider: React.FC<RadioProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGenre, setCurrentGenre] = useState('All');
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  
  const genres = ['All', ...MUSIC_LIBRARY.map(g => g.name)];
  
  const currentPlaylist = currentGenre === 'All' 
    ? getAllSongs() 
    : MUSIC_LIBRARY.find(g => g.name === currentGenre)?.songs || getAllSongs();
  
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
          event.target.setVolume(50);
          event.target.playVideo();
          setIsPlaying(true);
        },
        onStateChange: (event: { data: number }) => {
          if (ytWindow.YT?.PlayerState) {
            if (event.data === ytWindow.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
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
    setIsInitialized(true);
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

  return (
    <RadioContext.Provider value={{
      isPlaying,
      currentSong: isInitialized ? currentSong : null,
      currentGenre,
      genres,
      play,
      pause,
      skip,
      previous,
      toggle,
      shuffle,
      setGenre: handleSetGenre,
      albumArt: isInitialized ? albumArt : null,
    }}>
      {children}
    </RadioContext.Provider>
  );
};
