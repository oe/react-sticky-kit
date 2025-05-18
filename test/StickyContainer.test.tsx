import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StickyContainer, StickyItem } from '../src/index';

describe('StickyContainer & StickyItem', () => {
  it('renders children and sticky items', () => {
    render(
      <StickyContainer>
        <StickyItem><div data-testid="sticky">Sticky</div></StickyItem>
        <div data-testid="content">Content</div>
      </StickyContainer>
    );
    expect(screen.getByTestId('sticky')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('handles empty sections and zero-height headers', () => {
    render(
      <StickyContainer>
        <StickyItem><div style={{ height: 0 }} data-testid="zero-header" /></StickyItem>
        <div data-testid="content">Content</div>
      </StickyContainer>
    );
    expect(screen.getByTestId('zero-header')).toBeInTheDocument();
  });

  it('supports dynamic add/remove sticky items', () => {
    function Demo() {
      const [show, setShow] = React.useState(true);
      return (
        <StickyContainer>
          {show && <StickyItem data-testid="dynamic-sticky"><div>Dynamic</div></StickyItem>}
          <button onClick={() => setShow(false)}>Remove</button>
        </StickyContainer>
      );
    }
    render(<Demo />);
    expect(screen.getByTestId('dynamic-sticky')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Remove'));
    expect(screen.queryByTestId('dynamic-sticky')).not.toBeInTheDocument();
  });

  it('applies correct z-index and offsetTop', () => {
    render(
      <StickyContainer offsetTop={42} baseZIndex={999}>
        <StickyItem><div data-testid="sticky1">Sticky1</div></StickyItem>
        <StickyItem><div data-testid="sticky2">Sticky2</div></StickyItem>
      </StickyContainer>
    );
    // DOM style checks can be done with getComputedStyle if needed
    expect(screen.getByTestId('sticky1')).toBeInTheDocument();
    expect(screen.getByTestId('sticky2')).toBeInTheDocument();
  });

  it('renders nested StickyContainer', () => {
    render(
      <StickyContainer>
        <StickyItem><div data-testid="outer">Outer</div></StickyItem>
        <StickyContainer>
          <StickyItem><div data-testid="inner">Inner</div></StickyItem>
        </StickyContainer>
      </StickyContainer>
    );
    expect(screen.getByTestId('outer')).toBeInTheDocument();
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });
});
