import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dts from 'vite-plugin-dts';

// ESM compatible __dirname
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // Development: use demo as entry for local testing
    return {
      root: 'demo',
      plugins: [react()],
      css: {
        // Suppress Dart Sass legacy API deprecation warnings
        preprocessorOptions: {
          scss: {
            // Silence Dart Sass legacy JS API deprecation warning (Vite 5+)
            silenceDeprecations: ['legacy-js-api'],
          },
        },
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        },
      },
      server: {
        open: true,
      },
    };
  } else {
    // Build: bundle src as a library
    return {
      plugins: [
        react(),
        dts({
          entryRoot: 'src',
          outDir: 'dist',
          copyDtsFiles: false, // Do not copy all d.ts files
          rollupTypes: true,   // Merge all type definitions into a single .d.ts
        }),
      ],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.tsx'),
          name: 'ReactSticky',
          fileName: (format) => `react-sticky.${format}.js`,
          formats: ['es', 'umd'],
        },
        rollupOptions: {
          // Externalize peer dependencies and JSX runtime
          external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          },
        },
        outDir: 'dist',
        emptyOutDir: true,
      },
      css: {
        preprocessorOptions: {
          scss: {
            // Silence Dart Sass legacy JS API deprecation warning (Vite 5+)
            silenceDeprecations: ['legacy-js-api'],
          },
        },
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        },
      },
    };
  }
});
