import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StickyContainer, StickyItem } from '../../src';

const query = new URLSearchParams(location.search);
const kind = query.get('case');
document.documentElement.style.overflowAnchor = 'none';

function Fixture() {
  if (kind === 'box') return <>
    <div style={{ height: 200 }} />
    <StickyContainer defaultMode="stack">
      <BoxHeader />
      <div data-testid="body" style={{ height: 1000 }} />
    </StickyContainer>
    <div style={{ height: 1000 }} />
  </>;
  if (kind === 'horizontal') return <>
    <div style={{ height: 200 }} />
    <div data-testid="scroller" style={{ overflow: 'auto', width: 400, height: 400 }}>
      <div style={{ width: 1000 }}>
        <StickyContainer defaultMode="stack">
          <StickyItem data-testid="item"><div style={{ height: 40 }}>Header</div></StickyItem>
          <div style={{ height: 1000 }} />
        </StickyContainer>
      </div>
    </div>
    <div style={{ height: 1000 }} />
  </>;
  const content = <>
    <div data-testid="preceding" style={{ height: 200 }} />
    <StickyContainer data-testid="container" defaultMode={query.has('replace') ? 'replace' : 'stack'}>
      {Array.from({ length: Number(query.get('count') ?? 1) }, (_, index) => <React.Fragment key={index}>
        <StickyItem data-testid={index === 0 ? 'item' : undefined}><div style={{ height: 40 }}>Header {index}</div></StickyItem>
        {query.has('spaced') && <div style={{ height: 200 }} />}
      </React.Fragment>)}
      <div style={{ height: 4000 }} />
    </StickyContainer>
  </>;
  return <>
    {query.has('fixed-parent') ? <div data-testid="flow" style={{ height: 6000 }}>{content}</div> : content}
    <div style={{ height: 1000 }} />
  </>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);

function BoxHeader() {
  const [shifted, setShifted] = useState(false);
  return <>
    <button style={{ position: 'fixed', right: 0, top: 0, zIndex: 10000 }} onClick={() => setShifted(true)}>Shift padding</button>
    <StickyItem data-testid="item" style={{ paddingTop: 10, paddingBottom: 10,
      paddingLeft: shifted ? 40 : 20, paddingRight: shifted ? 0 : 20, border: '5px solid black',
      boxSizing: query.has('content-box') ? 'content-box' : 'border-box', width: 400,
      ...(query.has('height') ? { height: query.get('height') === 'auto' ? 'auto' : 80 } : {}) }}>
      <div style={{ height: 40, background: '#eee' }}>Header</div>
    </StickyItem>
  </>;
}
