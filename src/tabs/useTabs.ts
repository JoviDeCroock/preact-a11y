import type { JSX, TargetedKeyboardEvent } from 'preact';

export type TabOrientation = 'horizontal' | 'vertical';
export type KeyboardActivation = 'automatic' | 'manual';

export interface AriaTabListProps {
  orientation?: TabOrientation;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function useTabList(props: AriaTabListProps = {}) {
  return {
    tabListProps: {
      role: 'tablist',
      'aria-orientation': props.orientation ?? 'horizontal',
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
  };
}

export interface AriaTabProps {
  id: string;
  itemKey: string;
  panelId: string;
  isSelected: boolean;
  isDisabled?: boolean;
  orientation?: TabOrientation;
  keyboardActivation?: KeyboardActivation;
  onSelect: (id: string) => void;
}

function tabsFor(element: HTMLElement): HTMLButtonElement[] {
  const list = element.closest('[role="tablist"]');
  if (!list) return [];
  return Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter(
    (tab) => tab.getAttribute('aria-disabled') !== 'true',
  );
}

export function useTab(props: AriaTabProps) {
  const orientation = props.orientation ?? 'horizontal';
  const activation = props.keyboardActivation ?? 'automatic';

  function moveFocus(event: TargetedKeyboardEvent<HTMLButtonElement>, destination: number) {
    const tabs = tabsFor(event.currentTarget);
    const tab = tabs.at((destination + tabs.length) % tabs.length);
    if (!tab) return;
    event.preventDefault();
    tab.focus();
    if (activation === 'automatic') props.onSelect(tab.dataset.key!);
  }

  return {
    tabProps: {
      id: props.id,
      role: 'tab',
      type: 'button',
      tabIndex: props.isSelected ? 0 : -1,
      'aria-controls': props.panelId,
      'aria-disabled': props.isDisabled || undefined,
      'aria-selected': props.isSelected,
      onClick() {
        if (!props.isDisabled) props.onSelect(props.itemKey);
      },
      onKeyDown(event: TargetedKeyboardEvent<HTMLButtonElement>) {
        if (props.isDisabled) return;
        const tabs = tabsFor(event.currentTarget);
        const current = tabs.indexOf(event.currentTarget);
        const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
        const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

        if (event.key === previousKey) moveFocus(event, current - 1);
        else if (event.key === nextKey) moveFocus(event, current + 1);
        else if (event.key === 'Home') moveFocus(event, 0);
        else if (event.key === 'End') moveFocus(event, tabs.length - 1);
        else if (activation === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          props.onSelect(props.itemKey);
        }
      },
    } satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  };
}

export interface AriaTabPanelProps {
  id: string;
  tabId: string;
  isSelected: boolean;
}

export function useTabPanel(props: AriaTabPanelProps) {
  return {
    tabPanelProps: {
      id: props.id,
      role: 'tabpanel',
      tabIndex: 0,
      hidden: !props.isSelected,
      'aria-labelledby': props.tabId,
    } satisfies JSX.HTMLAttributes<HTMLDivElement>,
  };
}
