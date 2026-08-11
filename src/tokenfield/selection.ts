export interface TokenFieldPosition {
  /** Index of the direct segment node within the token field. */
  index: number;
  /** UTF-16 text offset within the segment. Tokens use 0 or their full text length. */
  offset: number;
}

function segmentLength(node: Node | undefined): number {
  return node?.textContent?.length ?? 0;
}

function directChild(root: Element, node: Node): Node | null {
  let current: Node | null = node;
  while (current?.parentNode && current.parentNode !== root) current = current.parentNode;
  return current?.parentNode === root ? current : null;
}

function textOffsetWithin(segment: Node, node: Node, offset: number): number {
  if (segment === node && segment.nodeType === Node.TEXT_NODE) {
    return Math.min(offset, segmentLength(segment));
  }
  const range = segment.ownerDocument!.createRange();
  range.selectNodeContents(segment);
  try {
    range.setEnd(node, offset);
  } catch {
    return 0;
  }
  return range.toString().length;
}

function domPointToPosition(root: Element, node: Node, offset: number): TokenFieldPosition {
  const children: Node[] = [...root.childNodes];
  if (!children.length) return { index: 0, offset: 0 };
  if (node === root) {
    const previous = children[offset - 1];
    if (previous instanceof HTMLElement && previous.hasAttribute('data-preact-a11y-token')) {
      return { index: offset - 1, offset: segmentLength(previous) };
    }
    if (offset >= children.length) {
      const index = children.length - 1;
      return { index, offset: segmentLength(children[index]) };
    }
    return { index: Math.max(0, offset), offset: 0 };
  }

  const segment = directChild(root, node);
  if (!segment) return { index: 0, offset: 0 };
  const index = Math.max(0, children.indexOf(segment));
  return {
    index,
    offset: Math.min(textOffsetWithin(segment, node, offset), segmentLength(segment)),
  };
}

function firstText(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = node.ownerDocument!.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

function lastText(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = node.ownerDocument!.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let result: Text | null = null;
  for (let current = walker.nextNode(); current; current = walker.nextNode()) {
    result = current as Text;
  }
  return result;
}

function domPoint(root: Element, position: TokenFieldPosition): [Node, number] {
  const children: Node[] = [...root.childNodes];
  if (!children.length) return [root, 0];
  const index = Math.max(0, Math.min(position.index, children.length - 1));
  const segment = children[index]!;
  const length = segmentLength(segment);
  const offset = Math.max(0, Math.min(position.offset, length));
  const isToken = segment instanceof HTMLElement && segment.hasAttribute('data-preact-a11y-token');
  if (isToken) return [root, offset <= 0 ? index : index + 1];

  if (offset <= 0) {
    const text = firstText(segment);
    return text ? [text, 0] : [root, index];
  }
  if (offset >= length) {
    const text = lastText(segment);
    return text ? [text, text.data.length] : [root, index + 1];
  }

  const walker = segment.ownerDocument!.createTreeWalker(segment, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  for (
    let current = walker.nextNode() as Text | null;
    current;
    current = walker.nextNode() as Text | null
  ) {
    if (remaining <= current.data.length) return [current, remaining];
    remaining -= current.data.length;
  }
  return [root, index + 1];
}

/** Returns the current DOM selection as token-field segment positions. */
export function getSelection(container: Element): [TokenFieldPosition, TokenFieldPosition] | null {
  const selection = container.ownerDocument.defaultView?.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (
    !container.contains(range.commonAncestorContainer) &&
    range.commonAncestorContainer !== container
  )
    return null;
  return [
    domPointToPosition(container, range.startContainer, range.startOffset),
    domPointToPosition(container, range.endContainer, range.endOffset),
  ];
}

/** Converts a token-field position into a collapsed DOM Range. */
export function tokenFieldPositionToDOMRange(root: Element, position: TokenFieldPosition): Range {
  const range = root.ownerDocument.createRange();
  const [node, offset] = domPoint(root, position);
  range.setStart(node, offset);
  range.collapse(true);
  return range;
}

/** Applies a token-field selection and optionally emits a document selectionchange event. */
export function setTokenFieldSelection(
  root: Element,
  start: TokenFieldPosition,
  end: TokenFieldPosition,
  fireEvent = false,
): void {
  const selection = root.ownerDocument.defaultView?.getSelection();
  if (!selection) return;
  const startRange = tokenFieldPositionToDOMRange(root, start);
  const endRange = tokenFieldPositionToDOMRange(root, end);
  const range = root.ownerDocument.createRange();
  range.setStart(startRange.startContainer, startRange.startOffset);
  range.setEnd(endRange.startContainer, endRange.startOffset);
  selection.removeAllRanges();
  selection.addRange(range);
  if (fireEvent) root.ownerDocument.dispatchEvent(new Event('selectionchange'));
}
