# Browser compatibility and positioning strategies

React Sticky Kit's default `positionStrategy="fixed"` does not require native CSS
`position: sticky`. It measures viewport geometry and applies `position: fixed`.
That independence is useful for coordinated headers and environments where CSS
sticky support is missing. It does not remove React or JavaScript requirements.

## What happens in each environment?

| Condition | Default fixed strategy | Opt-in auto strategy |
| --- | --- | --- |
| Sticky supported, one eligible short direct child | Fixed coordination | Native sticky |
| Sticky unsupported, or CSS.supports cannot confirm support | Fixed coordination | Fixed fallback |
| ResizeObserver missing | Fixed with event/React-driven measurements | Fixed fallback |
| Multiple items, oversized content or another ineligible layout | Fixed coordination | Fixed fallback |

Auto also checks viewport fit, direct-child placement, wrapper stretching,
ancestor overflow, inline positioning overrides and container constraint.
It is not a generic browser-bug detector. Keep fixed positioning when native
sticky behaves incorrectly in an application-specific layout.

Without ResizeObserver, content and surrounding layout changes do not necessarily
refresh sticky geometry while idle. Scroll, window resize and React commits
trigger measurements. An application may supply a ResizeObserver polyfill if it
needs observation in an otherwise compatible environment.

## Runtime requirements and test coverage

- React and React DOM 17 or newer.
- The published JavaScript targets ES2018. The environment must parse that syntax
  and provide the standard JavaScript/DOM APIs used by React and the kit, including
  Map, Set and requestAnimationFrame.
- Native CSS sticky and ResizeObserver are optional for fixed positioning.
- Chromium, Firefox and WebKit regressions cover fixed/native transitions and
  simulated missing sticky support or ResizeObserver. React 17/18/19 package
  compatibility is tested separately.

These are engine-based regression checks, not a certified minimum-version matrix
for all browsers or embedded WebViews. IE11 and arbitrary older browsers are not
supported targets of the distributed build. Application-level transpilation and
polyfills may be necessary for older environments, and their behavior needs
separate validation; adding a sticky polyfill alone is not sufficient.

## Layout limits still apply

Offsets remain viewport-relative, including when nested scroll events trigger
updates. Internal-scroll-container coordinates are not implemented. Ancestor
transforms and overflow clipping can affect fixed positioning; CSS sticky uses
its scrolling ancestor instead, so the strategies are not interchangeable in
every layout. Use a layout that matches the selected strategy.

## Where the kit adds value

The main combination is automatic variable-height stack/replace coordination,
fixed positioning independent of CSS sticky, oversized group scrolling and an
optional native path, all through the existing Container/Item API. Shared event
listeners, observers and read-before-write scheduling reduce duplicated work
across groups. These are concrete capabilities, not claims of universally faster
rendering, broader support than every competing fixed-based library, or smaller
bundles than native-first alternatives.
