import React from 'react';
import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { StickyContainer, StickyItem } from '../src/index';

describe('Sticky edge cases', () => {
  it('renders with no children', () => {
    // @ts-expect-error for test
    render(<StickyContainer />);
  });

  it('renders StickyItem with mode none', () => {
    render(
      <StickyContainer>
        <StickyItem mode="none"><div data-testid="none">None</div></StickyItem>
      </StickyContainer>
    );
  });

  it('handles long content and scroll', () => {
    render(
      <StickyContainer>
        <StickyItem><div data-testid="sticky">Sticky</div></StickyItem>
        {Array.from({ length: 100 }, (_, i) => <div key={i}>Row {i}</div>)}
      </StickyContainer>
    );
  });
});
