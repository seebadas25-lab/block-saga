import { defineConfig } from 'vite'

export default defineConfig({
    base: './', // Relative path for better portability
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    }
})
