import React, { useRef, useEffect } from 'react';
import { type IStickyMode, type IStickyItemHandle, useStickyContext } from './context.js';

export interface IStickyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Sticky mode for this item. Defaults to the StickyContainer's mode. */
  mode?: IStickyMode;
}

export function StickyItem({ mode, children, className, ...rest }: IStickyItemProps): React.ReactElement<any, any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- Preserve the existing JSX.Element return shape.
  const context = useStickyContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const register = context?.register;
  const effectiveMode = mode ?? context?.mode;
  const baseZIndex = context?.baseZIndex;
  const normalHeight = rest.style?.height;
  const measurementRef = useRef<IStickyItemHandle | null>(null);
  const scheduleUpdate = context?.scheduleUpdate;
  const getFixedItemFactory = context?.getFixedItemFactory;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;
    const originalHeight = typeof normalHeight === 'number' ? `${normalHeight}px` : normalHeight ?? '';
    if (wrapper.style.height !== originalHeight) wrapper.style.height = originalHeight;
    if (!register || !effectiveMode || effectiveMode === 'none') return;
    let fixed: import('./fixed-layout.js').FixedItem | undefined;
    let nativeTop: number | null = null;
    let nativeZIndex: number;
    const fixedItem = () => {
      if (fixed) return fixed;
      const factory = getFixedItemFactory?.();
      if (!factory) throw new Error('Fixed positioning engine is not loaded.');
      return fixed = factory(wrapper, content, normalHeight, baseZIndex, effectiveMode);
    };
    const resetNative = () => {
      if (nativeTop === null) return;
      nativeTop = null;
      wrapper.classList.remove('is-native-sticky');
      wrapper.style.removeProperty('--oe-sticky-top');
      wrapper.style.removeProperty('--oe-sticky-z');
    };
    const reset = () => { resetNative(); fixed?.apply(null); };
    const measure: IStickyItemHandle['measure'] = rect => fixedItem().measure(rect);
    const apply: IStickyItemHandle['apply'] = layout => {
      if (!layout) { reset(); return; }
      resetNative();
      fixedItem().apply(layout);
    };
    const applyNative = (top: number, zIndex: number) => {
      if (nativeTop === top && nativeZIndex === zIndex) return;
      reset();
      nativeTop = top;
      nativeZIndex = zIndex;
      wrapper.style.setProperty('--oe-sticky-top', `${top}px`);
      wrapper.style.setProperty('--oe-sticky-z', String(zIndex));
      wrapper.classList.add('is-native-sticky');
    };
    const handle: IStickyItemHandle = { canNative: false, prepareFixed: resetNative, applyNative, el: wrapper, content, mode: effectiveMode, apply, measure, invalidate: () => fixed?.invalidate() };
    measurementRef.current = handle;
    const unregister = register(handle);
    return () => {
      measurementRef.current = null;
      unregister();
      reset();
    };
  }, [register, effectiveMode, baseZIndex, normalHeight, getFixedItemFactory]);

  useEffect(() => {
    if (measurementRef.current) {
      const style = rest.style;
      measurementRef.current.canNative = normalHeight === undefined && style?.position === undefined &&
        style?.top === undefined && style?.bottom === undefined && style?.zIndex === undefined;
      if (!measurementRef.current.canNative && wrapperRef.current?.classList.contains('is-native-sticky')) {
        measurementRef.current.apply(null);
      }
      measurementRef.current.invalidate();
    }
    scheduleUpdate?.();
  });

  return (
    <div {...rest} className={['oe-sticky-item', className].filter(Boolean).join(' ')} ref={wrapperRef}>
      <div className="oe-sticky-content" ref={contentRef}>{children}</div>
    </div>
  );
}
