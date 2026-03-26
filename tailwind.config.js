/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './{pages,components,contexts,services}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Royal Gold Cinematic Palette ── */
        canvas: '#D4AF37', // Reassigned to Royal Gold
        'on-surface': '#241a00',
        'on-surface-variant': '#c4a02e',
        'outline-variant': '#8a7124',

        primary: {
          DEFAULT: '#D4AF37',
          dark: '#c4a02e',
          container: '#fff2d8',
        },
        'on-primary': '#1a1400',

        secondary: {
          DEFAULT: '#9f402d',
          dark: '#7d3122',
        },

        tertiary: {
          DEFAULT: '#006a6a',
        },

        obsidian: '#241a00',

        surface: {
          DEFAULT: '#D4AF37',
          bright: '#e2c15a',
          'container-lowest': '#ffffff',
          'container-low': '#fff2d8',
          container: '#ffebbc',
          'container-high': '#ffe5a0',
          'container-highest': '#ffe088',
          variant: '#c4a02e',
        },

        background: {
          DEFAULT: '#D4AF37',
          surface: '#e2c15a',
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        headline: ['Newsreader', 'Georgia', 'serif'],
        body: ['Inter', 'sans-serif'],
        ui: ['"Plus Jakarta Sans"', 'sans-serif'],
        label: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.5rem',
        lg: '0.25rem',
        md: '0.375rem',
        DEFAULT: '0.125rem',
        full: '9999px',
      },
      spacing: {
        section: '5.5rem',
        'section-lg': '7rem',
      },
      boxShadow: {
        ambient: '0 10px 40px rgba(36, 26, 0, 0.06)',
        'ambient-lg': '0 16px 60px rgba(36, 26, 0, 0.08)',
        obsidian: '0 20px 50px rgba(36, 26, 0, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) skewX(-12deg)' },
          '100%': { transform: 'translateX(200%) skewX(-12deg)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
