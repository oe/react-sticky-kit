# Patterns and migration

## Start with native CSS

When your target browsers support CSS sticky, a grouped contact list often only
needs native positioning:

```tsx
type ContactGroup = { letter: string; people: { id: string; name: string }[] };

function ContactGroups({ groups }: { groups: ContactGroup[] }) {
  return groups.map(group => (
    <section key={group.letter}>
      <h2 style={{ position: 'sticky', top: 0, background: '#fff' }}>{group.letter}</h2>
      {group.people.map(person => <p key={person.id}>{person.name}</p>)}
    </section>
  ));
}
```

The section boundary pushes its heading away as the next section arrives. This
avoids a JavaScript dependency and follows the nearest scrolling ancestor. Use
React Sticky Kit when coordinating multiple headers would otherwise require
application-owned measurements and offsets, or when you need viewport positioning
without relying on CSS sticky support. The kit defaults to fixed positioning; see
[browser requirements and fallbacks](browser-compatibility.md).

## Keep a title above changing section headings

```tsx
import { StickyContainer, StickyItem } from 'react-sticky-kit';
import 'react-sticky-kit/style';

type ContactGroup = { letter: string; people: { id: string; name: string }[] };

export function Sections({ groups }: { groups: ContactGroup[] }) {
  return (
    <StickyContainer defaultMode="replace" offsetTop={48} baseZIndex={1000}>
      <StickyItem mode="stack"><h1 style={{ margin: 0, padding: 12, background: '#fff' }}>Contacts</h1></StickyItem>
      {groups.map(group => (
        <section key={group.letter}>
          <StickyItem><h2 style={{ margin: 0, padding: 12, background: '#fff' }}>{group.letter}</h2></StickyItem>
          {group.people.map(person => <p key={person.id}>{person.name}</p>)}
        </section>
      ))}
    </StickyContainer>
  );
}
```

The title's measured height determines the section heading's offset; its height
can change without manually updating each heading. Choose `baseZIndex` above the
number of registered headers, and coordinate it with your application's layers.

## Stack dynamic-height headings

Use `defaultMode="stack"` when previously reached headings should remain visible.
Their actual heights determine subsequent offsets. Changing an item to `mode="none"`
keeps its content in ordinary flow. With ResizeObserver available, changing
content heights schedules an update; no polling loop is required.

`onStickyItemsHeightChange` reports the final changed total once per frame, after
layout writes. Use it to coordinate other UI, and keep expensive work outside
that callback. Adding the reported height to the same container's `offsetTop`
creates a feedback loop and should be avoided.

## Moving from another sticky library

This is an API migration, not an import-only replacement.

| Existing approach | What to check |
| --- | --- |
| `react-sticky` render-prop styles | Replace the render prop with `StickyItem`; arbitrary render-prop state and style customization have no direct equivalent. |
| `react-stickynode` top/bottom selectors | Use a numeric `offsetTop`; selector-based offsets, arbitrary bottom boundaries and tall-sidebar behavior have no direct equivalent. |
| `react-sticky-el` scroll-element positioning | Offsets here remain viewport-relative. Use native CSS or another library if you need positioning relative to the scrolling panel. |
| `react-sticky-box` tall sidebars | Keep a sidebar-focused solution; grouped header coordination is a different interaction. |

Retest boundaries, nested scrolling, overflow clipping and transformed ancestors.
Import `react-sticky-kit/style` once. For Next.js Pages Router, put the global CSS
import in `pages/_app.tsx`; for App Router, follow the README example. Astro should
hydrate the entire sticky group as one React island.

## Upgrading from React Sticky Kit 0.2.x

Version 0.3.0 changes height notifications to the final changed total once per
frame, including zero when sticking ends. Notifications run after all scheduled
layouts are written and are skipped after unmount. Remove code that depends on
transient per-item notifications. Public component props and stylesheet paths
remain available; CommonJS and NodeNext declarations are corrected.
