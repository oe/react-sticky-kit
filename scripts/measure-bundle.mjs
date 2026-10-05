import { createRequire } from 'node:module';
import { basename, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

// Use the esbuild version already resolved by our locked Vite development toolchain.
const { build, version } = createRequire(import.meta.resolve('vite'))('esbuild');
const entries = {
  ...(process.argv[2] ? { baseline: resolve(process.argv[2]) } : {}),
  main: resolve('dist/react-sticky.es.js'),
  auto: resolve('dist/react-sticky-auto.es.js'),
};
console.log(`esbuild ${version}; minified ES2018 ESM; React/ReactDOM external; gzip bytes; CSS excluded`);
for (const [name, entry] of Object.entries(entries)) {
  const result = await build({
    stdin: { contents: `export { StickyContainer, StickyItem } from ${JSON.stringify(entry)}`, resolveDir: resolve('.') },
    bundle: true, minify: true, format: 'esm', target: 'es2018', splitting: true,
    outdir: resolve(`.bundle-measure/${name}`), write: false, external: ['react', 'react-dom'],
  });
  console.log(name, result.outputFiles.map(file => ({
    chunk: basename(file.path) === 'stdin.js' ? 'initial' : 'deferred', gzip: gzipSync(file.contents).length,
  })));
}
