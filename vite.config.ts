import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{css,html,ico,js,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    restoreMocks: true,
    clearMocks: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // accessible from Android emulator via 10.0.2.2:3000
    proxy: {
      '/identity': 'http://localhost:5000',
      '/link': 'http://localhost:5000',
      '/conversation': 'http://localhost:5000',
      '/message': 'http://localhost:5000',
      '/trust': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
});
