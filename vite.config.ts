import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(({ command }) => ({
  ...(command === 'serve' ? { root: 'demo' } : {}),
  plugins: [react({ jsxRuntime: 'classic' })],
  resolve: { alias: { '@': source } },
  build: {
    target: 'es2018',
    lib: {
      entry: `${source}/index.tsx`,
      name: 'ReactSticky',
      formats: ['es', 'cjs', 'umd'],
      cssFileName: 'style',
      fileName: format => format === 'cjs' ? 'react-sticky.cjs' : `react-sticky.${format}.js`,
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
