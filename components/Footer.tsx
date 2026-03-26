import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-12 px-8 bg-[#fff2d8] border-t-4 border-primary mt-auto z-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 max-w-7xl mx-auto font-headline text-sm tracking-wide">
        <div className="italic text-lg text-[#241a00]">YourGbedu</div>
        <div className="flex flex-wrap justify-center gap-6 md:space-x-12 md:gap-0">
          <Link to="/" className="text-[#5e5e63] hover:text-[#241a00] underline transition-all">
            Home
          </Link>
          <Link
            to="/library"
            className="text-[#5e5e63] hover:text-[#241a00] underline transition-all"
          >
            Library
          </Link>
          <a
            href="mailto:hello@yourgbedu.com"
            className="text-[#5e5e63] hover:text-[#241a00] underline transition-all"
          >
            Contact
          </a>
        </div>
        <div className="text-[#241a00]">
          © {new Date().getFullYear()} The Digital Curator • Permanent Collection
        </div>
      </div>
    </footer>
  );
};

export default Footer;
