import React from 'react';
import CodeBlock from './CodeBlock';
import { StickyContainer, StickyItem, type IStickyMode } from '../src';

const sections = [
  { title: 'Getting started', rows: [ ['Install the package', 'Add React Sticky Kit to your project using your preferred package manager.', 'pnpm add react-sticky-kit'], ['Add your first container', 'Wrap the headings you want to coordinate in a StickyContainer.', "import { StickyContainer, StickyItem } from 'react-sticky-kit';"] ] },
  { title: 'Build your layout', rows: [ ['Choose a mode', 'Replace keeps the current section visible. Stack keeps previously reached headings together.', '<StickyContainer defaultMode="replace">'], ['Keep content in the page flow', 'Use regular page scrolling so headings track the browser viewport.', '<StickyItem><h2>Section heading</h2></StickyItem>'] ] },
  { title: 'Make it your own', rows: [ ['Let heights adapt', 'Headings can wrap or change height. The kit measures them and coordinates their offsets.', '<StickyItem mode="stack">'], ['Set a viewport offset', 'Leave space above your headings when your application has a fixed header.', '<StickyContainer offsetTop={64}>'] ] },
  { title: 'Explore more patterns', rows: [ ['Combine behaviors', 'Keep a page title stacked while section headings replace below it.', '<StickyItem mode="replace">'], ['Respect container boundaries', 'By default, headings stop sticking when their container leaves the viewport.', '<StickyContainer defaultMode="stack">'] ] },
];
export default function SectionModesDemo({ mode }: { mode: IStickyMode }) {
  return <>
    <StickyContainer defaultMode={mode}>
      {sections.map((section, index) => <section key={section.title}>
        <StickyItem><h2 className="section-heading"><span className="section-number">0{index + 1}</span>{section.title}<span className="mode-label">{mode}</span></h2></StickyItem>
        <div className="section-body">{section.rows.map(([title, description, code]) => <div className="section-row" key={title}><h3>{title}</h3><p>{description}</p><CodeBlock code={code} language={code.startsWith('pnpm') ? 'shell' : 'tsx'} compact /></div>)}</div>
      </section>)}
    </StickyContainer>
    <div className="section-outro">You have reached the container boundary. Keep scrolling to see the headings return to the document flow.</div>
  </>;
}
