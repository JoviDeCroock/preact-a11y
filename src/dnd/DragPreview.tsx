import { render } from 'preact';
import type { Ref, VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { DragItem } from './types';
import type { DragPreviewRenderer } from './useDrag';

export interface DragPreviewProps {
  children: (items: DragItem[]) => VNode | { element: VNode; x: number; y: number } | null;
  /** Preact-native ref seam; no forwardRef compatibility layer is installed. */
  previewRef: Ref<DragPreviewRenderer>;
}

function setRef(ref: Ref<DragPreviewRenderer>, value: DragPreviewRenderer | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/** Synchronously renders a native drag preview into an isolated, off-screen Preact root. */
export function DragPreview({ children, previewRef }: DragPreviewProps) {
  const childrenRef = useRef(children);
  childrenRef.current = children;
  useEffect(() => {
    let frame: number | undefined;
    let mount: HTMLDivElement | undefined;
    const renderer: DragPreviewRenderer = (items, callback) => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (mount) render(null, mount);
      mount?.remove();
      const result = childrenRef.current(items);
      if (!result || typeof document === 'undefined') {
        callback(null);
        return;
      }
      const rendered = 'element' in result ? result.element : result;
      const x = 'element' in result ? result.x : undefined;
      const y = 'element' in result ? result.y : undefined;
      mount = document.createElement('div');
      Object.assign(mount.style, {
        left: '-100000px',
        position: 'fixed',
        top: '0',
        zIndex: '-100',
      });
      document.body.append(mount);
      render(rendered, mount);
      callback(mount, x, y);
      frame = requestAnimationFrame(() => {
        if (mount) render(null, mount);
        mount?.remove();
        mount = undefined;
      });
    };
    setRef(previewRef, renderer);
    return () => {
      setRef(previewRef, null);
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (mount) render(null, mount);
      mount?.remove();
    };
  }, [previewRef]);
  return null;
}
