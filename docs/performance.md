# Performance audit

This audit covers PR #1. The scaling comparison uses commit
`4652701286a1840e76f5e2dd1fa66bb6bb584923` as its baseline. Timings are local
observations, not browser or device performance guarantees.

## Method

The final comparison uses a Vite production build, including production React,
in Chromium at a 1,280 × 720 viewport. Four fixtures exercise 1,000 simultaneous
stacked headers, 1,000 spaced replacement headers, 100 sibling containers with
one header each, and 20 nested containers. After mounting and warming up, each
fixture scrolls from 2,200 px in 2 px steps over 80 frames. The initial step does
not change the scroll position, leaving 79 measured scroll updates.

Instrumentation counts library RAF callbacks, geometry reads, computed-style
reads and observer registrations. RAF callback timings include instrumentation.
A separate 20-frame idle period checks for continued work. CDP counters track
layout, style recalculation and browser task durations. Native RAF timestamps
provide sampled frame intervals, not full paint/compositing latency or FPS.

The baseline and final code run alternately three times per fixture, at normal
CPU speed and Chromium's 4x CPU throttling (48 runs total). The tables report the
median of the three per-run statistics. CPU throttling is a synthetic stress
test, not a measurement from a real mobile device.

## Changes

- Containers share global scroll/resize listeners and one scheduled RAF. Every
  scheduled container reads geometry before any container writes sticky styles.
  Height callbacks run after all writes; an exception or synchronous unmount in
  one callback does not prevent another container's layout from being applied.
- One shared ResizeObserver deduplicates targets. Scoped mutation observation is
  also shared. Ancestor and preceding-sibling chains are merged, skipping already
  visited chains; refreshes coalesce into a microtask. Removing a container keeps
  observations required by other containers, and removing the last container
  disconnects observers, removes listeners and cancels scheduled work.
- Unchanged numeric layouts skip repeated style reads and string construction.
  Dimensions remain freshly measured during scrolling; box/layout caches are
  invalidated on observed changes, window resize and component commits.
- A Set provides constant-time item unregister operations. The registered-item
  array is rebuilt only after additions/removals. Geometry and visual order are
  recalculated every frame, including keyed and CSS ordering changes.

## Results

| Container configuration | Resize registrations, before → after | Library RAF callbacks per scroll update, before → after |
| --- | ---: | ---: |
| 100 sibling containers | 5,650 → 304 | 100 → 1 |
| 20 nested containers | 520 → 64 | 20 → 1 |
| One container, 1,000 headers | 2,005 → 2,005 | 1 → 1 |

The sibling/nested fixtures each now use one library ResizeObserver and one
library MutationObserver instead of one of each per container. Shared target
bookkeeping does not store a separate preceding-sibling subscription chain for
every container.

| One container, 1,000 headers | Normal CPU callback median, before → after | 4x CPU callback median, before → after |
| --- | ---: | ---: |
| Stack, all active | 3.4 → 1.9 ms | 14.1 → 8.0 ms |
| Replace, one eligible header | 1.1 → 1.1 ms | 4.7 → 4.6 ms |

For the throttled stacked fixture, sampled RAF interval p95 improved from
21.9 ms to 17.7 ms. At normal CPU speed it remained approximately 16.9 ms.
Across 100 sibling containers, aggregate callback time averaged 0.20 → 0.16 ms
per scroll update normally and 0.81 → 0.68 ms under throttling. These figures
measure different statistics from the individual callback medians above.

All fixtures stopped scheduling library callbacks during the idle check.
Stable stacked/nested scrolling read no computed styles and generated no
observed mutations. Replacement/sibling fixtures refreshed computed styles only
around header changes. Stable stacked/nested scrolling added no layout or style
recalculation time in the CDP counters; this does not establish end-to-end frame
latency.

Initialization and teardown are not uniformly faster. Shared-target bookkeeping
adds setup work for a single large container. In the 1,000-header replace fixture,
normal-speed mount medians were 64.3 → 76.2 ms and throttled medians were
287.5 → 313.4 ms. These timings include React mounting and two settling RAFs.
The 100-container fixture improved throttled mounting from 191.1 → 141.1 ms and
teardown from 28.0 → 14.7 ms. One-container teardown timings showed no consistent
improvement despite removal of the registry's repeated linear scans.

## Size and remaining limits

The ESM artifact is approximately 3.48 kB gzip plus 0.09 kB gzip CSS, versus
2.79 kB gzip before the scaling changes. React remains external and no runtime
dependency was added. CJS, UMD and declaration files increase package download
size but are not all loaded into a browser bundle.

Geometry reads still grow with mounted item count. Layout changes can invalidate
multiple containers, and shared scheduling still visits subscribed containers
on scroll. This work reduces duplicated scheduling, observation and style
handling; it does not eliminate the cost of arbitrarily large lists.

Prefer one container for related sections rather than one per row. For very long
lists, consider application-level pagination or virtualization, keeping the
active header and required replacement boundary available. Virtualization is not
built into this library. Keep expensive work in `onStickyItemsHeightChange`
outside the scrolling frame. Further profiling should use representative pages
and actual mobile devices before introducing cached positions or spatial indexes.
