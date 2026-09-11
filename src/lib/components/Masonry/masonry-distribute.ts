/**
 * Greedy shortest-column distribution for `Masonry`.
 *
 * Children are visited in source order (row-major reading preserved:
 * item `i` lands in column `i % columns` when every estimate is equal,
 * which is the default) and each is appended to the currently shortest
 * column — the classic "pack the shortest stack" heuristic that keeps
 * column heights balanced as estimates diverge.
 *
 * This is the estimation-based simplified pass: the height oracle
 * defaults to a constant, so distribution is stable, SSR-safe and free
 * of measurement. Feeding real heights (e.g. from a `ResizeObserver`
 * over mounted items) is a drop-in extension of the same function —
 * the component documents that upgrade path.
 */
export function distributeIndices(
  count: number,
  columns: number,
  estimateHeight: (index: number) => number = () => 1,
): number[][] {
  const cols = Array.from({ length: Math.max(1, columns) }, () => ({
    indices: [] as number[],
    height: 0,
  }));

  for (let index = 0; index < count; index += 1) {
    // leftmost wins ties: reduce keeps the earlier column on equality
    const shortest = cols.reduce((a, b) => (b.height < a.height ? b : a));
    shortest.indices.push(index);
    shortest.height += Math.max(0, estimateHeight(index));
  }

  return cols.map((col) => col.indices);
}
