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
      boxShadow: {
        header: '0 1px 0 rgba(16,24,40,0.06), 0 12px 32px -18px rgba(16,24,40,0.28)',
        lift: '0 18px 40px -24px rgba(16,24,40,0.35)',
        liftLg: '0 30px 70px -32px rgba(11,32,88,0.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
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
