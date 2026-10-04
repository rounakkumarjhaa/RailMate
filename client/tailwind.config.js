/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        railway: {
          navy: '#0b192c',
          blue: '#1e3e62',
          orange: '#ff6500',
          amber: '#f6993f',
          gold: '#fbbf24',
          slate: '#1e293b',
          card: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'train-move': 'trainMove 2s ease-in-out infinite alternate',
      },
      keyframes: {
        trainMove: {
          '0%': { transform: 'translateX(0px)' },
          '100%': { transform: 'translateX(10px)' },
        }
      }
    },
  },
  plugins: [],
}
