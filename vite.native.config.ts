import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    target: 'es2018', emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/native.tsx', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: format => format === 'cjs' ? 'react-sticky-native.cjs' : 'react-sticky-native.es.js',
    },
    rolldownOptions: { external: ['react'], output: { banner: '"use client";' } },
  },
});
