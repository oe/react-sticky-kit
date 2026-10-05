# Oversized sticky content

The existing `StickyContainer` and `StickyItem` API now supports coordinated
content taller than the viewport. No separate Box component is required.
The defaults remain `overflowBehavior="pin"` and `positionStrategy="fixed"`.
These additions are opt-in and do not change existing header behavior.

```tsx
<StickyContainer
  defaultMode="stack"
  offsetTop={16}
  offsetBottom={16}
  overflowBehavior="scroll"
  positionStrategy="auto"
>
  <StickyItem><Sidebar /></StickyItem>
  <main>{content}</main>
</StickyContainer>
```

## Scrolling oversized groups

With `overflowBehavior="scroll"`, an oversized active group travels with the
page until its bottom reaches the reserved bottom offset. It then stays pinned.
On upward scrolling, it moves with the page until its top reaches `offsetTop`.
There is no nested scrollbar. The group still releases at its container boundary.

Multiple active stack items share one displacement: they do not independently
compete for viewport space. Items enter the group when they reach its current
stack edge. The full heights of active items are still reported through
`onStickyItemsHeightChange`; this is not an intersected visible-height callback.
Overflow is a container-level setting because the active items move as a group.
It is not an independent scrolling frame for an individual item.

`offsetBottom` reserves space only for the bottom edge of oversized content. It
is not a bottom-alignment option for short content. Short items remain top-aligned.

## Native positioning

`positionStrategy="auto"` uses native `position: sticky` only when all of these
conditions hold:

- The browser reports support for sticky positioning and provides ResizeObserver.
- There is one registered sticky item, directly inside the container.
- Its content and offsets fit inside the viewport; its wrapper is not stretched. Row-flex and grid stretching are rejected
  structurally, even if a fixed placeholder temporarily makes the wrapper fit.
- The item has no explicit inline height, position, top, bottom or z-index override.
- No ancestor establishes an overflow auto, scroll, hidden or overlay boundary.
- The container uses its default boundary constraint.

Other cases use the existing fixed positioning path. Native CSS controls width
and boundary positioning. When there is no height callback, native items stop
subscribing to scroll-driven library updates. Resize observations, React commits,
and observed layout changes can still schedule a recheck and switch strategies.
Native items carry `is-native-sticky` on their wrapper, rather than `is-sticky` on
fixed content. Applications using those classes should account for the opt-in path.

This remains a viewport-scrolling API. Internal scroll-container coordinates,
short-item bottom alignment and multi-item native coordination are not added by
this change. `CSS.supports` plus layout checks do not guarantee avoidance of every
browser sticky bug; keep the default fixed strategy when native rendering fails
in an application-specific layout.

## Measured cost and limits

A production React fixture in Chromium at 1280×720 compared npm
`react-sticky-kit@0.3.1`, this implementation, and `react-sticky-box@2.0.5`.
There were 1, 20 or 100 independent 1200px sections, each with one 80px sticky item
and a 20px top offset. After mounting and a warm-up scroll to 300px, the fixture
scrolled 30 times in 2px steps, waiting two native RAFs after each step. Instrumentation
counted `getBoundingClientRect`, library RAF requests and ResizeObserver instances.
React was bundled in production mode; measurement RAFs bypassed instrumentation.

| Instances | 0.3.1 fixed reads / RAFs | New fixed reads / RAFs | New auto reads / RAFs | Sticky Box reads / RAFs |
| --- | ---: | ---: | ---: | ---: |
| 1 | 90 / 30 | 90 / 30 | 0 / 0 | 0 / 0 |
| 20 | 660 / 30 | 660 / 30 | 0 / 0 | 0 / 0 |
| 100 | 3060 / 30 | 3060 / 30 | 0 / 0 | 0 / 0 |

The kit uses one shared ResizeObserver in each fixture; Sticky Box uses 2, 40 and
200, respectively. The kit also has shared mutation observation; this table does
not equate observer counts to CPU time or memory. Zero geometry reads does not
mean zero browser layout or paint work. These short-item results do not establish
that our long-content implementation is faster than Sticky Box.

The project build's ESM gzip grows from 3.48 KB to approximately 4.53 KB, and CSS
from 0.09 KB to 0.14 KB. The feature adds no dependency. It does not achieve a
smaller bundle than Sticky Box; size remains a tradeoff for the expanded API.

### Follow-up audit

The same production fixture also compared the initial PR implementation with the
reviewed implementation using 900px items. Native fit rejection is now cached
until a resize, observed layout change or React commit invalidates it, rather
than measuring unsuitable items again on each scroll.

| Instances | Initial auto fallback reads / RAFs | Reviewed auto fallback reads / RAFs |
| --- | ---: | ---: |
| 1 | 150 / 30 | 90 / 30 |
| 20 | 1860 / 30 | 660 / 30 |
| 100 | 9060 / 30 | 3060 / 30 |

Short native items retain 0 reads / 0 RAF requests. In a row-flex stretching
fixture, a 200ms idle observation previously recorded 54 rectangle reads and
12 RAF requests as native/fixed modes alternated; the reviewed implementation
records 0 / 0. Regression tests cover stable fallback and a switch to native
when stretching is removed. These counts measure library work, not elapsed CPU
time or browser rendering cost.

The audit also removes the unreleased item-level overflow option: overflow
coordination has one container-level entry point. It reuses the first item's
measurement during initial activation and avoids repeated z-index normalization
and unnecessary allocations. The stretching fix increases ESM gzip from the
initial PR's 4.43 KB to 4.53 KB despite these simplifications. Further size work
should preserve tested layout behavior rather than add more generic machinery.
