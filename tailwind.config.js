module.exports = {
  content: [
    './src/**/*.{html,svelte,ts}',
    './src/app.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Manrope',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
