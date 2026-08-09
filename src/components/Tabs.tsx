import { createContext } from 'preact';
import type { ComponentChildren, JSX } from 'preact';
import { useContext, useId, useState } from 'preact/hooks';
import {
  useTab,
  useTabList,
  useTabPanel,
  type AriaTabListProps,
  type KeyboardActivation,
  type TabOrientation,
} from '../tabs/useTabs';

interface TabsContextValue {
  baseId: string;
  selectedKey: string | undefined;
  orientation: TabOrientation;
  keyboardActivation: KeyboardActivation;
  select(key: string): void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`${component} must be rendered inside <Tabs>.`);
  return context;
}

export interface TabsProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  children: ComponentChildren;
  selectedKey?: string;
  defaultSelectedKey?: string;
  orientation?: TabOrientation;
  keyboardActivation?: KeyboardActivation;
  onSelectionChange?: (key: string) => void;
}

export function Tabs({
  children,
  selectedKey,
  defaultSelectedKey,
  orientation = 'horizontal',
  keyboardActivation = 'automatic',
  onSelectionChange,
  ...domProps
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultSelectedKey);
  const selection = selectedKey ?? uncontrolled;
  const context: TabsContextValue = {
    baseId: `preact-aria-tabs-${useId()}`,
    selectedKey: selection,
    orientation,
    keyboardActivation,
    select(key) {
      if (selectedKey === undefined) setUncontrolled(key);
      onSelectionChange?.(key);
    },
  };

  return (
    <TabsContext.Provider value={context}>
      <div {...domProps} data-orientation={orientation}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabListProps
  extends AriaTabListProps, Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof AriaTabListProps> {
  children: ComponentChildren;
}

export function TabList({
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: TabListProps) {
  const context = useTabsContext('TabList');
  const { tabListProps } = useTabList({
    orientation: context.orientation,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
  });
  return (
    <div {...domProps} {...tabListProps}>
      {children}
    </div>
  );
}

export interface TabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'id'> {
  id: string;
  children: ComponentChildren;
  isDisabled?: boolean;
}

export function Tab({ id, children, isDisabled, ...domProps }: TabProps) {
  const context = useTabsContext('Tab');
  const tabId = `${context.baseId}-tab-${id}`;
  const panelId = `${context.baseId}-panel-${id}`;
  const isSelected = context.selectedKey === id;
  const { tabProps } = useTab({
    id: tabId,
    itemKey: id,
    panelId,
    isSelected,
    isDisabled,
    orientation: context.orientation,
    keyboardActivation: context.keyboardActivation,
    onSelect: context.select,
  });

  return (
    <button
      {...domProps}
      {...tabProps}
      data-disabled={isDisabled || undefined}
      data-key={id}
      data-selected={isSelected || undefined}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id'> {
  id: string;
  children: ComponentChildren;
}

export function TabPanel({ id, children, ...domProps }: TabPanelProps) {
  const context = useTabsContext('TabPanel');
  const { tabPanelProps } = useTabPanel({
    id: `${context.baseId}-panel-${id}`,
    tabId: `${context.baseId}-tab-${id}`,
    isSelected: context.selectedKey === id,
  });
  return (
    <div {...domProps} {...tabPanelProps}>
      {children}
    </div>
  );
}
