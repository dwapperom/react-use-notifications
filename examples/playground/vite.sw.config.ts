import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.PLAYGROUND_BASE ?? '/',
  publicDir: false,
  build: {
    outDir: 'public',
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: fileURLToPath(new URL('./src/sw.ts', import.meta.url)),
      formats: ['iife'],
      name: 'serviceWorker',
      fileName: () => 'sw.js',
    },
  },
});
