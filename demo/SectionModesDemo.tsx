import React from 'react';
import { StickyContainer, StickyItem, type IStickyMode } from '../src';

export default function SectionModesDemo({ mode }: { mode: IStickyMode }) {
  return <div style={{ maxWidth: 720, margin: '0 auto', background: '#fff' }}>
    <StickyContainer defaultMode={mode}>
      {Array.from({ length: 8 }, (_, index) => <section key={index}>
        <StickyItem><h2 style={{ margin: 0, padding: '12px 20px', background: index % 2 ? '#dbeafe' : '#dcfce7', fontSize: 20 }}>
          {mode === 'stack' ? 'Stack' : 'Replace'} · Section {index + 1}
        </h2></StickyItem>
        <div style={{ minHeight: 200, padding: 20, boxSizing: 'border-box' }}>
          <p>{mode === 'stack' ? 'Reached headings remain visible. Their measured heights determine the next offset.' : 'The next section heading pushes the previous heading away.'}</p>
          <p>Scroll down to reach the next section.</p>
        </div>
      </section>)}
    </StickyContainer>
    <div style={{ height: 500, padding: 20 }}>The headers stop sticking when the group leaves the viewport.</div>
  </div>;
}
