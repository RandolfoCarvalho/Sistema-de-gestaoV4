/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", "./src/**/*.{js, ts, jsx, tsx}"
  ],
  theme: {
    extend: {
      fontFamily : {
        quickSand : ["Quicksand", "sans-serif"]
      },
      animation: {
        'fade-in-right': 'fade-in-right 0.5s ease-out both',
      },
      keyframes: {
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

