import { cloneElement, Fragment } from 'preact';
import type { ComponentChildren, JSX, Ref, VNode } from 'preact';
import { useRef } from 'preact/hooks';
import { useTooltip } from '../tooltip/useTooltip';
import { useTooltipTrigger, type AriaTooltipTriggerProps } from '../tooltip/useTooltipTrigger';
import { mergeProps } from '../utils/mergeProps';

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface TooltipProps extends AriaTooltipTriggerProps {
  children: VNode<JSX.HTMLAttributes<HTMLElement>>;
  content: ComponentChildren;
  placement?: TooltipPlacement;
  className?: string;
  elementRef?: Ref<HTMLDivElement>;
  'aria-label'?: string;
}

function joinIds(...ids: Array<string | undefined>): string | undefined {
  const result = ids.filter(Boolean).join(' ');
  return result || undefined;
}

export function Tooltip({
  children,
  content,
  placement = 'top',
  className,
  elementRef,
  'aria-label': ariaLabel,
  ...props
}: TooltipProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const trigger = useTooltipTrigger(props, triggerRef);
  const { tooltipProps } = useTooltip({
    id: trigger.tooltipId,
    isOpen: trigger.isOpen,
    'aria-label': ariaLabel,
  });
  const childProps = children.props as JSX.HTMLAttributes<HTMLElement>;
  const mergedTriggerProps = mergeProps(
    childProps as Record<string, unknown>,
    trigger.triggerProps as Record<string, unknown>,
  ) as JSX.HTMLAttributes<HTMLElement>;
  mergedTriggerProps['aria-describedby'] = joinIds(
    typeof childProps['aria-describedby'] === 'string' ? childProps['aria-describedby'] : undefined,
    trigger.triggerProps['aria-describedby'],
  );

  return (
    <Fragment>
      {cloneElement(children, mergedTriggerProps)}
      {trigger.isOpen && (
        <div
          {...tooltipProps}
          {...trigger.tooltipHoverProps}
          className={className}
          data-placement={placement}
          ref={elementRef}
        >
          {content}
        </div>
      )}
    </Fragment>
  );
}
