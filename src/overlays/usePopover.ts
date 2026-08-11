import type { RefObject } from 'preact';
import type { JSX, TargetedFocusEvent } from '../preactTypes';
import { useEffect } from 'preact/hooks';
import { mergeProps } from '../utils/mergeProps';
import { ariaHideOutside } from './ariaHideOutside';
import { useOverlay } from './useOverlay';
import {
  useOverlayPosition,
  type AriaPositionProps,
  type PlacementAxis,
} from './useOverlayPosition';

export interface AriaPopoverProps extends Omit<
  AriaPositionProps,
  'targetRef' | 'overlayRef' | 'arrowRef' | 'isOpen' | 'onClose'
> {
  triggerRef: RefObject<Element>;
  popoverRef: RefObject<HTMLElement>;
  arrowRef?: RefObject<HTMLElement>;
  groupRef?: RefObject<HTMLElement>;
  isOpen: boolean;
  isNonModal?: boolean;
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  onFocusWithin?: (event: TargetedFocusEvent<HTMLElement>) => void;
  onBlurWithin?: (event: TargetedFocusEvent<HTMLElement>) => void;
  onClose: () => void;
}

export interface PopoverAria {
  popoverProps: JSX.HTMLAttributes<HTMLDivElement>;
  arrowProps: JSX.HTMLAttributes<HTMLDivElement>;
  underlayProps: JSX.HTMLAttributes<HTMLDivElement>;
  placement: PlacementAxis | null;
  triggerAnchorPoint: { x: number; y: number } | null;
}

export function usePopover(props: AriaPopoverProps): PopoverAria {
  const interactionRef = props.groupRef ?? props.popoverRef;
  const overlay = useOverlay(
    {
      isOpen: props.isOpen,
      isDismissable: props.isDismissable ?? true,
      isKeyboardDismissDisabled: props.isKeyboardDismissDisabled,
      shouldCloseOnInteractOutside(element) {
        if (
          props.triggerRef.current?.contains(element) ||
          props.groupRef?.current?.contains(element)
        )
          return false;
        return props.shouldCloseOnInteractOutside?.(element) ?? true;
      },
      onClose: props.onClose,
    },
    interactionRef,
  );
  const position = useOverlayPosition({
    ...props,
    targetRef: props.triggerRef,
    overlayRef: props.popoverRef,
    arrowRef: props.arrowRef,
    isOpen: props.isOpen,
    onClose: props.onClose,
  });

  useEffect(() => {
    if (props.isNonModal || !props.isOpen || !interactionRef.current) return;
    const targets = [interactionRef.current];
    if (props.triggerRef.current) targets.push(props.triggerRef.current as HTMLElement);
    return ariaHideOutside(targets);
  }, [interactionRef, props.isNonModal, props.isOpen, props.triggerRef]);

  const focusProps = {
    onfocusin: props.onFocusWithin,
    onfocusout(event: TargetedFocusEvent<HTMLElement>) {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        props.onBlurWithin?.(event);
      }
    },
  } satisfies JSX.HTMLAttributes<HTMLElement>;

  return {
    popoverProps: mergeProps(
      overlay.overlayProps as Record<string, unknown>,
      position.overlayProps as Record<string, unknown>,
      focusProps as Record<string, unknown>,
    ) as JSX.HTMLAttributes<HTMLDivElement>,
    arrowProps: position.arrowProps as JSX.HTMLAttributes<HTMLDivElement>,
    underlayProps: {
      style: { position: 'fixed', inset: 0 },
      'data-preact-a11y-underlay': true,
    } as JSX.HTMLAttributes<HTMLDivElement>,
    placement: position.placement,
    triggerAnchorPoint: position.triggerAnchorPoint,
  };
}
