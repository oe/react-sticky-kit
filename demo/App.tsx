import React, { useState, useEffect } from 'react';
import ContactListDemo from './ContactListDemo';
import MixedModeDemo from './MixedModeDemo';
import NestedStickyDemo from './NestedStickyDemo';
import DynamicStickyDemo from './DynamicStickyDemo';
import DynamicOffsetDemo from './DynamicOffsetDemo';
import ConstraintDemo from './ConstraintDemo';
import SectionModesDemo from './SectionModesDemo';

const pages = [
  { hash: 'replace', name: 'Replace sections', component: <SectionModesDemo mode="replace" /> },
  { hash: 'stack', name: 'Stack sections', component: <SectionModesDemo mode="stack" /> },
  { hash: 'ios-contact', name: 'Replace + stacked title', component: <ContactListDemo /> },
  { hash: 'mixed-mode', name: 'Stack / replace / none', component: <MixedModeDemo /> },
  { hash: 'nested', name: 'Nested Sticky Containers', component: <NestedStickyDemo /> },
  { hash: 'dynamic', name: 'Dynamic Sticky Items', component: <DynamicStickyDemo /> },
  { hash: 'dynamic-offset', name: 'Dynamic offsetTop Demo', component: <DynamicOffsetDemo /> },
  { hash: 'constraint', name: 'Constraint Demo', component: <ConstraintDemo /> },
];

// Sync pageIdx with location.hash
function getPageHashFromLocation() {
  const hash = window.location.hash.replace('#', '');
  return pages.find(p => p.hash === hash) ? hash : pages[0].hash;
}

export default function App() {
  const [pageHash, setPageHash] = useState(() => getPageHashFromLocation());

  useEffect(() => {
    const onHashChange = () => setPageHash(getPageHashFromLocation());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNav = (n: string) => {
    window.location.assign(`#${n}`)
    setPageHash(n);
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px 16px' }}>
        <h1 style={{ margin: '0 0 12px' }}>React Sticky Kit</h1>
        <p>Coordinate stacked and replacing section headers without manually measuring their heights.</p>
        <p>Scroll the page to try each pattern. A stacked title stays above the current replacing section heading.</p>
        <p>For a single header or a straightforward grouped list, native CSS position: sticky is usually enough.
          These demos focus on coordinating multiple headers with viewport-relative offsets.</p>
        <a href="https://github.com/oe/react-sticky-kit#readme">Documentation and installation</a>
        {' · '}<a href="https://www.npmjs.com/package/react-sticky-kit">npm package</a>
      </div>
      <nav aria-label="Sticky examples" style={{ flexWrap: 'wrap', display: 'flex', gap: 16, padding: 16, background: '#fff', borderBottom: '1px solid #eee' }}>
        {pages.map((p) => (
          <button aria-pressed={pageHash === p.hash} key={p.hash} onClick={() => handleNav(p.hash)} style={{ fontWeight: pageHash === p.hash ? 'bold' : undefined }}>
            {p.name}
          </button>
        ))}
      </nav>
      <div style={{ padding: 16 }}>{pages.find(p => p.hash === pageHash)?.component}</div>
    </div>
  );
}
