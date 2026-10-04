/** Observe elements whose size or placement can move the container without scrolling. */
export function observeLayoutChanges(container: HTMLElement, resize: ResizeObserver, update: () => void) {
  let targets = new Set<Element>();
  const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(records => {
    if (records.some(record => record.type === 'childList')) refresh();
    update();
  });
  function refresh() {
    const next = new Set<Element>();
    for (let node: Element | null = container; node?.parentElement; node = node.parentElement) {
      next.add(node.parentElement);
      for (let sibling = node.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
        next.add(sibling);
      }
    }
    for (const target of targets) if (!next.has(target)) resize.unobserve(target);
    mutations?.disconnect();
    for (const target of next) {
      if (!targets.has(target)) resize.observe(target);
      mutations?.observe(target, { childList: true, attributes: true, attributeFilter: ['class', 'style'] });
    }
    targets = next;
  }
  refresh();
  return () => mutations?.disconnect();
}
