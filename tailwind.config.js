/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem' },
    extend: {
      colors: {
        ink: {
          DEFAULT: '#101828',
          muted: '#475467',
          soft: '#667085',
          line: '#E4E9F0',
        },
        navy: {
          950: '#050E2E',
          900: '#07133D',
          800: '#0B1748',
          700: '#0A1F5A',
          600: '#0B2058',
          500: '#123078',
        },
        brand: {
          50: '#EEF8FE',
          100: '#D6EFFB',
          200: '#AEDFF7',
          300: '#6FC9F0',
          400: '#35C7F4',
          500: '#159BD3',
          600: '#0F7AAC',
          700: '#0E6088',
          800: '#0F4F6E',
          900: '#11425C',
        },
        mist: '#F7FAFC',

        /* Light grounds — the page sits on these instead of navy. */
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F4F8FF',
          tint: '#E9F2FF',
          sky: '#DCEBFF',
        },

        /* Warm accent: energy against an otherwise all-blue palette. */
        coral: {
          50: '#FFF3EE',
          100: '#FFE2D5',
          200: '#FFC4AC',
          300: '#FF9E78',
          400: '#FF7A45',
          500: '#F2571C',
          600: '#CE4413',
        },

        /* Secondary for "health" cues. */
        mint: {
          50: '#E8FBF6',
          100: '#C8F5EA',
          200: '#8FEAD7',
          300: '#4DD9BE',
          400: '#14C4A3',
          500: '#059E84',
          600: '#067A68',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        editorial: '-0.035em',
      },
      maxWidth: {
        shell: '1560px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        /* Blue-tinted shadows: on a white ground, neutral grey shadows look
           dirty, while a tint of the brand colour reads as depth. */
        soft: '0 2px 8px -2px rgba(16,58,120,0.08), 0 12px 28px -12px rgba(16,58,120,0.12)',
        card: '0 4px 14px -4px rgba(16,58,120,0.10), 0 20px 48px -20px rgba(16,58,120,0.20)',
        cardHover: '0 8px 22px -6px rgba(16,58,120,0.16), 0 32px 64px -24px rgba(16,58,120,0.28)',
        glow: '0 18px 44px -14px rgba(21,155,211,0.55)',
        glowCoral: '0 18px 44px -14px rgba(255,122,69,0.45)',
        header: '0 1px 0 rgba(16,24,40,0.06), 0 12px 32px -18px rgba(16,24,40,0.28)',
        lift: '0 18px 40px -24px rgba(16,24,40,0.35)',
        liftLg: '0 30px 70px -32px rgba(11,32,88,0.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      screens: {
        /* Short viewports: 1366x768 and 1280x720 laptops, where a hero sized
           for a 900px screen runs past the fold. */
        short: { raw: '(max-height: 820px)' },
      },
      backgroundImage: {
        'mesh-hero':
          'radial-gradient(at 12% 18%, rgba(53,199,244,0.28) 0px, transparent 55%), radial-gradient(at 88% 12%, rgba(255,122,69,0.20) 0px, transparent 50%), radial-gradient(at 72% 82%, rgba(20,196,163,0.22) 0px, transparent 52%), radial-gradient(at 30% 88%, rgba(21,155,211,0.20) 0px, transparent 55%)',
        'grid-light':
          'linear-gradient(to right, rgba(16,24,40,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,24,40,0.05) 1px, transparent 1px)',
        'grid-dark':
          'linear-gradient(to right, rgba(148,197,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,197,255,0.055) 1px, transparent 1px)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'trace-line': {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.6s cubic-bezier(0.24,0.6,0.32,1) infinite',
        marquee: 'marquee 38s linear infinite',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        400: '400ms',
      },
    },
  },
  plugins: [],
};
