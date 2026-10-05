import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(({ command }) => ({
  ...(command === 'serve' ? { root: 'demo' } : {}),
  plugins: [react({ jsxRuntime: command === 'serve' ? 'automatic' : 'classic' })],
  resolve: { alias: { '@': source } },
  build: {
    target: 'es2018',
    lib: {
      entry: { 'react-sticky': `${source}/index.tsx`, 'react-sticky-auto': `${source}/auto.tsx` },
      name: 'ReactSticky',
      formats: ['es', 'cjs'],
      cssFileName: 'style',
      fileName: (format, name) => format === 'cjs' ? `${name}.cjs` : `${name}.es.js`,
    },
    rolldownOptions: {
      external: ['react', 'react-dom'],
      output: {
        banner: '"use client";',
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
  },
}));
