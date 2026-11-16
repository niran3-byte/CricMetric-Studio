import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const projectRoot = process.cwd();

export default defineConfig({
  root: resolve(projectRoot, 'client'),
  publicDir: resolve(projectRoot, 'public'),
  plugins: [react()],
  build: {
    outDir: resolve(projectRoot, 'dist/client'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'charts-vendor': ['recharts'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
  },
  server: {
    strictPort: true,
  },
});
