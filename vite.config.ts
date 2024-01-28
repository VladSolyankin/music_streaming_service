import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'esnext'
  },
  server: {
    proxy: {
      "/getArtists": {
        target: "http://localhost:3001",
        secure: false,
      },
      "/getTracks": {
        target: "http://localhost:3001",
        secure: false,
      },
      "/getSearchedTracks": {
        target: "http://localhost:3001",
        secure: false,
      },
      "/getTracksByIds": {
        target: "http://localhost:3001",
        secure: false,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, './src/components')
    }
  },
  base: "./"
})
