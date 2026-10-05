import React from 'react';
import ContactListDemo from './ContactListDemo';
import MixedModeDemo from './MixedModeDemo';
import NestedStickyDemo from './NestedStickyDemo';
import DynamicStickyDemo from './DynamicStickyDemo';
import DynamicOffsetDemo from './DynamicOffsetDemo';
import ConstraintDemo from './ConstraintDemo';
import SectionModesDemo from './SectionModesDemo';

export const examples = [
  { hash: 'replace', name: 'Replace sections', description: 'Keep the current section in view. As you scroll, the next heading replaces the previous one.', hint: 'Scroll past a section heading to pin it. The next heading takes its place.', component: <SectionModesDemo mode="replace" /> },
  { hash: 'stack', name: 'Stack sections', description: 'Keep reached headings together. Each new heading sits below the measured height of the ones above it.', hint: 'Scroll through several sections to see their headings accumulate.', component: <SectionModesDemo mode="stack" /> },
  { hash: 'ios-contact', name: 'Contact list', description: 'Keep a list title in place while alphabetical section headings replace beneath it.', hint: 'The Contacts title uses stack mode; the letter headings use replace mode.', component: <ContactListDemo /> },
  { hash: 'mixed-mode', name: 'Mixed modes', description: 'Combine stack, replace and ordinary flowing content in a single container.', hint: 'Change the offset or the dynamic section mode, then scroll to see the result.', component: <MixedModeDemo /> },
  { hash: 'nested', name: 'Nested containers', description: 'Coordinate an inner section list with the measured height of its outer sticky headings.', hint: 'Inner headings replace below the outer title and active outer heading.', component: <NestedStickyDemo /> },
  { hash: 'dynamic', name: 'Dynamic items', description: 'Add or remove sticky headings without manually rebuilding their offsets.', hint: 'Add a heading or remove an existing one. The remaining headings adjust automatically.', component: <DynamicStickyDemo /> },
  { hash: 'dynamic-offset', name: 'Dynamic offset', description: 'Keep sticky content aligned below a header whose height changes.', hint: 'Increase or decrease the header height, or enable automatic measurement.', component: <DynamicOffsetDemo /> },
  { hash: 'constraint', name: 'Container boundaries', description: 'Compare headings that stop at their container boundary with headings that remain pinned.', hint: 'Scroll beyond each group to compare the default constraint with constraint="none".', component: <ConstraintDemo /> },
];

export function exampleCode(hash: string) {
  if (hash === 'replace' || hash === 'stack') return `import type React from 'react';\nimport { StickyContainer, StickyItem } from 'react-sticky-kit';\nimport 'react-sticky-kit/style';\n\ntype Section = { id: string; title: string; content: React.ReactNode };\n\nexport function SectionList({ sections }: { sections: Section[] }) {\n  return (\n    <StickyContainer defaultMode="${hash}">\n      {sections.map(section => (\n        <section key={section.id}>\n          <StickyItem>\n            <h2 style={{ margin: 0, padding: 16, background: '#fff' }}>\n              {section.title}\n            </h2>\n          </StickyItem>\n          <div>{section.content}</div>\n        </section>\n      ))}\n    </StickyContainer>\n  );\n}`;
  return null;
}
export const sourceFiles: Record<string, string> = {
  replace: 'SectionModesDemo.tsx', stack: 'SectionModesDemo.tsx', 'ios-contact': 'ContactListDemo.tsx',
  'mixed-mode': 'MixedModeDemo.tsx', nested: 'NestedStickyDemo.tsx', dynamic: 'DynamicStickyDemo.tsx',
  'dynamic-offset': 'DynamicOffsetDemo.tsx', constraint: 'ConstraintDemo.tsx',
};
