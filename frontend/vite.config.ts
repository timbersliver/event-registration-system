import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          // Only proxy admin API routes; serve admin page routes from SPA
          if (req.url && !req.url.startsWith('/api') && req.url !== '/login/api') {
            return '/index.html';
          }
        },
      },
    },
  },
});
