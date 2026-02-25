import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // accessible from Android emulator via 10.0.2.2:3000
    proxy: {
      '/identity': 'http://localhost:5000',
      '/link': 'http://localhost:5000',
      '/conversation': 'http://localhost:5000',
      '/message': 'http://localhost:5000',
      '/trust': 'http://localhost:5000',
      '/moderation': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    },
  },
});
