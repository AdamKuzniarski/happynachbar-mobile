/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          light: {
            brand: '#8EA956',
            accent: '#68A236',
            card: '#4F742F',
            text: '#1F2A1A',
            bg: '#F7F8F5',
          },
          dark: {
            brand: '#8EA956',
            accent: '#68A236',
            card: '#4F742F',
            text: '#F3F6EE',
            bg: '#132910',
          },
        },
      },
    },
  },
  plugins: [],
};
