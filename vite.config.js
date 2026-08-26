import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://forgedfreedom.github.io/BBALL/ (a project Pages site,
  // not a user/org root site), so the base path must match the repo name.
  base: '/BBALL/',
  plugins: [react()],
})
