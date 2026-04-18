import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const VIRTUAL_ID = 'virtual:sfx-manifest'
const RESOLVED_ID = '\0' + VIRTUAL_ID

function sfxManifest() {
  const scanDir = (rel: string): string[] => {
    const abs = path.resolve(__dirname, 'public', rel)
    try {
      return fs.readdirSync(abs)
        .filter(f => /\.(mp3|wav|ogg)$/i.test(f))
        .map(f => `/${rel}/${f}`)
    } catch {
      return []
    }
  }

  const generate = () =>
    `export const SFX_CORRECT = ${JSON.stringify(scanDir('sfx/correct'))};\n` +
    `export const SFX_INCORRECT = ${JSON.stringify(scanDir('sfx/incorrect'))};\n`

  return {
    name: 'sfx-manifest',
    resolveId: (id: string) => id === VIRTUAL_ID ? RESOLVED_ID : null,
    load: (id: string) => id === RESOLVED_ID ? generate() : null,
    configureServer(server: any) {
      const watchDirs = ['public/sfx/correct', 'public/sfx/incorrect'].map(d =>
        path.resolve(__dirname, d)
      )
      watchDirs.forEach(dir => {
        try { fs.mkdirSync(dir, { recursive: true }) } catch {}
        server.watcher.add(dir)
      })
      server.watcher.on('all', (_: string, file: string) => {
        if (watchDirs.some(d => file.startsWith(d))) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
          if (mod) server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sfxManifest()],
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

