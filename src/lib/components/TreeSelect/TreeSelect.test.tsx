import type { TreeNodeData } from '../Tree/types';

import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { expect, vi } from 'vitest';
import { useControl } from 'react-use-control';

import LocaleProvider, {
  createStrings,
  defaultStrings,
} from '../LocaleProvider';

import TreeSelect from './TreeSelect';

const TREE: TreeNodeData[] = [
  {
    key: 'p1',
    title: 'Parent 1',
    children: [
      { key: 'c1', title: 'Child 1' },
      { key: 'c2', title: 'Child 2' },
    ],
  },
  {
    key: 'p2',
    title: 'Parent 2',
    children: [
      { key: 'c3', title: 'Child 3' },
      { key: 'c4', title: 'Child 4' },
    ],
  },
];

/** Lazy roots for the loadData case — no children in the static data. */
const ROOTS: TreeNodeData[] = [
  { key: 'p1', title: 'Parent 1' },
  { key: 'p2', title: 'Parent 2' },
];

/**
 * The trigger is a native button re-roled to combobox (the Select
 * trigger contract): naming is name-from-author, so content-based name
 * queries do not match — resolve it unlabeled and assert text inside.
 */
const triggerOf = () => screen.getByRole('combobox');

/** A tree item row by (partial) name. */
const item = (name: string | RegExp) =>
  screen.getByRole('treeitem', { name });

/** The expand/collapse switcher inside a row. */
const switcher = (row: HTMLElement, label: string) =>
  within(row).getByRole('button', { name: label });

