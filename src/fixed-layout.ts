import type { IStickyItemHandle, IStickyItemMeasurement } from './context.js';
import type { IStickyContainerProps } from './container.js';
import type { subscribeUpdates } from './scheduler.js';

type Ref<T> = { current: T };
export type ContainerOptions = Pick<IStickyContainerProps, 'constraint' | 'onStickyItemsHeightChange'> &
  Required<Pick<IStickyContainerProps, 'offsetTop' | 'offsetBottom' | 'overflowBehavior' | 'positionStrategy' | 'baseZIndex'>>;
export interface FixedRefs {
  itemsRef: Ref<Set<IStickyItemHandle>>;
  measurementsRef: Ref<{ item: IStickyItemHandle; rect: DOMRect }[] | null>;
  overflowRef: Ref<{ scrollY: number; shift: number; maximum: number } | null>;
  stickyRef: Ref<boolean>;
  heightRef: Ref<number>;
  updatesRef: Ref<ReturnType<typeof subscribeUpdates> | null>;
}
export function readFixedLayout(container: HTMLElement, rect: DOMRect, options: ContainerOptions, refs: FixedRefs) {
  const { itemsRef, measurementsRef, overflowRef, stickyRef, heightRef, updatesRef } = refs;
  // Reuse storage, not geometry: rectangles and visual order stay fresh each frame.
  let measurements = measurementsRef.current;
  if (measurements) {
    for (const entry of measurements) {
      entry.item.prepareFixed();
      entry.rect = entry.item.el.getBoundingClientRect();
    }
  } else {
    measurements = measurementsRef.current = [...itemsRef.current].map(item => {
      // Clear native positioning before sorting/measuring the original flow geometry.
      // The scheduler applies fixed plans in the same frame, before the browser paints.
      item.prepareFixed();
      return { item, rect: item.el.getBoundingClientRect() };
    });
  }
  measurements.sort((a, b) => {
    const difference = a.rect.top - b.rect.top;
    if (difference !== 0) return difference;
    const position = a.item.el.compareDocumentPosition(b.item.el);
    return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  const scrolling = options.overflowBehavior === 'scroll';
  const scrollY = scrolling ? window.scrollY : 0;
  const previous = scrolling ? overflowRef.current : null;
  let shift = 0;
  let firstDimensions: IStickyItemMeasurement | undefined;
  if (scrolling) {
    if (previous) shift = Math.max(-previous.maximum, Math.min(0, previous.shift - (scrollY - previous.scrollY)));
    else {
      const first = measurements[0];
      if (first && first.rect.top <= options.offsetTop) {
        firstDimensions = first.item.measure(first.rect);
        const height = firstDimensions.height;
        const maximum = Math.max(0, height + options.offsetTop + Math.max(0, options.offsetBottom) - window.innerHeight);
        shift = Math.max(-maximum, Math.min(0, first.rect.top - options.offsetTop));
      }
    }
  }
  const replaceOnly = scrolling && measurements.every(({ item }) => item.mode === 'replace');
  let offset = options.offsetTop + shift;
  let totalHeight = 0;
  const plans = measurements.map(({ item, rect: itemRect }, index) => {
    const activationTop = offset - (replaceOnly ? shift : 0);
    if (itemRect.top > activationTop) return null;
    const nextTop = measurements[index + 1]?.rect.top;
    if (item.mode === 'replace' && nextTop !== undefined && nextTop < activationTop) return null;
    // Only eligible contents need measuring; all reads still precede every write.
    const dimensions = index === 0 && firstDimensions ? firstDimensions : item.measure(itemRect);
    const top = item.mode === 'replace' && nextTop !== undefined ?
      Math.min(offset, nextTop - dimensions.height) : offset;
    totalHeight += dimensions.height;
    if (item.mode === 'stack') offset += dimensions.height;
    return { ...dimensions, top, index };
  });
  let overflow: { scrollY: number; shift: number; maximum: number } | null = null;
  if (scrolling && totalHeight > 0) {
    const maximum = Math.max(0, totalHeight + options.offsetTop + Math.max(0, options.offsetBottom) - window.innerHeight);
    const nextShift = Math.max(-maximum, shift);
    for (const plan of plans) if (plan) plan.top += nextShift - shift;
    overflow = { scrollY, shift: nextShift, maximum };
  }
  const correction = options.constraint === 'none' ? 0 :
    Math.min(0, rect.bottom - options.offsetTop - totalHeight - (overflow?.shift ?? 0));
  return () => {
    updatesRef.current?.setScrollEnabled(true);
    overflowRef.current = overflow;
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
}

export type FixedItem = Pick<IStickyItemHandle, 'measure' | 'apply' | 'invalidate'>;
export function createFixedItem(wrapper: HTMLElement, content: HTMLElement,
  normalHeight: import('react').CSSProperties['height'], baseZIndex: number | undefined,
  effectiveMode: IStickyItemHandle['mode']): FixedItem {
  const originalHeight = typeof normalHeight === 'number' ? `${normalHeight}px` : normalHeight ?? '';
  const automaticHeight = normalHeight === undefined || ['auto', 'initial', 'unset', 'revert',
    'revert-layer', 'fit-content', 'min-content', 'max-content'].includes(String(normalHeight));
  let sticky = false;
  let previousLayout: Parameters<IStickyItemHandle['apply']>[0] = null;
  const reset = () => {
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
  return { measure, apply, invalidate: () => { box = null; previousLayout = null; } };
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
