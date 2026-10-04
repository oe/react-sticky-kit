import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { renderToString } from 'react-dom/server';
import React from 'react';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const esm = await import('react-sticky-kit');
const cjs = require('react-sticky-kit');
for (const library of [esm, cjs]) {
  assert.equal(typeof library.StickyContainer, 'function');
  assert.equal(typeof library.StickyItem, 'function');
  const html = renderToString(React.createElement(library.StickyContainer, { className: 'custom' },
    React.createElement(library.StickyItem, null, 'SSR header')));
  assert.match(html, /SSR header/);
  assert.match(html, /oe-sticky-container custom/);
}
for (const style of ['react-sticky-kit/style', 'react-sticky-kit/dist/style.css']) {
  assert.match(await readFile(require.resolve(style), 'utf8'), /position:fixed/);
}
for (const name of ['react-sticky.es.js', 'react-sticky.cjs', 'react-sticky.umd.js']) {
  const content = await readFile(new URL(`../dist/${name}`, import.meta.url), 'utf8');
  assert.match(content, /^['"]use client['"]/);
  assert.doesNotMatch(content, /react\/jsx-runtime/);
}
const sandbox = { React };
vm.runInNewContext(await readFile(new URL('../dist/react-sticky.umd.js', import.meta.url), 'utf8'), sandbox);
assert.equal(typeof sandbox.ReactSticky.StickyContainer, 'function');
assert.equal(typeof sandbox.ReactSticky.StickyItem, 'function');
assert.equal(fileURLToPath(import.meta.resolve('react-sticky-kit')), require.resolve('react-sticky-kit'));
console.log('Package entry points, CSS paths, UMD globals, client directive and SSR passed.');
