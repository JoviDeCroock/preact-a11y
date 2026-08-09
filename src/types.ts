export type PointerType = 'keyboard' | 'mouse' | 'pen' | 'touch' | 'virtual';

export interface PressEvent {
  type: 'press' | 'pressstart' | 'pressend' | 'pressup';
  pointerType: PointerType;
  target: Element;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  preventDefault(): void;
}

export interface PressProps {
  isDisabled?: boolean;
  preventFocusOnPress?: boolean;
  onPress?: (event: PressEvent) => void;
  onPressStart?: (event: PressEvent) => void;
  onPressEnd?: (event: PressEvent) => void;
  onPressUp?: (event: PressEvent) => void;
  onPressChange?: (isPressed: boolean) => void;
}
