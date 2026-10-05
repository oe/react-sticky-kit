import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: { '#built-main': fileURLToPath(new URL('../../dist/react-sticky.es.js', import.meta.url)), '#built-auto': fileURLToPath(new URL('../../dist/react-sticky-auto.es.js', import.meta.url)) } },
  plugins: [react()],
});
