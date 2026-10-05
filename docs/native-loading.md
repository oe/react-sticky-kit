# Choosing what to load

Browser support and application features are different decisions. A browser may
support CSS sticky while your layout still needs automatic stack/replace offsets
or oversized group scrolling. Those features require coordination code.

## Small native entry for CSS layouts

```tsx
import type React from 'react';
import { StickyContainer, StickyItem } from 'react-sticky-kit/native';

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <StickyContainer offsetTop={16}>
      <StickyItem>{children}</StickyItem>
      <main style={{ minHeight: 1200 }}>Page content</main>
    </StickyContainer>
  );
}
```

This keeps the Container/Item names and markup, with native CSS positioning from
the first render, including SSR markup. It imports only React and does not load
the full entry, fixed positioning, observers, a scheduler or geometry measurement.
No stylesheet is required for the native positioning itself; importing the
existing stylesheet for shared styling is also allowed.

Choose this entry only for layouts where you intentionally want CSS sticky:

- Container supports `children`, `offsetTop`, `baseZIndex` and ordinary div props.
- Item supports `children` and ordinary div props. Explicit inline styles can
  override the generated position, top or z-index.
- Offsets follow the nearest scrolling ancestor, with native CSS boundaries.
- There is no automatic stack/replace coordination, height callback, oversized
  group scrolling or `constraint="none"`. Tall content behaves exactly like
  native sticky; this entry does not solve an oversized sidebar's hidden bottom.
- It does not run layout eligibility checks. Flex/grid stretching, overflow
  ancestors and sizing behave according to native CSS; design those layouts
  accordingly (for example, use `align-self: start` to avoid flex/grid stretching).
- It does not detect missing sticky support or load a fixed fallback. If CSS
  sticky is unsupported, the browser leaves the item in normal document flow.
- Both components must come from the same entry. Do not mix full and native pairs.

A single plain CSS sticky element remains a valid alternative without a library.
This entry is useful when retaining the kit's Container/Item structure while
choosing a smaller implementation for a simple layout.

## Full entry for coordinated layouts and fallback

```tsx
import { StickyContainer, StickyItem } from 'react-sticky-kit';
import 'react-sticky-kit/style';
```

The full entry is unchanged. It defaults to fixed and supports mixed modes,
dynamic-height coordination, callbacks, constraints and oversized groups.
`positionStrategy="auto"` reduces scroll-driven library work in eligible layouts,
but does not reduce the downloaded full-entry JavaScript. It still provides
synchronous fixed fallback when native support or layout eligibility is missing.

## Does this require bundler configuration?

No special tree-shaking or code-splitting setting is required. The native entry is
a separate, self-contained ESM/CJS module. Vite, webpack and other tools that honor
package exports resolve `/native` normally. Its source has no dependency on the
full implementation, so the saving does not depend on a compiler interpreting
JSX prop values. Native ESM can also be served directly with the usual React
module/import-map setup.

Static imports do not switch based on `CSS.supports` at runtime. If an application
must handle uncertain support with transparent fallback, use the full entry.
Application-level conditional imports are possible, but add an asynchronous
boundary and require separate SSR/hydration and loading-state design. They are
not the default behavior of this package. Importing the full entry elsewhere in
the same initial application bundle also loads that code; using `/native` in one
component cannot remove another component's full-entry dependency.

## Measurements and the rejected runtime split

The same esbuild 0.28.2 harness bundled exported components as ESM, with minification,
ES2018 target, React/ReactDOM external and gzip compression. These are library
contributions, not complete application bundles or feature-equivalent comparisons.

| Implementation | Initial gzip | Additional fallback gzip |
| --- | ---: | ---: |
| Published full entry 0.4.0 | 4,099 bytes | None |
| Reviewed full entry | 4,099 bytes | None |
| Native-only entry | 438 bytes | No fallback exists |
| react-sticky-box 2.0.5 | 1,672 bytes | None in this harness |
| Experimental asynchronous auto entry, not shipped | 3,360 bytes | 1,658 bytes |

The experiment also grew the full entry to 4,674 bytes and introduced a delay
before fixed positioning could begin. It was rejected. Only the separate native
entry is added; the default entry's JS/CSS remain byte-for-byte unchanged.

The native-only entry is smaller because it deliberately excludes functionality.
It is not a substitute for Sticky Box's oversized content behavior, or a claim of
being a better full-featured sidebar library. The project's native ESM artifact
is approximately 0.54 KB gzip; the full artifact remains 4.56 KB gzip. React and
optional application styling are excluded from all of these figures.
