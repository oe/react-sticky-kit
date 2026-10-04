import { readFile, writeFile } from 'node:fs/promises';

for (const name of ['index', 'context', 'sticky-item']) {
  const path = new URL(`../dist/${name}.d.ts`, import.meta.url);
  // CSS has no public declarations; preserve proper extensions for NodeNext resolution.
  const declaration = (await readFile(path, 'utf8')).replace(/^import ['"]\.\/style\.scss['"];\n/m, '');
  await writeFile(path, declaration);
  await writeFile(new URL(`../dist/${name}.d.cts`, import.meta.url),
    declaration.replace(/(from ['"]\.\/[^'"]+)\.js(['"])/g, '$1.cjs$2'));
}
