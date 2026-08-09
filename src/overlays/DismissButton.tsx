import { VisuallyHidden } from '../visually-hidden';

export interface DismissButtonProps {
  onDismiss: () => void;
  label?: string;
}

export function DismissButton({ onDismiss, label = 'Dismiss' }: DismissButtonProps) {
  return (
    <VisuallyHidden>
      <button type="button" onClick={onDismiss}>
        {label}
      </button>
    </VisuallyHidden>
  );
}
