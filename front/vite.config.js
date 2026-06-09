import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Esto le indica a Vite que autocomplete estas extensiones cuando no las pongamos
    extensions: ['.js', '.jsx', '.json']
  }
})