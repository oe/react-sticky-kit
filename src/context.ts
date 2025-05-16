import { createContext, useContext } from 'react';

export const MIN_BASE_Z_INDEX = 20;

export const DEFAULT_BASE_Z_INDEX = 200;
/**
 * Sticky mode:
 * - 'replace': This item replaces the previous sticky item; its height is set to the previous sticky item's height.
 * - 'stack': This item stacks on top of previous sticky items; its height is set to 0.
 * - 'none': This item is not sticky.
 */
export type IStickyMode = 'replace' | 'stack' | 'none';

export interface IStickyItemHandle {
  /**
   * The DOM element wrapping the sticky content.
   */
  el: HTMLElement;
  /**
   * Update function for the sticky item.
   * @param canSticky Whether the container intersects the top and the item can be sticky.
   * @param currentOffsetTop The distance from the item's container to the top of the viewport.
   * @param offsetTop The offset of previous sticky items.
   * @param nextOffsetTop The offsetTop of the next sticky item container, or undefined if none.
   * @param index The index of the sticky item in the container, used for z-index control.
   * @returns The height of the current item, or 0 if not sticky.
   */
  update: (
    canSticky: boolean,
    currentOffsetTop: number,
    offsetTop: number,
    nextOffsetTop: number | undefined,
    index: number
  ) => number;
}

export interface IStickyGroupContextValue {
  /**
   * base z-index for sticky items.
   */
  baseZIndex: number;
  /**
   * Register a sticky item.
   */
  register: (handle: IStickyItemHandle) => () => void;
  /**
   * Update the total height of sticky items.
   * @param height Height of the newly added sticky item.
   * @returns Cleanup function to call on unmount for height cleanup.
   */
  updateStickyItemsHeight: (height: number) => () => void;
  /**
   * Fixed offset from the top for the entire StickyGroup.
   */
  fixedOffsetTop: number;
  /**
   * Default sticky mode for the group.
   */
  mode?: IStickyMode;
}

export const StickyGroupContext = createContext<IStickyGroupContextValue | null>(null);

export function useStickyContext() {
  return useContext(StickyGroupContext);
}
