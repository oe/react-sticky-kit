import React, { useRef, useEffect, useState } from 'react';
import { type IStickyMode, type IStickyItemHandle, useStickyContext, MIN_BASE_Z_INDEX } from './context';

export interface IStickyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /**
   * Sticky mode for this item. Defaults to the StickyContainer's mode if not specified.
   */
  mode?: IStickyMode
}

export function StickyItem({ mode, children, className, ...rest}: IStickyItemProps) {
  const context = useStickyContext();
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // Use ref to cache fixedOffsetTop and avoid unnecessary re-renders
  const contextInfoRef = useRef({
    fixedOffsetTop: context?.fixedOffsetTop || 0,
    isSticky,
    baseZIndex: context?.baseZIndex || MIN_BASE_Z_INDEX,
  });
  contextInfoRef.current.baseZIndex = context?.baseZIndex || MIN_BASE_Z_INDEX;
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
      // can sticky but has not reached offsetTop
      if (!canSticky || currentOffsetTop > offsetTop) {
        // only update offsetTop if canSticky is true, to avoid unnecessary re-renders
        if(contextInfoRef.current.isSticky) setIsSticky(false);
        return 0;
      }
      // .offsetHeight/.clientHeight could be rounded make it inaccurate
      // Use getBoundingClientRect().height to get accurate height
      const contentHeight = $content.getBoundingClientRect().height;
      let newOffsetTop = offsetTop;
      // In 'replace' mode, adjust height if next item overlaps current item
      if (effectedMode === 'replace' && typeof nextOffsetTop !== 'undefined') {
        const diff = nextOffsetTop - (offsetTop + contentHeight);
        if (diff < 0) {
          newOffsetTop = offsetTop + diff;
          // If offset exceeds content height, disable sticky
          if (diff + contentHeight < 0) {
            if(contextInfoRef.current.isSticky) setIsSticky(false);
            return 0;
          }
        }
      }
      // set wrapper height before setting content offset to avoid scroll glitch
      $contentWrapper.style.height = `${contentHeight}px`;
      if(!contextInfoRef.current.isSticky) setIsSticky(true);
      $content.style.top = `${newOffsetTop}px`;
      $content.style.width = `${$contentWrapper.offsetWidth}px`;
      // Lower z-index in 'replace' mode, raise in 'stack' mode to ensure stacking order
      $content.style.zIndex = `${contextInfoRef.current.baseZIndex + (effectedMode === 'replace' ? -index : index)}`;
      // In 'replace' mode, do not occupy offsetTop height
      return effectedMode === 'replace' ? 0 : contentHeight;
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
    const removeHeight = updateStickyItemsHeight($content.getBoundingClientRect().height);
  
    return () => {
      unsetStyle($item, ['height']);
      unsetStyle($content, ['top', 'z-index', 'width']);
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

function unsetStyle(el: HTMLElement, styles: string[]) {
  styles.forEach(style => {
    el.style.removeProperty(style);
  });
}
