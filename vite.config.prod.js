import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.png'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          dnd: ['react-dnd', 'react-dnd-html5-backend'],
          mobx: ['mobx', 'mobx-react-lite']
        }
      }
    }
  }
  // define: {
  //   'process.env': {
  //       // In production, use Netlify Functions URL pattern
  //       // BASE_URL: '/.netlify/functions'
  //       BASE_URL: 'https://prepai-ui.netlify.app/.netlify/functions'
  //   }
  // }
})
