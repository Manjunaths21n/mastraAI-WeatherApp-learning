import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/db/**',
        '**/.mastra/**',
        '**/*.db',
        '**/*.db-shm',
        '**/*.db-wal',
        '**/*.duckdb',
        '**/*.duckdb.wal',
        '**/node_modules/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})