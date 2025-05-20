import { useState, useRef, useEffect } from 'react';
import { StickyContainer, StickyItem } from '../src';

/**
 * Demo showing dynamic offsetTop that changes based on a header's height
 * This demo shows how to use React's state to manage a dynamic offsetTop value
 */
export default function DynamicOffsetDemo() {
  const [headerHeight, setHeaderHeight] = useState(60);
  const [autoAdjust, setAutoAdjust] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Handle manual adjustment of header height
  const increaseHeaderHeight = () => {
    setHeaderHeight(prev => Math.min(prev + 20, 200));
  };
  
  const decreaseHeaderHeight = () => {
    setHeaderHeight(prev => Math.max(prev - 20, 40));
  };
  
  // Automatically measure and update header height when in auto mode
  useEffect(() => {
    if (!autoAdjust || !headerRef.current) return;
    
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        setHeaderHeight(Math.round(height));
      }
    };
    
    // Initial measurement
    updateHeaderHeight();
    
    // Use ResizeObserver to detect changes in header size (for the resizable element)
    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight();
    });
    
    resizeObserver.observe(headerRef.current);
    
    // Also re-measure on window resize
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      resizeObserver.disconnect();
    };
  }, [autoAdjust]);
  
  return (
    <div className="dynamic-offset-demo">
      {/* Header with adjustable height */}
      <div 
        ref={headerRef}
        className="demo-header" 
        style={{ 
          ...(autoAdjust ? {} : { height: `${headerHeight}px` }),
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          background: '#4a6fa5',
          color: 'white',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          boxSizing: 'border-box',
          borderBottom: '2px solid #2c4a7c'
        }}
      >
        <div>
          <div>Dynamic Header - Height: {headerHeight}px</div>
          <div style={{ fontSize: '0.8rem' }}>
            {autoAdjust ? 'Auto mode: Drag the resizable element below to change header height' : 'Manual mode: Use buttons to adjust'}
          </div>
          {autoAdjust && (
            <div 
              style={{ 
                marginTop: '10px', 
                padding: '10px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                cursor: 'row-resize',
                resize: 'vertical',
                overflow: 'auto',
                minHeight: '20px',
                maxHeight: '100px'
              }}
            >
              <div>↕ Drag to resize this element ↕</div>
              <div>Changes will automatically update offsetTop</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAutoAdjust(!autoAdjust)} style={{ fontWeight: autoAdjust ? 'bold' : 'normal' }}>
            {autoAdjust ? 'Disable Auto' : 'Enable Auto'}
          </button>
          <button onClick={decreaseHeaderHeight} disabled={autoAdjust}>
            Decrease
          </button>
          <button onClick={increaseHeaderHeight} disabled={autoAdjust}>
            Increase
          </button>
        </div>
      </div>

      <div>
        <h2>Dynamic offsetTop Demo</h2>
        <p>
          This demo shows how to use React state to dynamically calculate and update the offsetTop 
          value. The sticky sections below will maintain the correct distance from the header.
        </p>
        
        {/* Use the dynamic headerHeight value as offsetTop */}
        <StickyContainer offsetTop={headerHeight}>
          <StickyItem>
            <div style={{ background: '#e9c46a', padding: '15px' }}>
              <h3>Sticky Section 1</h3>
              <p>This section maintains proper distance from the dynamic header above.</p>
              <p><strong>Current offsetTop: {headerHeight}px</strong></p>
            </div>
          </StickyItem>
          
          <div style={{ height: '300px', padding: '20px', background: '#f4f4f4' }}>
            <h3>Regular content</h3>
            <p>Scroll down to see the next sticky section. Try changing the header height.</p>
          </div>
          
          <StickyItem>
            <div style={{ background: '#f4a261', padding: '15px' }}>
              <h3>Sticky Section 2</h3>
              <p>As the header height changes, this section also adapts automatically.</p>
            </div>
          </StickyItem>
          
          <div style={{ height: '300px', padding: '20px', background: '#f4f4f4' }}>
            <h3>More regular content</h3>
            <p>Keep scrolling to see how the sticky behavior works with dynamic offsets.</p>
          </div>
          
          <StickyItem>
            <div style={{ background: '#e76f51', padding: '15px' }}>
              <h3>Sticky Section 3</h3>
              <p>
                Notice how all sticky headers maintain the correct distance from the 
                dynamic header as you scroll and adjust the header height.
              </p>
            </div>
          </StickyItem>
          
          <div style={{ height: '500px', padding: '20px', background: '#f4f4f4' }}>
            <h3>Implementation Details</h3>
            <p>
              This example shows two approaches for dynamic offsetTop:
            </p>
            <ul>
              <li>
                <strong>Manual mode:</strong> You control the header height with buttons,
                and the state value is passed to the StickyContainer.
              </li>
              <li>
                <strong>Auto mode:</strong> The component removes the fixed height constraint, 
                allowing the header&apos;s height to be determined by its content. You can resize 
                the draggable element in the header, and the component measures the actual 
                header height using <code>getBoundingClientRect()</code> and updates the state 
                accordingly, which then flows to the StickyContainer component.
              </li>
            </ul>
            <p>
              When the state value changes, React automatically re-renders the component
              with the new offsetTop value, ensuring proper positioning of the sticky elements.
            </p>
          </div>
        </StickyContainer>
      </div>
    </div>
  );
}
