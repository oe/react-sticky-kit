/* eslint-disable react/no-unescaped-entities */
import React, { useRef } from 'react';
import { StickyContainer, StickyItem } from '../src';

const COLORS = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'];

/**
 * Demo showcasing the referenceContainer prop functionality.
 * This demo creates a page with three sections:
 * 1. Default container (parent-based) sticky behavior
 * 2. Window-based sticky behavior
 * 3. Custom container sticky behavior
 */
export function ReferenceContainerDemo() {
  const customContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="demo-page demo-page-reference-container">
      <h1>Reference Container Demo</h1>
      <p>This demo shows how to use the <code>referenceContainer</code> prop to control sticky element behavior.</p>

      <div className="demo-section">
        <h2>Default Container Behavior</h2>
        <p>In this example, sticky items behave relative to their parent container's visibility in the viewport.</p>
        <p>Scroll down to see the effect.</p>
        
        <div className="demo-container" style={{ border: '2px solid #999', margin: '20px 0', height: '400px', overflow: 'auto' }}>
          <div style={{ padding: '20px', height: '800px' }}>
            <StickyContainer defaultMode='stack'>
              <div style={{ height: '100px', background: '#eee' }}>Scroll down inside this container</div>
              {[...Array(3)].map((_, i) => (
                <StickyItem key={i}>
                  <div style={{ 
                    padding: '10px', 
                    background: COLORS[i % COLORS.length], 
                    border: '1px solid #666',
                  }}>
                    Default Container - Sticky Item {i + 1}
                  </div>
                </StickyItem>
              ))}
              <div style={{ height: '600px', background: '#eee' }}>Content below</div>
            </StickyContainer>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2>Window-Based Behavior</h2>
        <p>In this example, sticky items behave relative to the window viewport (similar to CSS position:sticky).</p>
        <p>These items will stick when scrolling the whole page, regardless of their parent container's visibility.</p>
        <p><strong>Note:</strong> When using <code>referenceContainer="window"</code>, sticky items will always stick when they reach the top of the viewport, making them behave like native CSS <code>position: sticky</code>.</p>
        
        <StickyContainer referenceContainer="window">
          <div style={{ padding: '20px', background: '#f5f5f5', marginBottom: '20px' }}>
            Content before sticky items
          </div>
          {[...Array(3)].map((_, i) => (
            <StickyItem key={i} mode={i % 2 === 0 ? 'stack' : 'replace'}>
              <div style={{ 
                padding: '10px', 
                background: COLORS[i % COLORS.length], 
                border: '1px solid #666',
              }}>
                Window Container - Sticky Item {i + 1}
              </div>
            </StickyItem>
          ))}
          <div style={{ height: '300px', background: '#f5f5f5', marginTop: '20px' }}>
            Content below sticky items
          </div>
        </StickyContainer>
      </div>

      <div className="demo-section">
        <h2>Custom Container Reference</h2>
        <p>In this example, sticky items behave relative to a specific container referenced by a ref.</p>
        <p>The sticky behavior is controlled by the custom container's position in the viewport.</p>
        
        <div 
          ref={customContainerRef} 
          style={{ 
            border: '2px solid #000', 
            background: '#f0f0f0', 
            padding: '10px', 
            height: '500px', 
            margin: '20px 0' 
          }}
        >
          <h3>Reference Container</h3>
          <p>Sticky elements below will reference this container's position</p>
        </div>
        
        <StickyContainer referenceContainer={customContainerRef}>
          <div style={{ padding: '20px', background: '#f5f5f5', marginBottom: '20px' }}>
            Content before sticky items
          </div>
          {[...Array(3)].map((_, i) => (
            <StickyItem key={i}>
              <div style={{ 
                padding: '10px', 
                background: COLORS[i % COLORS.length], 
                border: '1px solid #666',
              }}>
                Custom Container Reference - Sticky Item {i + 1}
              </div>
            </StickyItem>
          ))}
          <div style={{ height: '300px', background: '#f5f5f5', marginTop: '20px' }}>
            Content below sticky items
          </div>
        </StickyContainer>
      </div>
      
      {/* Add some space at the bottom for scrolling demonstrations */}
      <div style={{ height: '600px' }}></div>
    </div>
  );
}

export default ReferenceContainerDemo;
