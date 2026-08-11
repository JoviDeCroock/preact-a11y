import type { RefObject } from 'preact';
import type { JSX } from '../preactTypes';
import { useEffect, useState } from 'preact/hooks';

export interface TokenProps {}

export interface TokenAria {
  tokenProps: Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'ref'> & {
    'data-preact-a11y-token': true;
  };
  isSelected: boolean;
}

/** Makes a token atomic to content editing and reports native selection overlap. */
export function useToken(
  _props: TokenProps,
  _state: unknown,
  ref: RefObject<HTMLSpanElement>,
): TokenAria {
  const [isSelected, setSelected] = useState(false);
  useEffect(() => {
    const document = ref.current?.ownerDocument;
    if (!document) return;
    const onSelectionChange = () => {
      const selection = document.defaultView?.getSelection();
      const token = ref.current;
      if (!selection || !token || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelected(false);
        return;
      }
      setSelected(selection.getRangeAt(0).intersectsNode(token));
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [ref]);

  return {
    tokenProps: {
      'data-preact-a11y-token': true,
      contentEditable: false,
      draggable: false,
      style: { userSelect: 'all', WebkitUserSelect: 'all' },
    },
    isSelected,
  };
}
