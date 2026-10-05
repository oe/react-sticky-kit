import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const directory = await mkdtemp(join(tmpdir(), 'react-sticky-compat-'));
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}
try {
  run('pnpm', ['pack', '--pack-destination', directory], resolve('.'));
  const tarball = (await readdir(directory)).find(name => name.endsWith('.tgz'));
  for (const version of ['17.0.2', '18.3.1', '19.3.0']) {
    const consumer = join(directory, version);
    await mkdir(consumer);
    await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error',
      join(directory, tarball), `react@${version}`, `react-dom@${version}`,
      `@types/react@${version.split('.')[0]}`, `@types/react-dom@${version.split('.')[0]}`, 'typescript@5.0.4'], consumer);
    const typecheck = `import React from 'react';
import { StickyContainer, StickyItem, type IStickyMode } from 'react-sticky-kit';
import { StickyContainer as AutoContainer, StickyItem as AutoItem } from 'react-sticky-kit/auto';
import 'react-sticky-kit/style';
const auto = React.createElement(AutoContainer, { defaultMode: 'stack', overflowBehavior: 'scroll',
  offsetTop: 16, offsetBottom: 16, constraint: 'none', positionStrategy: 'fixed',
  onStickyItemsHeightChange: (height: number) => void height,
  children: React.createElement(AutoItem, { mode: 'replace', children: 'Header' }) });
void auto;
const mode: IStickyMode = 'stack';
const element = React.createElement(StickyContainer, { defaultMode: mode, children:
  React.createElement(StickyItem, { children: 'Header' }) });
const result: React.ReactElement<{ children: React.ReactNode }> = StickyContainer({ children: 'Header' });
void element;
void result;
`;
    await writeFile(join(consumer, 'consumer.mts'), typecheck);
    await writeFile(join(consumer, 'consumer.cts'), typecheck);
    run(process.execPath, [join(consumer, 'node_modules/typescript/bin/tsc'),
      '--noEmit', '--strict', '--module', 'NodeNext', '--target', 'ES2018',
      '--esModuleInterop', 'consumer.mts', 'consumer.cts'], consumer);
    run(process.execPath, [join(consumer, 'node_modules/typescript/bin/tsc'),
      '--noEmit', '--strict', '--module', 'ESNext', '--moduleResolution', 'Bundler',
      '--target', 'ES2018', '--esModuleInterop', 'consumer.mts'], consumer);
    const require = createRequire(join(consumer, 'package.json'));
    const React = require('react');
    const ReactDOM = require('react-dom');
    const { renderToString } = require('react-dom/server');
    const library = require('react-sticky-kit');
    const autoLibrary = require('react-sticky-kit/auto');
    assert.equal(autoLibrary.StickyItem, library.StickyItem);
    assert.match(renderToString(React.createElement(autoLibrary.StickyContainer, null,
      React.createElement(library.StickyItem, null, 'Mixed entry'))), /Mixed entry/);
    const imported = await import(require.resolve('react-sticky-kit'));
    assert.equal(imported.StickyContainer, library.StickyContainer);
    for (const entry of [library, autoLibrary]) {
    const element = React.createElement(entry.StickyContainer, { defaultMode: 'stack' },
      React.createElement(library.StickyItem, null, 'Compatibility header'));
    assert.match(renderToString(element), /Compatibility header/);
    const dom = new JSDOM('<div id="root"></div>');
    Object.assign(globalThis, { window: dom.window, document: dom.window.document,
      Node: dom.window.Node, HTMLElement: dom.window.HTMLElement,
      getComputedStyle: dom.window.getComputedStyle.bind(dom.window), IS_REACT_ACT_ENVIRONMENT: true });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
    let callback;
    globalThis.requestAnimationFrame = scheduled => { callback = scheduled; return 0; };
    globalThis.cancelAnimationFrame = () => { callback = undefined; };
    dom.window.Element.prototype.getBoundingClientRect = function () {
      const height = this.classList.contains('oe-sticky-content') ? 40 : 1000;
      return { top: -100, bottom: -100 + height, height, width: 300 };
    };
    const act = React.act ?? require('react-dom/test-utils').act;
    let root;
    await act(async () => {
      // eslint-disable-next-line react/no-deprecated -- React 17 has no createRoot.
      if (version.startsWith('17.')) ReactDOM.render(element, document.getElementById('root'));
      else {
        root = require('react-dom/client').createRoot(document.getElementById('root'));
        root.render(element);
      }
    });
    // Dynamic CJS fallback loading can settle after the initial animation frame.
    for (let attempt = 0; attempt < 20 && !document.querySelector('.oe-sticky-content.is-sticky'); attempt++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        const pending = callback;
        callback = undefined;
        pending?.(0);
      });
    }
    assert.ok(document.querySelector('.oe-sticky-content.is-sticky'));
    assert.equal(document.querySelector('.oe-sticky-content').style.top, '0px');
    await act(async () => {
      if (root) root.unmount();
      // eslint-disable-next-line react/no-deprecated -- React 17 has no root.unmount.
      else ReactDOM.unmountComponentAtNode(document.getElementById('root'));
    });
    assert.equal(callback, undefined);
    dom.window.close();
    }
    console.log(`Packed package: React ${version} SSR, import/require, TypeScript 5 NodeNext/Bundler and both sticky lifecycles passed.`);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
