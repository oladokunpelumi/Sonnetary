import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PersistentPlayerProps {
  /**
   * Lift the transport above a bottom-anchored banner (the cookie-consent bar)
   * so the two fixed layers stack instead of overlapping.
   */
  raised?: boolean;
}

const PersistentPlayer: React.FC<PersistentPlayerProps> = ({ raised = false }) => {
  const [isHidden, setIsHidden] = useState(false);
  // Inline style so it reliably overrides the Tailwind `bottom-*` class
  // regardless of stylesheet ordering.
  const raisedStyle = raised ? { bottom: '6.5rem' } : undefined;
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

  const waveformBars = useMemo(
    () => Array.from({ length: 32 }, (_, i) => 24 + (((i * 11 + 17) % 90) / 90) * 66),
    []
  );

  if (!activeSong) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
        <Link
          to="/create"
          className="pointer-events-auto inline-flex min-h-12 min-w-[190px] items-center justify-center whitespace-nowrap rounded-full border border-cream/10 bg-ink px-7 py-3 font-label text-xs font-bold uppercase tracking-[0.14em] text-cream shadow-[0_14px_32px_rgba(31,27,20,0.24)] transition-colors hover:bg-terracotta"
        >
          Create My Custom Song
        </Link>
      </div>
    );
  }

  const hasAudio = !!activeSong.audioUrl;
  const previewDuration = Math.min(duration || 0, 30);
  const previewTime = Math.min(currentTime, previewDuration);
  const progressFraction = previewDuration > 0 ? previewTime / previewDuration : 0;
  const activeBarIndex = Math.floor(progressFraction * waveformBars.length);

  if (isHidden) {
    return (
      <button
        type="button"
        onClick={() => setIsHidden(false)}
        className="fixed bottom-5 right-5 z-[100] inline-flex h-12 items-center gap-2 rounded-full border border-cream/10 bg-ink px-4 text-cream shadow-[0_10px_24px_rgba(31,27,20,0.22)] transition-colors hover:bg-terracotta"
        style={{ marginBottom: 'env(safe-area-inset-bottom)', ...raisedStyle }}
        aria-label="Show music player"
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          graphic_eq
        </span>
        <span className="hidden font-label text-xs font-bold uppercase tracking-[0.14em] sm:inline">
          Player
        </span>
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-3 pb-[env(safe-area-inset-bottom)]" style={raisedStyle}>
      <div className="pointer-events-auto grid w-full max-w-[960px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[1.75rem] border border-cream/10 bg-ink px-3 py-2.5 text-cream shadow-[0_18px_42px_rgba(31,27,20,0.28)] md:grid-cols-[minmax(170px,245px)_auto_minmax(170px,1fr)_auto_auto] md:rounded-full md:px-4 lg:grid-cols-[minmax(170px,245px)_auto_minmax(170px,1fr)_auto_auto_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={activeSong.coverUrl}
            alt=""
            loading="eager"
            className="h-12 w-12 shrink-0 rounded-lg border border-cream/15 object-cover md:rounded-full"
          />
          <div className="min-w-0">
            <p className="truncate font-body text-base font-bold leading-tight text-cream">
              {activeSong.title}
            </p>
            <p className="mt-1 truncate font-label text-xs font-bold uppercase tracking-[0.14em] text-mustard-soft">
              {activeSong.genre} {hasAudio ? '' : '- no audio'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-1">
          <button
            type="button"
            onClick={skipPrev}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-cream/55 transition-colors hover:bg-cream/10 hover:text-cream sm:flex"
            aria-label="Previous sample"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              skip_previous
            </span>
          </button>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!hasAudio || isPreviewLocked}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              hasAudio && !isPreviewLocked
                ? 'bg-mustard text-ink hover:brightness-95'
                : 'cursor-not-allowed bg-cream/10 text-cream/55'
            }`}
            aria-label={isPlaying ? 'Pause sample' : 'Play sample'}
          >
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button
            type="button"
            onClick={skipNext}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-cream/55 transition-colors hover:bg-cream/10 hover:text-cream sm:flex"
            aria-label="Next sample"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              skip_next
            </span>
          </button>
        </div>

        <div className="hidden min-w-0 items-center gap-3 md:flex">
          <span className="w-9 text-right font-mono text-xs text-cream/55">
            {formatTime(previewTime)}
          </span>
          <div className="relative flex h-10 min-w-0 flex-1 items-center gap-[3px] rounded-full bg-black/20 px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cream">
            {waveformBars.map((height, i) => (
              <span
                key={i}
                className={`w-1 rounded-full ${i < activeBarIndex ? 'bg-mustard' : 'bg-cream/20'}`}
                style={{ height: `${height}%` }}
                aria-hidden="true"
              />
            ))}
            <label className="sr-only" htmlFor="sample-position">Sample position</label>
            <input
              id="sample-position"
              type="range"
              min={0}
              max={previewDuration || 0}
              // 1s granularity: step={5} quantised every seek to 5s jumps.
              step={1}
              // While scrubbing, show the user's own value. Binding straight to
              // previewTime made rapid arrow-key presses lossy: each keypress fired
              // onChange, but React re-rendered from the not-yet-updated media time
              // and reverted the input, so 5 presses moved ~1s instead of 5s.
              value={Math.round(previewTime)}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={!hasAudio || !previewDuration || isPreviewLocked}
              aria-valuetext={`${formatTime(previewTime)} of ${formatTime(previewDuration)}`}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            {isPreviewLocked && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-ink/90 px-3" role="status">
              <span className="material-symbols-outlined text-sm text-mustard" aria-hidden="true">
                lock
              </span>
              <span className="truncate font-label text-xs font-bold text-mustard-soft">
                30s preview ended
              </span>
              </div>
            )}
          </div>
          <span className="w-9 font-mono text-xs text-cream/55">{formatTime(previewDuration)}</span>
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <label className="sr-only" htmlFor="player-volume">
            Volume
          </label>
          <span className="material-symbols-outlined text-lg text-cream/55" aria-hidden="true">
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <input
            id="player-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-valuetext={`${Math.round(volume * 100)} percent`}
            className="h-11 w-20 cursor-pointer accent-mustard"
          />
        </div>

        <Link
          to="/create"
          className="hidden min-h-10 min-w-[150px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-cream/10 px-5 font-label text-xs font-bold uppercase tracking-[0.14em] text-mustard-soft transition-colors hover:bg-cream hover:text-ink md:inline-flex"
        >
          Create yours
        </Link>

        <button
          type="button"
          onClick={() => setIsHidden(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cream/55 transition-colors hover:bg-cream/10 hover:text-cream"
          aria-label="Hide music player"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">
            close
          </span>
        </button>

        {isPreviewLocked && (
          <div className="col-span-3 grid grid-cols-2 gap-2 border-t border-cream/15 pt-2 md:hidden">
            <Link
              to="/create"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-mustard px-3 text-center font-label text-xs font-bold uppercase tracking-[0.1em] text-ink"
            >
              Create yours
            </Link>
            <button
              type="button"
              onClick={skipNext}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-cream/30 px-3 text-center font-label text-xs font-bold uppercase tracking-[0.1em] text-cream"
            >
              Next sample
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersistentPlayer;
