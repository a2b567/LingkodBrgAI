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
        gov: {
          blue: {
            50: '#f0f5fb',
            100: '#e1ecf7',
            200: '#c3dbf0',
            300: '#94c0e4',
            400: '#5e9ed4',
            500: '#3880c2',
            600: '#2565a4',
            700: '#1e5186',
            800: '#1c456f',
            900: '#1c3b5d',
            950: '#0f243d',
          },
          gold: {
            50: '#fdfce8',
            100: '#faf8c5',
            200: '#f5ee8e',
            300: '#eedc4e',
            400: '#e4c41e',
            500: '#cca210',
            600: '#af7e0c',
            700: '#8c5c0d',
            800: '#744a12',
            900: '#633d14',
            950: '#3a2007',
          },
          red: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            800: '#9f1239',
            900: '#881337',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
