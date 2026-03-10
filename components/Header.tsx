import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TrackOrderModal from './TrackOrderModal';

const Header: React.FC = () => {
  const location = useLocation();
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors ${location.pathname === path ? 'text-white' : 'text-slate-400 hover:text-white'}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-background-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="size-8 text-primary">
              <span className="material-symbols-outlined !text-[32px]">graphic_eq</span>
            </div>
            <h2 className="text-white text-xl font-bold tracking-tight font-display">Sonnetary</h2>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/library" className={navLinkClass('/library')}>Library</Link>
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Track Order
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/create"
              className="flex items-center justify-center rounded-lg h-10 px-6 bg-primary hover:bg-primary-dark transition-all text-white text-sm font-bold shadow-[0_0_15px_rgba(236,19,55,0.4)] tracking-wide"
            >
              Create Song
            </Link>
          </div>

          {/* Mobile: Track + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsTrackModalOpen(true)}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Track
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="material-symbols-outlined">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-background-border">
          <nav className="flex flex-col px-4 py-4 gap-1">
            <Link
              to="/"
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Home
            </Link>
            <Link
              to="/library"
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/library' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              Library
            </Link>
            <button
              onClick={() => { setIsTrackModalOpen(true); setIsMobileMenuOpen(false); }}
              className="px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-left"
            >
              Track Order
            </button>
            <div className="pt-2 mt-1 border-t border-background-border">
              <Link
                to="/create"
                className="flex items-center justify-center rounded-lg h-11 px-6 bg-primary hover:bg-primary-dark transition-all text-white text-sm font-bold shadow-lg tracking-wide"
              >
                <span className="material-symbols-outlined mr-2 text-base">mic</span>
                Create Song
              </Link>
            </div>
          </nav>
        </div>
      )}

      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
      />
    </header>
  );
};

export default Header;
