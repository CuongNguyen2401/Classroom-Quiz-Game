import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mediapipe': ['@mediapipe/tasks-vision'],
          'utils': ['sweetalert2', 'xlsx', 'canvas-confetti', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
