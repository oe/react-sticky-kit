import React, { useState } from 'react';
import { StickyContainer, StickyItem } from '../src';
export default function OverflowDemo() {
  const [tall, setTall] = useState(true);
  const [multiple, setMultiple] = useState(false);
  return <>
    <div style={{ padding: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <button onClick={() => setTall(!tall)}>{tall ? 'Use short content' : 'Use tall content'}</button>
      <button onClick={() => setMultiple(!multiple)}>{multiple ? 'Use one item' : 'Stack two items'}</button>
    </div>
    <StickyContainer defaultMode="stack" overflowBehavior="scroll" offsetTop={16} offsetBottom={16} positionStrategy="auto">
      <StickyItem><div style={{ padding: 24, background: '#f0f7f7' }}>
        <h2>Reading list</h2><p>Scroll down to reach the last entry. Then reverse direction: the group moves with the page before pinning at the top.</p>
        {Array.from({ length: tall ? 18 : 2 }, (_, index) => <div key={index} style={{ padding: '20px 0', borderBottom: '1px solid #d7e7e7' }}>Chapter {index + 1} · {['Getting started', 'Working with layouts', 'Coordinating headings'][index % 3]}</div>)}
      </div></StickyItem>
      <div style={{ height: 240, padding: 24 }}>Ordinary content between sticky items.</div>
      {multiple && <StickyItem><div style={{ minHeight: 320, padding: 24, background: '#edf1f8' }}><h2>Related chapters</h2><p>Active stack items scroll together, so their content stays reachable without overlapping.</p></div></StickyItem>}
      <div style={{ height: 1200, padding: 24 }}>Keep scrolling to reach the container boundary.</div>
    </StickyContainer>
    <div style={{ height: 600, padding: 24 }}>After the container. The group has returned to the document flow.</div>
  </>;
}
