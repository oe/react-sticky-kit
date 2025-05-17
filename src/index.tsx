import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { StickyGroupContext, type IStickyItemHandle, MIN_BASE_Z_INDEX, DEFAULT_BASE_Z_INDEX } from './context';

import './style.scss';

export type { IStickyMode } from './context';
export * from './sticky-item';

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
   * * for performance reasons, when baseZIndex is changed, the component will not re-render.
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
}

export function StickyContainer(
  { children, offsetTop = 0, baseZIndex, onStickyItemsHeightChange,
    defaultMode = 'replace', ...rest }: IStickyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<IStickyItemHandle[]>([]);
  
  // Use ref to cache config to avoid unnecessary hook dependencies
  const optionsRef = useRef({
    fixedOffsetTop: offsetTop,
    defaultMode,
    stickyItemsHeight: 0,
    onStickyItemsHeightChange,
    lastCanSticky: false,
  });
  optionsRef.current.onStickyItemsHeightChange = onStickyItemsHeightChange;

  const scheduleUpdate = useCallback(() => {
    const $container = containerRef.current;
    if (!$container) return;
    const rect = $container.getBoundingClientRect();
    const options = optionsRef.current;
    const fixedOffsetTop = options.fixedOffsetTop;
    const stickyItemsHeight = options.stickyItemsHeight;
    // Determine if the container intersects the top of the viewport
    const canSticky = !(rect.top > fixedOffsetTop || rect.bottom < fixedOffsetTop);
    // stop loop if container is not stickyable and lastCanSticky is false
    if (!canSticky) {
      if (optionsRef.current.lastCanSticky !== canSticky) {
        $container.classList.toggle('can-sticky', false);
        itemsRef.current.forEach(item => item.update(false, 0, 0, 0, 0));
        optionsRef.current.lastCanSticky = canSticky;
      }
      return;
    }
    optionsRef.current.lastCanSticky = canSticky;

    // enable sticky when some items should be sticky
    if (stickyItemsHeight > 0) {
      $container.classList.toggle('can-sticky', true);
    }

    let accHeight = fixedOffsetTop;

    // Calculate correction offset if container's bottom is not enough to display all sticky items
    let correctionOffset = rect.bottom - (fixedOffsetTop + stickyItemsHeight);
    // If correctionOffset > 0, there is enough space, no correction needed
    if (correctionOffset > 0) correctionOffset = 0;
    const offsetTopOfItems = itemsRef.current.map(item => item.el.getBoundingClientRect().top);
    itemsRef.current.forEach((item, index) => {
      accHeight += item.update(canSticky, offsetTopOfItems[index]!, accHeight + correctionOffset, offsetTopOfItems[index + 1], index);
    });
  }, []);

  // Update the total height of sticky items
  const updateStickyItemsHeight = useCallback((height: number) => {
    const nextHeight = optionsRef.current.stickyItemsHeight + height;
    optionsRef.current.stickyItemsHeight = nextHeight;
    // Trigger the callback asynchronously to avoid UI jank
    setTimeout(() => {
      optionsRef.current.onStickyItemsHeightChange?.(nextHeight);
    }, 0);
    return () => {
      const nextHeight = optionsRef.current.stickyItemsHeight - height;
      optionsRef.current.stickyItemsHeight = nextHeight;
      // Trigger the callback asynchronously to avoid UI jank
      setTimeout(() => {
        optionsRef.current.onStickyItemsHeightChange?.(nextHeight);
      }, 0);
    }
  }, []);
    
  // Update optionsRef values when props change
  useEffect(() => {
    optionsRef.current.fixedOffsetTop = offsetTop;
    optionsRef.current.defaultMode = defaultMode;
    setTimeout(() => {
      scheduleUpdate();
    }, 10);
  }, [offsetTop, defaultMode, scheduleUpdate]);
  
  // Register a sticky item and keep items sorted by their position in the viewport
  const register = useCallback((item: IStickyItemHandle) => {
    itemsRef.current.push(item);
    // Sort items by their position in the viewport to ensure correct update order
    itemsRef.current = sortStickyItemsByRect(itemsRef.current);
    scheduleUpdate();

    return () => {
      itemsRef.current = itemsRef.current.filter(i => i !== item);
      scheduleUpdate();
    };
  }, [scheduleUpdate]);
  
  useEffect(() => {
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
  
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    }
  }, [scheduleUpdate]);

  const fixedBaseZIndex = useMemo(() => fixBaseZIndex(baseZIndex), [baseZIndex]);

  return (
    <StickyGroupContext.Provider 
      value={{
        register,
        baseZIndex: fixedBaseZIndex,
        updateStickyItemsHeight,
        fixedOffsetTop: offsetTop, 
        mode: defaultMode, 
      }}
    >
      <div 
        {...rest} 
        ref={containerRef} 
        className="oe-sticky-container"
      >
        {children}
      </div>
    </StickyGroupContext.Provider>
  );
}

function fixBaseZIndex(baseZIndex?: number) {
  if (typeof baseZIndex === 'undefined') return DEFAULT_BASE_Z_INDEX;
  return Math.max(Number(baseZIndex) || 0, MIN_BASE_Z_INDEX); 
}

/**
 * Sort sticky items by their position in the viewport (top to bottom)
 */
function sortStickyItemsByRect(items: IStickyItemHandle[]) {
  return items.sort((a, b) => {
    const rectA = a.el.getBoundingClientRect();
    const rectB = b.el.getBoundingClientRect();
    return rectA.top - rectB.top;
  });
}