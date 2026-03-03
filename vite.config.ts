import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    watch: {
      // Ignore paths that should not trigger a full reload (stops phantom reloads)
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.cursor/**',
        '**/coverage/**',
        '**/*.log',
        '**/.env*',
      ],
      // Avoid polling unless needed (polling can cause extra reloads on some systems)
      usePolling: false,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
