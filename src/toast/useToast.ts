import type { JSX, RefObject, TargetedKeyboardEvent } from '../preactTypes';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useId } from '../utils/useId';

export type ToastPriority = 'polite' | 'assertive';

export interface AriaToastProps {
  id: string;
  priority?: ToastPriority;
  timeout?: number;
  isPaused?: boolean;
  closeLabel?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  onClose: () => void;
}

export function useToast(props: AriaToastProps, _ref?: RefObject<HTMLElement>) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;
  const [isVisible, setVisible] = useState(false);
  const remaining = useRef(props.timeout);
  const startedAt = useRef(0);
  const onClose = useRef(props.onClose);
  onClose.current = props.onClose;

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    remaining.current = props.timeout;
  }, [props.id, props.timeout]);

  useEffect(() => {
    if (props.isPaused || remaining.current == null || remaining.current <= 0) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onClose.current(), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, (remaining.current ?? 0) - (Date.now() - startedAt.current));
    };
  }, [props.id, props.isPaused, props.timeout]);

  return {
    toastProps: {
      role: 'alertdialog' as const,
      tabIndex: 0,
      'aria-modal': 'false',
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'] ?? titleId,
      'aria-describedby': props['aria-describedby'] ?? descriptionId,
      onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
        if (event.key === 'Escape') {
          event.preventDefault();
          props.onClose();
        }
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    contentProps: {
      role: props.priority === ('assertive' as const) ? ('alert' as const) : ('status' as const),
      'aria-atomic': 'true',
      'aria-hidden': isVisible ? undefined : 'true',
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    titleProps: {
      id: titleId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    descriptionProps: {
      id: descriptionId,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    closeButtonProps: {
      type: 'button',
      'aria-label': props.closeLabel ?? 'Close notification',
      onClick: props.onClose,
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}
