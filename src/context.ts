import { createContext, useContext } from 'react';

export const MIN_BASE_Z_INDEX = 20;
export const DEFAULT_BASE_Z_INDEX = 200;

/** Replace the previous item, stack below it, or disable sticky behavior. */
export type IStickyMode = 'replace' | 'stack' | 'none';

export interface IStickyItemMeasurement {
  height: number;
  wrapperHeight: number;
  width: number;
  left: number;
}

export interface IStickyItemHandle {
  el: HTMLElement;
  content: HTMLElement;
  canNative: boolean;
  applyNative: (top: number, zIndex: number) => void;
  mode: Exclude<IStickyMode, 'none'>;
  measure: (rect: DOMRect) => IStickyItemMeasurement;
  invalidate: () => void;
  apply: (layout: (IStickyItemMeasurement & { top: number; index: number }) | null) => void;
}

export interface IStickyGroupContextValue {
  baseZIndex: number;
  register: (handle: IStickyItemHandle) => () => void;
  scheduleUpdate: () => void;
  mode: IStickyMode;
}

export const StickyGroupContext = createContext<IStickyGroupContextValue | null>(null);

export function useStickyContext() {
  return useContext(StickyGroupContext);
}
