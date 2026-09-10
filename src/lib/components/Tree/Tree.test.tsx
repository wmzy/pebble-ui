import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Tree from './Tree';

const basicData = [
  {
    key: '0-0',
    title: 'parent 0',
    children: [
      { key: '0-0-0', title: 'leaf 0-0-0' },
      { key: '0-0-1', title: 'leaf 0-0-1' },
    ],
  },
  {
    key: '0-1',
    title: 'parent 1',
    children: [{ key: '0-1-0', title: 'leaf 0-1-0' }],
  },
];

describe('Tree', () => {
  it('renders tree nodes', () => {
    render(<Tree treeData={basicData} />);
    expect(screen.getByText('parent 0')).toBeInTheDocument();
    expect(screen.getByText('parent 1')).toBeInTheDocument();
  });

  it('expands node on click', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} />);
    await user.click(screen.getByText('parent 0'));
    expect(screen.getByText('leaf 0-0-0')).toBeInTheDocument();
    expect(screen.getByText('leaf 0-0-1')).toBeInTheDocument();
  });

  it('selects node on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Tree treeData={basicData} onSelect={onSelect} />);
    await user.click(screen.getByText('parent 0'));
    expect(onSelect).toHaveBeenCalled();
  });

  it('renders checkboxes when checkable', () => {
    render(<Tree treeData={basicData} checkable />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('checks node and children', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(<Tree treeData={basicData} checkable onCheck={onCheck} />);
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]!);
    expect(onCheck).toHaveBeenCalled();
  });

  it('applies className', () => {
    render(<Tree treeData={basicData} className='custom' />);
    expect(screen.getByRole('tree')).toHaveClass('custom');
  });

  it('respects expandedKeys', () => {
    render(<Tree treeData={basicData} expandedKeys={['0-0']} />);
    expect(screen.getByText('leaf 0-0-0')).toBeInTheDocument();
    expect(screen.getByText('leaf 0-0-1')).toBeInTheDocument();
  });

  it('disables tree when disabled', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} disabled />);
    await user.click(screen.getByText('parent 0'));
    expect(screen.queryByText('leaf 0-0-0')).not.toBeInTheDocument();
  });

  it('supports blockNode mode', () => {
    render(<Tree treeData={basicData} blockNode />);
    expect(screen.getByText('parent 0')).toBeInTheDocument();
  });

  it('supports showLine mode', () => {
    render(<Tree treeData={basicData} showLine />);
    expect(screen.getByText('parent 0')).toBeInTheDocument();
  });

  it('supports showIcon mode', () => {
    render(<Tree treeData={basicData} showIcon />);
    expect(screen.getByText('parent 0')).toBeInTheDocument();
  });

  it('supports multiple selection', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} multiple />);
    await user.click(screen.getByText('parent 0'));
    await user.click(screen.getByText('parent 1'));
  });

  it('supports custom switcherIcon', () => {
    render(<Tree treeData={basicData} switcherIcon={<span>→</span>} />);
    expect(screen.getAllByText('→')).toHaveLength(2);
  });

  it('supports titleRender', () => {
    render(
      <Tree
        treeData={basicData}
        titleRender={(node) => <span data-testid='custom'>{node.title}</span>}
      />
    );
    expect(screen.getAllByTestId('custom')).toHaveLength(2);
  });

  it('supports checkStrictly mode', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(
      <Tree treeData={basicData} checkable checkStrictly onCheck={onCheck} />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]!);
    expect(onCheck).toHaveBeenCalled();
  });

  it('checks parent checks all children', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(<Tree treeData={basicData} checkable onCheck={onCheck} />);
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]!);
    const result = onCheck.mock.calls[0]![0] as {
      checked: string[];
      halfChecked: string[];
    };
    expect(result.checked).toContain('0-0');
    expect(result.checked).toContain('0-0-0');
    expect(result.checked).toContain('0-0-1');
  });

  it('unchecks parent unchecks all children', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(
      <Tree
        treeData={basicData}
        checkable
        checkedKeys={['0-0', '0-0-0', '0-0-1']}
        onCheck={onCheck}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]!);
    const result = onCheck.mock.calls[0]![0] as {
      checked: string[];
      halfChecked: string[];
    };
    expect(result.checked).not.toContain('0-0');
    expect(result.checked).not.toContain('0-0-0');
    expect(result.checked).not.toContain('0-0-1');
  });

  it('shows halfChecked when some children are checked', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(
      <Tree
        treeData={basicData}
        checkable
        checkedKeys={['0-0-0']}
        onCheck={onCheck}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]!);
    const result = onCheck.mock.calls[0]![0] as {
      checked: string[];
      halfChecked: string[];
    };
    expect(result.halfChecked).toContain('0-0');
  });

  it('supports controlled expandedKeys', async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    render(
      <Tree treeData={basicData} expandedKeys={['0-0']} onExpand={onExpand} />
    );
    expect(screen.getByText('leaf 0-0-0')).toBeInTheDocument();
    await user.click(screen.getByText('parent 0'));
    expect(onExpand).toHaveBeenCalled();
    const expandCall = onExpand.mock.calls[0]![0] as string[];
    expect(expandCall).not.toContain('0-0');
  });

  it('supports controlled selectedKeys', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Tree treeData={basicData} selectedKeys={['0-0']} onSelect={onSelect} />
    );
    await user.click(screen.getByText('parent 1'));
    expect(onSelect).toHaveBeenCalledWith(
      ['0-1'],
      expect.objectContaining({ selected: true })
    );
  });

  it('supports controlled checkedKeys', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();
    render(
      <Tree
        treeData={basicData}
        checkable
        checkedKeys={['0-0-0']}
        onCheck={onCheck}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]!);
    expect(onCheck).toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Tree treeData={basicData} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when a node is expanded and checkable', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Tree treeData={basicData} checkable />);
    await user.click(screen.getByText('parent 0'));
    expect(screen.getByText('leaf 0-0-0')).toBeInTheDocument();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Tree keyboard navigation', () => {
  it('roves the tab stop: the first focusable item is the only one', () => {
    render(<Tree treeData={basicData} />);
    const [first, second] = screen.getAllByRole('treeitem');
    expect(first).toHaveAttribute('tabindex', '0');
    expect(second).toHaveAttribute('tabindex', '-1');
  });

  it('enters via Tab and moves focus with ArrowDown/ArrowUp', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} />);
    const [first, second] = screen.getAllByRole('treeitem');
    await user.tab();
    expect(document.activeElement).toBe(first);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(second);
    expect(second).toHaveAttribute('tabindex', '0');
    expect(first).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(first);
  });

  it('does not wrap at the ends (APG tree pattern)', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} />);
    const [first, second] = screen.getAllByRole('treeitem');
    await user.tab();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(first);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(second);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(second);
  });

  it('ArrowRight expands a collapsed node keeping focus, then descends to the first child', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} />);
    const [first] = screen.getAllByRole('treeitem');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('leaf 0-0-0')).toBeInTheDocument();
    expect(document.activeElement).toBe(first);
    await user.keyboard('{ArrowRight}');
    const child = screen
      .getByText('leaf 0-0-0')
      .closest('[role="treeitem"]');
    expect(document.activeElement).toBe(child);
  });

  it('ArrowRight on a leaf does nothing', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}{ArrowRight}'); // descend to leaf 0-0-0
    const leaf = screen
      .getByText('leaf 0-0-0')
      .closest('[role="treeitem"]');
    expect(document.activeElement).toBe(leaf);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(leaf);
  });

  it('ArrowLeft collapses an expanded node, hops to the parent from a leaf, no-ops on a collapsed root', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} />);
    const [first] = screen.getAllByRole('treeitem');
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}'); // expand, descend
    await user.keyboard('{ArrowLeft}'); // leaf → parent
    expect(document.activeElement).toBe(first);
    await user.keyboard('{ArrowLeft}'); // expanded root → collapse
    expect(screen.queryByText('leaf 0-0-0')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(first);
    await user.keyboard('{ArrowLeft}'); // collapsed root → no-op
    expect(document.activeElement).toBe(first);
  });

  it('jumps to the first and last visible row with Home/End', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} expandedKeys={['0-0', '0-1']} />);
    await user.tab();
    await user.keyboard('{End}');
    expect(document.activeElement).toHaveAttribute('data-tree-key', '0-1-0');
    await user.keyboard('{Home}');
    expect(document.activeElement).toHaveAttribute('data-tree-key', '0-0');
  });

  it('skips disabled rows while navigating', async () => {
    const data = [
      { key: 'a', title: 'A' },
      { key: 'b', title: 'B', disabled: true },
      { key: 'c', title: 'C' },
    ];
    const user = userEvent.setup();
    render(<Tree treeData={data} />);
    const [a, b, c] = screen.getAllByRole('treeitem');
    expect(b).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(document.activeElement).toBe(a);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(c);
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(a);
  });

  it('children of a disabled node stay keyboard reachable once expanded', async () => {
    const data = [
      {
        key: 'd',
        title: 'D',
        disabled: true,
        children: [{ key: 'd-1', title: 'D1' }],
      },
    ];
    const user = userEvent.setup();
    render(<Tree treeData={data} expandedKeys={['d']} />);
    const [d, d1] = screen.getAllByRole('treeitem');
    expect(d).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(document.activeElement).toBe(d1);
  });

  it('selects with Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Tree treeData={basicData} onSelect={onSelect} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(
      ['0-0'],
      expect.objectContaining({ selected: true })
    );
  });

  it('toggles checks with Space when checkable', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} checkable />);
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await user.keyboard(' ');
    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('leaves Space inert without checkable', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Tree treeData={basicData} onSelect={onSelect} />);
    await user.tab();
    await user.keyboard(' ');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('mirrors the expand/collapse arrows under dir="rtl"', async () => {
    const user = userEvent.setup();
    render(
      <div dir='rtl'>
        <Tree treeData={basicData} />
      </div>
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}'); // rtl: ArrowLeft is the inward key
    expect(screen.getByText('leaf 0-0-0')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}'); // descend to the first child
    expect(document.activeElement).toHaveAttribute('data-tree-key', '0-0-0');
    await user.keyboard('{ArrowRight}'); // rtl: outward — leaf hops to parent
    expect(document.activeElement).toHaveAttribute('data-tree-key', '0-0');
    await user.keyboard('{ArrowRight}'); // outward again — collapse
    expect(screen.queryByText('leaf 0-0-0')).not.toBeInTheDocument();
  });

  it('moves the tab stop when a row is clicked', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={basicData} />);
    const [first, second] = screen.getAllByRole('treeitem');
    await user.click(screen.getByText('parent 1'));
    expect(document.activeElement).toBe(second);
    expect(second).toHaveAttribute('tabindex', '0');
    expect(first).toHaveAttribute('tabindex', '-1');
  });

  it('has no axe violations while keyboard-focused', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Tree treeData={basicData} checkable />);
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Tree virtualization', () => {
  const flatData = Array.from({ length: 1000 }, (_, i) => ({
    key: `n-${i}`,
    title: `Node ${i}`,
  }));

  /** jsdom scrollports have no layout — give the VirtualList scrollport a
   *  real scroll range so programmatic scrollTop is not clamped to 0. */
  function giveScrollRange(port: HTMLElement, rows: number) {
    Object.defineProperty(port, 'scrollHeight', {
      value: rows * 32,
      configurable: true,
    });
  }

  it('mounts only the visible window (plus overscan) of 1000 nodes', () => {
    render(<Tree treeData={flatData} virtualized />);
    expect(document.querySelector('[data-virtualized]')).not.toBeNull();
    const mounted = screen.getAllByRole('treeitem');
    // 320px viewport / 32px rows = 10 visible + 2×5 overscan = 20.
    expect(mounted.length).toBeLessThan(50);
    expect(screen.getByRole('treeitem', { name: 'Node 0' })).toBeInTheDocument();
    expect(
      screen.queryByRole('treeitem', { name: 'Node 500' })
    ).not.toBeInTheDocument();
  });

  it('keeps the plain DOM path when virtualized is not set', () => {
    render(
      <Tree
        treeData={Array.from({ length: 60 }, (_, i) => ({
          key: `n-${i}`,
          title: `Node ${i}`,
        }))}
      />
    );
    expect(document.querySelector('[data-virtualized]')).toBeNull();
    expect(screen.getAllByRole('treeitem')).toHaveLength(60);
  });

  it('preserves depth, expansion and selection state on flat rows', () => {
    render(<Tree treeData={basicData} virtualized expandedKeys={['0-0']} />);
    expect(
      screen.getByRole('treeitem', { name: 'leaf 0-0-0' })
    ).toHaveAttribute('aria-level', '2');
    expect(
      screen.getByRole('treeitem', { name: 'parent 0' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves keyboard focus across the virtual window with scrollToIndex', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={flatData} virtualized />);
    const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
    giveScrollRange(port, 1000);

    await user.tab();
    expect(document.activeElement).toHaveAttribute('data-tree-key', 'n-0');
    expect(port.scrollTop).toBe(0);

    await user.keyboard('{End}');
    // Row 999 (top 31968) aligns to start, clamped by the max scroll
    // 32000 − 320 = 31680.
    expect(port.scrollTop).toBe(31680);
    expect(document.activeElement).toHaveAttribute('data-tree-key', 'n-999');
    expect(
      screen.getByRole('treeitem', { name: 'Node 999' })
    ).toBeInTheDocument();

    await user.keyboard('{Home}');
    expect(port.scrollTop).toBe(0);
    expect(document.activeElement).toHaveAttribute('data-tree-key', 'n-0');
  });

  it('scrolls the window as ArrowDown steps past the viewport', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={flatData} virtualized />);
    const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
    giveScrollRange(port, 1000);

    await user.tab();
    await user.keyboard('{ArrowDown}'.repeat(15));
    // Row 10 is the first to leave the 320px viewport and aligns to start.
    expect(port.scrollTop).toBe(320);
    expect(document.activeElement).toHaveAttribute('data-tree-key', 'n-15');
  });

  it('selects with Enter in virtual mode with the same semantics', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Tree treeData={flatData} virtualized onSelect={onSelect} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(
      ['n-0'],
      expect.objectContaining({ selected: true })
    );
    expect(screen.getByRole('treeitem', { name: 'Node 0' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('toggles checks with Space in virtual mode', async () => {
    const user = userEvent.setup();
    render(<Tree treeData={flatData} virtualized checkable />);
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getAllByRole('checkbox')[0]).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('has no axe violations when virtualized', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Tree treeData={flatData} virtualized checkable />);
    await user.tab();
    await user.keyboard('{Enter}');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
