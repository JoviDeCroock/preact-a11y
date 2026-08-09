import type { JSX, RefObject } from 'preact';
import { useId } from '../utils/useId';

export type OverlayTriggerType = 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';

export interface AriaOverlayTriggerProps {
  type: OverlayTriggerType;
  isOpen: boolean;
  id?: string;
  isDisabled?: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function useOverlayTrigger(props: AriaOverlayTriggerProps, _ref?: RefObject<Element>) {
  const overlayId = useId(props.id);
  return {
    triggerProps: {
      'aria-haspopup': props.type,
      'aria-expanded': props.isOpen,
      'aria-controls': props.isOpen ? overlayId : undefined,
      disabled: props.isDisabled,
      onClick() {
        if (!props.isDisabled) props.onOpenChange(!props.isOpen);
      },
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    overlayProps: {
      id: overlayId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
