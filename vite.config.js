import { defineConfig } from 'vite'

export default defineConfig({
    base: '/block-saga/', // Base path for GitHub Pages
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
})
