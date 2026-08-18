import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Served from a GitHub Pages project site, so assets resolve under /LandDemo/.
  base: process.env.GITHUB_PAGES ? '/LandDemo/' : '/',
  plugins: [vue(), tailwindcss()],
  test: {
    // The shortlist store persists to localStorage, so its tests need a DOM.
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