describe('TreeSelect', () => {
  it('renders a combobox trigger with placeholder and closed state', () => {
    render(<TreeSelect treeData={TREE} placeholder='Pick a node' />);
    const trigger = triggerOf();
    expect(within(trigger).getByText('Pick a node')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'tree');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // aria-controls resolves to the panel content host.
    expect(
      document.getElementById(trigger.getAttribute('aria-controls')!)
    ).toBeInTheDocument();
    // The panel tree rides along, hidden by the floating behavior.
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('falls back to the locale placeholder and forwards className', () => {
    render(<TreeSelect treeData={TREE} className='custom' />);
    expect(triggerOf()).toHaveClass('custom');
    expect(within(triggerOf()).getByText('Select…')).toBeInTheDocument();
  });

  it('commits a single selection, closes the panel and shows the label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect treeData={TREE} placeholder='Pick' onChange={onChange} />
    );
    const trigger = triggerOf();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(switcher(item(/Parent 1/), 'Expand'));
    await user.click(item('Child 2'));
    expect(onChange).toHaveBeenCalledWith('c2');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(within(trigger).getByText('Child 2')).toBeInTheDocument();
  });

  it('replaces the selection when another leaf is picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        value='p2'
        placeholder='Pick'
        onChange={onChange}
      />
    );
    const trigger = triggerOf();
    expect(within(trigger).getByText('Parent 2')).toBeInTheDocument();

    await user.click(trigger);
    // The committed row is focused on open (single mode).
    expect(item(/Parent 2/)).toHaveFocus();
    await user.click(switcher(item(/Parent 2/), 'Expand'));
    await user.click(item('Child 4'));
    expect(onChange).toHaveBeenCalledWith('c4');
    expect(within(trigger).getByText('Child 4')).toBeInTheDocument();
    expect(within(trigger).queryByText('Parent 2')).not.toBeInTheDocument();
  });

  it('cascades a parent checkbox to its children and back (AntD semantics)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect treeData={TREE} multiple placeholder='Pick' onChange={onChange} />
    );
    const trigger = triggerOf();

    await user.click(trigger);
    // Checking a parent commits the whole subtree, parent included.
    await user.click(within(item(/Parent 1/)).getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(['p1', 'c1', 'c2']);
    expect(within(trigger).getByText('Parent 1')).toBeInTheDocument();
    expect(within(trigger).getByText('Child 2')).toBeInTheDocument();

    // Unchecking one child demotes the parent to half-checked and
    // drops it from the value; the stale chips leave with it.
    await user.click(switcher(item(/Parent 1/), 'Expand'));
    expect(within(item(/Parent 1/)).getByRole('checkbox')).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await user.click(within(item('Child 2')).getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(['c1']);
    expect(within(item(/Parent 1/)).getByRole('checkbox')).toHaveAttribute(
      'aria-checked',
      'mixed'
    );
    expect(within(trigger).queryByText('Child 2')).not.toBeInTheDocument();
    expect(within(trigger).queryByText('Parent 1')).not.toBeInTheDocument();
    expect(within(trigger).getByText('Child 1')).toBeInTheDocument();
  });

  it('keeps parent and child checkboxes independent with checkStrictly', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        multiple
        checkStrictly
        placeholder='Pick'
        onChange={onChange}
      />
    );
    await user.click(triggerOf());
    await user.click(within(item(/Parent 1/)).getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(['p1']);
  });

  it('expands a parent key in the value to its whole subtree', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        multiple
        value={['p1']}
        onChange={onChange}
        placeholder='Pick'
      />
    );
    // The bare parent key seeds the full checked set (AntD value
    // semantics): all three chips are committed up front.
    const trigger = triggerOf();
    expect(within(trigger).getByText('Parent 1')).toBeInTheDocument();
    expect(within(trigger).getByText('Child 2')).toBeInTheDocument();

    await user.click(trigger);
    await user.click(switcher(item(/Parent 1/), 'Expand'));
    expect(within(item('Child 2')).getByRole('checkbox')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('shares multiple state with a parent through a control', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [value, , control] = useControl<string[]>([]);
      return (
        <div>
          <TreeSelect
            treeData={TREE}
            multiple
            value={control}
            onChange={onChange}
            placeholder='Pick'
          />
          <output data-testid='out'>{value.join(',')}</output>
        </div>
      );
    }
    render(<Controlled />);
    await user.click(triggerOf());
    await user.click(within(item(/Parent 2/)).getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(['p2', 'c3', 'c4']);
    expect(screen.getByTestId('out')).toHaveTextContent('p2,c3,c4');
  });

  it('removes one chip with its subtree through the pointer-only ×', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        multiple
        value={['p1', 'c1', 'c2', 'c3']}
        onChange={onChange}
        placeholder='Pick'
      />
    );
    const trigger = triggerOf();
    // Removing the parent chip unchecks its subtree; the unrelated
    // leaf stays. (The × affordances follow chip order.)
    await user.click(within(trigger).getAllByText('×')[0]!);
    expect(onChange).toHaveBeenCalledWith(['c3']);
    expect(within(trigger).queryByText('Child 1')).not.toBeInTheDocument();
    expect(within(trigger).getByText('Child 3')).toBeInTheDocument();
  });

  it('caps chips with maxTagCount into a +N overflow badge', () => {
    render(
      <TreeSelect
        treeData={TREE}
        multiple
        value={['c1', 'c3']}
        maxTagCount={1}
        placeholder='Pick'
      />
    );
    const trigger = triggerOf();
    expect(within(trigger).getByText('Child 1')).toBeInTheDocument();
    expect(within(trigger).queryByText('Child 3')).not.toBeInTheDocument();
    const badge = within(trigger).getByText('+1');
    expect(badge).toHaveAttribute('title', 'Child 3');
  });

  it('filters the tree through the panel search and commits a hit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        showSearch
        placeholder='Pick'
        onChange={onChange}
      />
    );
    const trigger = triggerOf();

    await user.click(trigger);
    const search = screen.getByRole('textbox', { name: 'Search nodes' });
    expect(search).toHaveFocus();

    await user.type(search, 'Child 3');
    expect(item(/Child 3/)).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: /Child 1/ })).not.toBeInTheDocument();
    // The ancestor path to the hit stays visible.
    expect(item(/Parent 2/)).toBeInTheDocument();

    await user.click(item(/Child 3/));
    expect(onChange).toHaveBeenCalledWith('c3');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('resets the query when the panel closes', async () => {
    const user = userEvent.setup();
    render(<TreeSelect treeData={TREE} showSearch placeholder='Pick' />);
    const trigger = triggerOf();

    await user.click(trigger);
    const search = screen.getByRole('textbox', { name: 'Search nodes' });
    await user.type(search, 'Child 3');
    await user.click(trigger); // close via the trigger toggle
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Search nodes' })).toHaveValue('');
    // The filter died with the query — Parent 1's branch (dropped
    // entirely while filtering) is back alongside Parent 2.
    expect(item(/Parent 1/)).toBeInTheDocument();
    expect(item(/Parent 2/)).toBeInTheDocument();
  });

  it('opens with ArrowDown, navigates the tree and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<TreeSelect treeData={TREE} placeholder='Pick' />);
    const trigger = triggerOf();

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(item(/Parent 1/)).toHaveFocus();

    // Expand the focused parent, walk into its children.
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowDown}');
    expect(item('Child 1')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('clears a single value through the × without opening the panel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        allowClear
        value='p1'
        onChange={onChange}
        placeholder='Pick'
      />
    );
    const trigger = triggerOf();
    await user.click(within(trigger).getByTitle('Clear'));
    expect(onChange).toHaveBeenCalledWith('');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(within(trigger).getByText('Pick')).toBeInTheDocument();
  });

  it('clears a whole multiple selection in one click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        multiple
        allowClear
        value={['p1', 'c1', 'c2']}
        onChange={onChange}
        placeholder='Pick'
      />
    );
    const trigger = triggerOf();
    await user.click(within(trigger).getByTitle('Clear'));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(within(trigger).getByText('Pick')).toBeInTheDocument();
  });

  it('expands every parent with treeDefaultExpandAll', async () => {
    const user = userEvent.setup();
    render(
      <TreeSelect
        treeData={TREE}
        treeDefaultExpandAll
        placeholder='Pick'
      />
    );
    await user.click(triggerOf());
    expect(item('Child 4')).toBeInTheDocument();
  });

  it('reports tree expansion through onTreeExpand', async () => {
    const user = userEvent.setup();
    const onTreeExpand = vi.fn();
    render(
      <TreeSelect
        treeData={TREE}
        onTreeExpand={onTreeExpand}
        placeholder='Pick'
      />
    );
    await user.click(triggerOf());
    await user.click(switcher(item(/Parent 1/), 'Expand'));
    expect(onTreeExpand).toHaveBeenCalledWith(['p1'], {
      expanded: true,
      node: expect.objectContaining({
        key: 'p1',
        title: 'Parent 1',
      }) as Record<string, unknown>,
    });
  });

  it('loads children lazily and resolves their labels in the trigger', async () => {
    const user = userEvent.setup();
    const loadData = vi.fn((node: TreeNodeData) =>
      node.key === 'p1'
        ? Promise.resolve([{ key: 'c1', title: 'Child 1' }])
        : Promise.resolve([])
    );
    render(
      <TreeSelect
        treeData={ROOTS}
        loadData={loadData}
        placeholder='Pick'
      />
    );
    await user.click(triggerOf());
    await user.click(switcher(item(/Parent 1/), 'Expand'));
    expect(loadData).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'p1' })
    );
    // The loaded child mounts once the promise resolves.
    const leaf = await screen.findByRole('treeitem', { name: 'Child 1' });
    await user.click(leaf);
    const trigger = triggerOf();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Label resolution sees the lazily loaded node — not the raw key.
    expect(within(trigger).getByText('Child 1')).toBeInTheDocument();
  });

  it('renders disabled and refuses to open', async () => {
    const user = userEvent.setup();
    render(<TreeSelect treeData={TREE} disabled placeholder='Pick' />);
    const trigger = triggerOf();
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('honors a createStrings pack through the provider', () => {
    const strings = createStrings(defaultStrings, {
      treeSelect: { placeholder: 'Wähle…' },
    });
    render(
      <LocaleProvider strings={strings}>
        <TreeSelect treeData={TREE} />
      </LocaleProvider>
    );
    expect(within(triggerOf()).getByText('Wähle…')).toBeInTheDocument();
  });

  it('forwards ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<TreeSelect ref={ref} treeData={TREE} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it('has no axe violations in single mode (open panel)', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <TreeSelect treeData={TREE} value='p2' aria-label='Pick a node' />
    );
    await user.click(triggerOf());
    await user.click(switcher(item(/Parent 2/), 'Expand'));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations in multiple mode with search, chips and clear', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <TreeSelect
        treeData={TREE}
        multiple
        showSearch
        allowClear
        value={['p1', 'c1', 'c2']}
        aria-label='Pick nodes'
      />
    );
    await user.click(triggerOf());
    const search = screen.getByRole('textbox', { name: 'Search nodes' });
    await user.type(search, 'Child');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
