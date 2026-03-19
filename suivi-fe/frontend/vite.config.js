import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Toutes les requêtes commençant par /api seront redirigées vers le backend
      '/api': {
        target: 'http://localhost:4000', // Port de ton serveur Express
        changeOrigin: true,
        secure: false,
      }
    }
  }
})