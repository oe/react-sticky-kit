import { createStickyContainer } from './container.js';
export type { IStickyContainerProps } from './container.js';
export type { IStickyMode } from './context.js';
export * from './sticky-item.js';

type FixedEngine = typeof import('./fixed-layout.js');
let engine: FixedEngine | undefined;
let loading = false;
let failed = false;
const waiting = new Set<() => void>();
function getEngine(schedule?: () => void) {
  if (!engine && schedule && !failed) {
    waiting.add(schedule);
    if (!loading) {
      loading = true;
      import('./fixed-layout.js').then(module => {
        engine = module;
        for (const update of waiting) update();
        waiting.clear();
      }, error => {
        failed = true;
        waiting.clear();
        // One error per failed chunk, rather than an error/request on every scroll.
        window.setTimeout(() => { throw error; });
      });
    }
  }
  return engine;
}

/** Full-feature native-first entry; fixed positioning loads only when required. */
export const StickyContainer = /* @__PURE__ */ createStickyContainer(getEngine, 'auto', schedule => { waiting.delete(schedule); });
