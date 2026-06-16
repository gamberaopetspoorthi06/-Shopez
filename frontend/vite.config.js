import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Since we are writing ESM but Vite config might run in CJS/ESM contexts,
// standard Vite config with import is best, but let's make it fully modern ESM:
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
});
