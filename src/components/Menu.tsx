import { createContext } from 'preact';
import type { ComponentChildren, JSX, Ref } from 'preact';
import { useContext, useId, useRef, useState } from 'preact/hooks';
import { useInteractOutside } from '../interactions/useInteractOutside';
import { useMenu, useMenuItem } from '../menu/useMenu';
import { useMenuTrigger } from '../menu/useMenuTrigger';
import { mergeRefs } from '../utils/mergeRefs';

interface MenuContextValue {
  baseId: string;
  focusedKey: string | undefined;
  selectedKeys: Set<string>;
  focus(key: string): void;
  action(key: string): void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export interface MenuProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'aria-label' | 'aria-labelledby' | 'autoFocus' | 'id' | 'onSelect'
> {
  children: ComponentChildren;
  autoFocus?: 'first' | 'last';
  selectedKeys?: Iterable<string>;
  closeOnSelect?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  elementRef?: Ref<HTMLDivElement>;
  onAction?: (key: string) => void;
  onClose?: () => void;
}

export function Menu({
  children,
  autoFocus = 'first',
  selectedKeys,
  closeOnSelect = true,
  elementRef,
  onAction,
  onClose,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...domProps
}: MenuProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const [focusedKey, setFocusedKey] = useState<string>();
  const baseId = id ?? `preact-aria-menu-${useId()}`;
  const selection = new Set(selectedKeys);

  function action(key: string) {
    onAction?.(key);
    if (closeOnSelect) onClose?.();
  }

  const context: MenuContextValue = {
    baseId,
    focusedKey,
    selectedKeys: selection,
    focus: setFocusedKey,
    action,
  };
  const { menuProps } = useMenu(
    {
      focusedKey: focusedKey ? `${baseId}-item-${focusedKey}` : undefined,
      autoFocus,
      'aria-label': typeof ariaLabel === 'string' ? ariaLabel : undefined,
      'aria-labelledby': typeof ariaLabelledby === 'string' ? ariaLabelledby : undefined,
      onFocusedKeyChange(itemId) {
        setFocusedKey(itemId.replace(`${baseId}-item-`, ''));
      },
      onAction(itemId) {
        action(itemId.replace(`${baseId}-item-`, ''));
      },
      onClose,
    },
    localRef,
  );
  useInteractOutside({ ref: localRef, onInteractOutside: onClose });

  return (
    <MenuContext.Provider value={context}>
      <div {...domProps} {...menuProps} id={baseId} ref={mergeRefs(localRef, elementRef)}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export interface MenuItemProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'id'> {
  id: string;
  children: ComponentChildren;
  type?: 'item' | 'checkbox' | 'radio';
  isDisabled?: boolean;
}

export function MenuItem({ id, children, type = 'item', isDisabled, ...domProps }: MenuItemProps) {
  const context = useContext(MenuContext);
  if (!context) throw new Error('MenuItem must be rendered inside <Menu>.');
  const isFocused = context.focusedKey === id;
  const isSelected = context.selectedKeys.has(id);
  const itemId = `${context.baseId}-item-${id}`;
  const { menuItemProps } = useMenuItem({
    id: itemId,
    key: id,
    type,
    isSelected,
    isDisabled,
    onAction: context.action,
    onFocus: context.focus,
  });

  return (
    <div
      {...domProps}
      {...menuItemProps}
      data-focused={isFocused || undefined}
      data-key={itemId}
      data-selected={isSelected || undefined}
    >
      {children}
    </div>
  );
}

export interface MenuTriggerProps {
  children: ComponentChildren;
  label: ComponentChildren;
  isDisabled?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  className?: string;
  menuClassName?: string;
  onAction?: (key: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export function MenuTrigger({
  children,
  label,
  isDisabled,
  isOpen,
  defaultOpen = false,
  className,
  menuClassName,
  onAction,
  onOpenChange,
}: MenuTriggerProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [focusStrategy, setFocusStrategy] = useState<'first' | 'last'>('first');
  const open = isOpen ?? uncontrolled;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const triggerId = `preact-aria-menu-trigger-${generatedId}`;
  const menuId = `preact-aria-menu-${generatedId}`;

  function setOpen(next: boolean, strategy: 'first' | 'last' = 'first') {
    setFocusStrategy(strategy);
    if (isOpen === undefined) setUncontrolled(next);
    onOpenChange?.(next);
    if (!next) queueMicrotask(() => triggerRef.current?.focus());
  }

  const { menuTriggerProps } = useMenuTrigger({
    isOpen: open,
    isDisabled,
    triggerId,
    menuId,
    onOpenChange: setOpen,
  });

  return (
    <div className={className}>
      <button {...menuTriggerProps} ref={triggerRef}>
        {label}
      </button>
      {open && (
        <Menu
          aria-labelledby={triggerId}
          autoFocus={focusStrategy}
          className={menuClassName}
          id={menuId}
          onAction={onAction}
          onClose={() => setOpen(false)}
        >
          {children}
        </Menu>
      )}
    </div>
  );
}
