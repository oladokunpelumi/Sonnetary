
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../App';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PersistentPlayer: React.FC = () => {
  const { activeSong, isPlaying, isPreviewLocked, currentTime, duration, volume, togglePlay, seek, setVolume, skipNext, skipPrev } = usePlayer();

  const waveformBars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const seed = (i * 7 + 13) % 100;
      return 20 + (seed / 100) * 80;
    });
  }, []);

  if (!activeSong) return null;

  const progressFraction = duration > 0 ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressFraction * waveformBars.length);
  const hasAudio = !!activeSong.audioUrl;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background-surface border-t border-background-border h-20 px-4 md:px-8 flex items-center justify-between shadow-[0_-4px_20px_rgba(28,16,8,0.08)] transition-all">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        <div className="h-12 w-12 rounded bg-background-border relative overflow-hidden group shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
            style={{ backgroundImage: `url(${activeSong.coverUrl})` }}
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[#1C1008] font-bold text-sm truncate">{activeSong.title}</span>
          <span className="text-[#A08B74] text-xs truncate">
            {activeSong.genre} {hasAudio ? '' : '• No Audio'}
            {isPreviewLocked && <span className="text-primary ml-1">• Preview ended</span>}
          </span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-1">
          <button onClick={skipPrev} className="text-[#A08B74] hover:text-[#1C1008] transition-colors">
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button
            onClick={togglePlay}
            disabled={!hasAudio || isPreviewLocked}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-transform ${hasAudio && !isPreviewLocked ? 'bg-primary text-white hover:scale-105' : 'bg-background-border text-[#A08B74] cursor-not-allowed'}`}
          >
            <span className="material-symbols-outlined fill">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
          <button onClick={skipNext} className="text-[#A08B74] hover:text-[#1C1008] transition-colors">
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="w-full flex items-center gap-3 relative">
          <span className="text-[10px] text-[#A08B74] font-mono">{formatTime(currentTime)}</span>

          {isPreviewLocked ? (
            <div className="flex-1 h-8 flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3">
              <span className="material-symbols-outlined text-primary text-sm">lock</span>
              <span className="text-primary text-xs font-bold">30s preview ended</span>
              <Link
                to="/create"
                className="ml-auto text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded hover:bg-primary-dark transition-colors uppercase tracking-wider"
              >
                Get Yours
              </Link>
            </div>
          ) : (
            <div
              className="h-8 flex-1 flex items-center gap-[2px] opacity-80 cursor-pointer"
              onClick={(e) => {
                if (!hasAudio || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const fraction = (e.clientX - rect.left) / rect.width;
                seek(fraction * duration);
              }}
            >
              {waveformBars.map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-colors ${i < activeBarIndex ? 'bg-primary' : 'bg-background-border'}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          )}

          <span className="text-[10px] text-[#A08B74] font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Actions */}
      <div className="hidden md:flex items-center justify-end gap-6 w-1/4 min-w-[200px]">
        <div className="flex items-center gap-2 group">
          <span className="material-symbols-outlined text-[#A08B74] text-lg">
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-background-border rounded-full appearance-none cursor-pointer"
          />
        </div>
        <Link
          to="/create"
          className="text-xs font-bold text-primary border border-primary/30 rounded px-3 py-1 hover:bg-primary hover:text-white transition-colors uppercase tracking-wider"
        >
          Get Yours
        </Link>
      </div>
    </div>
  );
};

export default PersistentPlayer;
