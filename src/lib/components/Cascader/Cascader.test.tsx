import { render, screen, within } from '@testing-library/react';
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
});
