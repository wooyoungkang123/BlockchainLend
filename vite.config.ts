import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Make sure environment variables are properly loaded
  envPrefix: 'VITE_',
  // Enable detailed error messages in production builds
  build: {
    sourcemap: true,
  },
  // Configure the development server
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Listen on all local IPs
  },
  base: '/project/'
})
