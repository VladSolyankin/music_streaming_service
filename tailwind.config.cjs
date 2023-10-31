/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
      './index.html',
      './src/**/*.{js,jsx,ts,tsx}',
      './src/**/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
      extend: {
          fontFamily: {
              "jost": ["Jost", "sans-serif"]
          },
          backgroundImage: {
              'new-tracks': "url('src/assets/new_tracks.png')",
              'top-songs': "url('src/assets/top_songs.png')",
              'trending': "url('src/assets/trending.png')",
          }
      },
      colors: {
          "gray-12": '#121212',
          "white": '#FFFFFF'
      }

  },
  plugins: [],
}
