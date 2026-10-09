const palette = require('./src/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: palette,
      fontFamily: {
        // Fredoka para títulos y montos; el resto usa la fuente del sistema.
        display: ['Fredoka_600SemiBold'],
        'display-medium': ['Fredoka_500Medium'],
      },
    },
  },
  plugins: [],
};
