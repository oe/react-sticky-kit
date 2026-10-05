import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  build: {
    emptyOutDir: false, target: 'es2018',
    lib: { entry: './src/index.tsx', name: 'ReactSticky', formats: ['umd'], cssFileName: 'style', fileName: () => 'react-sticky.umd.js' },
    rolldownOptions: { external: ['react', 'react-dom'], output: { globals: { react: 'React', 'react-dom': 'ReactDOM' }, banner: '"use client";' } },
  },
});
