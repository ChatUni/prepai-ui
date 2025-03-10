import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.PNG'], // Include PNG files as assets
  server: {
    allowedHosts: ['prepai.loca.lt'],
    proxy: {
      // Proxy /token requests to backend server
      '/token': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      // Proxy API requests to backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
