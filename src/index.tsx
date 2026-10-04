import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { StickyGroupContext, type IStickyItemHandle, MIN_BASE_Z_INDEX, DEFAULT_BASE_Z_INDEX } from './context.js';
import './style.scss';

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
}: IStickyContainerProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<IStickyItemHandle[]>([]);
  const rafId = useRef<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const activeRef = useRef(false);
  const heightRef = useRef(0);
  const optionsRef = useRef({ offsetTop, constraint, onStickyItemsHeightChange });

  const scheduleUpdate = useCallback(() => {
    if (!activeRef.current || rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const container = containerRef.current;
      if (!activeRef.current || !container) return;
      const options = optionsRef.current;
      const rect = container.getBoundingClientRect();
      const canSticky = options.constraint === 'none' ||
        (rect.top <= options.offsetTop && rect.bottom >= options.offsetTop);

      // Offscreen containers need only one rectangle read, regardless of item count.
      if (!canSticky) {
        container.classList.remove('can-sticky');
        for (const item of itemsRef.current) item.apply(null, 0, 0, 0);
        if (heightRef.current !== 0) {
          heightRef.current = 0;
          options.onStickyItemsHeightChange?.(0);
        }
        return;
      }

      // Read all geometry before applying styles; sort cached rectangles, including reorders.
      const measurements = itemsRef.current.map(item => ({
        item, rect: item.el.getBoundingClientRect(),
        height: item.content.getBoundingClientRect().height,
      })).sort((a, b) => {
        const difference = a.rect.top - b.rect.top;
        if (difference !== 0) return difference;
        const position = a.item.el.compareDocumentPosition(b.item.el);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      let offset = options.offsetTop;
      let totalHeight = 0;
      const plans = measurements.map(({ item, rect: itemRect, height }, index) => {
        let top: number | null = null;
        if (itemRect.top <= offset) {
          const nextTop = measurements[index + 1]?.rect.top;
          if (item.mode === 'replace' && nextTop !== undefined) {
            if (nextTop >= offset) top = Math.min(offset, nextTop - height);
          } else {
            top = offset;
          }
          if (top !== null) {
            totalHeight += height;
            if (item.mode === 'stack') offset += height;
          }
        }
        return { item, top, height, width: itemRect.width, index };
      });
      const correction = options.constraint === 'none' ? 0 :
        Math.min(0, rect.bottom - options.offsetTop - totalHeight);
      container.classList.toggle('can-sticky', plans.some(plan => plan.top !== null));
      for (const { item, top, height, width, index } of plans) {
        item.apply(top === null ? null : top + correction, height, width, index);
      }
      if (heightRef.current !== totalHeight) {
        heightRef.current = totalHeight;
        options.onStickyItemsHeightChange?.(totalHeight);
      }
    });
  }, []);

  const register = useCallback((item: IStickyItemHandle) => {
    itemsRef.current.push(item);
    observerRef.current?.observe(item.el);
    observerRef.current?.observe(item.content);
    scheduleUpdate();
    return () => {
      observerRef.current?.unobserve(item.el);
      observerRef.current?.unobserve(item.content);
      itemsRef.current = itemsRef.current.filter(existing => existing !== item);
      scheduleUpdate();
    };
  }, [scheduleUpdate]);

  useEffect(() => {
    activeRef.current = true;
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(scheduleUpdate);
      observerRef.current = observer;
      if (containerRef.current) observer.observe(containerRef.current);
      for (const item of itemsRef.current) {
        observer.observe(item.el);
        observer.observe(item.content);
      }
    }
    window.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    scheduleUpdate();
    return () => {
      activeRef.current = false;
      window.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [scheduleUpdate]);

  // Every commit can change item order or layout without a scroll event.
  useEffect(() => {
    optionsRef.current = { offsetTop, constraint, onStickyItemsHeightChange };
    scheduleUpdate();
  });

  const fixedBaseZIndex = baseZIndex === undefined ? DEFAULT_BASE_Z_INDEX :
    Math.max(Number(baseZIndex) || 0, MIN_BASE_Z_INDEX);
  const context = useMemo(() => ({ register, baseZIndex: fixedBaseZIndex, mode: defaultMode }),
    [register, fixedBaseZIndex, defaultMode]);

  return (
    <StickyGroupContext.Provider value={context}>
      <div {...rest} ref={containerRef} className={['oe-sticky-container', className].filter(Boolean).join(' ')}>
        {children}
      </div>
    </StickyGroupContext.Provider>
  );
}
