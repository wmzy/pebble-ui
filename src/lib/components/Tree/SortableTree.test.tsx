import type { SortableTreeMoveInfo } from './sortable-tree-utils';

import type { TreeNodeData } from './types';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect } from 'vitest';

import SortableTree from './SortableTree';

import { applyTreeMove, resolveTreeMove } from './sortable-tree-utils';
import { rowDraggable, rowInSubtree } from './sortable-tree-styles';

const dir = path.dirname(fileURLToPath(import.meta.url));

const flatRoots: TreeNodeData[] = [
  { key: 'a', title: 'A' },
  { key: 'b', title: 'B' },
  { key: 'c', title: 'C' },
];

const twoBranches: TreeNodeData[] = [
  {
    key: 'p1',
    title: 'P1',
    children: [
      { key: 'c1a', title: 'C1a' },
      { key: 'c1b', title: 'C1b' },
    ],
  },
  {
    key: 'p2',
    title: 'P2',
    children: [
      { key: 'c2a', title: 'C2a' },
      { key: 'c2b', title: 'C2b' },
    ],
  },
];

/** Applies every reported move — the controlled demo pattern. */
function StatefulSortableTree({
  initial,
  initialExpanded,
  ...rest
}: {
  initial: TreeNodeData[];
  initialExpanded?: string[];
} & Omit<Parameters<typeof SortableTree>[0], 'treeData' | 'expandedKeys'>) {
  const [data, setData] = useState(initial);
  const [expanded, setExpanded] = useState<string[]>(initialExpanded ?? []);
  return (
    <SortableTree
      treeData={data}
      expandedKeys={expanded}
      onExpand={setExpanded}
      onMove={(info) => setData((prev) => applyTreeMove(prev, info))}
      {...rest}
    />
  );
}

/** jsdom rects are all 0×0 at (0,0) and dnd-kit's keyboard coordinate
 *  getter + collision detection work off rect geometry — give every
 *  sortable row wrapper a distinct stacked rect before any keyboard
 *  drag (the SortableTagGroup test precedent). */
function giveRowsDistinctRects() {
  const rows = screen.getByRole('tree').querySelectorAll('[data-sortable-row]');
  rows.forEach((rowEl, index) => {
    const top = index * 32;
    rowEl.getBoundingClientRect = () =>
      ({
        x: 0,
        y: top,
        top,
        left: 0,
        right: 240,
        bottom: top + 32,
        width: 240,
        height: 32,
        toJSON: () => ({}),
      });
  });
}

/** Visible row titles in DOM order. */
function rowTitles(): string[] {
  return screen.getAllByRole('treeitem').map((row) => row.textContent);
}

/** Lift `title`, press an arrow `steps` times, drop (or Escape). */
async function keyboardDrag(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
  steps: number,
  action: 'drop' | 'cancel' = 'drop',
  direction: 'down' | 'up' = 'down'
) {
  screen.getByRole('treeitem', { name: title }).focus();
  await user.keyboard(' ');
  const arrow = direction === 'down' ? '{ArrowDown}' : '{ArrowUp}';
  for (let i = 0; i < steps; i += 1) {
    await user.keyboard(arrow);
  }
  await user.keyboard(action === 'drop' ? ' ' : '{Escape}');
}

describe('resolveTreeMove', () => {
  it('inserts after the target and adjusts for the removal (drag down)', () => {
    expect(resolveTreeMove(flatRoots, 'a', 'c')).toEqual({
      key: 'a',
      parentKey: null,
      index: 2,
    });
  });

  it('keeps the index when dragging up within the same parent', () => {
    expect(resolveTreeMove(flatRoots, 'c', 'a')).toEqual({
      key: 'c',
      parentKey: null,
      index: 1,
    });
  });

  it('reparents across parents', () => {
    expect(resolveTreeMove(twoBranches, 'c1a', 'c2b')).toEqual({
      key: 'c1a',
      parentKey: 'p2',
      index: 2,
    });
  });

  it('returns null when the node is dropped back onto its own position', () => {
    expect(resolveTreeMove(flatRoots, 'b', 'a')).toBeNull();
  });

  it('returns null when dropping onto itself', () => {
    expect(resolveTreeMove(flatRoots, 'a', 'a')).toBeNull();
  });

  it('never moves a node into its own subtree', () => {
    expect(resolveTreeMove(twoBranches, 'p1', 'c1b')).toBeNull();
  });

  it('returns null for unknown keys', () => {
    expect(resolveTreeMove(flatRoots, 'nope', 'a')).toBeNull();
    expect(resolveTreeMove(flatRoots, 'a', 'nope')).toBeNull();
  });
});

