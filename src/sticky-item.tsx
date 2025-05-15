import React, { useRef, useEffect, useState } from 'react';
import { type IStickyMode, type IStickyItemHandle, useStickyContext } from './context';

export interface IStickyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Sticky mode for this item. Defaults to the group's mode if not specified.
   */
  mode?: IStickyMode
}

const BASE_Z_INDEX = 200;

export function StickyItem({ mode, children, className, ...rest}: IStickyItemProps) {
  const context = useStickyContext();
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Use ref to cache fixedOffsetTop and avoid unnecessary re-renders
  const contextInfoRef = useRef({
    fixedOffsetTop: context?.fixedOffsetTop || 0,
    isSticky,
  });

  contextInfoRef.current.fixedOffsetTop = context?.fixedOffsetTop || 0;
  contextInfoRef.current.isSticky = isSticky;

  // Do not apply sticky if context is missing or mode is 'none'
  useEffect(() => {
    const $content = contentRef.current;
    const $contentWrapper = contentWrapperRef.current;
    const effectedMode = mode || context?.mode;
    // Handle cases where sticky cannot be applied
    if (!context || !$contentWrapper || !$content
      // Skip sticky if mode is 'none' or not set
      || effectedMode === 'none' || !effectedMode
      || !context.register) {
      setIsSticky(false);
      return;
    }
    // Register sticky item and provide update logic
    const update: IStickyItemHandle['update'] = (canSticky, currentOffsetTop, offsetTop, nextOffsetTop, index) => {
      if (!canSticky) {
        setIsSticky(false);
        return 0;
      }
      if (currentOffsetTop <= offsetTop) {
        const contentHeight = $content.offsetHeight;
        setIsSticky(true);
        let newOffsetTop = offsetTop;
        // In 'replace' mode, adjust height if next item overlaps current item
        if (effectedMode === 'replace' && typeof nextOffsetTop !== 'undefined') {
          const diff = nextOffsetTop - (offsetTop + contentHeight);
          if (diff < 0) {
            newOffsetTop = offsetTop + diff;
            // If offset exceeds content height, disable sticky
            if (diff + contentHeight < 0) {
              setIsSticky(false);
              return 0;
            }
          }
        }
        $content.style.setProperty('top', `${newOffsetTop}px`);
        $content.style.setProperty('width', `${$contentWrapper.offsetWidth}px`);
        // Lower z-index in 'replace' mode, raise in 'stack' mode to ensure stacking order
        $content.style.setProperty('z-index', `${BASE_Z_INDEX + (effectedMode === 'replace' ? -index : index)}`);
        $contentWrapper.style.setProperty('height', `${contentHeight}px`);
        // In 'replace' mode, do not occupy offsetTop height
        return effectedMode === 'replace' ? 0 : contentHeight;
      } else {
        setIsSticky(false);
      }
      return 0;
    };

    const handle: IStickyItemHandle = {
      el: $contentWrapper,
      update,
    }

    return context.register(handle);

  }, [context?.mode, context?.register, mode]);

  useEffect(() => {
    const $item = contentWrapperRef.current;
    const $content = contentRef.current;
    const updateStickyItemsHeight = context?.updateStickyItemsHeight;
    if (!isSticky || !$item || !$content || !updateStickyItemsHeight) return;
    const removeHeight = updateStickyItemsHeight($content.offsetHeight);
  
    return () => {
      $content.style.removeProperty('top');
      $content.style.removeProperty('z-index');
      $item.style.removeProperty('height');
      $content.style.removeProperty('width');
      removeHeight();
    }
  }, [isSticky, context?.updateStickyItemsHeight])
  

  return (
    <div className={'oe-sticky-item ' + (className || '')} {...rest} ref={contentWrapperRef}>
      <div className={'oe-sticky-content ' + (isSticky ? 'is-sticky':  '')} ref={contentRef}>
        {children}
      </div>
    </div>
  )
}