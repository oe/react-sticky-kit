import React, { useRef, useEffect, useCallback } from 'react';
import { StickyGroupContext, type IStickyItemHandle } from './context';

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
  { children, offsetTop = 0, onStickyItemsHeightChange,
    defaultMode = 'replace', ...rest }: IStickyContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<IStickyItemHandle[]>([]);
  // const [stickyItemsHeight, setStickyItemsHeight] = useState(0);
  
  // Use ref to cache config to avoid unnecessary hook dependencies
  const optionsRef = useRef({
    fixedOffsetTop: offsetTop,
    defaultMode,
    stickyItemsHeight: 0,
    onStickyItemsHeightChange,
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
    scheduleUpdate();
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

  return (
    <StickyGroupContext.Provider 
      value={{
        register,
        updateStickyItemsHeight,
        fixedOffsetTop: offsetTop, 
        mode: defaultMode, 
      }}
    >
      <div 
        {...rest} 
        ref={containerRef} 
        className="oe-sticky-container"
        data-mode={defaultMode} 
      >
        {children}
      </div>
    </StickyGroupContext.Provider>
  );
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