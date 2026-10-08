import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Backend (kashikchi-jewelry) çalışırken API ve yüklenen görseller aynı origin'den sunulur;
    // böylece cookie + CSRF akışı CORS gerektirmeden çalışır.
    proxy: {
      '/api': { target: 'http://localhost:5080', changeOrigin: false },
      '/media': { target: 'http://localhost:5080', changeOrigin: false },
    },
  },
})
