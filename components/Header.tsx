import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import TrackOrderModal from './TrackOrderModal';
import { useModalDialog } from '../hooks/useModalDialog';
import { useOverlay } from '../contexts/OverlayContext';

const MOBILE_MENU_ID = 'mobile-navigation-panel';

const Header: React.FC = () => {
  const location = useLocation();
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const previousLocationRef = useRef(`${location.pathname}?${location.search}`);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement | null>(null);
  const openTrackAfterMenuRef = useRef(false);
  const { canOpen, setLayerOpen } = useOverlay();

  const navLinkClass = (path: string) =>
    `border-b border-transparent pb-1 font-label text-sm font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
      location.pathname === path
        ? 'border-terracotta text-terracotta'
        : 'text-ink-soft hover:border-terracotta/40 hover:text-terracotta'
    }`;

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const menuDialogRef = useModalDialog({
    isOpen: isMobileMenuOpen,
    onClose: closeMobileMenu,
    initialFocusRef: firstMenuLinkRef,
  });

  const openTrackModal = useCallback(() => {
    if (canOpen('task-dialog')) setIsTrackModalOpen(true);
  }, [canOpen]);

  useEffect(() => {
    const currentLocation = `${location.pathname}?${location.search}`;
    if (previousLocationRef.current === currentLocation) return undefined;
    previousLocationRef.current = currentLocation;
    if (!isMobileMenuOpen) return undefined;
    const closeTimer = window.setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => window.clearTimeout(closeTimer);
  }, [location.pathname, location.search, isMobileMenuOpen]);

  useEffect(() => {
    setLayerOpen('menu', isMobileMenuOpen);
    return () => setLayerOpen('menu', false);
  }, [isMobileMenuOpen, setLayerOpen]);

  useEffect(() => {
    if (isMobileMenuOpen || !openTrackAfterMenuRef.current || !canOpen('task-dialog')) return undefined;
    openTrackAfterMenuRef.current = false;
    const openTimer = window.setTimeout(() => setIsTrackModalOpen(true), 0);
    return () => window.clearTimeout(openTimer);
  }, [canOpen, isMobileMenuOpen]);

  const mobileNavLinkClass = (path: string) =>
    `flex min-h-16 items-center justify-between rounded-lg border px-5 font-label text-base font-bold uppercase tracking-[0.14em] transition-colors ${
      location.pathname === path
        ? 'border-terracotta bg-terracotta-pale text-terracotta-dark'
        : 'border-line-control bg-cream text-ink hover:border-terracotta hover:text-terracotta'
    }`;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-line bg-ivory/88 backdrop-blur-xl">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center" aria-label="YourGbedu home">
            <BrandLogo
              variant="icon"
              tone="fullColor"
              className="h-10 w-10 lg:hidden"
            />
            <BrandLogo
              tone="fullColor"
              className="hidden h-14 w-[260px] lg:inline-flex"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center space-x-10 md:flex">
            <Link to="/" className={navLinkClass('/')}>
              Home
            </Link>
            <Link to="/library" className={navLinkClass('/library')}>
              Catalogue
            </Link>
            <button
              type="button"
              onClick={openTrackModal}
              className="border-b border-transparent pb-1 font-label text-sm font-bold uppercase tracking-[0.12em] text-ink-soft transition-colors duration-200 hover:border-terracotta/40 hover:text-terracotta"
            >
              Track Order
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/create"
              className="rounded-full bg-ink px-7 py-2.5 font-label text-xs font-bold uppercase tracking-[0.14em] text-cream transition-colors duration-200 hover:bg-terracotta"
            >
              Create Your Song
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                if (isMobileMenuOpen) closeMobileMenu();
                else if (canOpen('menu')) setIsMobileMenuOpen(true);
              }}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors ${
                isMobileMenuOpen
                  ? 'border-terracotta bg-terracotta-pale text-terracotta-dark'
                  : 'border-line-control bg-cream text-ink hover:border-terracotta hover:text-terracotta'
              }`}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls={MOBILE_MENU_ID}
            >
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && createPortal(
        <div
          className="fixed inset-0 z-[190] bg-ink/35 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        >
          <div
            id={MOBILE_MENU_ID}
            ref={menuDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            tabIndex={-1}
            className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-ivory px-5 pb-8 pt-5 shadow-ambient-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-5">
              <h2 id="mobile-navigation-title" className="font-headline text-3xl font-semibold text-ink">Menu</h2>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line-control bg-cream text-ink"
                aria-label="Close navigation menu"
              >
                <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
              <Link ref={firstMenuLinkRef} to="/" onClick={closeMobileMenu} className={mobileNavLinkClass('/')}>
                <span>Home</span>
                <span className="material-symbols-outlined text-xl" aria-hidden="true">home</span>
              </Link>
              <Link to="/library" onClick={closeMobileMenu} className={mobileNavLinkClass('/library')}>
                <span>Catalogue</span>
                <span className="material-symbols-outlined text-xl" aria-hidden="true">library_music</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  openTrackAfterMenuRef.current = true;
                  closeMobileMenu();
                }}
                className="flex min-h-16 items-center justify-between rounded-lg border border-line-control bg-cream px-5 text-left font-label text-base font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:border-terracotta hover:text-terracotta"
              >
                <span>Track Order</span>
                <span className="material-symbols-outlined text-xl" aria-hidden="true">receipt_long</span>
              </button>
            </nav>

            <div className="mt-5 border-t border-line pt-5">
              <p className="font-headline text-3xl italic leading-none text-ink">Start with the person you love.</p>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Build a custom song brief, then we configure the record around your story.
              </p>
              <Link
                to="/create"
                onClick={closeMobileMenu}
                className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-ink px-8 text-center font-label text-xs font-bold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-terracotta"
              >
                Create Your Song
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      <TrackOrderModal isOpen={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)} />
    </header>
  );
};

export default Header;
