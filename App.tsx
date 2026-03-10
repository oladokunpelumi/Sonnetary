import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import PersistentPlayer from './components/PersistentPlayer';
import Home from './pages/Home';
import CreateSong from './pages/CreateSong';
import OrderStatus from './pages/OrderStatus';
import Library from './pages/Library';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Admin from './pages/Admin';
import { Song } from './types';

const PREVIEW_LIMIT_SECONDS = 30;

// --- Audio Player Context ---
interface PlayerContextType {
  songs: Song[];
  activeSong: Song | null;
  isPlaying: boolean;
  isPreviewLocked: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  setActiveSong: (song: Song) => void;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewLocked, setIsPreviewLocked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch songs from API
  useEffect(() => {
    fetch('/api/songs')
      .then(res => res.json())
      .then((data: Song[]) => {
        setSongs(data);
        if (data.length > 0 && !activeSong) {
          setActiveSong(data[0]);
        }
      })
      .catch(err => console.error('Failed to fetch songs:', err));
  }, []);



  const playSong = useCallback((song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeSong?.id !== song.id) {
      setActiveSong(song);
      setIsPreviewLocked(false); // reset lock when changing song
      if (song.audioUrl) {
        audio.src = song.audioUrl;
        audio.load();
      } else {
        audio.src = '';
        setIsPlaying(false);
        return;
      }
    }

    if (song.audioUrl) {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [activeSong]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong?.audioUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // If src is not set, set it first
      if (!audio.src || audio.src === window.location.href) {
        if (activeSong.audioUrl) {
          audio.src = activeSong.audioUrl;
          audio.load();
        }
      }
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [isPlaying, activeSong]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  const skipNext = useCallback(() => {
    if (!activeSong || songs.length === 0) return;
    const idx = songs.findIndex(s => s.id === activeSong.id);
    const nextIdx = (idx + 1) % songs.length;
    playSong(songs[nextIdx]);
  }, [activeSong, songs, playSong]);

  const skipPrev = useCallback(() => {
    if (!activeSong || songs.length === 0) return;
    const idx = songs.findIndex(s => s.id === activeSong.id);
    const prevIdx = idx === 0 ? songs.length - 1 : idx - 1;
    playSong(songs[prevIdx]);
  }, [activeSong, songs, playSong]);

  // Audio element setup
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // 30-second preview limit for sample songs
      if (audio.currentTime >= PREVIEW_LIMIT_SECONDS) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        setIsPreviewLocked(true);
      }
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next song
      if (activeSong && songs.length > 0) {
        const idx = songs.findIndex(s => s.id === activeSong.id);
        if (idx < songs.length - 1) {
          playSong(songs[idx + 1]);
        }
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [activeSong, songs, playSong, volume]);

  const contextValue: PlayerContextType = {
    songs,
    activeSong,
    isPlaying,
    isPreviewLocked,
    currentTime,
    duration,
    volume,
    setActiveSong,
    playSong,
    togglePlay,
    seek,
    setVolume,
    skipNext,
    skipPrev,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      <div className="min-h-screen flex flex-col pb-20">
        <Header />
        <main className="pt-16 flex-grow">
          {children}
        </main>
        <PersistentPlayer />

        {/* Background Texture Overlay */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1000]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
      </div>
    </PlayerContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateSong />} />
          <Route path="/track" element={<OrderStatus />} />
          <Route path="/library" element={<Library />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;
