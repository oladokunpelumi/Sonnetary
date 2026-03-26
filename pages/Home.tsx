import React from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../App';
import FAQ from '../components/FAQ';

const Home: React.FC = () => {
  const { songs, activeSong, playSong, togglePlay, isPlaying } = usePlayer();

  return (
    <div className="flex flex-col">
      {/* ── Hero Section: Cinematic Royal Gold ─────────────────────────────── */}
      <section className="relative min-h-[95vh] flex items-center px-4 sm:px-6 lg:px-12 pt-24 overflow-hidden bg-gradient-to-br from-[#D4AF37] via-[#e2c15a] to-[#D4AF37]">
        <div className="max-w-[1920px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 z-10 pt-10">
          <div className="col-span-1 md:col-span-7 flex flex-col justify-center text-center md:text-left z-20">
            <h1 className="font-headline italic text-6xl md:text-8xl lg:text-[10rem] text-obsidian leading-[0.9] mb-8 lg:-ml-2">
              Hear what <br />
              your heart <br />
              <span className="opacity-80">meant to say.</span>
            </h1>
            <p className="font-body text-xl md:text-2xl text-obsidian/80 max-w-xl mb-12 leading-relaxed mx-auto md:mx-0">
              Some feelings are too big for words. Tell us your story, and we’ll compose your royal
              masterpiece.
            </p>
            <div>
              <Link
                to="/create"
                className="inline-block bg-obsidian text-primary px-12 py-5 font-label uppercase tracking-widest text-sm rounded-full hover:scale-105 transition-all duration-500 shadow-obsidian"
              >
                Score Your Story
              </Link>
            </div>
          </div>
          {/* Hero Image (hidden on small screens, huge on desktop) */}
          <div className="hidden md:block col-span-5 relative h-[600px] lg:h-[750px] -mt-10 lg:-mt-20">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#D4AF37] to-transparent z-10"></div>
            <img
              src="/images/Homepage.png"
              alt="Cinematic Hero"
              className="w-full h-full object-cover rounded-2xl shadow-2xl sepia-[.2] contrast-125 hover:sepia-0 transition-all duration-1000"
            />
          </div>
        </div>

        {/* Ornamental Elements */}
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full point-events-none"></div>
        <div className="absolute bottom-10 -left-20 w-[400px] h-[400px] bg-obsidian/5 blur-[100px] rounded-full pointer-events-none"></div>
      </section>

      {/* ── Features Section: The Digital Curator ────────────────────────────── */}
      <section className="py-32 sm:py-40 px-6 sm:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 text-center md:text-left">
            <span className="font-label text-obsidian uppercase tracking-[0.4em] text-xs font-semibold">
              The Digital Curator
            </span>
            <h2 className="font-headline italic text-5xl md:text-7xl mt-6 max-w-2xl text-obsidian leading-[0.95]">
              Set the Royal Vibe
            </h2>
          </div>

          {/* Staggered process cards mapping old process to new aesthetic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            {[
              {
                id: '01',
                title: 'The Interview',
                desc: 'Share your story through our curated intake form or chat with a producer. We capture your frequency.',
                delay: '0',
              },
              {
                id: '02',
                title: 'The Session',
                desc: 'Professional artists compose, record, and mix your custom track in the studio with royal precision.',
                delay: '100',
              },
              {
                id: '03',
                title: 'A Legacy in Sound',
                desc: 'Receive your mastered song, a digital vinyl curated for those who truly matter.',
                delay: '200',
              },
            ].map((step, idx) => (
              <div
                key={step.id}
                className={`flex flex-col space-y-8 group ${idx === 1 ? 'md:mt-24' : ''}`}
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-obsidian/5 rounded-2xl shadow-lg ring-1 ring-obsidian/10 flex items-center justify-center p-8 group-hover:-translate-y-2 transition-transform duration-700">
                  <h4 className="absolute top-4 right-6 font-headline italic text-6xl text-obsidian/10 group-hover:text-obsidian/20 transition-colors uppercase">
                    {step.id}
                  </h4>
                  <div className="w-full h-full rounded-full border border-obsidian/10 animate-[spin_60s_linear_infinite] group-hover:border-obsidian/30 transition-colors"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <h3 className="font-headline text-3xl md:text-4xl mb-4 italic text-obsidian group-hover:scale-105 transition-transform">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <div className="max-w-sm px-2">
                  <p className="font-body text-obsidian/80 leading-relaxed text-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audio Playback / Listening Room Fused ──────────────────────────── */}
      <section className="py-32 sm:py-40 bg-obsidian text-primary overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="text-center mb-16">
            <span className="font-label text-primary/60 uppercase tracking-[0.2em] text-xs mb-6 block">
              Tuning to your frequency...
            </span>
            <h2 className="font-headline italic text-5xl md:text-7xl mb-12">The Pulse of Now</h2>
          </div>

          {/* Fluid Sound Visualization embedded centrally */}
          <div className="h-64 flex flex-col items-center justify-center relative mb-24 max-w-4xl mx-auto">
            <svg
              className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
              viewBox="0 0 800 200"
              preserveAspectRatio="none"
            >
              <path
                className={`fluid-thread stroke-primary transition-all duration-[3000ms] ${isPlaying ? 'opacity-100 scale-y-110' : 'opacity-50'}`}
                d="M 0 100 Q 200 20 400 100 T 800 100"
                fill="none"
                strokeWidth="2"
              />
              <path
                className={`fluid-thread stroke-primary/40 transition-all duration-[2000ms] ${isPlaying ? 'opacity-100 -scale-y-125' : 'opacity-40'}`}
                d="M 0 100 Q 200 180 400 100 T 800 100"
                fill="none"
                strokeWidth="1"
              />
              <path
                className={`fluid-thread stroke-primary/20 transition-all duration-[4000ms] ${isPlaying ? 'opacity-100 scale-y-150' : 'opacity-20'}`}
                d="M 0 100 Q 150 50 400 100 T 800 100"
                fill="none"
                strokeWidth="3"
              />
            </svg>

            <button
              onClick={togglePlay}
              className={`relative z-20 w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all duration-500 ${isPlaying ? 'scale-110 shadow-[0_0_80px_rgba(212,175,55,0.6)]' : 'hover:scale-105'}`}
            >
              <span
                className="material-symbols-outlined text-obsidian text-6xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <div className="absolute -bottom-16 flex flex-col items-center space-y-3 pb-8">
              <p className="font-headline italic text-3xl md:text-4xl">
                {activeSong ? activeSong.title : 'Select a frequency'}
              </p>
              <p className="font-label text-xs uppercase tracking-widest text-primary/70">
                {activeSong ? `${activeSong.genre} • ${activeSong.duration}` : 'Idle'}
              </p>
            </div>
          </div>

          {/* The Grid of Tracks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-40">
            {songs.map((song) => (
              <div
                key={song.id}
                className={`flex items-center gap-6 p-6 rounded-2xl cursor-pointer transition-all duration-500 border border-primary/10 ${activeSong?.id === song.id ? 'bg-primary/10 border-primary/30' : 'bg-transparent hover:bg-primary/5'}`}
                onClick={() => playSong(song)}
              >
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-obsidian">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${song.coverUrl})` }}
                  />
                  <div className="absolute inset-0 bg-obsidian/40 flex items-center justify-center">
                    {activeSong?.id === song.id && isPlaying ? (
                      <span className="material-symbols-outlined text-primary text-3xl animate-pulse">
                        equalizer
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-primary text-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                        play_circle
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-label text-primary/60 uppercase tracking-widest mb-1">
                    {song.genre}
                  </span>
                  <h4 className="text-xl font-headline italic text-primary mb-2 line-clamp-1">
                    {song.title}
                  </h4>
                  <p className="text-sm font-body text-primary/70 line-clamp-2 leading-relaxed">
                    {song.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Texture overlay for the section */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        ></div>
      </section>

      {/* FAQ Section (Adapting to Royal Gold) */}
      <div className="bg-surface">
        <FAQ />
      </div>

      {/* ── CTA Section: The Royal Finale ──────────────────────────────────── */}
      <section className="py-40 px-6 sm:px-12 bg-surface">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          <h2 className="font-headline italic text-5xl md:text-7xl lg:text-8xl mb-12 leading-[1.1] text-obsidian">
            Your story is waiting to be heard.
          </h2>
          <Link
            to="/create"
            className="bg-obsidian text-primary px-16 py-6 font-label uppercase tracking-[0.2em] text-sm rounded-full shadow-[0_20px_50px_rgba(36,26,0,0.2)] hover:shadow-[0_30px_60px_rgba(36,26,0,0.4)] hover:-translate-y-2 transition-all duration-700"
          >
            Begin Composing
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
