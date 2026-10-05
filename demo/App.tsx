import React, { useEffect, useRef, useState } from 'react';
import { examples, exampleCode, sourceFiles } from './examples';
import './site.css';
import CodeBlock, { CopyButton } from './CodeBlock';

const repo = 'https://github.com/oe/react-sticky-kit';
const sources = import.meta.glob('./*Demo.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const install = 'pnpm add react-sticky-kit';
const sourceRef = import.meta.env.VITE_DEMO_SOURCE_REF || 'main';
function currentRoute() {
  const hash = window.location.hash.slice(1);
  return hash === 'overview' || hash === 'installation' || examples.some(p => p.hash === hash) ? hash : 'replace';
}
function GettingStarted({ installation }: { installation: boolean }) {
  const [manager, setManager] = useState<'pnpm' | 'npm' | 'yarn'>('pnpm');
  const command = `${manager} ${manager === 'npm' ? 'install' : 'add'} react-sticky-kit`;
  return <article className="guide">
    <h1>{installation ? 'Installation' : 'Sticky headers, working together.'}</h1>
    <p className="lead">{installation ? 'Add the package, import its styles, and choose how your headings behave.' : 'Coordinate stacked and replacing section headers without manually measuring their heights.'}</p>
    {!installation && <><h2>Start with the behavior you need</h2><div className="pattern-list">
      <a href="#replace"><strong>Replace sections</strong><span>Keep the current heading visible in a grouped list.</span></a>
      <a href="#stack"><strong>Stack sections</strong><span>Accumulate headings with automatic height coordination.</span></a>
      <a href="#ios-contact"><strong>Combine both</strong><span>Keep a list title above replacing section headings.</span></a>
    </div><h2>When to use native CSS</h2><p>A single sticky header or a straightforward grouped list usually only needs <code>position: sticky</code>. Use this kit for coordinated variable-height headings, mixed modes or the measured total sticky height.</p></>}
    <h2>1. Install the package</h2><p>React 17 or newer is required.</p><div className="package-managers" role="group" aria-label="Package manager">{(['pnpm', 'npm', 'yarn'] as const).map(name => <button key={name} aria-pressed={manager === name} onClick={() => setManager(name)}>{name}</button>)}</div><CodeBlock code={command} language="shell" />
    <h2>2. Import the components and styles</h2><CodeBlock code={"import { StickyContainer, StickyItem } from 'react-sticky-kit';\nimport 'react-sticky-kit/style';"} />
    <h2>3. Wrap your section headings</h2><CodeBlock code={exampleCode('replace')!} />
    <div className="usage-note"><strong>Using Next.js or another SSR framework?</strong><p>Add <code>&apos;use client&apos;</code> to the component using the kit. Keep the stylesheet in the location your framework expects.</p></div>
    <p><a href={`${repo}/blob/main/docs/patterns-and-migration.md`}>Read the patterns and migration guide</a></p>
  </article>;
}

export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [view, setView] = useState<'demo' | 'code'>('demo');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  useEffect(() => {
    const change = () => { setRoute(currentRoute()); setView('demo'); setMenuOpen(false); document.getElementById('main-content')?.focus({ preventScroll: true }); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  const example = examples.find(p => p.hash === route);
  const title = example?.name ?? (route === 'installation' ? 'Installation' : 'Overview');
  useEffect(() => { document.title = `${title} · React Sticky Kit`; }, [title]);
  const jump = () => {
    const headings = document.querySelectorAll('.demo-surface .oe-sticky-item');
    const next = [...headings].find(el => el.getBoundingClientRect().top > 2);
    if (next) window.scrollTo({ top: window.scrollY + next.getBoundingClientRect().top + 1 });
  };
  return <>
    <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <header className="mobile-header"><a href="#overview" className="brand">React Sticky Kit</a><button ref={menuButton} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close menu' : 'Menu'}</button></header>
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
      <a href="#overview" className="brand desktop-brand">React Sticky Kit</a>
      <nav id="site-navigation" aria-label="Documentation">
        <div className="nav-label">Getting started</div>
        {['overview', 'installation'].map(hash => <a key={hash} href={`#${hash}`} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} aria-current={route === hash ? 'page' : undefined}>{hash === 'overview' ? 'Overview' : 'Installation'}</a>)}
        <div className="nav-label">Examples</div>
        {examples.map(p => <a href={`#${p.hash}`} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }} key={p.hash} aria-current={route === p.hash ? 'page' : undefined}>{p.name}</a>)}
      </nav>
      <div className="sidebar-footer"><a href={repo}>GitHub</a><a href="https://www.npmjs.com/package/react-sticky-kit">npm</a><span>Install with pnpm</span><div className="sidebar-install"><code>pnpm add <span>react-sticky-kit</span></code><CopyButton value={install} /></div></div>
    </aside>
    <main id="main-content" tabIndex={-1}>
      <div className="topbar"><span>{example ? 'Examples' : 'Getting started'} <span className="breadcrumb-divider">/</span> {title}</span><div><a href={repo}>GitHub</a><a href="https://www.npmjs.com/package/react-sticky-kit">npm</a></div></div>
      {example ? <>
        <header className="page-heading"><h1>{title}</h1><p className="lead">{example.description}</p></header>
        <div className="view-tabs" role="group" aria-label="Example view"><button aria-pressed={view === 'demo'} onClick={() => setView('demo')}>Live demo</button><button aria-pressed={view === 'code'} onClick={() => setView('code')}>Code</button></div>
        {view === 'demo' ? <div className="example-layout"><div className="example-main"><div className="demo-toolbar"><span>Scroll the page to explore</span><button onClick={jump}>Jump to next section</button></div><div key={route} className="demo-surface">{example.component}</div><div className="demo-end">End of example. <a href={`#${route}`} onClick={() => window.scrollTo(0, 0)}>Back to top</a></div></div><aside className="example-notes"><h2>How it works</h2><p>{example.hint}</p><p>This example uses the browser’s native viewport scrolling.</p><p>Keep the demo in the page flow. An internal scroll frame does not match its viewport-relative offsets.</p><a href={`${repo}/blob/${sourceRef}/demo/${sourceFiles[route]}`}>View full source on GitHub</a></aside></div> : <section className="code-view" aria-label="Example source"><p>{exampleCode(route) ? 'A minimal example. Give each section enough content to scroll through.' : 'The complete demo source, with package and stylesheet imports ready to copy.'}</p><CodeBlock code={exampleCode(route) ?? `import 'react-sticky-kit/style';\n${sources[`./${sourceFiles[route]}`].replace("from '../src'", "from 'react-sticky-kit'")}`} /><a href={`${repo}/blob/${sourceRef}/demo/${sourceFiles[route]}`}>View full source on GitHub</a></section>}
      </> : <GettingStarted installation={route === 'installation'} />}
      <footer className="site-footer"><span>React Sticky Kit · MIT license</span><a href={`${repo}/issues`}>Report an issue</a></footer>
    </main>
  </>;
}
