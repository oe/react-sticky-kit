import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { StickyGroupContext, type IStickyItemHandle, MIN_BASE_Z_INDEX, DEFAULT_BASE_Z_INDEX } from './context.js';
import './style.scss';
import { observeLayoutChanges } from './layout-observer.js';
import { observeResize } from './resize-observer.js';
import { subscribeUpdates } from './scheduler.js';

import type { FixedRefs } from './fixed-layout.js';

export interface IStickyContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * The offset from the top of the viewport for sticky elements. Default is 0.
   */
  offsetTop?: number;
  /** Space below oversized groups when overflowBehavior="scroll". */
  offsetBottom?: number;
  /** Preserve pinning (default), or scroll oversized active groups as one unit. */
  overflowBehavior?: 'pin' | 'scroll';
  /** Opt into native sticky for eligible single, direct-child items. Defaults to fixed in the main entry, auto in the auto entry. */
  positionStrategy?: 'fixed' | 'auto';
  /**
   * base z-index for sticky items. Default is 200. minimum z-index is 20.
   * * - When using the `replace` mode, the z-index of a `StickyItem` is calculated as `baseZIndex` minus its index within the container.
   * * - When using the `stack` mode, the z-index of a `StickyItem` is calculated as `baseZIndex` plus its index.
   * * should be greater than number of sticky items in the container.
   * * use it when you need nest StickyContainer or need to change z-index of sticky items.
   */
  baseZIndex?: number;
  /**
   * Default sticky mode for the group. 'none' disables sticky behavior.
   */
  defaultMode?: 'replace' | 'stack' | 'none';
  /**
   * Callback triggered when the total height of all currently sticky items changes.
   * @param height The total height of all sticky items inside the container.
   */
  onStickyItemsHeightChange?: (height: number) => void;
  /**
   * Define the constraint for sticky behavior
   * - undefined (default): Sticky items will stop being sticky when StickyContainer leaves viewport
   * - 'none': No container boundary; offsets remain viewport-relative
   */
  constraint?: 'none';
}

