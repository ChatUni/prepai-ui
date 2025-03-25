import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.png'],
  define: {
    'process.env': {
        // In production, use Netlify Functions URL pattern
        BASE_URL: '/.netlify/functions'
    }
  }
})
