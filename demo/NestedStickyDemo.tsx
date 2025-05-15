import { useState } from 'react';
import { StickyContainer, StickyItem } from '../src';

const OUTER_OFFSET = 48;

export default function NestedStickyDemo() {
  const [outerStickyHeight, setOuterStickyHeight] = useState(0);
  console.log('outerStickyHeight', outerStickyHeight);
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', overflow: 'hidden', minHeight: 900 }}>
      <h2 style={{ textAlign: 'center', margin: 0, padding: 16, background: '#f5f5f5' }}>Nested Sticky Containers</h2>
      <StickyContainer offsetTop={OUTER_OFFSET} defaultMode="stack" onStickyItemsHeightChange={setOuterStickyHeight}>
        <StickyItem>
          <div style={{ background: '#e0eaff', padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #dde' }}>
            Outer Header 1
          </div>
        </StickyItem>
        <div style={{ padding: 16 }}>
          <StickyContainer offsetTop={outerStickyHeight + OUTER_OFFSET} defaultMode="stack">
            <StickyItem>
              <div style={{ background: '#ffe0e0', padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #dde' }}>
                Inner Header A
              </div>
            </StickyItem>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid #f7f7f7' }}>Inner Content {i + 1}</div>
            ))}
            <StickyItem>
              <div style={{ background: '#e0ffe0', padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #dde' }}>
                Inner Header B
              </div>
            </StickyItem>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid #f7f7f7' }}>More Inner Content {i + 1}</div>
            ))}
          </StickyContainer>
        </div>
        <StickyItem>
          <div style={{ background: '#e0eaff', padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #dde' }}>
            Outer Header 2
          </div>
        </StickyItem>
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid #f7f7f7' }}>Outer Content {i + 1}</div>
        ))}
      </StickyContainer>
    </div>
  );
}
