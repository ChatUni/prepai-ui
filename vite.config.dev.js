import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.png'],
  define: {
    'process.env': {
        BASE_URL: '/.netlify/functions' // Updated to match the new server port
    }
  }
})
