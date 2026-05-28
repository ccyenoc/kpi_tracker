import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://localhost:8000',
=======
        target: 'http://localhost:8006',
>>>>>>> 7aecd0edd3a2ad7f9b3e5363b8049b5176e10d23
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
