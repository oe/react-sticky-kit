import { createContext, useContext } from 'react';

export const MIN_BASE_Z_INDEX = 20;
export const DEFAULT_BASE_Z_INDEX = 200;

/** Replace the previous item, stack below it, or disable sticky behavior. */
export type IStickyMode = 'replace' | 'stack' | 'none';

export interface IStickyItemHandle {
  el: HTMLElement;
  content: HTMLElement;
  mode: Exclude<IStickyMode, 'none'>;
  apply: (top: number | null, height: number, width: number, index: number) => void;
}

export interface IStickyGroupContextValue {
  baseZIndex: number;
  register: (handle: IStickyItemHandle) => () => void;
  mode: IStickyMode;
}

export const StickyGroupContext = createContext<IStickyGroupContextValue | null>(null);

export function useStickyContext() {
  return useContext(StickyGroupContext);
}
