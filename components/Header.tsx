import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TrackOrderModal from './TrackOrderModal';

const Header: React.FC = () => {
  const location = useLocation();
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const isDark = true; // Hardcoded for Sonnetary's aesthetic

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-background-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <span className="material-symbols-outlined !text-[32px]">graphic_eq</span>
            </div>
            <h2 className="text-white text-xl font-bold tracking-tight font-display">Sonnetary</h2>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Home</Link>
            <Link to="/library" className={`text-sm font-medium transition-colors ${location.pathname === '/library' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Library</Link>
            <button onClick={() => setIsTrackModalOpen(true)} className={`text-sm font-medium transition-colors ${location.pathname === '/track' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Track Order</button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <button
                onClick={() => setIsTrackModalOpen(true)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Track Order
              </button>
              <Link
                to="/create"
                className="flex items-center justify-center rounded-lg h-10 px-6 bg-primary hover:bg-primary-dark transition-all text-white text-sm font-bold shadow-[0_0_15px_rgba(236,19,55,0.4)] tracking-wide"
              >
                Create Song
              </Link>
            </div>

            <button className="md:hidden text-white p-2">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>

      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
    </header>
  );
};

export default Header;
