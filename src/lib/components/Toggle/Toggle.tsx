import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { useControl } from 'react-use-control';

import ToggleCore from './ToggleCore';

type ToggleProps = {
  /** Whether the toggle is pressed; a control for full external ownership. */
  pressed?: ControlOrValue<boolean>;
  size?: 'sm' | 'md' | 'lg';
  /** Equal padding on all sides — for icon-only square toggles. */
  square?: boolean;
  /** Forwarded to the underlying `<button>` — form bridges and
   * `ref.current.focus()` reach. */
  ref?: Ref<HTMLButtonElement>;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'aria-pressed'>;

/**
 * A momentary pressed-state button (aria-pressed) for one-shot modes —
 * bold, mute, grid/list view. `pressed` is one prop, two modes: a plain
 * boolean leaves state internal, a control hands ownership to the caller.
 */
export default function Toggle({
  pressed: pressedControl,
  size,
  square,
  className,
  onClick,
  ref,
  ...rest
}: ToggleProps) {
  const [pressed, setPressed] = useControl(pressedControl, false);

  return (
    <ToggleCore
      ref={ref}
      pressed={pressed}
      onPressedChange={setPressed}
      onNativeClick={onClick}
      size={size}
      square={square}
      className={className}
      {...rest}
    />
  );
}

export type { ToggleProps };
