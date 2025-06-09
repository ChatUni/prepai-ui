import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.png'],
  define: {
    'process.env': {
        BASE_URL: '/.netlify/functions'
        // BASE_URL: 'http://localhost:3001'
    }
  }
})
