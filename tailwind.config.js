/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // "Neo-Cinema Date Night" — violet-tinted midnight in place of the old warm
        // brown/amber scale. Token *names* are unchanged on purpose (every component
        // already references ink/ember/rose/sage/parchment) — only the values move,
        // so the whole app reskins from this one file.
        ink: {
          950: '#07060C',
          900: '#0C0A16',
          800: '#141122',
          700: '#1D1830',
          600: '#28213F',
          500: '#332A4D',
        },
        ember: {
          400: '#FFB25E',
          500: '#F59E42',
          600: '#DB7F26',
          700: '#B8641A',
        },
        rose: {
          400: '#FF8B7D',
          500: '#FF6B5B',
          600: '#E5493A',
        },
        sage: {
          400: '#7FD4B0',
          500: '#57B892',
        },
        parchment: {
          100: '#F3F1FA',
          200: '#E4DFF3',
          300: '#CBC2E8',
        },
        // New accents for mood ambience and the premium reveal moments.
        violet: {
          400: '#B79CFB',
          500: '#8B5CF6',
          600: '#6D28D9',
        },
        electric: {
          400: '#7CB3FF',
          500: '#3B82F6',
          600: '#1D4ED8',
        },
      },
      boxShadow: {
        card: '0 20px 50px -15px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(255,178,94,0.25), 0 12px 30px -8px rgba(245,158,66,0.35)',
        'glow-violet': '0 0 0 1px rgba(139,92,246,0.3), 0 12px 40px -8px rgba(139,92,246,0.45)',
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 15% 15%, rgba(139,92,246,0.14), transparent 40%), radial-gradient(circle at 85% 0%, rgba(255,107,91,0.10), transparent 45%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.08), transparent 50%)",
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'spotlight-sweep': {
          '0%': { opacity: '0', transform: 'scale(0.85) rotate(-2deg)' },
          '60%': { opacity: '1' },
          '100%': { opacity: '0.9', transform: 'scale(1) rotate(0deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'spotlight-sweep': 'spotlight-sweep 1.1s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
