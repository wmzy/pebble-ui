import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { useCallback, useEffect, useRef } from 'react';
import { useControl } from 'react-use-control';

import { useHotkeys } from '../../hooks/useHotkeys';
import Dialog from '../Dialog/Dialog';

import Command, { CommandInput } from './Command';

type CommandDialogProps = {
  /**
   * Whether the palette dialog is open (controlled `Control<boolean>`
   * or plain uncontrolled initial value).
   */
  open?: ControlOrValue<boolean>;
  /**
   * Called whenever the open state changes through user interaction —
   * the `hotkey` toggle, selecting an item, Esc or backdrop close.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Global shortcut that toggles the palette, e.g. `'mod+k'` (macOS ⌘K,
   * elsewhere Ctrl+K; comma-joined aliases and full `useHotkeys` spec
   * syntax apply). Unset — the default — registers no listener at all.
   * The binding fires even while focus is inside an input: palette
   * chords never collide with plain typing.
   */
  hotkey?: string;
  /** Dialog title, rendered as the palette's accessible name (`h2`). */
  title?: ReactNode;
  /** Placeholder of the palette's search input. */
  placeholder?: string;
  /**
   * Palette body below the input — `CommandList` (with `CommandGroup` /
   * `CommandItem` rows). Selecting any item closes the palette; wire
   * per-item behavior through `CommandItem`'s `onSelect`, which runs
   * before the close.
   */
  children: ReactNode;
  className?: string;
};

/**
 * Palette shell for the embedded Dialog: the component-token channel
 * (`--haze-dialog-*`) strips the panel padding and widens it to the
 * cmdk-style 640px without fighting Dialog's own classes — the custom
 * properties resolve on the `<dialog>` element itself, where Dialog's
 * fallback chains consume them.
 */
const panel = css`
  --haze-dialog-width: 640px;
  --haze-dialog-padding: 0;
  --haze-dialog-title-gap: 0;
`;

/**
 * With the panel padding gone the title carries its own; the size-gap
 * token zeroes Dialog's `margin-bottom` (titleText consumes it) so the
 * input's border-bottom doubles as the header separator.
 */
const panelTitle = css`
  box-sizing: border-box;
  padding: var(--haze-space-4) var(--haze-space-4) var(--haze-space-3);
  font-size: var(--haze-text-sm);
`;

/** Borderless, full-width Command via Command's component tokens. */
const palette = css`
  --haze-command-width: none;
  --haze-command-border: none;
`;

export default function CommandDialog({
  open: openControl,
  onOpenChange,
  hotkey: hotkeySpec,
  title,
  placeholder,
  children,
  className,
}: CommandDialogProps) {
  const [open, setOpen, openCtrl] = useControl(openControl, false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  }, [open, setOpen, onOpenChange]);

  // Selecting an item closes the palette (after the item's own
  // onSelect); Esc and backdrop close ride Dialog's native paths.
  const closeOnSelect = useCallback(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [setOpen, onOpenChange]);

  // No `hotkey` prop → `enabled: false` keeps useHotkeys from attaching
  // any listener.
  useHotkeys(
    hotkeySpec !== undefined ? { [hotkeySpec]: toggle } : {},
    { enabled: hotkeySpec !== undefined, allowInInput: true }
  );

  // Focus the input on open. Dialog's focus scope already auto-focuses
  // the first tabbable (the input); this pins it explicitly so the
  // contract holds regardless of what precedes the palette in DOM
  // order (e.g. a title with a tabindex).
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <Dialog
      open={openCtrl}
      onClose={() => onOpenChange?.(false)}
      title={title}
      classNames={{ root: panel, header: panelTitle }}
      className={className}
    >
      <Command className={palette} onItemSelect={closeOnSelect}>
        <CommandInput ref={inputRef} placeholder={placeholder} />
        {children}
      </Command>
    </Dialog>
  );
}

export type { CommandDialogProps };
