import { createStickyContainer } from './container.js';
import * as fixedEngine from './fixed-layout.js';
export type { IStickyContainerProps } from './container.js';
export type { IStickyMode } from './context.js';
export * from './sticky-item.js';

export const StickyContainer = /* @__PURE__ */ createStickyContainer(() => fixedEngine, 'fixed');
