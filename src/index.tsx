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
  /**
   * Define the constraint for sticky behavior
   * - undefined (default): Sticky items will stop being sticky when StickyContainer leaves viewport
   * - 'none': No constraints, similar to CSS position:sticky behavior
   */
  constraint?: 'none';
}

export function StickyContainer(
  { children, offsetTop = 0, baseZIndex, onStickyItemsHeightChange,
    defaultMode = 'replace', constraint, ...rest }: IStickyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<IStickyItemHandle[]>([]);
  const rafId = useRef<number|null>(null);
  
  // Use ref to cache config to avoid unnecessary hook dependencies
  const optionsRef = useRef({
    fixedOffsetTop: offsetTop,
    defaultMode,
    stickyItemsHeight: 0,
    onStickyItemsHeightChange,
    lastCanSticky: false,
  });
  optionsRef.current.onStickyItemsHeightChange = onStickyItemsHeightChange;

  // Get the constraint container's bounding rectangle
  const getConstraintRect = useCallback((): DOMRect => {
    if (constraint === 'none') {
      // No constraint: Create a DOMRect-like object for the entire viewport (CSS-like behavior)
      return {
        top: -Infinity, bottom: Infinity,
        left: -Infinity, right: Infinity,
        width: Infinity, height: Infinity,
        x: 0, y: 0,
        toJSON: () => ({})
      };
    }
    // Default constraint: use the StickyContainer's own bounds
    return containerRef.current?.getBoundingClientRect() || 
      { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) };
  }, [constraint]);

  const scheduleUpdate = useCallback(() => {
    const $container = containerRef.current;
    if (!$container || rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      const rect = getConstraintRect();
      const { fixedOffsetTop, stickyItemsHeight } = optionsRef.current;
      
      // Calculate if sticky is allowed based on constraint type
      let canSticky: boolean;
      
      if (constraint === 'none') {
        // No constraint: CSS-like behavior, always allow sticky
        canSticky = true;
      } else {
        // Default constraint: check if StickyContainer is visible in viewport
        canSticky = !(rect.top > fixedOffsetTop || rect.bottom < fixedOffsetTop);
      }
      
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
  
      let accHeight: number;
      let correctionOffset = 0;
      
      if (constraint === 'none') {
        // No constraint: use standard calculation
        accHeight = fixedOffsetTop;
        correctionOffset = rect.bottom - (fixedOffsetTop + stickyItemsHeight);
        if (correctionOffset > 0) correctionOffset = 0;
      } else {
        // Default constraint: use standard calculation
        accHeight = fixedOffsetTop;
        correctionOffset = rect.bottom - (fixedOffsetTop + stickyItemsHeight);
        if (correctionOffset > 0) correctionOffset = 0;
      }
      
      // Calculate offsetTop for each item
      const offsetTopOfItems = itemsRef.current.map(item => {
        const itemRect = item.el.getBoundingClientRect();
        // Always use viewport-relative position for simplified implementation
        return itemRect.top;
      });
      
      itemsRef.current.forEach((item, index) => {
        accHeight += item.update(canSticky, offsetTopOfItems[index]!, accHeight + correctionOffset, offsetTopOfItems[index + 1], index);
      });
    });
  }, [getConstraintRect, constraint]);

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
    // delay the update to ensure DOM is ready
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
    // Always listen to window scroll and resize
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