import type { ComponentPropsWithoutRef, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useCallback, useId, useMemo } from 'react';
import { useControl } from 'react-use-control';

import {
  groupAnchor,
  anchored,
  menuList,
  iconBox,
  iconOpen,
  descBox,
  fab,
  shapes,
  variants,
} from './float-button-styles';
import { PlusGlyph } from './float-button-glyphs';
import { FloatButtonGroupContext } from './float-button-context';

/**
 * A `FloatButton` whose trigger expands a stack of `FloatButton`
 * children — the classic FAB menu. The trigger owns the fixed anchor
 * (`--haze-float-button-offset`), rotates its plus into an × as the menu
 * opens, and reports the state through `aria-expanded` /
 * `aria-controls`. Activating a child button dismisses the menu (the
 * child's own `onClick` runs first); Escape closes it too.
 *
 * `open` follows the controllable-state contract: a control drives it
 * live, a plain boolean is the uncontrolled initial value.
 */
type FloatButtonGroupProps = {
  /** Expanded state; a Control drives it live, a plain boolean is the
   * uncontrolled initial value. */
  open?: ControlOrValue<boolean>;
  /** Fires whenever the expanded state changes through user
   * interaction — trigger toggle, child activation or Escape. */
  onOpenChange?: (open: boolean) => void;
  /** Icon of the trigger button; defaults to a plus glyph (rotates 45°
   * into an × while open). */
  icon?: ReactNode;
  /** Text beside the trigger icon; doubles as its accessible name. */
  description?: ReactNode;
  shape?: 'circle' | 'square';
  /** Button-aligned color variant over the same tokens. */
  variant?: 'solid' | 'outline' | 'ghost';
  /** `FloatButton` items revealed by the trigger. */
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

export default function FloatButtonGroup({
  open: openControl,
  onOpenChange,
  icon,
  description,
  shape = 'circle',
  variant = 'solid',
  children,
  className,
  onKeyDown,
  ...rest
}: FloatButtonGroupProps) {
  const [open, setOpen] = useControl(openControl, false);
  const listId = useId();
  const state = open ? 'open' : 'closed';

  const update = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [setOpen, onOpenChange]
  );

  const closeMenu = useCallback(() => {
    if (open) update(false);
  }, [open, update]);

  const contextValue = useMemo(() => ({ closeMenu }), [closeMenu]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.key === 'Escape') closeMenu();
  };

  return (
    <FloatButtonGroupContext.Provider value={contextValue}>
      <div
        x-class={[groupAnchor, anchored, className]}
        data-state={state}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <div id={listId} x-class={[menuList]} data-state={state}>
          <div>{children}</div>
        </div>
        <button
          type='button'
          x-class={[fab, shapes[shape], variants[variant]]}
          data-state={state}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => update(!open)}
        >
          <span x-class={[iconBox, open && iconOpen]} aria-hidden='true'>
            {icon ?? <PlusGlyph />}
          </span>
          {description != null && <span x-class={[descBox]}>{description}</span>}
        </button>
      </div>
    </FloatButtonGroupContext.Provider>
  );
}

export type { FloatButtonGroupProps };
