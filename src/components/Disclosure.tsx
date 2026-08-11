import type { ComponentChildren, Ref } from 'preact';
import type { JSX } from '../preactTypes';
import { useDisclosure, type AriaDisclosureProps } from '../disclosure/useDisclosure';

export interface DisclosureProps
  extends
    AriaDisclosureProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof AriaDisclosureProps | 'title'> {
  children: ComponentChildren;
  title: ComponentChildren;
  elementRef?: Ref<HTMLDivElement>;
  triggerClassName?: string;
  panelClassName?: string;
}

export function Disclosure({
  children,
  title,
  elementRef,
  triggerClassName,
  panelClassName,
  isExpanded,
  defaultExpanded,
  isDisabled,
  onExpandedChange,
  ...domProps
}: DisclosureProps) {
  const result = useDisclosure({
    isExpanded,
    defaultExpanded,
    isDisabled,
    onExpandedChange,
  });

  return (
    <div
      {...domProps}
      data-disabled={isDisabled || undefined}
      data-expanded={result.isExpanded || undefined}
      ref={elementRef}
    >
      <button {...result.buttonProps} className={triggerClassName}>
        {title}
      </button>
      <div {...result.panelProps} className={panelClassName}>
        {children}
      </div>
    </div>
  );
}
