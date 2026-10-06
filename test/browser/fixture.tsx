import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StickyContainer, StickyItem, type IStickyMode } from '../../src';

function Fixture() {
  const [height, setHeight] = useState(40);
  const [reversed, setReversed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const query = new URLSearchParams(location.search);
  const mode = (query.get('mode') ?? 'stack') as IStickyMode;
  const content = <StickyContainer data-testid="container" className="custom" defaultMode={enabled ? mode : 'none'}
    offsetTop={offset} constraint={query.has('unconstrained') ? 'none' : undefined}>
    {(reversed ? ['b', 'a'] : ['a', 'b']).map(key => <React.Fragment key={key}>
      <StickyItem data-testid={key}><div style={{ height: key === 'a' ? height : 50, background: '#eee' }}>{key}</div></StickyItem>
      <div style={{ height: 500 }}>Section {key}</div>
    </React.Fragment>)}
  </StickyContainer>;
  if (query.has('nested')) return <>
    <StickyContainer data-testid="outer">
      <StickyItem data-testid="outer-header"><div style={{ height: 30 }}>Outer</div></StickyItem>
      <div style={{ height: 200 }}>Before inner</div>
      <StickyContainer offsetTop={30}>
        <StickyItem data-testid="inner-header"><div style={{ height: 40 }}>Inner</div></StickyItem>
        <div style={{ height: 200 }}>Inner body</div>
      </StickyContainer>
      <div style={{ height: 1200 }}>Outer body</div>
    </StickyContainer>
    <div style={{ height: 1000 }}>After</div>
  </>;
  return <>
    <div style={{ position: 'fixed', right: 0, top: 0, zIndex: 10000 }}>
      <button onClick={() => setHeight(90)}>Resize</button>
      <button onClick={() => setReversed(value => !value)}>Reorder</button>
      <button onClick={() => setOffset(25)}>Offset</button>
      <button onClick={() => setEnabled(false)}>Disable</button>
    </div>
    <div style={{ height: 200 }}>Before</div>
    {query.has('element-scroll') ? <div data-testid="scroller" style={{ height: 400, overflow: 'auto' }}>{content}</div> : content}
    <div style={{ height: 2000 }}>After</div>
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
