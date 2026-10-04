import { observeResize } from './resize-observer.js';

const containers = new Map<HTMLElement, () => void>();
const targets = new Map<Element, () => void>();
let mutations: MutationObserver | null = null;
let queued = false;

function update() {
  for (const callback of containers.values()) callback();
}
function refreshSoon() {
  if (queued) return;
  queued = true;
  void Promise.resolve().then(() => {
    queued = false;
    if (containers.size) refresh();
  });
}
function refresh() {
  const next = new Set<Element>();
  const parents = new Set<Element>();
  // Shared ancestors and preceding sibling chains are walked only once.
  for (const container of containers.keys()) {
    for (let node: Element | null = container; node?.parentElement; node = node.parentElement) {
      const parent = node.parentElement;
      next.add(parent);
      for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
        if (next.has(sibling)) break;
        next.add(sibling);
      }
      if (parents.has(parent)) break;
      parents.add(parent);
    }
  }
  const removed = [...targets.keys()].filter(target => !next.has(target));
  if (removed.length) mutations?.disconnect();
  for (const target of removed) {
    targets.get(target)!();
    targets.delete(target);
  }
  for (const target of next) {
    const added = !targets.has(target);
    if (added) targets.set(target, observeResize(target, update));
    if (added || removed.length) {
      mutations?.observe(target, { childList: true, attributes: true, attributeFilter: ['class', 'style'] });
    }
  }
}

/** Share observations of ancestors and preceding siblings across all containers. */
export function observeLayoutChanges(container: HTMLElement, callback: () => void) {
  containers.set(container, callback);
  if (!mutations && typeof MutationObserver !== 'undefined') {
    mutations = new MutationObserver(records => {
      if (records.some(record => record.type === 'childList')) refreshSoon();
      update();
    });
  }
  refreshSoon();
  return () => {
    containers.delete(container);
    if (containers.size) refreshSoon();
    else {
      mutations?.disconnect();
      mutations = null;
      for (const stop of targets.values()) stop();
      targets.clear();
    }
  };
}
