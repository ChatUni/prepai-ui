import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.PNG'],
  base: '/prepai/',
  define: {
    'process.env': {
        BASE_URL: 'https://lb.freshroad.ai:3001'
    }
  }
})
