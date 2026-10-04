# Performance audit

This audit covers PR #1 and its follow-up changes. Timings are local observations,
not browser or device performance guarantees.

## Scenarios and method

A Chromium development fixture exercised 1,000 simultaneous stacked headers,
100 sibling containers with one header each, and 20 nested containers. After
mounting and warming up, it scrolled from 2,200 px in 2 px steps over 80 frames.
Instrumentation counted library RAF callbacks, geometry reads, computed-style
reads and observer notifications. A separate 20-frame idle period checked for
continued work. CDP performance counters tracked layout and style recalculation.
The same scenarios ran at normal CPU speed and with Chromium's 4x CPU throttling.
Throttling is a synthetic stress test, not a real mobile-device measurement.

For the 1,000-header unregister comparison, the previous PR implementation and
the follow-up ran alternately three times at each CPU setting. Both used the same
fixture and React development build. Mount/unmount timings include React work;
scroll callback timings include instrumentation. Development-mode results should
not be presented as production-library timings.

## Findings

- All three scenarios stopped scheduling library callbacks during the idle check.
- Stable single-container and nested scrolling read no computed styles and
  generated no observed mutations. The sibling scenario had four computed-style
  reads across the measured sequence as the active header changed.
- Stable single-container and nested scrolling added no layout or style
  recalculation time in the CDP counters. This does not measure painting,
  compositing or establish end-to-end frame latency.
- At 4x CPU throttling, 1,000 simultaneously active headers took roughly
  14–18 ms per library callback in the repeated baseline runs. Sampled RAF
  intervals had p95 values around 20–30 ms. This extreme workload can exceed a
  60 Hz frame budget; normal-speed callback medians were around 3–4 ms.
- 100 sibling containers scheduled approximately 100 library callbacks per scroll
  frame. Their resize observation registrations totaled 5,650, including repeated
  targets across observers. Preceding-sibling tracking can grow quadratically with
  many sibling containers. A shared scheduler/observer is a future scaling option,
  but was not introduced without evidence from a representative application.

## Changes retained

Removing an item now mutates the internal registry with `splice` rather than
allocating and copying the remaining registry with `filter` on every removal.
This removes repeated array allocations; locating/removing items remains linear,
so bulk teardown is not claimed to be asymptotically linear.

| 1,000-item teardown, three alternating runs | Before | After |
| --- | --- | --- |
| Normal CPU | 19.0–21.5 ms | 11.8–15.6 ms |
| 4x CPU throttle | 74.0–87.9 ms | 50.9–74.4 ms |

Scroll timings varied between runs and showed no reliable improvement from this
teardown-only change. An attempted ordering fast path was discarded because its
benefit was not stable enough to justify extra runtime logic.

The audit also found a correctness gap in box-metric caching: a media query can
redistribute padding without changing observed dimensions. Window resize now
invalidates those metrics before scheduling the next layout update. A browser
regression test verifies both directions across the breakpoint. Scroll events
continue using the cache.

The final ESM build is approximately 2.79 kB gzip plus 0.09 kB gzip CSS. React
remains external and no runtime dependency was added. CJS, UMD and declaration
files increase package download size but are not all loaded into a browser bundle.

## Application guidance

Prefer one container for related sections rather than a container for every row.
For very long lists, reduce mounted headers with application-level pagination or
virtualization, keeping the active header and required replacement boundary
available. Virtualization is not built into this library. Keep expensive work in
`onStickyItemsHeightChange` outside the scrolling frame.

Further optimization should use production fixtures and actual mobile devices,
particularly when many containers or hundreds of simultaneous stacked headers
are required. Preserve dynamic reordering, external layout updates and observer
cleanup when evaluating shared observers or cached geometry.
