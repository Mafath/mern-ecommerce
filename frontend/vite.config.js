import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // We'll have CORS errors. So lets fix it. we can go to server.js and add a CORS configuration. Or we can fix it from the vite.config.js file
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  //if we visit /api, it will be redirected to http://localhost:5000
      }
    }
  }
})