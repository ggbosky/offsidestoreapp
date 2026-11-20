import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { offsideApi } from './server/plugin';

// base: './' => sestavená aplikace funguje i z file:// (bez lokálního serveru jen offline funkce).
export default defineConfig(({ mode }) => {
  // '' = načíst i proměnné bez prefixu VITE_. Zůstávají jen na serveru – do prohlížeče jde jen VITE_*.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [react(), offsideApi(env)],
    server: { port: 5173, open: true, host: 'localhost' },
    preview: { port: 4173, host: 'localhost' },
    test: { environment: 'node' },
  };
});
