import { useCallback, useRef, useState } from 'preact/hooks';
import type { JSX, TargetedKeyboardEvent, TargetedMouseEvent, TargetedPointerEvent } from 'preact';
import type { PointerType, PressEvent, PressProps } from '../types';

type PressDOMProps = Pick<
  JSX.HTMLAttributes<HTMLElement>,
  | 'onBlur'
  | 'onClick'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'onPointerCancel'
  | 'onPointerDown'
  | 'onPointerEnter'
  | 'onPointerLeave'
  | 'onPointerUp'
>;

function pointerType(event: Event): PointerType {
  if ('pointerType' in event) return (event.pointerType || 'mouse') as PointerType;
  return event instanceof MouseEvent && event.detail === 0 ? 'virtual' : 'mouse';
}

function pressEvent(
  type: PressEvent['type'],
  event: Event & Partial<Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>>,
  target: Element,
  source = pointerType(event),
): PressEvent {
  return {
    type,
    pointerType: source,
    target,
    altKey: event.altKey ?? false,
    ctrlKey: event.ctrlKey ?? false,
    metaKey: event.metaKey ?? false,
    shiftKey: event.shiftKey ?? false,
    preventDefault: () => event.preventDefault(),
  };
}

export interface PressResult {
  isPressed: boolean;
  pressProps: PressDOMProps;
}

export function usePress(props: PressProps = {}): PressResult {
  const { isDisabled = false, onPress, onPressChange, onPressEnd, onPressStart, onPressUp } = props;
  const [isPressed, setPressed] = useState(false);
  const pressed = useRef(false);
  const activePointer = useRef<number | null>(null);
  const activeKeyboard = useRef(false);
  const keyboardClickFired = useRef(false);
  const ignoreNextClick = useRef(false);

  const changePressed = useCallback(
    (value: boolean) => {
      if (pressed.current === value) return;
      pressed.current = value;
      setPressed(value);
      onPressChange?.(value);
    },
    [onPressChange],
  );

  const endPress = useCallback(
    (event: Event, target: Element, source: PointerType) => {
      changePressed(false);
      onPressEnd?.(pressEvent('pressend', event, target, source));
    },
    [changePressed, onPressEnd],
  );

  const pressProps: PressDOMProps = {
    onPointerDown(event: TargetedPointerEvent<HTMLElement>) {
      if (isDisabled || event.button !== 0 || activePointer.current != null) return;
      ignoreNextClick.current = false;
      activePointer.current = event.pointerId;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      changePressed(true);
      onPressStart?.(pressEvent('pressstart', event, event.currentTarget));
    },
    onPointerEnter(event: TargetedPointerEvent<HTMLElement>) {
      if (activePointer.current === event.pointerId && !pressed.current) changePressed(true);
    },
    onPointerLeave(event: TargetedPointerEvent<HTMLElement>) {
      if (activePointer.current === event.pointerId && pressed.current) changePressed(false);
    },
    onPointerUp(event: TargetedPointerEvent<HTMLElement>) {
      if (activePointer.current !== event.pointerId) return;
      const target = event.currentTarget;
      activePointer.current = null;
      target.releasePointerCapture?.(event.pointerId);
      onPressUp?.(pressEvent('pressup', event, target));
      endPress(event, target, pointerType(event));

      if (target.contains(event.target as Node)) {
        onPress?.(pressEvent('press', event, target));
        ignoreNextClick.current = true;
      }
    },
    onPointerCancel(event: TargetedPointerEvent<HTMLElement>) {
      if (activePointer.current !== event.pointerId) return;
      activePointer.current = null;
      endPress(event, event.currentTarget, pointerType(event));
    },
    onKeyDown(event: TargetedKeyboardEvent<HTMLElement>) {
      if (isDisabled || activeKeyboard.current || (event.key !== 'Enter' && event.key !== ' ')) {
        return;
      }
      if (event.key === ' ') event.preventDefault();
      activeKeyboard.current = true;
      ignoreNextClick.current = false;
      keyboardClickFired.current = false;
      changePressed(true);
      onPressStart?.(pressEvent('pressstart', event, event.currentTarget, 'keyboard'));
    },
    onKeyUp(event: TargetedKeyboardEvent<HTMLElement>) {
      if (!activeKeyboard.current || (event.key !== 'Enter' && event.key !== ' ')) return;
      activeKeyboard.current = false;
      if (event.key === ' ') event.preventDefault();
      onPressUp?.(pressEvent('pressup', event, event.currentTarget, 'keyboard'));
      endPress(event, event.currentTarget, 'keyboard');

      if (!keyboardClickFired.current) {
        onPress?.(pressEvent('press', event, event.currentTarget, 'keyboard'));
        ignoreNextClick.current = true;
      }
    },
    onClick(event: TargetedMouseEvent<HTMLElement>) {
      if (isDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (ignoreNextClick.current) {
        ignoreNextClick.current = false;
        return;
      }
      if (activeKeyboard.current) keyboardClickFired.current = true;
      onPress?.(
        pressEvent('press', event, event.currentTarget, event.detail === 0 ? 'keyboard' : 'mouse'),
      );
    },
    onBlur(event) {
      if (!activeKeyboard.current) return;
      activeKeyboard.current = false;
      endPress(event, event.currentTarget, 'keyboard');
    },
  };

  return { isPressed, pressProps };
}
