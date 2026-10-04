import React, { useRef, useEffect } from 'react';
import { type IStickyMode, type IStickyItemHandle, useStickyContext } from './context.js';

export interface IStickyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Sticky mode for this item. Defaults to the StickyContainer's mode. */
  mode?: IStickyMode;
}

export function StickyItem({ mode, children, className, ...rest }: IStickyItemProps): React.ReactElement {
  const context = useStickyContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const register = context?.register;
  const effectiveMode = mode ?? context?.mode;
  const baseZIndex = context?.baseZIndex;
  const normalHeight = rest.style?.height;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;
    const originalHeight = typeof normalHeight === 'number' ? `${normalHeight}px` : normalHeight ?? '';
    setStyle(wrapper, 'height', originalHeight);
    if (!register || !effectiveMode || effectiveMode === 'none') return;
    let sticky = false;
    const reset = () => {
      if (!sticky) return;
      sticky = false;
      wrapper.style.height = originalHeight;
      content.classList.remove('is-sticky');
      for (const property of ['top', 'width', 'z-index']) content.style.removeProperty(property);
    };
    const apply: IStickyItemHandle['apply'] = (top, height, width, index) => {
      if (top === null) {
        reset();
        return;
      }
      if (!sticky) {
        sticky = true;
        content.classList.add('is-sticky');
      }
      setStyle(wrapper, 'height', `${height}px`);
      setStyle(content, 'top', `${top}px`);
      setStyle(content, 'width', `${width}px`);
      setStyle(content, 'zIndex', `${(baseZIndex ?? 200) + (effectiveMode === 'replace' ? -index : index)}`);
    };
    const unregister = register({ el: wrapper, content, mode: effectiveMode, apply });
    return () => {
      unregister();
      reset();
    };
  }, [register, effectiveMode, baseZIndex, normalHeight]);

  return (
    <div {...rest} className={['oe-sticky-item', className].filter(Boolean).join(' ')} ref={wrapperRef}>
      <div className="oe-sticky-content" ref={contentRef}>{children}</div>
    </div>
  );
}

function setStyle(element: HTMLElement, property: 'height' | 'top' | 'width' | 'zIndex', value: string) {
  if (element.style[property] !== value) element.style[property] = value;
}
