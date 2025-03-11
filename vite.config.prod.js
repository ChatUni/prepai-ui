import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.PNG'],
  define: {
    'process.env': {
        BASE_URL: 'http://app.freshroad.ai:3001'
    }
  }
})
