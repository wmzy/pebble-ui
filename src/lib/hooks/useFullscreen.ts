import type { RefObject } from 'react';

import { useCallback, useEffect, useMemo, useState } from 'react';

/** A fullscreen target: the element itself or a ref holding it. */
export type FullscreenTarget = HTMLElement | RefObject<HTMLElement | null>;

export type UseFullscreenHandle = {
  /** Whether the target element is currently fullscreen. */
  readonly isFullscreen: boolean;
  /** Request fullscreen for the target; a no-op when the API is missing. */
  enter: () => void;
  /** Exit fullscreen when the target is the fullscreen element. */
  exit: () => void;
  /** Enter or exit based on what the document currently shows. */
  toggle: () => void;
};

function resolveElement(target?: FullscreenTarget): HTMLElement | null {
  if (!target) return document.documentElement;
  return 'current' in target ? target.current : target;
}

/**
 * Track and drive the Fullscreen API for `target` (an element or a ref;
 * defaults to `document.documentElement`).
 *
 * ```tsx
 * const boxRef = useRef<HTMLDivElement>(null);
 * const [isFullscreen, toggle] = useFullscreen(boxRef);
 * <button onClick={toggle}>{isFullscreen ? 'Exit' : 'Enter'} fullscreen</button>
 * ```
 *
 * State mirrors `fullscreenchange`: entering/exiting through any path
 * (toggle, another component, the browser's Esc) updates `isFullscreen` —
 * only when the fullscreen element is *this* target. Engines without the
 * Fullscreen API (jsdom, iOS Safari) degrade to a permanent `false` and
 * no-op commands instead of throwing.
 *
 * @returns `[isFullscreen, toggle, handle]` — the third element bundles the
 * same commands with `isFullscreen` for stable-effect consumers.
 */
export function useFullscreen(
  target?: FullscreenTarget
): [boolean, () => void, UseFullscreenHandle] {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sync = useCallback(() => {
    const el = resolveElement(target);
    setIsFullscreen(document.fullscreenElement === el);
  }, [target]);

  useEffect(() => {
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [sync]);

  const enter = useCallback(() => {
    const el = resolveElement(target);
    if (!el || typeof el.requestFullscreen !== 'function') return;
    // rejections (permissions policy, gesture rules) leave state at false
    void el.requestFullscreen().catch(() => undefined);
  }, [target]);

  const exit = useCallback(() => {
    if (
      typeof document.exitFullscreen === 'function' &&
      document.fullscreenElement === resolveElement(target)
    ) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [target]);

  const toggle = useCallback(() => {
    if (document.fullscreenElement === resolveElement(target)) exit();
    else enter();
  }, [target, enter, exit]);

  const handle = useMemo<UseFullscreenHandle>(
    () => ({ isFullscreen, enter, exit, toggle }),
    [isFullscreen, enter, exit, toggle]
  );

  return [isFullscreen, toggle, handle];
}
