import type { ComponentChildren, Ref } from 'preact';
import type { JSX } from '../preactTypes';
import { useRef } from 'preact/hooks';
import { useDialog, type AriaDialogProps } from '../dialog/useDialog';
import {
  useBreadcrumbItem,
  useBreadcrumbs,
  type AriaBreadcrumbsProps,
} from '../navigation/useBreadcrumbs';
import { useToolbar, type AriaToolbarProps } from '../navigation/useToolbar';
import { mergeRefs } from '../utils/mergeRefs';

export interface BreadcrumbsProps
  extends AriaBreadcrumbsProps, Omit<JSX.HTMLAttributes<HTMLElement>, keyof AriaBreadcrumbsProps> {
  children: ComponentChildren;
}

export function Breadcrumbs({
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: BreadcrumbsProps) {
  const { navProps } = useBreadcrumbs({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
  });
  return (
    <nav {...domProps} {...navProps}>
      <ol>{children}</ol>
    </nav>
  );
}

export interface BreadcrumbProps extends JSX.HTMLAttributes<HTMLLIElement> {
  children: ComponentChildren;
  href?: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
}

export function Breadcrumb({
  children,
  href,
  isCurrent,
  isDisabled,
  ...domProps
}: BreadcrumbProps) {
  const { itemProps } = useBreadcrumbItem({ isCurrent, isDisabled });
  return (
    <li {...domProps}>
      {isCurrent || isDisabled ? (
        <span {...itemProps}>{children}</span>
      ) : (
        <a {...itemProps} href={href}>
          {children}
        </a>
      )}
    </li>
  );
}

export interface DialogProps
  extends
    AriaDialogProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof AriaDialogProps | 'title'> {
  children: ComponentChildren;
  title?: ComponentChildren;
  elementRef?: Ref<HTMLDivElement>;
}

export function Dialog({
  children,
  title,
  elementRef,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: DialogProps) {
  const { dialogProps, titleProps } = useDialog({
    role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
  });
  return (
    <div {...domProps} {...dialogProps} ref={elementRef}>
      {title != null && <h2 {...titleProps}>{title}</h2>}
      {children}
    </div>
  );
}

export interface ToolbarProps
  extends AriaToolbarProps, Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof AriaToolbarProps> {
  children: ComponentChildren;
  elementRef?: Ref<HTMLDivElement>;
}

export function Toolbar({
  children,
  elementRef,
  orientation,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: ToolbarProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const { toolbarProps } = useToolbar(
    { orientation, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby },
    localRef,
  );
  return (
    <div {...domProps} {...toolbarProps} ref={mergeRefs(localRef, elementRef)}>
      {children}
    </div>
  );
}
