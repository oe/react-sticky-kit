# React Sticky Kit

<p align="left">
  <a href="https://www.npmjs.com/package/react-sticky-kit" target="_blank">
    <img src="https://img.shields.io/npm/v/react-sticky-kit.svg?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://img.shields.io/npm/dm/react-sticky-kit?style=flat-square" target="_blank">
    <img src="https://img.shields.io/npm/dm/react-sticky-kit?style=flat-square" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/oe/react-sticky-kit" target="_blank">
    <img src="https://img.shields.io/github/stars/oe/react-sticky-kit?style=flat-square" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/oe/react-sticky-kit/actions" target="_blank">
    <img src="https://img.shields.io/github/actions/workflow/status/oe/react-sticky-kit/ci.yml?style=flat-square" alt="Build Status" />
  </a>
  <a href="https://github.com/oe/react-sticky-kit/blob/main/LICENSE" target="_blank">
    <img src="https://img.shields.io/github/license/oe/react-sticky-kit?style=flat-square" alt="License" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-5.0%2B-blue?logo=typescript&style=flat-square" alt="TypeScript" />
  </a>
</p>

A lightweight, flexible React sticky container and item component library. Easily create sticky headers, sections, and advanced sticky layouts with support for multiple modes and edge cases.

## Features

- 📦 Simple API: `<StickyContainer>` and `<StickyItem>`
- 🧩 Supports `replace`, `stack`, and `none` sticky modes
- 🏷️ Customizable offset, z-index (baseZIndex), and sticky logic
- 🧪 Handles edge cases: empty sections, dynamic heights, zero-height headers, long headers, etc.
- ⚡️ Written in TypeScript, fully typed
- 🧪 Includes demo pages for real-world scenarios

## Installation

```bash
npm install react-sticky-kit
# or
yarn add react-sticky-kit
# or
pnpm add react-sticky-kit
```

## Usage

```tsx
import { StickyContainer, StickyItem } from 'react-sticky-kit';
// !! Import styles for sticky components
import 'react-sticky-kit/dist/style.css';
// or `import 'react-sticky-kit/style';` for more clean style path(require modern bundler tools)

export default function Example() {
  return (
    <StickyContainer offsetTop={48} defaultMode="stack" baseZIndex={300}>
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
| Prop                        | Type                                 | Default     | Description                                                                                 |
|-----------------------------|--------------------------------------|-------------|---------------------------------------------------------------------------------------------|
| `offsetTop`                 | `number`                             | `0`         | Offset from the top of the viewport                                                         |
| `defaultMode`               | `'replace' \| 'stack' \| 'none'`     | `'replace'`| Default sticky mode for all items                                                           |
| `baseZIndex`                | `number`                             | `200`       | Base z-index for sticky items. Should be greater than the number of sticky items.            |
|                             |                                      |             | In `replace` mode, z-index = baseZIndex - index; in `stack` mode, z-index = baseZIndex + index. |
| `onStickyItemsHeightChange` | `(height: number) => void`            |             | Callback when total sticky height changes                                                   |

### `<StickyItem />`
| Prop    | Type                                 | Default | Description                                 |
|---------|--------------------------------------|---------|---------------------------------------------|
| `mode`  | `'replace' \| 'stack' \| 'none'`     |         | Sticky mode for this item (overrides StickyContainer) |

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

Open [http://localhost:5173](http://localhost:5173) and switch between demo pages to explore all features and edge cases:
* [iOS Contact](http://localhost:5173/#ios-contact) a dead simple iOS contact clone
* [Mixed mode](http://localhost:5173/#mixed-mode) mix replace/stack/none mode
* [Nested](http://localhost:5173/#dynamic-height) nest sticky containers
* [Dynamic sticky items](http://localhost:5173/#nested) dynamic sticky items(add/remove)

## License

MIT
