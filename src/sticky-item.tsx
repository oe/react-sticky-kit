import React, { useRef, useEffect } from 'react';
import { type IStickyMode, type IStickyItemHandle, useStickyContext } from './context.js';

export interface IStickyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Sticky mode for this item. Defaults to the StickyContainer's mode. */
  mode?: IStickyMode;
  /** Scroll an oversized active group before pinning its corresponding edge. */
  overflowBehavior?: 'pin' | 'scroll';
}

export function StickyItem({ mode, overflowBehavior = 'pin', children, className, ...rest }: IStickyItemProps): React.ReactElement<any, any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- Preserve the existing JSX.Element return shape.
  const context = useStickyContext();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const register = context?.register;
  const effectiveMode = mode ?? context?.mode;
  const baseZIndex = context?.baseZIndex;
  const normalHeight = rest.style?.height;
  const measurementRef = useRef<IStickyItemHandle | null>(null);
  const scheduleUpdate = context?.scheduleUpdate;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;
    const originalHeight = typeof normalHeight === 'number' ? `${normalHeight}px` : normalHeight ?? '';
    setStyle(wrapper, 'height', originalHeight);
    if (!register || !effectiveMode || effectiveMode === 'none') return;
    const automaticHeight = normalHeight === undefined || ['auto', 'initial', 'unset', 'revert',
      'revert-layer', 'fit-content', 'min-content', 'max-content'].includes(String(normalHeight));
    let sticky = false;
    let nativeLayout: string | null = null;
    let previousLayout: Parameters<IStickyItemHandle['apply']>[0] = null;
    const reset = () => {
      if (nativeLayout !== null) {
        nativeLayout = null;
        wrapper.classList.remove('is-native-sticky');
        wrapper.style.removeProperty('--oe-sticky-top');
        wrapper.style.removeProperty('--oe-sticky-z');
      }
      if (!sticky) return;
      sticky = false;
      previousLayout = null;
      content.classList.remove('is-sticky');
      wrapper.style.height = originalHeight;
      for (const property of ['top', 'left', 'width', 'z-index']) content.style.removeProperty(property);
    };
    let box: ReturnType<typeof readBox> | null = null;
    const measure: IStickyItemHandle['measure'] = rect => {
      box ??= readBox(wrapper, content);
      const height = content.getBoundingClientRect().height;
      return { height, wrapperHeight: height + box.heightInset,
        width: Math.max(0, rect.width - box.widthInset), left: rect.left + box.leftInset };
    };
    const apply: IStickyItemHandle['apply'] = layout => {
      if (layout === null) {
        reset();
        return;
      }
      if (nativeLayout !== null) reset();
      const { top, wrapperHeight, width, left, index } = layout;
      if (previousLayout && previousLayout.top === top && previousLayout.wrapperHeight === wrapperHeight &&
        previousLayout.width === width && previousLayout.left === left && previousLayout.index === index) return;
      previousLayout = layout;
      if (automaticHeight) setStyle(wrapper, 'height', `${wrapperHeight}px`);
      setStyle(content, 'top', `${top}px`);
      setStyle(content, 'left', `${left}px`);
      setStyle(content, 'width', `${width}px`);
      setStyle(content, 'zIndex', `${(baseZIndex ?? 200) + (effectiveMode === 'replace' ? -index : index)}`);
      // Keep the placeholder in flow before switching position to avoid scroll jumps.
      if (!sticky) {
        sticky = true;
        content.classList.add('is-sticky');
      }
    };
    const applyNative = (top: number, zIndex: number) => {
      const key = `${top}:${zIndex}`;
      if (nativeLayout === key) return;
      reset();
      nativeLayout = key;
      wrapper.style.setProperty('--oe-sticky-top', `${top}px`);
      wrapper.style.setProperty('--oe-sticky-z', String(zIndex));
      wrapper.classList.add('is-native-sticky');
    };
    const handle: IStickyItemHandle = { overflowBehavior, canNative: false, applyNative, el: wrapper, content, mode: effectiveMode, apply, measure, invalidate: () => { box = null; previousLayout = null; } };
    measurementRef.current = handle;
    const unregister = register(handle);
    return () => {
      measurementRef.current = null;
      unregister();
      reset();
    };
  }, [register, effectiveMode, baseZIndex, normalHeight, overflowBehavior]);

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

function setStyle(element: HTMLElement, property: 'height' | 'top' | 'left' | 'width' | 'zIndex', value: string) {
  if (element.style[property] !== value) element.style[property] = value;
}

function readBox(wrapper: HTMLElement, content: HTMLElement) {
  const outer = getComputedStyle(wrapper);
  const inner = getComputedStyle(content);
  const number = (value: string) => Number.parseFloat(value) || 0;
  const horizontal = (style: CSSStyleDeclaration) => number(style.paddingLeft) + number(style.paddingRight) +
    number(style.borderLeftWidth) + number(style.borderRightWidth);
  return {
    heightInset: outer.boxSizing === 'border-box' ? number(outer.paddingTop) + number(outer.paddingBottom) +
      number(outer.borderTopWidth) + number(outer.borderBottomWidth) : 0,
    widthInset: horizontal(outer) + (inner.boxSizing === 'border-box' ? 0 : horizontal(inner)),
    leftInset: number(outer.paddingLeft) + number(outer.borderLeftWidth),
  };
}
