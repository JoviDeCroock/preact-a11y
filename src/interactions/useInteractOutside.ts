import type { RefObject } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

export interface InteractOutsideProps {
  ref: RefObject<Element>;
  isDisabled?: boolean;
  onInteractOutsideStart?: (event: PointerEvent) => void;
  onInteractOutside?: (event: PointerEvent) => void;
}

export function useInteractOutside(props: InteractOutsideProps) {
  const interactionStartedOutside = useRef(false);

  useEffect(() => {
    if (props.isDisabled) return;

    function isOutside(event: PointerEvent) {
      return event.target instanceof Node && !props.ref.current?.contains(event.target);
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0 || !isOutside(event)) return;
      interactionStartedOutside.current = true;
      props.onInteractOutsideStart?.(event);
    }

    function onPointerUp(event: PointerEvent) {
      if (!interactionStartedOutside.current) return;
      interactionStartedOutside.current = false;
      if (isOutside(event)) props.onInteractOutside?.(event);
    }

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
    };
  }, [props.isDisabled, props.onInteractOutside, props.onInteractOutsideStart, props.ref]);
}
