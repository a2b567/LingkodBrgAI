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
            50: '#f0f4f9',
            100: '#e1e9f3',
            200: '#c2d2e7',
            300: '#94b3d7',
            400: '#5f8ec3',
            500: '#3b6fa8',
            600: '#2c568a',
            700: '#254771',
            800: '#213d5e',
            900: '#1f3550',
            950: '#142134',
          },
          gold: {
            50: '#fdfbe9',
            100: '#faf7c5',
            200: '#f5ee8e',
            300: '#eedc4e',
            400: '#e5c41f',
            500: '#cca210',
            600: '#b07f0c',
            700: '#8c5c0d',
            800: '#754b11',
            900: '#643f14',
            950: '#3a2107',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
