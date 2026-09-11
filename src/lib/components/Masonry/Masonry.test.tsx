import { render } from '@testing-library/react';

import Masonry from './Masonry';
import { distributeIndices } from './masonry-distribute';

function items(count: number) {
  return Array.from({ length: count }, (_, i) => (
    <div key={`item-${i}`} data-testid={`item-${i}`}>
      card {i}
    </div>
  ));
}

/** Column texts of the rendered masonry, outer column → inner cards. */
function columnTexts(container: HTMLElement): string[][] {
  const root = container.firstChild as HTMLElement;
  return Array.from(root.children).map((column) =>
    Array.from(column.children).map(
      (item) => (item.firstChild as HTMLElement).textContent
    )
  );
}

describe('Masonry', () => {
  it('distributes children round-robin across the default 3 columns', () => {
    const { container } = render(<Masonry>{items(5)}</Masonry>);
    expect(columnTexts(container)).toEqual([
      ['card 0', 'card 3'],
      ['card 1', 'card 4'],
      ['card 2'],
    ]);
  });

  it('honors a custom column count', () => {
    const { container } = render(<Masonry columns={4}>{items(8)}</Masonry>);
    const columns = columnTexts(container);
    expect(columns).toHaveLength(4);
    expect(columns[0]).toEqual(['card 0', 'card 4']);
    expect(columns[3]).toEqual(['card 3', 'card 7']);
  });

  it('clamps non-positive and fractional column counts', () => {
    const { container } = render(<Masonry columns={0}>{items(3)}</Masonry>);
    expect(columnTexts(container)).toHaveLength(1);
    const { container: half } = render(<Masonry columns={2.7}>{items(3)}</Masonry>);
    expect(columnTexts(half)).toHaveLength(2);
  });

  it('keeps reading order: row-major walk reconstructs source order', () => {
    const { container } = render(<Masonry columns={3}>{items(7)}</Masonry>);
    const columns = columnTexts(container).map((col) =>
      col.map((text) => Number(text.replace('card ', '')))
    );
    // item i lands at row floor(i/3), column i%3 — reading row by row
    // walks the cards in source order (CSS multicolumn would fill
    // column-major instead)
    expect(columns[0]).toEqual([0, 3, 6]);
    expect(columns[1]).toEqual([1, 4]);
    expect(columns[2]).toEqual([2, 5]);
  });

  it('applies the gap token scale to the wrapper', () => {
    const { container } = render(<Masonry gap={2}>{items(2)}</Masonry>);
    const root = container.firstChild as HTMLElement;
    expect(root.style.gap).toBe('var(--haze-space-2)');
  });

  it('applies className and forwards native props', () => {
    const { container } = render(
      <Masonry className="custom" data-testid="wall" role="list" aria-label="Gallery">
        {items(2)}
      </Masonry>
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('custom');
    expect(root).toHaveAttribute('data-testid', 'wall');
    expect(root).toHaveAttribute('role', 'list');
    expect(root).toHaveAttribute('aria-label', 'Gallery');
  });

  it('renders nothing but columns for empty children', () => {
    const { container } = render(<Masonry columns={3}>{null}</Masonry>);
    expect(columnTexts(container)).toEqual([[], [], []]);
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(<Masonry columns={2}>{items(4)}</Masonry>);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('distributeIndices', () => {
  it('round-robins when every estimate is equal', () => {
    expect(distributeIndices(6, 3)).toEqual([[0, 3], [1, 4], [2, 5]]);
  });

  it('packs the shortest column when estimates diverge', () => {
    // heights: item0=10, then 1 each — column 0 is tall, everything
    // else stacks on column 1 until it passes 10
    const heights = [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    expect(distributeIndices(11, 2, (i) => heights[i] ?? 1)).toEqual([
      [0],
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ]);
  });

  it('keeps the leftmost column on ties', () => {
    expect(distributeIndices(4, 3)).toEqual([[0, 3], [1], [2]]);
  });

  it('clamps negative estimates to zero', () => {
    // clamped, item 0 leaves column 0 at height 0 so the tie stacks
    // item 1 leftmost; unclamped (-5) column 0 would be "shorter" and
    // item 1 would land on column 1 instead
    expect(distributeIndices(2, 2, (i) => (i === 0 ? -5 : 1))).toEqual([[0, 1], []]);
  });

  it('falls back to a single column for non-positive input', () => {
    expect(distributeIndices(3, 0)).toEqual([[0, 1, 2]]);
  });
});
