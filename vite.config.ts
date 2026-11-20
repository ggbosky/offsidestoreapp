import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' => sestavená aplikace funguje i z file:// (Electron / Tauri).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, open: true },
  test: { environment: 'node' },
});