type FixedEngine = typeof import('./fixed-layout.js');
export function createStickyContainer(getFixedEngine: (schedule?: () => void) => FixedEngine | undefined,
  defaultStrategy: 'fixed' | 'auto', cancelLoad?: (schedule: () => void) => void) {
  const getFixedItemFactory = () => getFixedEngine()?.createFixedItem;
  return function StickyContainer({ children, offsetTop = 0, offsetBottom = 0, overflowBehavior = 'pin', positionStrategy = defaultStrategy, baseZIndex,
  onStickyItemsHeightChange, defaultMode = 'replace', constraint, className, ...rest
}: IStickyContainerProps): React.ReactElement<any, any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- Preserve the existing JSX.Element return shape.
    const fixedBaseZIndex = baseZIndex === undefined ? DEFAULT_BASE_Z_INDEX :
      Math.max(Number(baseZIndex) || 0, MIN_BASE_Z_INDEX);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef(new Set<IStickyItemHandle>());
    const measurementsRef = useRef<{ item: IStickyItemHandle; rect: DOMRect }[] | null>(null);
    const handlesRef = useRef(new Map<Element, IStickyItemHandle>());
    const stickyRef = useRef(false);
    const nativeEligibleRef = useRef<boolean | null>(null);
    const updatesRef = useRef<ReturnType<typeof subscribeUpdates> | null>(null);
    const observationsRef = useRef(new Map<Element, () => void>());
    const heightRef = useRef(0);
    const overflowRef = useRef<{ scrollY: number; shift: number; maximum: number } | null>(null);
    const optionsRef = useRef({ offsetTop, offsetBottom, overflowBehavior, positionStrategy, baseZIndex: fixedBaseZIndex, constraint, onStickyItemsHeightChange });

    const fixedRefs = useRef<FixedRefs>({ itemsRef, measurementsRef, overflowRef, stickyRef, heightRef, updatesRef }).current;
    const scheduleUpdate = useCallback(() => updatesRef.current?.schedule(), []);

    const readLayout = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;
      const options = optionsRef.current;
      const rect = container.getBoundingClientRect();
      const canSticky = options.constraint === 'none' ||
        (rect.top <= options.offsetTop && rect.bottom >= options.offsetTop);

      // Native positioning is limited to one direct child; multiple headings still need coordination.
      const single = options.positionStrategy === 'auto' && nativeEligibleRef.current !== false &&
        itemsRef.current.size === 1 ? itemsRef.current.values().next().value : undefined;
      if (options.positionStrategy === 'auto' && options.constraint !== 'none' && single?.canNative &&
        single.el.parentElement === container && (nativeEligibleRef.current ??= hasViewportSticky(container, single.el))) {
        const height = single.content.getBoundingClientRect().height;
        const itemRect = single.el.getBoundingClientRect();
        if (itemRect.height <= height + 1 && height + options.offsetTop + Math.max(0, options.offsetBottom) <= window.innerHeight) {
          const total = canSticky && itemRect.top <= options.offsetTop ? height : 0;
          return () => {
            updatesRef.current?.setScrollEnabled(Boolean(options.onStickyItemsHeightChange));
            overflowRef.current = null;
            stickyRef.current = true;
            container.classList.remove('can-sticky');
            single.applyNative(options.offsetTop, options.baseZIndex);
            if (heightRef.current !== total) {
              heightRef.current = total;
              return () => options.onStickyItemsHeightChange?.(total);
            }
          };
        }
        // A rejected fit cannot change from scrolling alone. Recheck on layout invalidation.
        nativeEligibleRef.current = false;
      }
      // Request an unavailable backend before activation; native paths return above.
      const fixedReader = getFixedEngine(itemsRef.current.size ? scheduleUpdate : undefined);
      // Offscreen containers need only one rectangle read, regardless of item count.
      if (!canSticky) return () => {
        updatesRef.current?.setScrollEnabled(true);
        overflowRef.current = null;
        if (stickyRef.current) {
          container.classList.remove('can-sticky');
          for (const item of itemsRef.current) item.apply(null);
          stickyRef.current = false;
        }
        if (heightRef.current !== 0) {
          heightRef.current = 0;
          return () => options.onStickyItemsHeightChange?.(0);
        }
      };

      if (!fixedReader) return;
      return fixedReader.readFixedLayout(container, rect, options, fixedRefs);

    }, [fixedRefs, scheduleUpdate]);

    const onResize = useCallback((entries: ResizeObserverEntry[]) => {
      nativeEligibleRef.current = null;
      for (const entry of entries) handlesRef.current.get(entry.target)?.invalidate();
      scheduleUpdate();
    }, [scheduleUpdate]);
    const invalidate = useCallback(() => {
      nativeEligibleRef.current = null;
      for (const item of itemsRef.current) item.invalidate();
    }, []);

    const register = useCallback((item: IStickyItemHandle) => {
      itemsRef.current.add(item);
      nativeEligibleRef.current = null;
      measurementsRef.current = null;
      handlesRef.current.set(item.el, item);
      handlesRef.current.set(item.content, item);
      if (updatesRef.current) {
        observationsRef.current.set(item.el, observeResize(item.el, onResize));
        observationsRef.current.set(item.content, observeResize(item.content, onResize));
      }
      scheduleUpdate();
      return () => {
        observationsRef.current.get(item.el)?.();
        observationsRef.current.get(item.content)?.();
        observationsRef.current.delete(item.el);
        observationsRef.current.delete(item.content);
        handlesRef.current.delete(item.el);
        handlesRef.current.delete(item.content);
        itemsRef.current.delete(item);
        nativeEligibleRef.current = null;
        measurementsRef.current = null;
        scheduleUpdate();
      };
    }, [scheduleUpdate, onResize]);

    useEffect(() => {
      updatesRef.current = subscribeUpdates(readLayout, invalidate);
      let stopLayoutObserver: (() => void) | undefined;
      if (typeof ResizeObserver !== 'undefined') {
        if (containerRef.current) {
          observationsRef.current.set(containerRef.current, observeResize(containerRef.current, onResize));
          stopLayoutObserver = observeLayoutChanges(containerRef.current, () => {
            invalidate();
            scheduleUpdate();
          });
        }
        for (const item of itemsRef.current) {
          observationsRef.current.set(item.el, observeResize(item.el, onResize));
          observationsRef.current.set(item.content, observeResize(item.content, onResize));
        }
      }
      const observations = observationsRef.current;
      return () => {
        cancelLoad?.(scheduleUpdate);
        updatesRef.current?.stop();
        updatesRef.current = null;
        stopLayoutObserver?.();
        for (const stop of observations.values()) stop();
        observations.clear();
      };
    }, [readLayout, invalidate, scheduleUpdate, onResize]);

    // Every commit can change item order or layout without a scroll event.
    useEffect(() => {
      nativeEligibleRef.current = null;
      optionsRef.current = { offsetTop, offsetBottom, overflowBehavior, positionStrategy, baseZIndex: fixedBaseZIndex, constraint, onStickyItemsHeightChange };
      for (const item of itemsRef.current) item.invalidate();
      scheduleUpdate();
    });

    const context = useMemo(() => ({ register, scheduleUpdate, getFixedItemFactory, baseZIndex: fixedBaseZIndex, mode: defaultMode }),
      [register, scheduleUpdate, fixedBaseZIndex, defaultMode]);

    return (
      <StickyGroupContext.Provider value={context}>
        <div {...rest} ref={containerRef} className={['oe-sticky-container', className].filter(Boolean).join(' ')}>
          {children}
        </div>
      </StickyGroupContext.Provider>
    );
  };
}

function hasViewportSticky(container: HTMLElement, item: HTMLElement) {
  if (typeof ResizeObserver === 'undefined' || typeof CSS === 'undefined' ||
    typeof CSS.supports !== 'function' || !CSS.supports('position', 'sticky')) return false;
  for (let node: HTMLElement | null = container; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    // A fixed placeholder can hide vertical stretching; reject the layout itself
    // to avoid alternating native/fixed modes on every ResizeObserver delivery.
    if (node === container && (style.display.includes('grid') ||
      (style.display.includes('flex') && !style.flexDirection.startsWith('column'))) &&
      /^(normal|stretch)$/.test(style.alignItems) &&
      /^(auto|normal|stretch)$/.test(getComputedStyle(item).alignSelf)) return false;
    if (/(auto|scroll|hidden|overlay)/.test(`${style.overflowX} ${style.overflowY}`)) return false;
  }
  return true;
}
