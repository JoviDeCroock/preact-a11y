import type { ComponentChildren, Ref } from 'preact';
import { useRef } from 'preact/hooks';
import { useToast, type ToastPriority } from '../toast/useToast';
import { useToastRegion } from '../toast/useToastRegion';
import { mergeRefs } from '../utils/mergeRefs';

export interface ToastItem {
  id: string;
  title: ComponentChildren;
  description?: ComponentChildren;
  priority?: ToastPriority;
  timeout?: number;
  tone?: string;
}

export interface ToastProps extends ToastItem {
  isPaused?: boolean;
  className?: string;
  closeButtonClassName?: string;
  elementRef?: Ref<HTMLDivElement>;
  onClose: () => void;
}

export function Toast({
  id,
  title,
  description,
  priority,
  timeout,
  tone,
  isPaused,
  className,
  closeButtonClassName,
  elementRef,
  onClose,
}: ToastProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const result = useToast({ id, priority, timeout, isPaused, onClose }, localRef);
  return (
    <div
      {...result.toastProps}
      className={className}
      data-toast-id={id}
      data-tone={tone}
      ref={mergeRefs(localRef, elementRef)}
    >
      <div {...result.contentProps}>
        <div {...result.titleProps}>{title}</div>
        <div {...result.descriptionProps}>{description}</div>
      </div>
      <button {...result.closeButtonProps} className={closeButtonClassName}>
        ×
      </button>
    </div>
  );
}

export interface ToastRegionProps {
  toasts: readonly ToastItem[];
  className?: string;
  toastClassName?: string;
  closeButtonClassName?: string;
  elementRef?: Ref<HTMLDivElement>;
  'aria-label'?: string;
  onDismiss: (id: string) => void;
}

export function ToastRegion({
  toasts,
  className,
  toastClassName,
  closeButtonClassName,
  elementRef,
  'aria-label': ariaLabel,
  onDismiss,
}: ToastRegionProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const { regionProps, isPaused } = useToastRegion(
    { toastIds: toasts.map((toast) => toast.id), 'aria-label': ariaLabel },
    localRef,
  );
  if (toasts.length === 0) return null;
  return (
    <div {...regionProps} className={className} ref={mergeRefs(localRef, elementRef)}>
      {toasts.map((toast) => (
        <Toast
          {...toast}
          className={toastClassName}
          closeButtonClassName={closeButtonClassName}
          isPaused={isPaused}
          key={toast.id}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
