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
  <a href="#ssr-ssg-support" target="_blank">
    <img src="https://img.shields.io/badge/SSR%2FSSG-Compatible-brightgreen?style=flat-square" alt="SSR/SSG Compatible" />
  </a>
</p>

A lightweight, flexible React sticky container and item component library. Easily create sticky headers, sections, and advanced sticky layouts with support for multiple modes and edge cases.

## Features

- 📦 Simple API: `<StickyContainer>` and `<StickyItem>`
- 🧩 Supports `replace`, `stack`, and `none` sticky modes
- 🏷️ Customizable offset, z-index (baseZIndex), and sticky logic
- 🖥️ Viewport-relative sticky offsets, including updates on nested scroll events
- 🔄 Supports SSR/SSG (Next.js, Gatsby, Astro, etc.)
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

## Demo
- [Apple iOS Contact App](https://codesandbox.io/p/sandbox/dreamy-hofstadter-v9dzfz)

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
| Prop                        | Type                                                 | Default     | Description                                                                                 |
|-----------------------------|------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------|
| `offsetTop`                 | `number`                                             | `0`         | Offset from the top of the viewport                                                         |
| `defaultMode`               | `'replace' \| 'stack' \| 'none'`                     | `'replace'` | Default sticky mode for all items                                                           |
| `baseZIndex`                | `number`                                             | `200`       | Base z-index for sticky items. Should be greater than the number of sticky items.            |
|                             |                                                      |             | In `replace` mode, z-index = baseZIndex - index; in `stack` mode, z-index = baseZIndex + index. |
| `onStickyItemsHeightChange` | `(height: number) => void`                          |             | Callback when total sticky height changes                                                   |
| `constraint`                | `'none'`                                             |             | Define the constraint for sticky behavior. 'none' = no container boundary |

### `<StickyItem />`
| Prop    | Type                                 | Default | Description                                 |
|---------|--------------------------------------|---------|---------------------------------------------|
| `mode`  | `'replace' \| 'stack' \| 'none'`     |         | Sticky mode for this item (overrides StickyContainer) |

## Sticky Modes
- **replace**: Only one sticky item is visible at a time, replacing the previous.
- **stack**: Sticky items stack on top of each other.
- **none**: Sticky is disabled for this item.

## Constraint Behavior

The `constraint` prop allows you to control when sticky items should stop being sticky:

```tsx
import React from 'react';
import { StickyContainer, StickyItem } from 'react-sticky-kit';

function Example() {
  return (
    <div>
      {/* 1. Default: Container-based constraint */}
      <StickyContainer>
        <StickyItem><div>Sticky stops when container leaves viewport</div></StickyItem>
        <div>Content...</div>
      </StickyContainer>
      
      {/* 2. No container boundary */}
      <StickyContainer constraint="none">
        <StickyItem><div>Sticky even after the container leaves</div></StickyItem>
        <div>Content...</div>
      </StickyContainer>
    </div>
  );
}
```

### Special behavior of `constraint="none"`

When you set `constraint="none"`, the sticky items will always stick when they reach the top of the viewport, regardless of their parent container's visibility. Offsets remain relative to the viewport; this differs from native CSS `position: sticky`, which is constrained by its scrolling ancestor.

In contrast, the default behavior (without specifying a constraint) only makes items sticky when their parent container is visible in the viewport.

## Demo

Run the demo locally:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and switch between demo pages to explore all features and edge cases:
* [iOS Contact](http://localhost:5173/#ios-contact) a dead simple iOS contact clone
* [Mixed mode](http://localhost:5173/#mixed-mode) mix replace/stack/none mode
* [Nested](http://localhost:5173/#nested) nest sticky containers
* [Dynamic sticky items](http://localhost:5173/#dynamic) dynamic sticky items(add/remove)
* [Dynamic offsetTop](http://localhost:5173/#dynamic-offset) dynamic offsetTop that adapts to header height changes
* [Constraint Demo](http://localhost:5173/#constraint) demo showing different constraint options

## SSR/SSG Support

React Sticky Kit supports Server-Side Rendering (SSR) and Static Site Generation (SSG), working seamlessly with frameworks like Next.js, Gatsby, Astro, and more.

### Next.js Example

```tsx
// app/page.tsx (Next.js App Router)
import { StickyContainer, StickyItem } from 'react-sticky-kit'
import 'react-sticky-kit/dist/style.css'

export default function Home() {
  return (
    <StickyContainer>
      <StickyItem>
        <header>Sticky Header</header>
      </StickyItem>
      <main>Content...</main>
    </StickyContainer>
  )
}
```

For Pages Router, import the global stylesheet from `pages/_app.tsx`.

### Astro Example

Create a React component containing both `StickyContainer` and `StickyItem`, then
hydrate it from Astro:

```astro
---
import StickyLayout from '../components/StickyLayout.tsx'
import 'react-sticky-kit/style'
---
<StickyLayout client:load />
```

## Compatibility and updates

React 17 and later are supported. Import the stylesheet explicitly, using either
`react-sticky-kit/style` or `react-sticky-kit/dist/style.css`. ESM, CommonJS and the
UMD browser build are available; UMD requires a global `React`.

The built entry points include `"use client"` for Next.js App Router. Pages Router
and server rendering remain supported; sticky layout is applied after mounting.
For Astro, wrap the sticky layout in a React component and hydrate that component
as a single island.

Sticky offsets use the viewport, even when an event comes from a nested scrolling
element. Ancestor transforms and overflow clipping can affect fixed positioning;
use native CSS `position: sticky` if you need offsets relative to a scrolling ancestor.

When available, `ResizeObserver` updates dynamic content heights and widths. Without
it, measurements update on scroll, window resize and component commits.
`onStickyItemsHeightChange` reports the final total once per animation frame when
it changes, including zero when no items remain sticky. It does not emit transient
per-item totals or callbacks after the container unmounts.

## Development

Use Node.js 22.22.2+ or 24.15.0+ and the pnpm version pinned in `package.json`.
The development tools require these versions; the published library keeps its
React 17+ peer dependency range and targets ES2018.

```bash
pnpm install --frozen-lockfile
pnpm type-check
pnpm lint
pnpm test
pnpm build
pnpm check:package
pnpm check:compatibility # installs the tarball with React 17, 18 and 19
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:browser
```

TypeScript 6 is used for development while the ESLint TypeScript plugin supports
versions below 6.1. Generated declarations use the existing public component API.

## Publish steps

`pnpm pub`

## License

MIT
