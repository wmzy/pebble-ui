import type { ReactElement, MouseEvent } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { FullscreenTarget } from '../../hooks/useFullscreen';

import { Children, cloneElement, useEffect, useRef } from 'react';
import { useControl } from 'react-use-control';

import { useFullscreen } from '../../hooks/useFullscreen';

type MouseEventEventHandler = (event: MouseEvent<HTMLElement>) => void;

type FullscreenProps = {
  /** Whether the target should be fullscreen — control or plain initial value. */
  fullscreen?: ControlOrValue<boolean>;
  /** Fires whenever the actual fullscreen state changes (toggle, Esc, …). */
  onChange?: (fullscreen: boolean) => void;
  /** Element (or ref) to fullscreen; defaults to the document element. */
  target?: FullscreenTarget;
  /** The trigger — its click toggles fullscreen. */
  children: ReactElement<{
    onClick?: MouseEventEventHandler;
  }>;
};

/**
 * Wrap-mode fullscreen: the single child becomes the trigger.
 *
 * ```tsx
 * <Fullscreen target={boxRef}>
 *   <Button>Maximize</Button>
 * </Fullscreen>
 * ```
 *
 * The desired state (`fullscreen`) and the browser's actual state are
 * reconciled both ways: prop writes request/exit the API, and browser-side
 * changes (including the Esc shortcut) write back and fire `onChange`.
 * Without the Fullscreen API the trigger stays inert instead of throwing.
 */
export default function Fullscreen({
  fullscreen: fullscreenControl,
  onChange,
  target,
  children,
}: FullscreenProps) {
  const [fullscreen, setFullscreen] = useControl(fullscreenControl, false);
  const [isFullscreen, , handle] = useFullscreen(target);

  // intent → actual: drive the API only when the *desired* value changes —
  // never on mismatches created by browser-side exits, which the effect
  // below resolves instead. (A mismatch-driven drive would fight that
  // effect and ping-pong enter/exit forever.)
  const prevDesiredRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevDesiredRef.current === fullscreen) return;
    prevDesiredRef.current = fullscreen;
    if (fullscreen === isFullscreen) return;
    if (fullscreen) handle.enter();
    else handle.exit();
  }, [fullscreen, isFullscreen, handle]);

  // actual → desired: browser-initiated changes (Esc, OS gestures) sync the
  // control and report through onChange. The previous-value guard keeps the
  // initial mount from firing onChange(false).
  const prevActualRef = useRef(false);
  useEffect(() => {
    if (prevActualRef.current === isFullscreen) return;
    prevActualRef.current = isFullscreen;
    setFullscreen(isFullscreen);
    onChange?.(isFullscreen);
  }, [isFullscreen, setFullscreen, onChange]);

  // The trigger is the consumer's element (cloneElement, no wrapper DOM):
  // brand it with the trigger slot the way shadcn's Slot composition does.
  // An explicit data-slot on the child wins — the sanctioned prop-forwarded
  // override, same contract as DataTable/TableCell.
  const trigger = Children.only(children) as ReactElement<{
    onClick?: MouseEventEventHandler;
    'data-slot'?: string;
  }>;

  return cloneElement(trigger, {
    onClick: (event: MouseEvent<HTMLElement>) => {
      trigger.props.onClick?.(event);
      setFullscreen((prev) => !prev);
    },
    'data-slot': trigger.props['data-slot'] ?? 'trigger',
  });
}

export type { FullscreenProps };
