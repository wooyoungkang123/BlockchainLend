import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react() // Simplified React plugin config
  ],
  base: process.env.NODE_ENV === 'production' ? '/LendFlow/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    watch: {
      usePolling: true
    }
  },
  optimizeDeps: {
    exclude: ['@testing-library/jest-dom', '@testing-library/react-hooks']
  },
  // Ignore TypeScript errors
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
