import type { JSX } from 'preact';

export interface AriaBreadcrumbsProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function useBreadcrumbs(props: AriaBreadcrumbsProps = {}) {
  return {
    navProps: {
      'aria-label': props['aria-label'] ?? (props['aria-labelledby'] ? undefined : 'Breadcrumbs'),
      'aria-labelledby': props['aria-labelledby'],
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}

export interface AriaBreadcrumbItemProps {
  isCurrent?: boolean;
  isDisabled?: boolean;
}

export function useBreadcrumbItem(props: AriaBreadcrumbItemProps = {}) {
  return {
    itemProps: {
      'aria-current': props.isCurrent ? 'page' : undefined,
      'aria-disabled': props.isDisabled || undefined,
    } satisfies JSX.HTMLAttributes<HTMLElement>,
  };
}
