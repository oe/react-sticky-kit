import { useState, useEffect } from 'react';
import ContactListDemo from './ContactListDemo';
import MixedModeDemo from './MixedModeDemo';
import NestedStickyDemo from './NestedStickyDemo';
import DynamicStickyDemo from './DynamicStickyDemo';
import DynamicOffsetDemo from './DynamicOffsetDemo';
import ConstraintDemo from './ConstraintDemo';

const pages = [
  { hash: 'ios-contact', name: 'iPhone Contacts Demo', component: <ContactListDemo /> },
  { hash: 'mixed-mode', name: 'Mixed Sticky Modes Demo', component: <MixedModeDemo /> },
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
    window.location.hash = n
    setPageHash(n);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      <nav style={{ display: 'flex', gap: 16, padding: 16, background: '#fff', borderBottom: '1px solid #eee' }}>
        {pages.map((p) => (
          <button key={p.hash} onClick={() => handleNav(p.hash)} style={{ fontWeight: pageHash === p.hash ? 'bold' : undefined }}>
            {p.name}
          </button>
        ))}
      </nav>
      <div style={{ padding: 16 }}>{pages.find(p => p.hash === pageHash)?.component}</div>
    </div>
  );
}
