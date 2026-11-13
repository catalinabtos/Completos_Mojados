import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'safari15', outDir: 'dist' },
  server: { host: true }
});
