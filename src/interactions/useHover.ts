import { useState } from 'preact/hooks';
import type { JSX, TargetedPointerEvent } from '../preactTypes';
import type { PointerType } from '../types';

export interface HoverEvent {
  pointerType: PointerType;
  target: Element;
}

export interface HoverProps {
  isDisabled?: boolean;
  onHoverStart?: (event: HoverEvent) => void;
  onHoverEnd?: (event: HoverEvent) => void;
  onHoverChange?: (isHovered: boolean) => void;
}

export function useHover(props: HoverProps = {}) {
  const [isHovered, setHovered] = useState(false);
  const hoverProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'onpointerenter' | 'onpointerleave'> = {
    onpointerenter(event: TargetedPointerEvent<HTMLElement>) {
      if (props.isDisabled || event.pointerType === 'touch') return;
      setHovered(true);
      props.onHoverChange?.(true);
      props.onHoverStart?.({
        pointerType: (event.pointerType || 'mouse') as PointerType,
        target: event.currentTarget,
      });
    },
    onpointerleave(event: TargetedPointerEvent<HTMLElement>) {
      if (!isHovered) return;
      setHovered(false);
      props.onHoverChange?.(false);
      props.onHoverEnd?.({
        pointerType: (event.pointerType || 'mouse') as PointerType,
        target: event.currentTarget,
      });
    },
  };
  return { hoverProps, isHovered };
}
