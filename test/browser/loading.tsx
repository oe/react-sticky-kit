import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../dist/style.css';
import { StickyContainer, StickyItem } from '#built-auto';

const query = new URLSearchParams(location.search);
const main = query.has('mixed') ? await import('#built-main') : undefined;
const Container = query.get('mixed') === 'container' ? main!.StickyContainer : StickyContainer;
const Item = query.get('mixed') === 'item' ? main!.StickyItem : StickyItem;
function Fixture() {
  const [visible, setVisible] = useState(true);
  const [height, setHeight] = useState(80);
  const [multiple, setMultiple] = useState(query.has('multiple'));
  const [stickyHeight, setStickyHeight] = useState(0);
  return <>
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
      <button onClick={() => setVisible(false)}>Unmount</button>
      <button onClick={() => setHeight(900)}>Grow</button>
      <button onClick={() => setMultiple(true)}>Add item</button>
      <span data-testid="height">{stickyHeight}</span>
    </div>
    <div style={{ height: 200 }} />
    {visible && <Container data-testid="container" defaultMode={query.has('none') ? 'none' : 'stack'} offsetTop={20} offsetBottom={30}
      overflowBehavior="scroll" onStickyItemsHeightChange={setStickyHeight}>
      <Item data-testid="a"><div style={{ height }}><input aria-label="Preserved input" defaultValue="initial" /></div></Item>
      <div style={{ height: 300 }} />
      {multiple && <Item data-testid="b"><div style={{ height: 50 }}>Second</div></Item>}
      <div style={{ height: 2000 }} />
    </Container>}
    <div style={{ height: 1500 }} />
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
