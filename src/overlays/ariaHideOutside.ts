interface HiddenElementState {
  count: number;
  previousValue: string | null;
}

const hiddenElements = new WeakMap<Element, HiddenElementState>();

function hide(element: Element) {
  const state = hiddenElements.get(element);
  if (state) {
    state.count++;
    return;
  }

  hiddenElements.set(element, {
    count: 1,
    previousValue: element.getAttribute('aria-hidden'),
  });
  element.setAttribute('aria-hidden', 'true');
}

function restore(element: Element) {
  const state = hiddenElements.get(element);
  if (!state) return;
  state.count--;
  if (state.count > 0) return;

  if (state.previousValue == null) element.removeAttribute('aria-hidden');
  else element.setAttribute('aria-hidden', state.previousValue);
  hiddenElements.delete(element);
}

export function ariaHideOutside(targets: Element[]): () => void {
  const hidden = new Set<Element>();

  for (const target of targets) {
    let current: Element | null = target;
    while (current?.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (sibling === current || targets.some((item) => sibling.contains(item))) continue;
        if (!hidden.has(sibling)) {
          hide(sibling);
          hidden.add(sibling);
        }
      }
      current = current.parentElement;
    }
  }

  return () => {
    for (const element of hidden) restore(element);
  };
}
