# React Sticky

A lightweight, flexible React sticky container and item component library. Easily create sticky headers, sections, and advanced sticky layouts with support for multiple modes and edge cases.

## Features

- 📦 Simple API: `<StickyContainer>` and `<StickyItem>`
- 🧩 Supports `replace`, `stack`, and `none` sticky modes
- 🏷️ Customizable offset, z-index, and sticky logic
- 🧪 Handles edge cases: empty sections, dynamic heights, zero-height headers, long headers, etc.
- ⚡️ Written in TypeScript, fully typed
- 🧪 Includes demo pages for real-world scenarios

## Installation

```bash
npm install react-sticky
# or
yarn add react-sticky
# or
pnpm add react-sticky
```

## Usage

```tsx
import { StickyContainer, StickyItem } from 'react-sticky';

export default function Example() {
  return (
    <StickyContainer offsetTop={48} defaultMode="stack">
      <StickyItem>
        <div>Sticky Header</div>
      </StickyItem>
      <div>Content...</div>
      <StickyItem mode="replace">
        <div>Another Sticky Header (replace mode)</div>
      </StickyItem>
      <div>More Content...</div>
    </StickyContainer>
  );
}
```

## Props

### `<StickyContainer />`
| Prop                      | Type                                 | Default   | Description                                  |
|---------------------------|--------------------------------------|-----------|----------------------------------------------|
| `offsetTop`               | `number`                             | `0`       | Offset from the top of the viewport          |
| `defaultMode`             | `'replace' \| 'stack' \| 'none'`     | `'replace'`| Default sticky mode for all items            |
| `onStickyItemsHeightChange` | `(height: number) => void`          |           | Callback when total sticky height changes     |

### `<StickyItem />`
| Prop    | Type                                 | Default | Description                                 |
|---------|--------------------------------------|---------|---------------------------------------------|
| `mode`  | `'replace' \| 'stack' \| 'none'`     |         | Sticky mode for this item (overrides group) |

## Sticky Modes
- **replace**: Only one sticky item is visible at a time, replacing the previous.
- **stack**: Sticky items stack on top of each other.
- **none**: Sticky is disabled for this item.

## Demo

Run the demo locally:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and switch between demo pages to explore all features and edge cases.

## License

MIT
