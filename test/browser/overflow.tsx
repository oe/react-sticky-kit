import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
const { StickyContainer, StickyItem } = await (new URLSearchParams(location.search).has('entry-auto') ? import('../../src/auto') : import('../../src'));
function Fixture() {
  const query = new URLSearchParams(location.search);
  const [height, setHeight] = useState(query.has('short') ? 80 : 900);
  const [multiple, setMultiple] = useState(query.has('multiple'));
  const [inlineTop, setInlineTop] = useState<number>();
  const [stickyHeight, setStickyHeight] = useState(0);
  const [automatic, setAutomatic] = useState(query.has('auto'));
  const [enabled, setEnabled] = useState(true);
  return <>
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 10000 }}>
      <span data-testid="sticky-height">{stickyHeight}</span><button onClick={() => setInlineTop(100)}>Inline override</button><button onClick={() => setAutomatic(false)}>Fixed strategy</button><button onClick={() => setHeight(100)}>Shrink</button><button onClick={() => setHeight(900)}>Grow</button>
      <button onClick={() => setMultiple(!multiple)}>Toggle items</button><button onClick={() => setEnabled(false)}>Disable</button>
    </div>
    <div style={{ height: 200 }} />
    <StickyContainer data-testid="container" defaultMode={enabled ? (query.has('replace') ? 'replace' : 'stack') : 'none'}
      onStickyItemsHeightChange={query.has('callback') ? setStickyHeight : undefined}
      offsetTop={20} offsetBottom={30} positionStrategy={automatic ? 'auto' : 'fixed'}
      style={query.has('stretch') ? { display: 'flex', height: 1800 } : undefined}
      overflowBehavior={query.has('pin') ? 'pin' : 'scroll'} baseZIndex={400}>
      <StickyItem data-testid="a" style={inlineTop !== undefined ? { top: inlineTop } : query.has('inline') ? { top: 0, zIndex: 0 } : undefined}><div style={{ height, background: '#daeaea' }}>First content</div></StickyItem>
      <div style={{ height: 300 }} />
      {multiple && <StickyItem data-testid="b"><div style={{ height: 400, background: '#eaeada' }}>Second content</div></StickyItem>}
      <div style={{ height: 1800 }} />
    </StickyContainer><div style={{ height: 1500 }} />
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
