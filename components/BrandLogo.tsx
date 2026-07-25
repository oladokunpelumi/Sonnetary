import React from 'react';

type BrandLogoVariant = 'full' | 'icon';
type BrandLogoTone = 'fullColor' | 'monoLight' | 'monoDark';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  tone?: BrandLogoTone;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

const fullLogoSrc: Record<BrandLogoTone, string> = {
  fullColor: '/brand/logo-full.svg',
  monoLight: '/brand/logo-mono-light.svg',
  monoDark: '/brand/logo-mono-dark.svg',
};

const iconLogoSrc: Record<BrandLogoTone, string> = {
  fullColor: '/brand/logo-icon-small.svg',
  monoLight: '/brand/logo-icon-mono-light.svg',
  monoDark: '/brand/logo-icon-mono-dark.svg',
};

const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  tone = 'fullColor',
  className = '',
  markClassName = '',
  textClassName = '',
}) => {
  const src = variant === 'icon' ? iconLogoSrc[tone] : fullLogoSrc[tone];
  const fallbackSize = variant === 'icon' ? 'h-10 w-10' : 'h-12 w-auto';

  return (
    <span
      className={`inline-flex shrink-0 items-center ${fallbackSize} ${className}`}
      aria-label="YourGbedu"
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        decoding="async"
        className={`block h-full w-full object-contain ${markClassName} ${textClassName}`}
      />
    </span>
  );
};

export default BrandLogo;
