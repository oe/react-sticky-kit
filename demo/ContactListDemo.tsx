import React from 'react';
import { StickyContainer, StickyItem } from '../src';

// Generate mock contacts grouped by letter
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const contacts = letters.map(letter => ({
  letter,
  people: Array.from({ length: Math.floor(Math.random() * 8 + 3) }, (_, i) => `${letter} Name ${i + 1}`),
}));

export default function ContactListDemo() {
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', overflow: 'hidden' }}>
      <StickyContainer offsetTop={0} defaultMode="replace">
        <StickyItem mode='stack'>
          <h2 style={{ textAlign: 'center', margin: 0, padding: 16, background: '#f5f5f5' }}>Contacts</h2>
        </StickyItem>
        {contacts.map(group => (
          <div key={group.letter}>
            <StickyItem>
              <div style={{ background: '#f0f0f0', padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>{group.letter}</div>
            </StickyItem>
            {group.people.map(name => (
              <div key={name} style={{ padding: '8px 16px', borderBottom: '1px solid #f7f7f7' }}>{name}</div>
            ))}
          </div>
        ))}
      </StickyContainer>
    </div>
  );
}
