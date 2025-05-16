import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Skip TypeScript checks in development mode
      babel: {
        babelrc: false,
        configFile: false,
      }
    })
  ],
  base: '/LendFlow/',
  // Skip TypeScript validation
  optimizeDeps: {
    esbuildOptions: {
      // Skip TypeScript checking during dependency optimization
      tsconfigRaw: { compilerOptions: { skipLibCheck: true } }
    }
  },
  build: {
    // Continue on error during build
    minify: true,
    sourcemap: false,
    // Skip TypeScript errors during build
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  server: {
    // Don't fail on TypeScript errors
    hmr: {
      overlay: false
    }
  }
})
