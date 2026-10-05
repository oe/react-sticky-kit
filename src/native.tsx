import React, { createContext, useContext, useMemo } from 'react';

export interface IStickyContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Native CSS offset, relative to the nearest scrolling ancestor. */
  offsetTop?: number;
  /** z-index of native sticky items. Defaults to 200, with a minimum of 20. */
  baseZIndex?: number;
}
export interface IStickyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
const NativeContext = createContext<{ offsetTop: number; baseZIndex: number } | null>(null);

/** CSS-only entry. No fixed fallback, height measurement or multi-item coordination. */
export function StickyContainer({ children, offsetTop = 0, baseZIndex = 200, className,
  style, ...rest }: IStickyContainerProps): React.ReactElement<any, any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- Same public JSX return shape as the full entry.
  const zIndex = Math.max(Number(baseZIndex) || 0, 20);
  const options = useMemo(() => ({ offsetTop, baseZIndex: zIndex }), [offsetTop, zIndex]);
  return <NativeContext.Provider value={options}>
    <div {...rest} className={['oe-sticky-container', className].filter(Boolean).join(' ')}
      style={{ position: 'relative', ...style }}>{children}</div>
  </NativeContext.Provider>;
}

export function StickyItem({ children, className, style, ...rest }: IStickyItemProps): React.ReactElement<any, any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- Same public JSX return shape as the full entry.
  const options = useContext(NativeContext);
  if (!options) throw new Error('Import StickyContainer and StickyItem together from react-sticky-kit/native.');
  return <div {...rest} className={['oe-sticky-item', className].filter(Boolean).join(' ')}
    style={{ position: 'sticky', top: options.offsetTop, zIndex: options.baseZIndex, ...style }}>
    <div className="oe-sticky-content">{children}</div>
  </div>;
}
