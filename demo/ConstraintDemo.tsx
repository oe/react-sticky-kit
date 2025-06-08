/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { StickyContainer, StickyItem } from '../src';

const COLORS = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'];

/**
 * Demo showcasing the constraint prop functionality.
 * This demo shows the difference between default and no constraint behavior.
 */
export function ConstraintDemo() {
  return (
    <div className="demo-page demo-page-constraint">
      <h1>Constraint Demo</h1>
      <p>This demo shows how to use the <code>constraint</code> prop to control sticky element behavior.</p>

      <div className="demo-section">
        <h2>1. Default Constraint</h2>
        <p>Default behavior: sticky items are constrained by the StickyContainer's viewport visibility.</p>
        <p>When the StickyContainer leaves the viewport, sticky items stop being sticky.</p>
        
        <StickyContainer defaultMode='stack'>
          <div style={{ height: '100px', background: '#eee', marginBottom: '10px' }}>
            Content before sticky items - scroll to see how they behave when container leaves viewport
          </div>
          {[...Array(3)].map((_, i) => (
            <StickyItem key={i}>
              <div style={{ 
                padding: '10px', 
                background: COLORS[i % COLORS.length], 
                border: '1px solid #666',
              }}>
                Default Constraint - Sticky Item {i + 1}
              </div>
            </StickyItem>
          ))}
          <div style={{ height: '300px', background: '#eee', marginTop: '10px' }}>
            Content below sticky items
          </div>
        </StickyContainer>
      </div>

      <div className="demo-section">
        <h2>2. No Constraint Behavior</h2>
        <p>Using <code>constraint="none"</code>: sticky items behave like CSS position:sticky (no constraints).</p>
        <p>These items will stick when scrolling the whole page, regardless of container's visibility.</p>
        
        <StickyContainer constraint="none" defaultMode='stack'>
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
                No Constraint - Sticky Item {i + 1}
              </div>
            </StickyItem>
          ))}
          <div style={{ height: '300px', background: '#f5f5f5', marginTop: '20px' }}>
            Content below sticky items
          </div>
        </StickyContainer>
      </div>

      {/* Add some space at the bottom for scrolling demonstrations */}
      <div style={{ height: '800px' }}></div>
    </div>
  );
}

export default ConstraintDemo;
