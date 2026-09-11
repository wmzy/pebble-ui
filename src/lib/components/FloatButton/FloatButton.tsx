import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { fab, shapes, variants, anchored, iconBox, descBox } from './float-button-styles';
import { PlusGlyph } from './float-button-glyphs';
import { useFloatButtonGroup } from './float-button-context';

/**
 * A floating action button pinned to the inline-end / block-end screen
 * corner — the "primary action" affordance material design popularized.
 * General-purpose: any global action (create, chat, share…). For the
 * specific "scroll back up" action keep `BackToTop`, which owns its own
 * scroll-watching logic.
 *
 * Pass `href` to render a real anchor (navigation keeps ⌘/middle-click
 * and crawlability — the ButtonLink rationale); without it a
 * `<button type='button'>` is rendered and the rest of the native
 * attributes spread through.
 *
 * `variant` follows Button's `solid | outline | ghost` semantics over
 * the same color tokens; only the elevation (FAB shadow) is
 * FloatButton-specific. The default icon is a plus glyph — `icon`
 * replaces it (give a custom `svg` explicit width/height, or wrap it in
 * `Icon`).
 *
 * Standalone use fixes the button to the corner via logical insets
 * (RTL-safe; `--haze-float-button-offset` re-themes the gap). Inside a
 * `FloatButtonGroup` the button drops its own anchor and joins the
 * group's expandable menu.
 *
 * An icon-only FloatButton has no accessible name — pass `aria-label`
 * (it spreads through like any native attribute) or a `description`.
 */
type FloatButtonProps = {
  /** Icon slot; defaults to a plus glyph. Purely decorative (hidden
   * from AT) — the accessible name comes from `description` or
   * `aria-label`. */
  icon?: ReactNode;
  /** Text beside the icon (pill-shaped button); doubles as the
   * accessible name. */
  description?: ReactNode;
  shape?: 'circle' | 'square';
  /** Button-aligned color variant over the same tokens. */
  variant?: 'solid' | 'outline' | 'ghost';
  /** Render an anchor navigating to this URL instead of a button. */
  href?: string;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'> &
  Omit<ComponentPropsWithoutRef<'a'>, 'children' | 'type'>;

export default function FloatButton({
  icon,
  description,
  shape = 'circle',
  variant = 'solid',
  href,
  className,
  onClick,
  ...rest
}: FloatButtonProps) {
  const group = useFloatButtonGroup();

  // AntD behavior: activating a menu item dismisses the menu. The
  // group's own trigger is not a FloatButton, so this only fires for
  // menu children. Inlined per branch so the event keeps its native
  // element type (the shared props accept both button and anchor).
  const content = (
    <>
      <span x-class={[iconBox]} aria-hidden='true'>
        {icon ?? <PlusGlyph />}
      </span>
      {description != null && <span x-class={[descBox]}>{description}</span>}
    </>
  );

  const classes = [fab, shapes[shape], variants[variant], !group && anchored, className];

  if (href != null) {
    return (
      <a
        href={href}
        x-class={classes}
        {...rest}
        onClick={(event) => {
          onClick?.(event);
          group?.closeMenu();
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type='button'
      x-class={classes}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        group?.closeMenu();
      }}
    >
      {content}
    </button>
  );
}

export type { FloatButtonProps };
