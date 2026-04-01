import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path when served in development or production.
  // Using relative path './' ensures assets are resolved relative to index.html
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Set emptyOutDir to true to clean dist directory before build
    emptyOutDir: true
  }
});
