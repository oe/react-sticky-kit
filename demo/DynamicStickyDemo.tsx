import React, { useState } from 'react';
import { StickyContainer, StickyItem } from '../src';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function DynamicStickyDemo() {
  const [items, setItems] = useState([
    { id: 1, label: 'Sticky Header 1', pos: 2 },
    { id: 2, label: 'Sticky Header 2', pos: 7 },
    { id: 3, label: 'Sticky Header 3', pos: 15 },
  ]);
  const [nextId, setNextId] = useState(4);
  const contentCount = 30;

  const addItem = () => {
    const pos = getRandomInt(0, contentCount - 1);
    setItems([...items, { id: nextId, label: `Sticky Header ${nextId}`, pos }]);
    setNextId(nextId + 1);
  };
  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const content: React.ReactNode[] = [];
  for (let i = 0; i < contentCount; i++) {
    const stickies = items.filter(item => item.pos === i);
    stickies.forEach(item => {
      content.push(
        <StickyItem key={item.id}>
          <div style={{ background: '#e0eaff', padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #dde', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {item.label}
            <button onClick={() => removeItem(item.id)} style={{ marginLeft: 8, fontSize: 12 }}>Remove</button>
          </div>
        </StickyItem>
      );
    });
    content.push(
      <div key={`content-${i}`} style={{ padding: '8px 16px', borderBottom: '1px solid #f7f7f7' }}>Content {i + 1}</div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', overflow: 'hidden', minHeight: 900, position: 'relative' }}>
      <h2 style={{ textAlign: 'center', margin: 0, padding: 16, background: '#f5f5f5' }}>Dynamic Sticky Items</h2>
      <StickyContainer offsetTop={0} defaultMode="stack">
        {content}
      </StickyContainer>
      <button
        onClick={addItem}
        style={{
          position: 'fixed',
          left: 24,
          bottom: 24,
          zIndex: 9999,
          padding: '10px 18px',
          background: '#1677ff',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 16,
          boxShadow: '0 2px 8px #0002',
          cursor: 'pointer',
        }}
      >
        Add Sticky Item
      </button>
    </div>
  );
}
