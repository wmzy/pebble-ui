import type { ComponentType, Key, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { Fragment } from 'react';

/**
 * Data-driven menu description shared by the Menu and DropdownMenu
 * families: an `items` array replaces composed children on the root.
 * The renderer is family-agnostic — each root passes its own component
 * record, so the two families keep their independent skins.
 */
export type MenuDataItem =
  | {
      type: 'item';
      label: ReactNode;
      onSelect?: () => void;
      disabled?: boolean;
      danger?: boolean;
      icon?: ReactNode;
      kbdLabel?: ReactNode;
      /** Stable React key; the array index is used when omitted. */
      key?: Key;
    }
  | {
      type: 'checkbox';
      label: ReactNode;
      checked?: ControlOrValue<boolean>;
      onCheckedChange?: (checked: boolean) => void;
      disabled?: boolean;
      danger?: boolean;
      icon?: ReactNode;
      kbdLabel?: ReactNode;
      key?: Key;
    }
  | {
      type: 'radio';
      /** Value this option selects in its group. */
      value: string;
      label: ReactNode;
      disabled?: boolean;
      danger?: boolean;
      icon?: ReactNode;
      kbdLabel?: ReactNode;
      key?: Key;
    }
  | {
      type: 'group';
      /** Non-interactive heading above the group's items. */
      label?: ReactNode;
      /**
       * When set, the group is a radio group bound to this value —
       * its `radio` children become one single-select cluster.
       */
      value?: ControlOrValue<string>;
      onValueChange?: (value: string) => void;
      children: MenuDataItem[];
      key?: Key;
    }
  | { type: 'divider'; key?: Key }
  | {
      type: 'sub';
      label: ReactNode;
      children: MenuDataItem[];
      disabled?: boolean;
      key?: Key;
    };

/** The family's components the renderer composes `items` from. */
type MenuDataFamily = {
  Item: ComponentType<{
    children: ReactNode;
    onSelect?: () => void;
    disabled?: boolean;
    danger?: boolean;
    icon?: ReactNode;
    kbdLabel?: ReactNode;
    className?: string;
  }>;
  CheckboxItem: ComponentType<{
    children: ReactNode;
    checked?: ControlOrValue<boolean>;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    danger?: boolean;
    icon?: ReactNode;
    kbdLabel?: ReactNode;
    className?: string;
  }>;
  RadioGroup: ComponentType<{
    children: ReactNode;
    value?: ControlOrValue<string>;
    onValueChange?: (value: string) => void;
    label?: ReactNode;
    className?: string;
  }>;
  RadioItem: ComponentType<{
    children: ReactNode;
    value: string;
    disabled?: boolean;
    danger?: boolean;
    icon?: ReactNode;
    kbdLabel?: ReactNode;
    className?: string;
  }>;
  Group: ComponentType<{
    label: ReactNode;
    children: ReactNode;
    className?: string;
  }>;
  Divider: ComponentType<{ className?: string }>;
  Sub: ComponentType<{ children: ReactNode; className?: string }>;
  SubTrigger: ComponentType<{
    children: ReactNode;
    disabled?: boolean;
    className?: string;
  }>;
  SubContent: ComponentType<{ children: ReactNode; className?: string }>;
};

/**
 * Renders a `MenuDataItem[]` through a family's components. Recursion:
 * `group` and `sub` render their `children` through the same walk, so
 * nested submenus compose to any depth.
 */
export function renderMenuDataItems(
  items: MenuDataItem[],
  family: MenuDataFamily
): ReactNode {
  return items.map((item, index) => {
    const key = item.key ?? index;
    switch (item.type) {
      case 'divider':
        return <family.Divider key={key} />;
      case 'item':
        return (
          <family.Item
            key={key}
            onSelect={item.onSelect}
            disabled={item.disabled}
            danger={item.danger}
            icon={item.icon}
            kbdLabel={item.kbdLabel}
          >
            {item.label}
          </family.Item>
        );
      case 'checkbox':
        return (
          <family.CheckboxItem
            key={key}
            checked={item.checked}
            onCheckedChange={item.onCheckedChange}
            disabled={item.disabled}
            danger={item.danger}
            icon={item.icon}
            kbdLabel={item.kbdLabel}
          >
            {item.label}
          </family.CheckboxItem>
        );
      case 'radio':
        return (
          <family.RadioItem
            key={key}
            value={item.value}
            disabled={item.disabled}
            danger={item.danger}
            icon={item.icon}
            kbdLabel={item.kbdLabel}
          >
            {item.label}
          </family.RadioItem>
        );
      case 'group': {
        const content =
          item.value !== undefined ? (
            <family.RadioGroup
              value={item.value}
              onValueChange={item.onValueChange}
              label={item.label}
            >
              {renderMenuDataItems(item.children, family)}
            </family.RadioGroup>
          ) : item.label !== undefined ? (
            <family.Group label={item.label}>
              {renderMenuDataItems(item.children, family)}
            </family.Group>
          ) : (
            renderMenuDataItems(item.children, family)
          );
        return <Fragment key={key}>{content}</Fragment>;
      }
      case 'sub':
        return (
          <family.Sub key={key}>
            <family.SubTrigger disabled={item.disabled}>
              {item.label}
            </family.SubTrigger>
            <family.SubContent>
              {renderMenuDataItems(item.children, family)}
            </family.SubContent>
          </family.Sub>
        );
    }
  });
}
