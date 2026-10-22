import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // three.js is only needed by the hero and the gallery; keeping it in
        // its own chunk stops it blocking first paint on text-only routes
        // rolldown wants the function form, not an object map
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/framer-motion')) return 'motion';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
