// Pure geometry for floating-panel collision handling, extracted from
// placeFloatingPanel (floating.tsx, tier 2) so placement strategies can be
// computed and tested without a DOM. No css, no React — deterministic math
// over literal rects only. Public surface curated behind the
// `haze-ui/headless` subpath; not part of the main library barrel.

/** Viewport edge a collision measurement applies to. */
export type CollisionSide = 'top' | 'right' | 'bottom' | 'left';

/** Viewport inset: a number applies to all four sides, an object per side. */
export type CollisionPadding = number | Partial<Record<CollisionSide, number>>;

/** Collision behavior knobs; consumers may pass any subset. */
export type CollisionStrategy = {
  /** Flip to the opposite side when the panel overflows the padded viewport and the other side fits. Default true. */
  flip?: boolean;
  /** Slide the panel along the cross axis to stay inside the padded viewport. Default true. */
  shift?: boolean;
  /** Space between the panel and the viewport edges that counts as collision. Default 0. */
  collisionPadding?: CollisionPadding;
};

/** A trigger rect as read from getBoundingClientRect. */
type TriggerRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type Size = {width: number; height: number};

/** Anchorable placements — FloatingPlacement without the 'point' escape hatch. */
type CollisionPlacement =
  | 'bottom'
  | 'bottom-span'
  | 'bottom-center'
  | 'bottom-end'
  | 'top'
  | 'left'
  | 'right';

/** Trigger-to-panel clearance per direction, read back from the gap classes. */
type PlacementGap = {
  below: number;
  above: number;
  before: number;
  after: number;
};

/**
 * Normalize a CollisionPadding into a full per-side record. Missing sides —
 * and a missing value entirely — count as no padding.
 */
export function resolvePadding(
  padding?: CollisionPadding
): Record<CollisionSide, number> {
  if (typeof padding === 'number') {
    return {top: padding, right: padding, bottom: padding, left: padding};
  }
  return {
    top: padding?.top ?? 0,
    right: padding?.right ?? 0,
    bottom: padding?.bottom ?? 0,
    left: padding?.left ?? 0,
  };
}

/** Clamp into [min, max]; an inverted range (viewport smaller than panel) pins to min. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

// The original placement's axes: flips only swap the primary side.
const verticals = {
  bottom: {side: 'bottom', align: 'start'},
  'bottom-span': {side: 'bottom', align: 'start'},
  'bottom-center': {side: 'bottom', align: 'center'},
  'bottom-end': {side: 'bottom', align: 'end'},
  top: {side: 'top', align: 'center'},
} as const;

/**
 * Resolve a fixed-panel position from literal rects: baseline coordinates →
 * flip on the primary axis → shift on the cross axis → primary-axis clamp.
 * The baseline and flip math mirror placeFloatingPanel in floating.tsx, so
 * with zero padding and both strategies enabled the output is
 * pixel-identical to the legacy behavior.
 */
export function computeFloatingPosition({
  trigger: rect,
  panel: box,
  viewport,
  placement,
  gap,
  strategy,
}: {
  trigger: TriggerRect;
  panel: Size;
  viewport: Size;
  placement: CollisionPlacement;
  gap: PlacementGap;
  strategy: Required<Pick<CollisionStrategy, 'flip' | 'shift'>> & {
    padding: Record<CollisionSide, number>;
  };
}): {top: number; left: number; placement: CollisionSide} {
  const {flip, shift, padding} = strategy;
  // Padded viewport edges — the collision bounds for every check below.
  const edge = {
    top: padding.top,
    bottom: viewport.height - padding.bottom,
    left: padding.left,
    right: viewport.width - padding.right,
  };

  const centerX = rect.left + rect.width / 2 - box.width / 2;
  const centerY = rect.top + rect.height / 2 - box.height / 2;

  // Coordinates for a vertical placement (panel over/under the trigger),
  // keeping the requested horizontal alignment across a vertical flip.
  const verticalPos = (
    side: 'top' | 'bottom',
    align: 'start' | 'center' | 'end'
  ) => ({
    top:
      side === 'bottom'
        ? rect.bottom + gap.below
        : rect.top - box.height - gap.above,
    left:
      align === 'start'
        ? rect.left
        : align === 'end'
          ? rect.right - box.width
          : centerX,
  });
  // Coordinates for a horizontal placement (panel beside the trigger);
  // the vertical center is shared by both sides.
  const horizontalPos = (side: 'left' | 'right') => ({
    top: centerY,
    left:
      side === 'right'
        ? rect.right + gap.after
        : rect.left - box.width - gap.before,
  });

  const horizontal = placement === 'left' || placement === 'right';
  let {top, left} = horizontal
    ? horizontalPos(placement)
    : verticalPos(verticals[placement].side, verticals[placement].align);
  let side: CollisionSide = horizontal
    ? placement
    : verticals[placement].side;

  if (horizontal) {
    const overflows =
      placement === 'right'
        ? left + box.width > edge.right
        : left < edge.left;
    const fitsFlipped =
      placement === 'right'
        ? rect.left - box.width - gap.before >= edge.left
        : rect.right + box.width + gap.after <= edge.right;
    if (flip && overflows && fitsFlipped) {
      const flipped = placement === 'right' ? 'left' : 'right';
      ({top, left} = horizontalPos(flipped));
      side = flipped;
    }
  } else {
    const {side: primary, align} = verticals[placement];
    const overflows =
      primary === 'bottom'
        ? top + box.height > edge.bottom
        : top < edge.top;
    const fitsFlipped =
      primary === 'bottom'
        ? rect.top - box.height - gap.above >= edge.top
        : rect.bottom + box.height + gap.below <= edge.bottom;
    if (flip && overflows && fitsFlipped) {
      const flipped = primary === 'bottom' ? 'top' : 'bottom';
      ({top, left} = verticalPos(flipped, align));
      side = flipped;
    }
  }

  // Cross axis: slide into the padded viewport, alignment unchanged.
  if (shift) {
    if (horizontal) {
      top = clamp(top, edge.top, edge.bottom - box.height);
    } else {
      left = clamp(left, edge.left, edge.right - box.width);
    }
  }

  // Primary axis: when neither side fits (or flip is disabled) clamp into
  // the padded viewport — with zero padding this is the legacy clamp that
  // keeps the panel fully in view.
  if (horizontal) {
    left = clamp(left, edge.left, edge.right - box.width);
  } else {
    top = clamp(top, edge.top, edge.bottom - box.height);
  }

  return {top, left, placement: side};
}