describe('applyTreeMove', () => {
  it('reorders roots without touching the input', () => {
    const next = applyTreeMove(flatRoots, { key: 'a', parentKey: null, index: 2 });
    expect(next.map((n) => n.key)).toEqual(['b', 'c', 'a']);
    expect(flatRoots.map((n) => n.key)).toEqual(['a', 'b', 'c']);
  });

  it('reparents keeping the whole subtree attached', () => {
    const next = applyTreeMove(twoBranches, {
      key: 'c1a',
      parentKey: 'p2',
      index: 1,
    });
    const p2 = next.find((n) => n.key === 'p2')!;
    expect(p2.children?.map((n) => n.key)).toEqual(['c2a', 'c1a', 'c2b']);
    const p1 = next.find((n) => n.key === 'p1')!;
    expect(p1.children?.map((n) => n.key)).toEqual(['c1b']);
  });

  it('moves a parent with children intact', () => {
    const next = applyTreeMove(twoBranches, {
      key: 'p1',
      parentKey: null,
      index: 1,
    });
    expect(next.map((n) => n.key)).toEqual(['p2', 'p1']);
    expect(next[1]!.children?.map((n) => n.key)).toEqual(['c1a', 'c1b']);
  });

  it('returns the same reference for an unknown node', () => {
    expect(applyTreeMove(flatRoots, { key: 'nope', parentKey: null, index: 0 })).toBe(flatRoots);
  });
});

