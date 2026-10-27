import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://yuni1325.github.io/hobby-slot/
export default defineConfig({
  plugins: [react()],
  base: '/hobby-slot/',
})
