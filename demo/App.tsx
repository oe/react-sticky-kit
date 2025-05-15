import { useState, useEffect } from 'react';
import ContactListDemo from './ContactListDemo';
import MixedModeDemo from './MixedModeDemo';
import NestedStickyDemo from './NestedStickyDemo';
import DynamicStickyDemo from './DynamicStickyDemo';

const pages = [
  { name: 'iPhone Contacts Demo', component: <ContactListDemo /> },
  { name: 'Mixed Sticky Modes Demo', component: <MixedModeDemo /> },
  { name: 'Nested Sticky Containers', component: <NestedStickyDemo /> },
  { name: 'Dynamic Sticky Items', component: <DynamicStickyDemo /> },
];

// Sync pageIdx with location.hash
function getIdxFromHash(pagesLen: number) {
  const idx = Number(window.location.hash.replace('#', ''));
  return Number.isFinite(idx) && idx >= 0 && idx < pagesLen ? idx : 0;
}

export default function App() {
  const [pageIdx, setPageIdx] = useState(() => getIdxFromHash(pages.length));

  useEffect(() => {
    const onHashChange = () => setPageIdx(getIdxFromHash(pages.length));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNav = (i: number) => {
    window.location.hash = String(i);
    setPageIdx(i);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <nav style={{ display: 'flex', gap: 16, padding: 16, background: '#fff', borderBottom: '1px solid #eee' }}>
        {pages.map((p, i) => (
          <button key={p.name} onClick={() => handleNav(i)} style={{ fontWeight: pageIdx === i ? 'bold' : undefined }}>
            {p.name}
          </button>
        ))}
      </nav>
      <div style={{ padding: 16 }}>{pages[pageIdx].component}</div>
    </div>
  );
}
