import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Esto le indica a Vite que busque estas extensiones en orden si no las pones en tus imports
    extensions: ['.js', '.jsx', '.json']
  }
})