import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Served from a GitHub Pages project site, so assets resolve under /LandDemo/.
  base: process.env.GITHUB_PAGES ? '/LandDemo/' : '/',
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
