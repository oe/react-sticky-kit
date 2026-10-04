import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { StickyGroupContext, type IStickyItemHandle, MIN_BASE_Z_INDEX, DEFAULT_BASE_Z_INDEX } from './context.js';
import './style.scss';
import { observeLayoutChanges } from './layout-observer.js';
import { observeResize } from './resize-observer.js';
import { subscribeUpdates } from './scheduler.js';

export type { IStickyMode } from './context.js';
export * from './sticky-item.js';

export interface IStickyContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * The offset from the top of the viewport for sticky elements. Default is 0.
   */
  offsetTop?: number;
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

export function StickyContainer({ children, offsetTop = 0, baseZIndex,
  onStickyItemsHeightChange, defaultMode = 'replace', constraint, className, ...rest
}: IStickyContainerProps): React.ReactElement<any, any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- Preserve the existing JSX.Element return shape.
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Set<IStickyItemHandle>());
  const registeredItemsRef = useRef<IStickyItemHandle[] | null>(null);
  const handlesRef = useRef(new Map<Element, IStickyItemHandle>());
  const stickyRef = useRef(false);
  const updatesRef = useRef<ReturnType<typeof subscribeUpdates> | null>(null);
  const observationsRef = useRef(new Map<Element, () => void>());
  const heightRef = useRef(0);
  const optionsRef = useRef({ offsetTop, constraint, onStickyItemsHeightChange });

  const scheduleUpdate = useCallback(() => updatesRef.current?.schedule(), []);

  const readLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const options = optionsRef.current;
    const rect = container.getBoundingClientRect();
    const canSticky = options.constraint === 'none' ||
      (rect.top <= options.offsetTop && rect.bottom >= options.offsetTop);

    // Offscreen containers need only one rectangle read, regardless of item count.
    if (!canSticky) return () => {
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

    // Read all geometry before applying styles; sort cached rectangles, including reorders.
    // Cache registration only; geometry and visual order remain fresh every frame.
    const registeredItems = registeredItemsRef.current ??= [...itemsRef.current];
    const measurements = registeredItems.map(item => ({
      item, rect: item.el.getBoundingClientRect(),
    })).sort((a, b) => {
      const difference = a.rect.top - b.rect.top;
      if (difference !== 0) return difference;
      const position = a.item.el.compareDocumentPosition(b.item.el);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    let offset = options.offsetTop;
    let totalHeight = 0;
    const plans = measurements.map(({ item, rect: itemRect }, index) => {
      if (itemRect.top > offset) return null;
      const nextTop = measurements[index + 1]?.rect.top;
      if (item.mode === 'replace' && nextTop !== undefined && nextTop < offset) return null;
      // Only eligible contents need measuring; all reads still precede every write.
      const dimensions = item.measure(itemRect);
      const top = item.mode === 'replace' && nextTop !== undefined ?
        Math.min(offset, nextTop - dimensions.height) : offset;
      totalHeight += dimensions.height;
      if (item.mode === 'stack') offset += dimensions.height;
      return { ...dimensions, top, index };
    });
    const correction = options.constraint === 'none' ? 0 :
      Math.min(0, rect.bottom - options.offsetTop - totalHeight);
    return () => {
      stickyRef.current = plans.some(plan => plan !== null);
      container.classList.toggle('can-sticky', stickyRef.current);
      measurements.forEach(({ item }, index) => {
        const plan = plans[index];
        if (plan) plan.top += correction;
        item.apply(plan);
      });
      if (heightRef.current !== totalHeight) {
        heightRef.current = totalHeight;
        return () => options.onStickyItemsHeightChange?.(totalHeight);
      }
    };
  }, []);

  const onResize = useCallback((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) handlesRef.current.get(entry.target)?.invalidate();
    scheduleUpdate();
  }, [scheduleUpdate]);
  const invalidate = useCallback(() => {
    for (const item of itemsRef.current) item.invalidate();
  }, []);

  const register = useCallback((item: IStickyItemHandle) => {
    itemsRef.current.add(item);
    registeredItemsRef.current = null;
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
      registeredItemsRef.current = null;
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
      updatesRef.current?.stop();
      updatesRef.current = null;
      stopLayoutObserver?.();
      for (const stop of observations.values()) stop();
      observations.clear();
    };
  }, [readLayout, invalidate, scheduleUpdate, onResize]);

  // Every commit can change item order or layout without a scroll event.
  useEffect(() => {
    optionsRef.current = { offsetTop, constraint, onStickyItemsHeightChange };
    for (const item of itemsRef.current) item.invalidate();
    scheduleUpdate();
  });

  const fixedBaseZIndex = baseZIndex === undefined ? DEFAULT_BASE_Z_INDEX :
    Math.max(Number(baseZIndex) || 0, MIN_BASE_Z_INDEX);
  const context = useMemo(() => ({ register, scheduleUpdate, baseZIndex: fixedBaseZIndex, mode: defaultMode }),
    [register, scheduleUpdate, fixedBaseZIndex, defaultMode]);

  return (
    <StickyGroupContext.Provider value={context}>
      <div {...rest} ref={containerRef} className={['oe-sticky-container', className].filter(Boolean).join(' ')}>
        {children}
      </div>
    </StickyGroupContext.Provider>
  );
}
