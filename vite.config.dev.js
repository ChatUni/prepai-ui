import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.PNG'],
  define: {
    'process.env': {
        BASE_URL: 'http://localhost:3001' // Updated to match the new server port
    }
  }
})