describe('SortableTree', () => {
  it('reorders same-level rows through the full keyboard flow', async () => {
    const user = userEvent.setup();
    render(<StatefulSortableTree initial={flatRoots} />);
    giveRowsDistinctRects();
    await keyboardDrag(user, 'A', 1);
    expect(rowTitles()).toEqual(['B', 'A', 'C']);
  });

  it('reports the onMove payload for a same-level reorder', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn<(info: SortableTreeMoveInfo) => void>();
    render(<SortableTree treeData={flatRoots} onMove={onMove} />);
    giveRowsDistinctRects();
    await keyboardDrag(user, 'A', 1);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({ key: 'a', parentKey: null, index: 1 });
  });

  it('moves a node across parents', async () => {
    const user = userEvent.setup();
    render(
      <StatefulSortableTree initial={twoBranches} initialExpanded={['p1', 'p2']} />
    );
    giveRowsDistinctRects();
    // rows: P1, C1a, C1b, P2, C2a, C2b — drag C1a onto C2a (3 steps down)
    await keyboardDrag(user, 'C1a', 3);
    expect(rowTitles()).toEqual(['P1', 'C1b', 'P2', 'C2a', 'C1a', 'C2b']);
    // C1a now nests under P2 (a root), one level down from it
    const moved = screen.getByRole('treeitem', { name: 'C1a' });
    expect(moved).toHaveAttribute('aria-level', '2');
  });

  it('moves an expanded node with its subtree following', async () => {
    const user = userEvent.setup();
    render(<StatefulSortableTree initial={twoBranches} initialExpanded={['p1']} />);
    giveRowsDistinctRects();
    // rows: P1, C1a, C1b, P2 — pressing down walks the dragged rect one
    // row at a time; while it sits inside its own subtree the drop target
    // resolves to the dragged row itself (a no-op), and one press past
    // the subtree lands over P2
    await keyboardDrag(user, 'P1', 2);
    expect(rowTitles()).toEqual(['P2', 'P1', 'C1a', 'C1b']);
    // the children stayed attached and nested under the moved parent
    expect(screen.getByRole('treeitem', { name: 'C1a' })).toHaveAttribute('aria-level', '2');
    expect(screen.getByRole('treeitem', { name: 'C1b' })).toHaveAttribute('aria-level', '2');
  });

  it('treats a drop inside the dragged subtree as a no-op', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn<(info: SortableTreeMoveInfo) => void>();
    render(
      <SortableTree treeData={twoBranches} expandedKeys={['p1']} onMove={onMove} />
    );
    giveRowsDistinctRects();
    // one press down moves the dragged rect onto C1a's row — inside the
    // dragged subtree, where the only candidate left is the dragged row
    await keyboardDrag(user, 'P1', 1);
    expect(onMove).not.toHaveBeenCalled();
    expect(rowTitles()).toEqual(['P1', 'C1a', 'C1b', 'P2']);
  });

  it('dims the dragged subtree rows while the drag is active', async () => {
    const user = userEvent.setup();
    render(<SortableTree treeData={twoBranches} expandedKeys={['p1']} />);
    giveRowsDistinctRects();
    screen.getByRole('treeitem', { name: 'P1' }).focus();
    await user.keyboard(' ');
    const childWrapper = screen
      .getByRole('treeitem', { name: 'C1a' })
      .closest('[data-sortable-row]')!;
    expect(childWrapper).toHaveClass(rowInSubtree);
    await user.keyboard('{Escape}');
    expect(childWrapper).not.toHaveClass(rowInSubtree);
  });

  it('does not report a move when dropped back onto the previous sibling', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn<(info: SortableTreeMoveInfo) => void>();
    render(<SortableTree treeData={flatRoots} onMove={onMove} />);
    giveRowsDistinctRects();
    // B dragged up onto A is its current position — nothing to report
    await keyboardDrag(user, 'B', 1, 'drop', 'up');
    expect(onMove).not.toHaveBeenCalled();
    expect(rowTitles()).toEqual(['A', 'B', 'C']);
  });

  it('does not report a move when the drag is cancelled with Escape', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn<(info: SortableTreeMoveInfo) => void>();
    render(<SortableTree treeData={flatRoots} onMove={onMove} />);
    giveRowsDistinctRects();
    await keyboardDrag(user, 'A', 1, 'cancel');
    expect(onMove).not.toHaveBeenCalled();
    expect(rowTitles()).toEqual(['A', 'B', 'C']);
  });

  it('keyboard lift does not toggle the checkbox on a checkable tree', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(
      <StatefulSortableTree initial={flatRoots} checkable onCheck={onCheck} />
    );
    giveRowsDistinctRects();
    screen.getByRole('treeitem', { name: 'A' }).focus();
    await user.keyboard(' '); // lift — must not also check
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' '); // drop — must not also check
    expect(onCheck).not.toHaveBeenCalled();
    expect(rowTitles()).toEqual(['B', 'A', 'C']);
  });

  it('keeps the tree keymap quiet during a drag (arrows do not expand)', async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    render(
      <SortableTree treeData={twoBranches} expandedKeys={['p1']} onExpand={onExpand} />
    );
    giveRowsDistinctRects();
    const dragged = screen.getByRole('treeitem', { name: 'P1' });
    dragged.focus();
    await user.keyboard(' ');
    await user.keyboard('{ArrowRight}'); // would expand P2 in the tree keymap
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');
    expect(onExpand).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(dragged);
  });

  it('keeps plain keyboard navigation working when idle', async () => {
    const user = userEvent.setup();
    render(<SortableTree treeData={flatRoots} />);
    const [a, b] = screen.getAllByRole('treeitem');
    a!.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(b);
  });

  it('keeps clicks selecting through the row activator', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<NonNullable<Parameters<typeof SortableTree>[0]['onSelect']>>();
    render(<SortableTree treeData={flatRoots} onSelect={onSelect} />);
    await user.click(screen.getByRole('treeitem', { name: 'B' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0]).toEqual(['b']);
  });

  it('reorders from a subtree the user expanded by click (uncontrolled mirror)', async () => {
    const user = userEvent.setup();
    render(<StatefulSortableTree initial={twoBranches} />);
    // expand both collapsed parents by clicking their switchers
    // (uncontrolled expansion — mirrored through onExpand)
    await user.click(screen.getAllByRole('button', { name: 'Expand' })[0]!);
    await user.click(screen.getAllByRole('button', { name: 'Expand' })[0]!);
    giveRowsDistinctRects();
    // rows: P1, C1a, C1b, P2, C2a, C2b — drag C1a onto C1b
    await keyboardDrag(user, 'C1a', 1);
    expect(rowTitles()).toEqual(['P1', 'C1b', 'C1a', 'P2', 'C2a', 'C2b']);
  });

  it('renders the pointer-only grip in dragHandle mode and stays keyboard sortable', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn<(info: SortableTreeMoveInfo) => void>();
    render(<SortableTree treeData={flatRoots} dragHandle onMove={onMove} />);
    const grips = screen
      .getAllByRole('treeitem')[0]!
      .querySelectorAll('span[aria-hidden="true"]');
    expect(grips.length).toBeGreaterThan(0);
    // rows carry no whole-row drag affordance in handle mode
    expect(
      screen.getAllByRole('treeitem')[0]!.closest('[data-sortable-row]')
    ).not.toHaveClass(rowDraggable);
    // keyboard drags stay on the row itself
    giveRowsDistinctRects();
    await keyboardDrag(user, 'A', 1);
    expect(onMove).toHaveBeenCalledWith({ key: 'a', parentKey: null, index: 1 });
  });

  it('gives whole rows the drag affordance by default', () => {
    render(<SortableTree treeData={flatRoots} />);
    expect(
      screen.getAllByRole('treeitem')[0]!.closest('[data-sortable-row]')
    ).toHaveClass(rowDraggable);
  });

  it('passes a consumer titleRender through', () => {
    render(
      <SortableTree
        treeData={flatRoots}
        titleRender={(node) => (
          <em>{`#${typeof node.title === 'string' ? node.title : node.key}`}</em>
        )}
      />
    );
    expect(screen.getAllByRole('treeitem')[0]!.textContent).toBe('#A');
  });

  it('has no axe violations (row mode, checkable, expanded)', async () => {
    const { axe } = await import('jest-axe');
    render(<SortableTree treeData={twoBranches} checkable expandedKeys={['p1']} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations (dragHandle mode)', async () => {
    const { axe } = await import('jest-axe');
    render(<SortableTree treeData={twoBranches} dragHandle expandedKeys={['p1', 'p2']} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('SortableTree dnd isolation', () => {
  it('keeps every base Tree source file free of @dnd-kit imports', () => {
    for (const file of [
      'Tree.tsx',
      'TreeItem.tsx',
      'utils.ts',
      'types.ts',
      'index.ts',
    ]) {
      const source = readFileSync(path.join(dir, file), 'utf8');
      expect(source.includes('@dnd-kit'), `${file} imports @dnd-kit`).toBe(false);
    }
  });
});
