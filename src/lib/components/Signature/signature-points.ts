/** Canvas-space point of a signature stroke. */
export type SignaturePoint = { x: number; y: number };

/** Euclidean distance between two points. */
export function pointDistance(a: SignaturePoint, b: SignaturePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Map pointer client coordinates onto the canvas coordinate space
 * (CSS pixels after the high-DPI `ctx.scale` — device pixels never leak
 * into stroke data). `rect` is the canvas's `getBoundingClientRect()`.
 */
export function getCanvasPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number }
): SignaturePoint {
  return { x: clientX - rect.left, y: clientY - rect.top };
}

/**
 * Drop points that move less than `minDistance` from their predecessor
 * (pointer-event streams over-sample stationary contact). The first and
 * last points of the stroke are always kept — the last one carries the
 * stroke's true endpoint. An input of fewer than two points returns a
 * copy unchanged.
 */
export function normalizeStroke(
  stroke: SignaturePoint[],
  minDistance: number
): SignaturePoint[] {
  const out: SignaturePoint[] = [];
  stroke.forEach((point, index) => {
    const last = index === stroke.length - 1;
    if (out.length === 0) {
      out.push(point);
      return;
    }
    const previous = out[out.length - 1];
    if (previous && (last || pointDistance(previous, point) >= minDistance)) {
      out.push(point);
    }
  });
  return out;
}

/**
 * Compact deterministic serialization of a stroke set —
 * `"x,y x,y|x,y"` — used to detect whether a commit (stroke end, undo,
 * clear) actually changed the drawing, so redundant events are not
 * fired.
 */
export function serializeStrokes(strokes: SignaturePoint[][]): string {
  return strokes
    .map((stroke) => stroke.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(' '))
    .join('|');
}
