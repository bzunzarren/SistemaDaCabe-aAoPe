/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
      },
      colors: {
        primary: '#8B7355',
        secondary: '#D4C4B5',
        background: '#FAF7F2',
        text: '#4A3E3E',
      },
    },
  },
  plugins: [],
};