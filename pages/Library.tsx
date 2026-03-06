
import React, { useState, useEffect } from 'react';
import { usePlayer } from '../App';
import { Song } from '../types';

const Library: React.FC = () => {
  const { songs, playSong, activeSong, isPlaying } = usePlayer();
  const [filter, setFilter] = useState('All Stories');

  const categories = ['All Stories', ...new Set(songs.flatMap(s => s.tags || []))];

  const filteredSongs = filter === 'All Stories'
    ? songs
    : songs.filter(s => s.tags?.includes(filter));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="relative w-full rounded-2xl overflow-hidden mb-12 min-h-[400px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB0ajymRznG0BzIiqT3JD-7qb6sjg-Kn36vozWGu5hPQ_q5EIlTcVwh14SM4SZCncgwQ6U7uuDgqPaKamHtcd-xa3GffCCnTQSNVWjgWiivY0c0IgV5Ap5esBCHZpJgCshWYTPyA95pCDV5HF_Hu5cDX9jIuGIh9hG0BNm4XRQ3ZcyH2YIpuX1DaVIE7w_C5vYUdZi7oyK6VRYsfZEtgU593IhrwEIX6OW_iU0o6Jhe2hPfBNKWSrl0uH8-TVQzy1AxqRHFlbeiGg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 z-10" />
        <div className="relative z-20 text-center max-w-3xl px-4 flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest font-display">
            The Collection
          </span>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight font-display">
            The Hall of Fame
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl font-light max-w-2xl leading-relaxed font-body">
            Explore real stories turned into timeless songs. From heart-warming anniversaries to tear-jerking memorials.
          </p>
          <button
            onClick={() => { if (songs.length > 0) playSong(songs[0]); }}
            className="flex items-center gap-2 h-12 px-6 bg-white text-background rounded-lg text-base font-bold hover:bg-slate-200 transition-colors font-display"
          >
            <span className="material-symbols-outlined text-[20px]">play_circle</span>
            Play All Samples
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sticky top-20 z-40 py-4 bg-background/95 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-full text-sm font-medium transition-all font-display ${filter === cat ? 'bg-primary text-white shadow-lg' : 'bg-background-surface border border-white/10 text-slate-300 hover:text-white hover:border-primary/50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSongs.map((song, i) => {
          const isCurrent = activeSong?.id === song.id;
          return (
            <div
              key={`${song.id}-${i}`}
              className={`group relative rounded-xl overflow-hidden bg-background-surface border shadow-xl transition-all hover:shadow-2xl cursor-pointer ${isCurrent ? 'border-primary/60 ring-1 ring-primary/20' : 'border-white/5 hover:border-primary/30'}`}
              onClick={() => playSong(song)}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <button className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-primary/40">
                    <span className="material-symbols-outlined text-4xl ml-1">
                      {isCurrent && isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                </div>
                {!song.audioUrl && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 font-medium">
                    Sample Only
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1 font-display">{song.tags?.[0] || 'Original'}</p>
                    <h3 className="text-white text-xl font-bold leading-tight font-display">{song.title}</h3>
                    <p className="text-slate-300 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 font-body">Commissioned for {song.artist}</p>
                  </div>
                  <span className="text-white/60 text-[10px] font-mono bg-white/10 px-2 py-1 rounded backdrop-blur-md">{song.duration}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <span className="material-symbols-outlined text-4xl mb-4 block">library_music</span>
          <p className="text-lg font-display">Loading songs...</p>
        </div>
      )}
    </div>
  );
};

export default Library;
