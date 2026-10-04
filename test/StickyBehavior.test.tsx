import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StickyContainer, StickyItem } from '../src';

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let resize: ResizeObserverCallback;
const disconnect = vi.fn();
let reads: string[];
let writes: string[];
const geometry = new WeakMap<Element, { top?: number; height?: number; width?: number; bottom?: number }>();

function flush() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(0));
  });
}
function box(element: Element, values: { top?: number; height?: number; width?: number; bottom?: number }) {
  geometry.set(element, values);
}
function item(element: HTMLElement) {
  return element.querySelector('.oe-sticky-content') as HTMLElement;
}

beforeEach(() => {
  frames = new Map();
  nextId = 0;
  reads = [];
  writes = [];
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = disconnect;
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    reads.push(this.className);
    expect(writes).toEqual([]);
    const value = geometry.get(this) ?? {};
    const top = value.top ?? -100;
    const height = value.height ?? (this.classList.contains('oe-sticky-container') ? 1000 : 40);
    return { x: 0, y: top, top, bottom: value.bottom ?? top + height,
      left: 0, right: value.width ?? 300.5, width: value.width ?? 300.5, height,
      toJSON: () => ({}) };
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); disconnect.mockClear(); });

describe('sticky layout and lifecycle', () => {
  it('activates on the first frame and preserves custom classes and fractional dimensions', () => {
    const onHeight = vi.fn();
    const { getByTestId } = render(<StickyContainer className="custom" data-testid="container" offsetTop={12} onStickyItemsHeightChange={onHeight}>
      <StickyItem data-testid="a">A</StickyItem>
    </StickyContainer>);
    flush();
    expect(getByTestId('container')).toHaveClass('custom', 'can-sticky');
    expect(item(getByTestId('a'))).toHaveClass('is-sticky');
    expect(item(getByTestId('a'))).toHaveStyle({ top: '12px', width: '300.5px' });
    expect(onHeight.mock.calls).toEqual([[40]]);
  });

  it('coalesces scroll bursts including animation frame ID zero', () => {
    render(<StickyContainer><StickyItem>A</StickyItem></StickyContainer>);
    for (let index = 0; index < 30; index++) fireEvent.scroll(window);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    flush();
    expect(reads).toHaveLength(3);
  });

  it('does not measure items when a container is outside its sticky range', () => {
    const { getByTestId } = render(<StickyContainer data-testid="container">
      {Array.from({ length: 100 }, (_, index) => <StickyItem key={index}>{index}</StickyItem>)}
    </StickyContainer>);
    box(getByTestId('container'), { top: 1000 });
    flush();
    expect(reads).toHaveLength(1);
  });

  it('only measures the eligible replacement header, even with many passed and future headers', () => {
    const { getByTestId } = render(<StickyContainer>
      {Array.from({ length: 100 }, (_, index) => <StickyItem key={index} data-testid={`header-${index}`}>{index}</StickyItem>)}
    </StickyContainer>);
    for (let index = 0; index < 100; index++) box(getByTestId(`header-${index}`), { top: (index - 50) * 200 - 100 });
    flush();
    expect(reads.filter(className => className === 'oe-sticky-content')).toHaveLength(1);
    expect(item(getByTestId('header-50'))).toHaveClass('is-sticky');
    expect(item(getByTestId('header-49'))).not.toHaveClass('is-sticky');
    expect(item(getByTestId('header-51'))).not.toHaveClass('is-sticky');
  });

  it('batches geometry reads before any style writes and avoids registration measurements', () => {
    const { getByTestId } = render(<StickyContainer defaultMode="stack">
      <StickyItem data-testid="a">A</StickyItem><StickyItem data-testid="b">B</StickyItem>
    </StickyContainer>);
    expect(reads).toHaveLength(0);
    const toggle = DOMTokenList.prototype.toggle;
    vi.spyOn(DOMTokenList.prototype, 'toggle').mockImplementation(function (this: DOMTokenList, ...args: Parameters<typeof toggle>) {
      writes.push('class');
      return toggle.apply(this, args);
    });
    flush();
    expect(reads).toHaveLength(5);
    expect(item(getByTestId('b'))).toHaveStyle({ top: '40px', zIndex: '201' });
  });

  it('keeps visual layout order when it differs from DOM order', () => {
    const { getByTestId } = render(<StickyContainer defaultMode="stack">
      <StickyItem data-testid="a">A</StickyItem><StickyItem data-testid="b">B</StickyItem>
    </StickyContainer>);
    box(getByTestId('b'), { top: -120 });
    flush();
    expect(item(getByTestId('b'))).toHaveStyle({ top: '0px', zIndex: '200' });
    expect(item(getByTestId('a'))).toHaveStyle({ top: '40px', zIndex: '201' });
  });

  it('replaces headers as the next wrapper reaches the viewport', () => {
    const { getByTestId } = render(<StickyContainer>
      <StickyItem data-testid="a">A</StickyItem><StickyItem data-testid="b">B</StickyItem>
    </StickyContainer>);
    box(getByTestId('b'), { top: 20 });
    flush();
    expect(item(getByTestId('a'))).toHaveStyle({ top: '-20px' });
    expect(item(getByTestId('b'))).not.toHaveClass('is-sticky');
    box(getByTestId('b'), { top: -1 });
    fireEvent.scroll(window); flush();
    expect(item(getByTestId('a'))).not.toHaveClass('is-sticky');
    expect(item(getByTestId('b'))).toHaveStyle({ top: '0px' });
  });

  it('tracks dynamic height and reports only the final height for each frame', () => {
    const onHeight = vi.fn();
    const { getByTestId } = render(<StickyContainer defaultMode="stack" onStickyItemsHeightChange={onHeight}>
      <StickyItem data-testid="a">A</StickyItem><StickyItem data-testid="b">B</StickyItem>
    </StickyContainer>);
    flush();
    expect(onHeight.mock.calls).toEqual([[80]]);
    box(item(getByTestId('a')), { height: 75 });
    resize([], {} as ResizeObserver); flush();
    expect(getByTestId('a')).toHaveStyle({ height: '75px' });
    expect(item(getByTestId('b'))).toHaveStyle({ top: '75px' });
    expect(onHeight.mock.calls).toEqual([[80], [115]]);
    fireEvent.scroll(window); flush();
    expect(onHeight).toHaveBeenCalledTimes(2);
  });

  it('pushes the stack above the container bottom and clears all sticky styles when it leaves', () => {
    const onHeight = vi.fn();
    const { getByTestId } = render(<StickyContainer data-testid="container" defaultMode="stack" onStickyItemsHeightChange={onHeight}>
      <StickyItem data-testid="a" style={{ height: 60 }}>A</StickyItem><StickyItem data-testid="b">B</StickyItem>
    </StickyContainer>);
    box(getByTestId('container'), { bottom: 60 }); flush();
    expect(item(getByTestId('a'))).toHaveStyle({ top: '-20px' });
    expect(item(getByTestId('b'))).toHaveStyle({ top: '20px' });
    box(getByTestId('container'), { bottom: -1 }); fireEvent.scroll(window); flush();
    expect(getByTestId('container')).not.toHaveClass('can-sticky');
    expect(item(getByTestId('a')).style.cssText).toBe('');
    expect(getByTestId('a')).toHaveStyle({ height: '60px' });
    expect(onHeight.mock.calls).toEqual([[80], [0]]);
  });

  it('updates offset, z-index, modes and keyed DOM order without a scroll', () => {
    function View({ reversed = false, offset = 0, mode = 'stack' as const, z = 200 }) {
      return <StickyContainer offsetTop={offset} baseZIndex={z} defaultMode={mode}>
        {(reversed ? ['b', 'a'] : ['a', 'b']).map(key => <StickyItem key={key} data-testid={key}>{key}</StickyItem>)}
      </StickyContainer>;
    }
    const { getByTestId, rerender } = render(<View />); flush();
    rerender(<View reversed offset={12} z={999} />); flush();
    expect(item(getByTestId('b'))).toHaveStyle({ top: '12px', zIndex: '999' });
    expect(item(getByTestId('a'))).toHaveStyle({ top: '52px', zIndex: '1000' });
  });

  it('cleans up when mode changes to none and when an item is removed', () => {
    const onHeight = vi.fn();
    const { getByTestId, rerender } = render(<StickyContainer onStickyItemsHeightChange={onHeight}><StickyItem data-testid="a">A</StickyItem></StickyContainer>);
    flush();
    rerender(<StickyContainer defaultMode="none" onStickyItemsHeightChange={onHeight}><StickyItem data-testid="a">A</StickyItem></StickyContainer>);
    flush();
    expect(item(getByTestId('a'))).not.toHaveClass('is-sticky');
    expect(getByTestId('a').style.height).toBe('');
    expect(onHeight.mock.calls).toEqual([[40], [0]]);
  });

  it('restores the latest user height after a sticky style prop changes', () => {
    const { getByTestId, rerender } = render(<StickyContainer><StickyItem data-testid="a" style={{ height: 60 }}>A</StickyItem></StickyContainer>);
    flush();
    rerender(<StickyContainer><StickyItem data-testid="a" style={{ height: 90 }}>A</StickyItem></StickyContainer>);
    flush();
    rerender(<StickyContainer defaultMode="none"><StickyItem data-testid="a" style={{ height: 90 }}>A</StickyItem></StickyContainer>);
    flush();
    expect(getByTestId('a')).toHaveStyle({ height: '90px' });
  });

  it('cancels pending work and disconnects observers under StrictMode and unmount', () => {
    const onHeight = vi.fn();
    const { unmount } = render(<StrictMode><StickyContainer onStickyItemsHeightChange={onHeight}><StickyItem>A</StickyItem></StickyContainer></StrictMode>);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(disconnect).toHaveBeenCalledTimes(2);
    resize([], {} as ResizeObserver); fireEvent.scroll(window); flush();
    expect(onHeight).not.toHaveBeenCalled();
  });

  it('disconnects layout mutation observers under StrictMode and unmount', () => {
    const observers: { active: boolean }[] = [];
    vi.stubGlobal('MutationObserver', class {
      active = false;
      constructor() { observers.push(this); }
      observe() { this.active = true; }
      disconnect() { this.active = false; }
    });
    const { unmount } = render(<StrictMode><StickyContainer><StickyItem>A</StickyItem></StickyContainer></StrictMode>);
    expect(observers.filter(observer => observer.active)).toHaveLength(1);
    unmount();
    expect(observers.filter(observer => observer.active)).toHaveLength(0);
  });

  it('handles element scroll events and works without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { getByTestId } = render(<div data-testid="scroll"><StickyContainer constraint="none"><StickyItem data-testid="a">A</StickyItem></StickyContainer></div>);
    box(getByTestId('a'), { top: 100 }); flush();
    expect(item(getByTestId('a'))).not.toHaveClass('is-sticky');
    box(getByTestId('a'), { top: -1 });
    fireEvent.scroll(getByTestId('scroll')); flush();
    expect(item(getByTestId('a'))).toHaveClass('is-sticky');
  });
});
