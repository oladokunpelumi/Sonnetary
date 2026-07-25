import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

interface FooterProps {
  onOpenCookiePreferences?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenCookiePreferences }) => {
  return (
    <footer className="relative z-10 mt-auto w-full border-t border-line bg-ink px-6 pb-32 pt-12 text-cream md:pb-28">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
        <div>
          <BrandLogo tone="monoLight" className="h-14 w-[260px]" />
          <p className="mt-3 max-w-md font-headline text-xl italic leading-7 text-cream/55">
            Personal songs for moments that deserve more than a message.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 font-label text-xs font-bold uppercase tracking-[0.14em]">
          <Link to="/" className="text-cream/65 transition-colors hover:text-mustard-soft">
            Home
          </Link>
          <Link
            to="/library"
            className="text-cream/65 transition-colors hover:text-mustard-soft"
          >
            Catalogue
          </Link>
          <a
            href="mailto:hello@yourgbedu.com"
            className="text-cream/65 transition-colors hover:text-mustard-soft"
          >
            Contact
          </a>
          {/* The /privacy route exists but is intentionally not linked yet — its copy
              makes factual data-handling claims that need legal review before we
              publish it. Restore this link once that review is done. */}
          <button
            type="button"
            onClick={onOpenCookiePreferences}
            className="text-left text-cream/65 transition-colors hover:text-mustard-soft"
          >
            Cookie preferences
          </button>
        </div>
        <div className="font-label text-xs text-cream/55">
          © {new Date().getFullYear()} YourGbedu
        </div>
      </div>
    </footer>
  );
};

export default Footer;
