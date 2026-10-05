import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StickyContainer, StickyItem } from '../../src/native';
function Fixture() {
  const [height, setHeight] = useState(80);
  const [offset, setOffset] = useState(20);
  const query = new URLSearchParams(location.search);
  const content = <StickyContainer data-testid="container" offsetTop={offset}>
    <StickyItem data-testid="item" style={query.has('override') ? { top: 40, zIndex: 0 } : undefined}>
      <div style={{ height }}><input aria-label="Preserved input" defaultValue="Keep me" />Native header</div>
    </StickyItem><div style={{ height: 1200 }} />
  </StickyContainer>;
  return <><div style={{ position: 'fixed', right: 0, zIndex: 1000 }}>
    <button onClick={() => setHeight(120)}>Grow</button><button onClick={() => setOffset(50)}>Offset</button>
  </div><div style={{ height: 200 }} />
    {query.has('scroll-root') ? <div data-testid="scroller" style={{ height: 300, overflow: 'auto' }}>{content}</div> : content}
    <div style={{ height: 1200 }} /></>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
