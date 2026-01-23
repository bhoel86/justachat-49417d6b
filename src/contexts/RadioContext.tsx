import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

interface RadioStation {
  name: string;
  artist: string;
  videoId: string;
  genre: string;
  albumArt: string;
}

interface RadioContextType {
  isPlaying: boolean;
  currentStation: RadioStation | null;
  play: () => void;
  pause: () => void;
  skip: () => void;
  toggle: () => void;
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

const RADIO_STATIONS: RadioStation[] = [
  // Lofi & Chill
  { name: 'Lofi Hip Hop', videoId: 'jfKfPfyJRdk', artist: 'Lofi Girl', genre: 'Lofi', albumArt: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg' },
  { name: 'Chillhop Radio', videoId: '5yx6BWlEVcY', artist: 'Chillhop Music', genre: 'Lofi', albumArt: 'https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg' },
  { name: 'Ambient Chill', videoId: 'S_MOd40zlYU', artist: 'Ambient Worlds', genre: 'Ambient', albumArt: 'https://i.ytimg.com/vi/S_MOd40zlYU/hqdefault.jpg' },
  
  // Drill & Hip Hop
  { name: 'UK Drill Mix', videoId: 'TbLAPUJQkKU', artist: 'Drill Central', genre: 'Drill', albumArt: 'https://i.ytimg.com/vi/TbLAPUJQkKU/hqdefault.jpg' },
  { name: 'NY Drill Radio', videoId: 'bSCY0RlGqYE', artist: 'Drill Vibes', genre: 'Drill', albumArt: 'https://i.ytimg.com/vi/bSCY0RlGqYE/hqdefault.jpg' },
  { name: 'Hip Hop Classics', videoId: '3sx0_8Ie0kM', artist: 'Old School Radio', genre: 'Hip Hop', albumArt: 'https://i.ytimg.com/vi/3sx0_8Ie0kM/hqdefault.jpg' },
  
  // Rock
  { name: 'Rock Anthems', videoId: 'E-WHW-QNswE', artist: 'Rock Radio', genre: 'Rock', albumArt: 'https://i.ytimg.com/vi/E-WHW-QNswE/hqdefault.jpg' },
  { name: 'Metal Radio', videoId: 'VTT6picaCoQ', artist: 'Heavy Tunes', genre: 'Metal', albumArt: 'https://i.ytimg.com/vi/VTT6picaCoQ/hqdefault.jpg' },
  { name: 'Indie Rock', videoId: 'DbIxd1dHxOQ', artist: 'Indie Vibes', genre: 'Indie', albumArt: 'https://i.ytimg.com/vi/DbIxd1dHxOQ/hqdefault.jpg' },
  
  // EDM & Electronic
  { name: 'EDM Party Mix', videoId: 'DiEwJTOderQ', artist: 'EDM Central', genre: 'EDM', albumArt: 'https://i.ytimg.com/vi/DiEwJTOderQ/hqdefault.jpg' },
  { name: 'House Radio', videoId: 'mDFBTdToRmw', artist: 'House Nation', genre: 'House', albumArt: 'https://i.ytimg.com/vi/mDFBTdToRmw/hqdefault.jpg' },
  { name: 'Dubstep Bass', videoId: 'iqQ9bLdHEPU', artist: 'Bass Drop', genre: 'Dubstep', albumArt: 'https://i.ytimg.com/vi/iqQ9bLdHEPU/hqdefault.jpg' },
  { name: 'Synthwave Radio', videoId: '4xDzrJKXOOY', artist: 'Synthwave Goose', genre: 'Synthwave', albumArt: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg' },
  { name: 'Drum & Bass', videoId: '6SVe4hdDd8Y', artist: 'DnB Radio', genre: 'DnB', albumArt: 'https://i.ytimg.com/vi/6SVe4hdDd8Y/hqdefault.jpg' },
  
  // Jazz & Classical
  { name: 'Jazz Radio', videoId: 'Dx5qFachd3A', artist: 'Cafe Music BGM', genre: 'Jazz', albumArt: 'https://i.ytimg.com/vi/Dx5qFachd3A/hqdefault.jpg' },
  { name: 'Classical Piano', videoId: 'klPZIGQcrHA', artist: 'Rousseau', genre: 'Classical', albumArt: 'https://i.ytimg.com/vi/klPZIGQcrHA/hqdefault.jpg' },
];

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
    PlayerState: { PLAYING: number; PAUSED: number };
  };
  onYouTubeIframeAPIReady?: () => void;
}

interface RadioProviderProps {
  children: React.ReactNode;
}

export const RadioProvider: React.FC<RadioProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  
  const currentStation = RADIO_STATIONS[currentStationIndex];
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

    if (!ytWindow.YT?.Player) return;

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
      videoId: currentStation.videoId,
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
            }
          }
        },
      },
    });
    setIsInitialized(true);
  }, [currentStation.videoId]);

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
    const nextIndex = (currentStationIndex + 1) % RADIO_STATIONS.length;
    setCurrentStationIndex(nextIndex);
    
    if (playerRef.current && isInitialized) {
      playerRef.current.loadVideoById(RADIO_STATIONS[nextIndex].videoId);
      playerRef.current.playVideo();
    }
  }, [currentStationIndex, isInitialized]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  return (
    <RadioContext.Provider value={{
      isPlaying,
      currentStation: isInitialized ? currentStation : null,
      play,
      pause,
      skip,
      toggle,
    }}>
      {children}
    </RadioContext.Provider>
  );
};
