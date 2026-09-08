import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // No manual chunking: every route is behind React.lazy, so Rollup's
        // own dynamic-import splitting already produces one chunk per page.
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
