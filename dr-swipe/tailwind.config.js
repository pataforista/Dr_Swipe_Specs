/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#0D9488',   // Teal 600
          secondary: '#14B8A6', // Teal 500 (accent)
          danger: '#EF4444',    // Red 500
          warning: '#F59E0B',   // Amber 500
          info: '#3B82F6',      // Blue 500
          dark: '#0F172A',      // Slate 900
          glass: 'rgba(255, 255, 255, 0.1)',
        },
        specialty: {
          ped: '#F472B6', // Pink
          surg: '#B91C1C', // Dark Red
          obs: '#8B5CF6',  // Violet
          int: '#3B82F6',  // Blue
          psych: '#10B981', // Emerald
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glitch-before': {
          '0%': { clipPath: 'inset(10% 0 31% 0)' },
          '10%': { clipPath: 'inset(80% 0 10% 0)' },
          '20%': { clipPath: 'inset(10% 0 31% 0)' },
          '30%': { clipPath: 'inset(40% 0 50% 0)' },
          '40%': { clipPath: 'inset(10% 0 31% 0)' },
          '50%': { clipPath: 'inset(70% 0 10% 0)' },
          '60%': { clipPath: 'inset(10% 0 31% 0)' },
          '70%': { clipPath: 'inset(30% 0 60% 0)' },
          '80%': { clipPath: 'inset(10% 0 31% 0)' },
          '90%': { clipPath: 'inset(80% 0 10% 0)' },
          '100%': { clipPath: 'inset(10% 0 31% 0)' },
        },
        'glitch-after': {
          '0%': { clipPath: 'inset(50% 0 20% 0)' },
          '10%': { clipPath: 'inset(20% 0 60% 0)' },
          '20%': { clipPath: 'inset(50% 0 20% 0)' },
          '30%': { clipPath: 'inset(80% 0 10% 0)' },
          '40%': { clipPath: 'inset(50% 0 20% 0)' },
          '50%': { clipPath: 'inset(10% 0 80% 0)' },
          '60%': { clipPath: 'inset(50% 0 20% 0)' },
          '70%': { clipPath: 'inset(60% 0 30% 0)' },
          '80%': { clipPath: 'inset(50% 0 20% 0)' },
          '90%': { clipPath: 'inset(20% 0 70% 0)' },
          '100%': { clipPath: 'inset(50% 0 20% 0)' },
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glitch-before': 'glitch-before 3s infinite linear alternate-reverse',
        'glitch-after': 'glitch-after 2s infinite linear alternate-reverse',
      },
    },
  },
  plugins: [],
}
