import { cloneElement, Fragment } from 'preact';
import type { ComponentChildren, JSX, Ref, VNode } from 'preact';
import { useCallback, useRef, useState } from 'preact/hooks';
import { DismissButton } from '../overlays/DismissButton';
import { FocusScope } from '../overlays/FocusScope';
import { usePopover, type AriaPopoverProps } from '../overlays/usePopover';
import { useOverlayTrigger, type OverlayTriggerType } from '../overlays/useOverlayTrigger';
import type { Placement } from '../overlays/useOverlayPosition';
import { mergeProps } from '../utils/mergeProps';
import { mergeRefs } from '../utils/mergeRefs';

export interface PopoverProps extends Omit<
  AriaPopoverProps,
  'triggerRef' | 'popoverRef' | 'arrowRef' | 'groupRef' | 'isOpen' | 'onClose'
> {
  children: VNode<JSX.HTMLAttributes<HTMLElement>>;
  content: ComponentChildren;
  type?: OverlayTriggerType;
  isOpen?: boolean;
  defaultOpen?: boolean;
  placement?: Placement;
  className?: string;
  underlayClassName?: string;
  arrowClassName?: string;
  showArrow?: boolean;
  elementRef?: Ref<HTMLDivElement>;
  'aria-label'?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

export function Popover({
  children,
  content,
  type = 'dialog',
  isOpen: controlledOpen,
  defaultOpen = false,
  placement = 'bottom',
  className,
  underlayClassName,
  arrowClassName,
  showArrow,
  elementRef,
  isNonModal,
  isDismissable = true,
  'aria-label': ariaLabel,
  onOpenChange,
  ...props
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const triggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const trigger = useOverlayTrigger({ type, isOpen, onOpenChange: setOpen }, triggerRef);
  const popover = usePopover({
    ...props,
    placement,
    triggerRef,
    popoverRef,
    arrowRef,
    isOpen,
    isNonModal,
    isDismissable,
    onClose: close,
  });
  const childProps = children.props as JSX.HTMLAttributes<HTMLElement>;
  const mergedTriggerProps = mergeProps(
    childProps as Record<string, unknown>,
    trigger.triggerProps as Record<string, unknown>,
  ) as JSX.HTMLAttributes<HTMLElement> & {
    ref?: Ref<HTMLElement>;
    elementRef?: Ref<HTMLElement>;
  };
  if (typeof children.type === 'string') {
    mergedTriggerProps.ref = mergeRefs(children.ref ?? undefined, triggerRef);
  } else {
    mergedTriggerProps.elementRef = mergeRefs(
      (childProps as { elementRef?: Ref<HTMLElement> }).elementRef,
      triggerRef,
    );
  }

  return (
    <Fragment>
      {cloneElement(children, mergedTriggerProps)}
      {isOpen && !isNonModal && <div {...popover.underlayProps} className={underlayClassName} />}
      {isOpen && (
        <FocusScope autoFocus contain={!isNonModal} restoreFocus>
          <div
            {...trigger.overlayProps}
            {...popover.popoverProps}
            aria-label={ariaLabel}
            className={className}
            data-placement={popover.placement ?? undefined}
            ref={mergeRefs(popoverRef, elementRef)}
            role={type === 'dialog' ? 'dialog' : undefined}
          >
            {isDismissable && <DismissButton onDismiss={close} />}
            {showArrow && <div {...popover.arrowProps} className={arrowClassName} ref={arrowRef} />}
            {content}
            {isDismissable && <DismissButton onDismiss={close} />}
          </div>
        </FocusScope>
      )}
    </Fragment>
  );
}
