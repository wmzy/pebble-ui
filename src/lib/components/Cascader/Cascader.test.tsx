import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Cascader, { type CascaderOption } from './Cascader';

const OPTIONS: CascaderOption[] = [
  {
    label: '浙江',
    value: 'zj',
    children: [
      {
        label: '杭州',
        value: 'hz',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '滨江区', value: 'binjiang' },
        ],
      },
      { label: '宁波', value: 'nb' },
    ],
  },
  {
    label: '广东',
    value: 'gd',
    children: [
      {
        label: '深圳',
        value: 'sz',
        children: [
          { label: '南山区', value: 'nanshan' },
          { label: '福田区', value: 'futian' },
        ],
      },
      { label: '广州', value: 'gz' },
    ],
  },
  { label: '北京', value: 'bj' },
];

/** Panel + one role=menu per visible column. */
function menuCount() {
  return screen.getAllByRole('menu').length;
}

describe('Cascader', () => {
  it('renders a trigger with placeholder, popup semantics and closed state', () => {
    render(<Cascader options={OPTIONS} placeholder='Select region' />);
    const trigger = screen.getByRole('button', { name: 'Select region' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    expect(
      document.getElementById(trigger.getAttribute('aria-controls')!)
    ).toBeInTheDocument();
  });

  it('renders the selected value path in the trigger', () => {
    render(
      <Cascader options={OPTIONS} value={['gd', 'sz']} placeholder='Select region' />
    );
    expect(
      screen.getByRole('button', { name: /广东\/深圳/ })
    ).toBeInTheDocument();
  });

  it('drills down level by level and commits a leaf selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Cascader options={OPTIONS} placeholder='Select region' onChange={onChange} />
    );
    const trigger = screen.getByRole('button', { name: 'Select region' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(menuCount()).toBe(2);

    await user.click(screen.getByRole('menuitem', { name: /广东/ }));
    expect(menuCount()).toBe(3);

    await user.click(screen.getByRole('menuitem', { name: /深圳/ }));
    expect(menuCount()).toBe(4);

    await user.click(screen.getByRole('menuitem', { name: '南山区' }));
    expect(onChange).toHaveBeenCalledWith(['gd', 'sz', 'nanshan']);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /广东\/深圳\/南山区/ })).toBe(
      trigger
    );
  });

  it('keeps the panel open without committing when a parent is clicked by default', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Cascader options={OPTIONS} placeholder='Select region' onChange={onChange} />
    );
    const trigger = screen.getByRole('button', { name: 'Select region' });

    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: /广东/ }));
    await user.click(screen.getByRole('menuitem', { name: /深圳/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('commits every level while staying open with changeOnSelect', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Cascader
        options={OPTIONS}
        placeholder='Select region'
        changeOnSelect
        onChange={onChange}
      />
    );
    const trigger = screen.getByRole('button', { name: 'Select region' });

    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: /浙江/ }));
    expect(onChange).toHaveBeenCalledWith(['zj']);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: '浙江' })).toBe(trigger);

    await user.click(screen.getByRole('menuitem', { name: /杭州/ }));
    expect(onChange).toHaveBeenCalledWith(['zj', 'hz']);
    await user.click(screen.getByRole('menuitem', { name: '西湖区' }));
    expect(onChange).toHaveBeenLastCalledWith(['zj', 'hz', 'xihu']);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /浙江\/杭州\/西湖区/ })).toBe(
      trigger
    );
  });

  it('shares state with a parent through a control', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [value, , control] = useControl<string[]>([]);
      return (
        <div>
          <Cascader
            options={OPTIONS}
            value={control}
            onChange={onChange}
            placeholder='Select region'
          />
          <output data-testid='path'>{value.join(' / ')}</output>
        </div>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Select region' }));
    await user.click(screen.getByRole('menuitem', { name: /广东/ }));
    await user.click(screen.getByRole('menuitem', { name: '广州' }));
    expect(onChange).toHaveBeenCalledWith(['gd', 'gz']);
    expect(screen.getByTestId('path')).toHaveTextContent('gd / gz');
  });

  it('navigates with arrow keys, Home/End and Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Cascader options={OPTIONS} placeholder='Select region' onChange={onChange} />
    );
    const trigger = screen.getByRole('button', { name: 'Select region' });

    // Opening puts focus on the first option.
    await user.click(trigger);
    expect(screen.getByRole('menuitem', { name: /浙江/ })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: /广东/ })).toHaveFocus();

    // Drill into 广东 → focus lands on its first child.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('menuitem', { name: /深圳/ })).toHaveFocus();
    expect(menuCount()).toBe(3);

    // Collapse back → focus returns to the parent.
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('menuitem', { name: /广东/ })).toHaveFocus();
    expect(menuCount()).toBe(2);

    // Home/End jump within the focused column.
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: '北京' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: /浙江/ })).toHaveFocus();

    // Enter expands a parent; a second Enter on the child selects it.
    await user.keyboard('{Enter}');
    expect(menuCount()).toBe(3);
    expect(screen.getByRole('menuitem', { name: /杭州/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith(['zj', 'nb']);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with ArrowDown on the trigger and closes with Escape, returning focus', async () => {
    const user = userEvent.setup();
    render(<Cascader options={OPTIONS} placeholder='Select region' />);
    const trigger = screen.getByRole('button', { name: 'Select region' });

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: /浙江/ })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('expands columns on hover with expandTrigger="hover"', async () => {
    const user = userEvent.setup();
    render(
      <Cascader
        options={OPTIONS}
        placeholder='Select region'
        expandTrigger='hover'
      />
    );
    await user.click(screen.getByRole('button', { name: 'Select region' }));
    expect(menuCount()).toBe(2);

    await user.hover(screen.getByRole('menuitem', { name: /浙江/ }));
    expect(menuCount()).toBe(3);

    await user.hover(screen.getByRole('menuitem', { name: /杭州/ }));
    expect(menuCount()).toBe(4);

    // Hovering a leaf at a shallower level collapses the deeper columns.
    await user.hover(screen.getByRole('menuitem', { name: '宁波' }));
    expect(menuCount()).toBe(3);
  });

  it('reopens the panel expanded to the committed selection', async () => {
    const user = userEvent.setup();
    render(
      <Cascader
        options={OPTIONS}
        value={['gd', 'sz', 'nanshan']}
        placeholder='Select region'
      />
    );
    const trigger = screen.getByRole('button', { name: /广东\/深圳\/南山区/ });
    await user.click(trigger);
    expect(menuCount()).toBe(4);
    expect(screen.getByRole('menuitem', { name: '南山区' })).toHaveFocus();
  });

  it('exposes expand semantics on parent items only', async () => {
    const user = userEvent.setup();
    render(<Cascader options={OPTIONS} placeholder='Select region' />);
    await user.click(screen.getByRole('button', { name: 'Select region' }));

    const parent = screen.getByRole('menuitem', { name: /广东/ });
    expect(parent).toHaveAttribute('aria-haspopup', 'true');
    expect(parent).toHaveAttribute('aria-expanded', 'false');
    expect(within(parent).getByRole('img', { name: 'Expand' })).toBeInTheDocument();

    await user.click(parent);
    expect(parent).toHaveAttribute('aria-expanded', 'true');

    const leaf = screen.getByRole('menuitem', { name: '北京' });
    expect(leaf).not.toHaveAttribute('aria-haspopup');
    expect(leaf).not.toHaveAttribute('aria-expanded');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Cascader options={OPTIONS} placeholder='Select region' />);
    await user.click(screen.getByRole('button', { name: 'Select region' }));
    await user.click(screen.getByRole('menuitem', { name: /广东/ }));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  describe('virtualization', () => {
    // Row height of the virtualized path — ITEM_ROW_HEIGHT in
    // Cascader.tsx (space-2 padding top+bottom + text-sm at
    // leading-normal = 8 + 21 + 8).
    const ROW_HEIGHT = 37;

    function makeLeaves(count: number): CascaderOption[] {
      return Array.from({ length: count }, (_, i) => ({
        label: `Leaf ${i}`,
        value: `leaf-${i}`,
      }));
    }

    // 20 parent groups × 100 leaf children.
    function makeTree(): CascaderOption[] {
      return Array.from({ length: 20 }, (_, p) => ({
        label: `Group ${p}`,
        value: `group-${p}`,
        children: Array.from({ length: 100 }, (_, c) => ({
          label: `Child ${p}-${c}`,
          value: `child-${p}-${c}`,
        })),
      }));
    }

    function columnPort(level: number) {
      return document.querySelector<HTMLElement>(
        `[data-haze-cascader-column="${level}"] [data-virtualized]`
      )!;
    }

    // jsdom has no layout: scrollHeight reads 0, which clamps every
    // programmatic scrollTop to 0. Give the scrollport a real range.
    function giveScrollRange(port: HTMLElement, rows: number) {
      Object.defineProperty(port, 'scrollHeight', {
        value: rows * ROW_HEIGHT,
        configurable: true,
      });
    }

    it('mounts only the visible window for a 1000-item column', async () => {
      const user = userEvent.setup();
      render(
        <Cascader options={makeLeaves(1000)} virtualized placeholder='Select' />
      );
      await user.click(screen.getByRole('button', { name: 'Select' }));
      const items = screen.getAllByRole('menuitem');
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThan(60);
      // Windowed rows keep complete set semantics for the whole column.
      expect(items[0]).toHaveAttribute('aria-setsize', '1000');
      expect(items[0]).toHaveAttribute('aria-posinset', '1');
      // The column caps at the plain path's 220px max-height.
      expect(columnPort(0).style.height).toBe('220px');
    });

    it('keeps the full plain DOM columns when off', async () => {
      const user = userEvent.setup();
      render(
        <Cascader options={makeLeaves(1000)} placeholder='Select' />
      );
      await user.click(screen.getByRole('button', { name: 'Select' }));
      expect(document.querySelector('[data-virtualized]')).toBeNull();
      expect(screen.getAllByRole('menuitem')).toHaveLength(1000);
    });

    it('moves focus across the window edge with synced scrolling', async () => {
      const user = userEvent.setup();
      render(
        <Cascader options={makeLeaves(1000)} virtualized placeholder='Select' />
      );
      const port = columnPort(0);
      giveScrollRange(port, 1000);
      await user.click(screen.getByRole('button', { name: 'Select' }));
      // Opening puts focus on the first option.
      expect(screen.getByRole('menuitem', { name: 'Leaf 0' })).toHaveFocus();

      await user.keyboard('{ArrowDown}'.repeat(15));
      // Highlight reaches row 15. Rows leave the 220px viewport once
      // top+37 > scrollTop+220: scrolling trips at row 5 (→185), row 10
      // (→370) and row 15 (→555).
      expect(port.scrollTop).toBe(555);
      expect(screen.getByRole('menuitem', { name: 'Leaf 15' })).toHaveFocus();

      await user.keyboard('{End}');
      // Row 999 aligns to the top, clamped to max scroll 37000 − 220.
      expect(port.scrollTop).toBe(36780);
      expect(screen.getByRole('menuitem', { name: 'Leaf 999' })).toHaveFocus();

      await user.keyboard('{Home}');
      // Row 0 enters from above → 'end' alignment clamps to 0.
      expect(port.scrollTop).toBe(0);
      expect(screen.getByRole('menuitem', { name: 'Leaf 0' })).toHaveFocus();
    });

    it('drills into a windowed child column and commits a leaf', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Cascader
          options={makeTree()}
          virtualized
          placeholder='Select'
          onChange={onChange}
        />
      );
      const port1 = () => columnPort(1);
      await user.click(screen.getByRole('button', { name: 'Select' }));
      expect(screen.getByRole('menuitem', { name: /Group 0/ })).toHaveFocus();

      // Drill: the child column mounts windowed (100 children) and
      // focus follows into its first item.
      await user.keyboard('{ArrowRight}');
      expect(menuCount()).toBe(3);
      expect(screen.getByRole('menuitem', { name: 'Child 0-0' })).toHaveFocus();
      expect(screen.getAllByRole('menuitem').length).toBeLessThan(60);
      giveScrollRange(port1(), 100);

      await user.keyboard('{ArrowDown}'.repeat(3));
      expect(screen.getByRole('menuitem', { name: 'Child 0-3' })).toHaveFocus();

      // Back collapses the child column; focus returns to the parent.
      await user.keyboard('{ArrowLeft}');
      expect(menuCount()).toBe(2);
      expect(screen.getByRole('menuitem', { name: /Group 0/ })).toHaveFocus();

      // Re-drill and commit.
      await user.keyboard('{ArrowRight}' + '{ArrowDown}'.repeat(3) + '{Enter}');
      expect(onChange).toHaveBeenCalledWith(['group-0', 'child-0-3']);
      expect(
        screen.getByRole('button', { name: /Group 0\/Child 0-3/ })
      ).toBeInTheDocument();
    });

    it('recovers focus on a committed value outside the initial window', async () => {
      const user = userEvent.setup();
      render(
        <Cascader
          options={makeLeaves(1000)}
          value={['leaf-500']}
          virtualized
          placeholder='Select'
        />
      );
      const port = columnPort(0);
      giveScrollRange(port, 1000);
      await user.click(
        screen.getByRole('button', { name: /Leaf 500/ })
      );
      // The deepest selected row is scrolled into the window and
      // focused (500 × 37).
      expect(port.scrollTop).toBe(18500);
      expect(screen.getByRole('menuitem', { name: 'Leaf 500' })).toHaveFocus();
    });

    it('has no axe violations when the columns are virtualized', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      render(
        <Cascader options={makeTree()} virtualized placeholder='Select' />
      );
      await user.click(screen.getByRole('button', { name: 'Select' }));
      await user.keyboard('{ArrowRight}{ArrowDown}{ArrowDown}');
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });
});

describe('Cascader ref forwarding', () => {
  it('forwards ref to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Cascader ref={ref} options={[]} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
