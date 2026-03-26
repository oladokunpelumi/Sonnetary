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
  const {
    activeSong,
    isPlaying,
    isPreviewLocked,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    skipNext,
    skipPrev,
  } = usePlayer();

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
    <div className="fixed bottom-0 left-0 right-0 z-[100] glass shadow-ambient h-20 px-4 md:px-8 flex items-center justify-between transition-all">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        <div className="h-12 w-12 rounded-md bg-surface-container-low relative overflow-hidden group shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
            style={{ backgroundImage: `url(${activeSong.coverUrl})` }}
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[#241a00] font-bold text-sm truncate font-display">
            {activeSong.title}
          </span>
          <span className="text-[#78614A] text-xs truncate font-ui">
            {activeSong.genre} {hasAudio ? '' : '• No Audio'}
            {isPreviewLocked && <span className="text-secondary ml-1">• Preview ended</span>}
          </span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-1">
          <button
            onClick={skipPrev}
            className="text-[#78614A] hover:text-[#241a00] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button
            onClick={togglePlay}
            disabled={!hasAudio || isPreviewLocked}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-transform ${hasAudio && !isPreviewLocked ? 'btn-gradient text-white hover:scale-105' : 'bg-surface-container-low text-[#78614A] cursor-not-allowed'}`}
          >
            <span className="material-symbols-outlined fill">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button
            onClick={skipNext}
            className="text-[#78614A] hover:text-[#241a00] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="w-full flex items-center gap-3 relative">
          <span className="text-[10px] text-[#78614A] font-mono">{formatTime(currentTime)}</span>

          {isPreviewLocked ? (
            <div className="flex-1 h-8 flex items-center justify-center gap-2 bg-secondary/10 rounded-lg px-3">
              <span className="material-symbols-outlined text-secondary text-sm">lock</span>
              <span className="text-secondary text-xs font-bold font-ui">30s preview ended</span>
              <Link
                to="/create"
                className="ml-auto text-[10px] font-bold btn-secondary-warm text-white px-2 py-0.5 rounded hover:opacity-90 transition-colors uppercase tracking-wider font-ui"
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
                  className={`w-1 rounded-full transition-colors ${i < activeBarIndex ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          )}

          <span className="text-[10px] text-[#78614A] font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Actions */}
      <div className="hidden md:flex items-center justify-end gap-6 w-1/4 min-w-[200px]">
        <div className="flex items-center gap-2 group">
          <span className="material-symbols-outlined text-[#78614A] text-lg">
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer"
          />
        </div>
        <Link
          to="/create"
          className="text-xs font-bold text-secondary rounded-md px-3 py-1.5 bg-surface-container-highest hover:bg-secondary hover:text-white transition-colors uppercase tracking-wider font-ui"
        >
          Get Yours
        </Link>
      </div>
    </div>
  );
};

export default PersistentPlayer;
