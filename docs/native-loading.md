# Native-first loading with the complete API

Both `react-sticky-kit` and `react-sticky-kit/auto` export the same components,
props and public types. Stack, replace, mixed modes, tall-content scrolling,
offsets, boundaries, nested groups and height notifications remain available.
No feature-limited native entry is provided.

| Entry | Default strategy | Fixed backend |
| --- | --- | --- |
| `react-sticky-kit` | `fixed` | Synchronously included |
| `react-sticky-kit/auto` | `auto` | Dynamically imported when needed |

Import the same stylesheet with either entry:

```tsx
import { StickyContainer, StickyItem } from 'react-sticky-kit/auto';
import 'react-sticky-kit/style';
```

The components and Context are shared across the ESM entries, and separately
across the CJS entries. Mixing a main-entry item with an auto-entry container, or
vice versa, works. Using the main-entry container also includes the fixed backend;
prefer the auto entry throughout a browser bundle if reducing its initial
loading is the goal. Do not mix direct ESM artifact imports with `require()` in
one React tree; those are separate module formats.

## What decides whether code is downloaded?

The library checks browser capabilities and layout at runtime. The bundler
preserves the dynamic import as a separate chunk. Vite and webpack normally
support this; a build that inlines dynamic imports cannot reduce the initial
network download. Merely specifying `positionStrategy="auto"` through the main
entry changes positioning, but does not remove the synchronous backend.

Direct browser ESM imports require native dynamic-import syntax support in
addition to the main entry's runtime requirements. A bundler can generate a
chunk loader compatible with its configured browser targets. Detecting CSS
sticky cannot polyfill unsupported JavaScript syntax. Keep the main entry for
targets unable to execute the emitted loader; missing-sticky tests on modern
engines do not certify historical browser versions.

The native path currently requires CSS sticky and ResizeObserver, one short
direct child and eligible ancestor/layout styles. Native items without height
callbacks do not need library geometry reads on scroll. Native items with height
callbacks keep the shared scroll scheduling needed for those notifications.

Fixed is a compatibility backend for browsers without sticky **and** for
layouts needing additional coordination in modern browsers. Multiple items,
oversized groups, unconstrained pinning and ineligible ancestors still load it.
This change does not claim that every modern-browser use case avoids fixed code,
or that the complete API now fits in a pure CSS wrapper.

## Loading, state and failure behavior

An ineligible mounted container requests the backend before sticky activation,
including below the viewport. Containers share one request. Disabled/empty groups
and eligible native groups do not request it. The component tree and content DOM
stay mounted; switching backends retains input state. An existing native position
is retained until the backend is ready. Unmounted containers are removed from the
waiting set.

A fixed layout on the initial frame can wait for a cold network request. Content
stays in flow until the backend arrives. Dynamic changes during a delayed request
may similarly postpone full fixed coordination. The library cannot guarantee
immediate fixed positioning or zero layout movement while unavailable code is
being downloaded. Use the main entry when synchronous behavior matters more than
initial size.

A failed chunk reports one asynchronous error, keeps content readable and avoids
repeated requests/errors on every scroll. A page reload is needed to recover the
backend after that failure. The main synchronous entry avoids this extra network
failure path. No new runtime polyfills are installed: ES2018, React 17+ and the
existing DOM API requirements still apply.

## Measure the tradeoff

Run `pnpm build`, then `pnpm measure:bundle`. To compare a saved 0.4.0 artifact:

```sh
pnpm measure:bundle /path/to/0.4.0/react-sticky.es.js
```

The script uses locked esbuild 0.28.2, retains both component exports, minifies
ES2018 ESM with splitting enabled and leaves React/ReactDOM external. It measures
gzip bytes; the shared stylesheet is excluded. Chunk sums are not the same as
compressing all code together, and application results depend on bundling.

Measured with the harness above:

| Build | Initial JS gzip | Deferred fixed JS gzip |
| --- | ---: | ---: |
| Published 0.4.0 main entry | 4,099 bytes | — |
| Proposed synchronous main entry | 4,606 bytes | — |
| Proposed native-first auto entry | 3,370 bytes | 1,672 bytes |
| react-sticky-box 2.0.5 (both React peers external) | 1,672 bytes | — |

The auto entry saves 729 bytes (17.8%) on the initial download compared with
0.4.0 when fixed is not needed. Its two chunks sum to 5,042 gzip bytes when
fixed is needed. The main entry increases by 507 bytes (12.4%). These numbers
are for the complete exports, not a JSX/CSS-only feature subset.

The native-first entry reduces initial loading, but the synchronous main entry
and the total download with a fallback are larger than 0.4.0. This is a loading
tradeoff, not an across-the-board size improvement. The full-feature entry also
remains larger than react-sticky-box 2.0.5 in the same harness; removing public
features to advertise a smaller number would not be an equivalent comparison.

## Validation

The browser behavior suite runs against both entries in Chromium, Firefox and
WebKit. Production-chunk tests cover native requests, delayed/failed fallbacks,
state retention, mixed-entry Context, missing sticky/ResizeObserver, disabled
groups and unmount during loading. Package checks cover SSR, CJS/ESM, UMD and
React 17/18/19 consumers with TypeScript 5 declarations.
