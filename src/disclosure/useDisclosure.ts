import type { JSX } from '../preactTypes';
import { useId, useState } from 'preact/hooks';

export interface AriaDisclosureProps {
  isExpanded?: boolean;
  defaultExpanded?: boolean;
  isDisabled?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
}

export function useDisclosure(props: AriaDisclosureProps = {}) {
  const [uncontrolled, setUncontrolled] = useState(props.defaultExpanded ?? false);
  const isExpanded = props.isExpanded ?? uncontrolled;
  const generatedId = useId();
  const buttonId = `preact-a11y-disclosure-trigger-${generatedId}`;
  const panelId = `preact-a11y-disclosure-panel-${generatedId}`;

  return {
    isExpanded,
    buttonProps: {
      id: buttonId,
      type: 'button',
      disabled: props.isDisabled,
      'aria-controls': panelId,
      'aria-expanded': isExpanded,
      onClick() {
        if (props.isDisabled) return;
        const next = !isExpanded;
        if (props.isExpanded === undefined) setUncontrolled(next);
        props.onExpandedChange?.(next);
      },
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    panelProps: {
      id: panelId,
      role: 'region',
      hidden: !isExpanded,
      'aria-labelledby': buttonId,
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
  };
}
