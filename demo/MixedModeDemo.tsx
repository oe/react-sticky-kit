import React, { useState } from 'react';
import { StickyContainer, StickyItem, type IStickyMode } from '../src';

const sections = [
  {
    title: 'FAQ',
    mode: 'stack',
    items: Array.from({ length: 12 }, (_, i) => `What is React? (Q${i + 1})`),
  },
  {
    title: 'Announcements',
    mode: 'replace',
    items: Array.from({ length: 8 }, (_, i) => `Announcement ${i + 1}`),
  },
  {
    title: 'Other',
    mode: 'none',
    items: Array.from({ length: 10 }, (_, i) => `Other content ${i + 1}`),
  },
  {
    title: 'Tall Section',
    mode: 'stack',
    items: [
      'This section header is tall',
      ...Array.from({ length: 15 }, (_, i) => `Tall content ${i + 1}`),
    ],
    headerStyle: { height: 80, background: '#ffe0e0', fontSize: 20, display: 'flex', alignItems: 'center', paddingLeft: 16 },
  },
  {
    title: 'Empty Section',
    mode: 'replace',
    items: [],
  },
  {
    title: 'Dynamic Mode',
    mode: 'stack', // will be toggled
    items: Array.from({ length: 6 }, (_, i) => `Dynamic item ${i + 1}`),
    dynamic: true,
  },
  {
    title: 'Zero Height Header',
    mode: 'replace',
    items: Array.from({ length: 5 }, (_, i) => `Zero header item ${i + 1}`),
    headerStyle: { height: 0, padding: 0, background: '#eee' },
  },
  {
    title: 'Long Header',
    mode: 'stack',
    items: Array.from({ length: 7 }, (_, i) => `Long header item ${i + 1}`),
    headerStyle: { whiteSpace: 'normal', background: '#e0ffe0', fontSize: 16, padding: 16 },
    headerContent: 'This is a very very very very very very long header to test overflow and sticky behavior.',
  },
];

export default function MixedModeDemo() {
  const [offsetTop, setOffsetTop] = useState(0);
  const [dynamicMode, setDynamicMode] = useState<IStickyMode>('stack');
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', minHeight: 900 }}>
      <h2 style={{ textAlign: 'center', zIndex: 999, position: 'sticky', top: 0, height: 60,  margin: 0, padding: 16, background: '#f5f5f5' }}>Mixed Sticky Modes</h2>
      <div style={{ padding: 8, background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
        <label>Sticky OffsetTop: <input type="number" value={offsetTop} onChange={e => setOffsetTop(Number(e.target.value))} style={{ width: 60 }} /> px</label>
        <span style={{ marginLeft: 24 }}>
          Dynamic Mode: 
          <select value={dynamicMode} onChange={e => setDynamicMode(e.target.value as IStickyMode)}>
            <option value="stack">stack</option>
            <option value="replace">replace</option>
            <option value="none">none</option>
          </select>
        </span>
      </div>
      <StickyContainer offsetTop={offsetTop || 92} defaultMode="stack">
        {sections.map(section => (
          <div key={section.title}>
            <StickyItem mode={section.dynamic ? dynamicMode : (section.mode as IStickyMode)}>
              <div
                style={{
                  // @ts-expect-error ignore headerStyle type error
                  background: '#e0eaff',
                  padding: '8px 16px',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #dde',
                  ...(section.headerStyle || {}),
                }}
              >
                {section.headerContent || (
                  <>
                    {section.title} <span style={{ fontSize: 12, color: '#888' }}>({section.dynamic ? dynamicMode : section.mode})</span>
                  </>
                )}
              </div>
            </StickyItem>
            {section.items.length === 0 ? (
              <div style={{ padding: '8px 16px', color: '#aaa', fontStyle: 'italic' }}>(No content)</div>
            ) : (
              section.items.map((item, idx) => (
                <div key={item + idx} style={{ padding: '8px 16px', borderBottom: '1px solid #f7f7f7' }}>{item}</div>
              ))
            )}
          </div>
        ))}
      </StickyContainer>
      <div style={{ padding: 16, background: '#f0f0f0', height: 1000, borderTop: '1px solid #eee', textAlign: 'center' }}>
        <p>Note: The &rdquo;Dynamic Mode&rdquo; section allows you to change the sticky mode dynamically.</p>
        <p>Try scrolling and resizing the window to see how the sticky behavior changes.</p>
        <p>All sections are scrollable, and the sticky items will adjust their positions accordingly.</p>
      </div>
    </div>
  );
}
