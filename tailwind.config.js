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
        ink: {
          950: '#0D0A08',
          900: '#120E0C',
          800: '#1B1512',
          700: '#251E19',
          600: '#332922',
          500: '#453830',
        },
        ember: {
          400: '#F4A65B',
          500: '#EE8B3C',
          600: '#D9722A',
          700: '#B85A1E',
        },
        rose: {
          400: '#E9707E',
          500: '#DD4F62',
          600: '#C63A4E',
        },
        sage: {
          400: '#8FBFA0',
          500: '#6FA684',
        },
        parchment: {
          100: '#FBF6EF',
          200: '#F1E7D8',
          300: '#E4D4BD',
        },
      },
      boxShadow: {
        card: '0 20px 50px -15px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(244,166,91,0.25), 0 12px 30px -8px rgba(238,139,60,0.35)',
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 20% 20%, rgba(244,166,91,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(221,79,98,0.08), transparent 45%)",
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
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}
