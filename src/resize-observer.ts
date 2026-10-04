type Listener = (entries: ResizeObserverEntry[]) => void;
const targets = new Map<Element, Set<Listener>>();
let observer: ResizeObserver | null = null;

export function observeResize(target: Element, listener: Listener) {
  if (typeof ResizeObserver === 'undefined') return () => {};
  observer ??= new ResizeObserver(entries => {
    const notifications = new Map<Listener, ResizeObserverEntry[]>();
    for (const entry of entries) {
      for (const callback of targets.get(entry.target) ?? []) {
        const group = notifications.get(callback);
        if (group) group.push(entry);
        else notifications.set(callback, [entry]);
      }
    }
    for (const [callback, group] of notifications) callback(group);
  });
  let listeners = targets.get(target);
  if (!listeners) {
    listeners = new Set();
    targets.set(target, listeners);
    observer.observe(target);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      targets.delete(target);
      observer?.unobserve(target);
    }
    if (!targets.size) {
      observer?.disconnect();
      observer = null;
    }
  };
}
