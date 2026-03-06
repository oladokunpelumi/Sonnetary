
import React from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../App';
import FAQ from '../components/FAQ';

const Home: React.FC = () => {
  const { songs, playSong } = usePlayer();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10" />
          <div
            className="w-full h-full bg-cover bg-center opacity-60 scale-105 animate-[pulse_10s_ease-in-out_infinite]"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA-Y8HKu-Cik8k2wJr4YDrUksyvPN2kRX9oUElqm8PMRoLbrdZUMR2qxeZANcPr6SPg6s13beUY_-7z-FQ-eEPkApTVFC2dLVKstFRhl_xTy1l2pSYpNKkfb85WbLFRPH3bj3XwdgV6pTmYQTI0zq64d5F57KqAbaZUOBFO1JDtG53wzLsf23RIX3J5kME3HGvILHnCU-2gPEjmR0ebtW6GRfpWdkZX0HoJclfMetybK8hmcYcD-FeDhwtWNeN1Z3NYQ4Nt3cXaHg')" }}
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Now Recording
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter leading-[0.9] text-glow font-display">
            Turn Your Story <br /><span className="text-slate-400">Into A Soundtrack</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-light max-w-2xl font-body leading-relaxed">
            Studio-quality, bespoke songs written, composed, and recorded by professional artists just for you. From your memory to a masterpiece.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
            <Link to="/create" className="flex items-center justify-center rounded-lg h-14 px-8 bg-primary hover:bg-primary-dark text-white text-base font-bold transition-all shadow-lg hover:-translate-y-1">
              <span className="material-symbols-outlined mr-2">mic</span>
              Begin Composition
            </Link>
            <Link to="/library" className="flex items-center justify-center rounded-lg h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-base font-bold transition-all backdrop-blur-sm">
              <span className="material-symbols-outlined mr-2">play_circle</span>
              Listen to Examples
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-2">How It Works</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight font-display">From Memory to Masterpiece.</h3>
          </div>
          <p className="text-slate-400 max-w-sm text-base font-body">
            We've simplified the music production process into three transparent steps. No musical knowledge required.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { id: '01', title: 'The Interview', desc: 'Share your story and preferred genre through our easy intake form or chat with a producer.', icon: 'chat' },
            { id: '02', title: 'The Session', desc: 'Professional artists compose, record, and mix your custom track in the studio.', icon: 'graphic_eq' },
            { id: '03', title: 'The Release', desc: 'Receive your mastered song, instrumental, and lyric sheet ready for the big moment.', icon: 'music_note' },
          ].map(step => (
            <div key={step.id} className="group relative p-8 rounded-2xl bg-background-surface border border-background-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
              <div className="absolute top-4 right-6 text-6xl font-bold text-white/5 group-hover:text-primary/10 transition-colors font-display">{step.id}</div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">{step.icon}</span>
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-display">{step.title}</h4>
              <p className="text-slate-400 font-body text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Songs */}
      <section className="py-24 bg-background-surface border-y border-background-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-2">The Listening Room</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 font-display">Hear the Difference</h3>
            <p className="text-slate-400 max-w-2xl text-base font-body">
              Real stories from real people, turned into professional tracks. Experience the cinematic quality.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {songs.map(song => (
              <div
                key={song.id}
                className="flex flex-col sm:flex-row gap-6 p-6 rounded-xl bg-background border border-background-border hover:border-primary/40 transition-all group cursor-pointer"
                onClick={() => playSong(song)}
              >
                <div className="relative w-full sm:w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${song.coverUrl})` }}
                  />
                  <button className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary pl-1 shadow-lg group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">play_arrow</span>
                    </div>
                  </button>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{song.genre}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                    <span className="text-xs text-slate-500">{song.duration}</span>
                    {!song.audioUrl && <span className="text-xs text-slate-600 italic">• Sample</span>}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors font-display">{song.title}</h4>
                  <p className="text-slate-400 text-sm font-body line-clamp-2">{song.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto relative p-12 rounded-3xl overflow-hidden border border-background-border bg-gradient-to-b from-background-surface to-background">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">Ready to Record?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto font-body">Create a timeless gift that speaks louder than words. Start your composition today.</p>
          <Link to="/create" className="inline-flex items-center justify-center rounded-lg h-14 px-10 bg-primary hover:bg-primary-dark text-white text-lg font-bold shadow-lg transition-all transform hover:scale-105">
            Start Your Song
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
