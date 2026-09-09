import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Select from './Select';
import SelectCore from './SelectCore';
import Option from './Option';

describe('Option', () => {
  it('renders an option element', () => {
    render(
      <Select aria-label="test">
        <Option value="a">Alpha</Option>
      </Select>
    );
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('value', 'a');
  });
});

describe('Select', () => {
  it('renders a select element with options', () => {
    render(
      <Select aria-label="fruit">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </Select>
    );
    expect(screen.getByRole('combobox', { name: 'fruit' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('applies className', () => {
    render(
      <Select className="custom" aria-label="test">
        <option>A</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom');
  });

  it('works as uncontrolled with initial value', () => {
    render(
      <Select value="banana" aria-label="test">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveValue('banana');
  });

  it('changes value on selection', async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="test">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </Select>
    );
    await user.selectOptions(screen.getByRole('combobox'), 'banana');
    expect(screen.getByRole('combobox')).toHaveValue('banana');
  });

  it('calls onChange handler', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select aria-label="test" onChange={onChange}>
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </Select>
    );
    await user.selectOptions(screen.getByRole('combobox'), 'banana');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards disabled prop', () => {
    render(
      <Select disabled aria-label="test">
        <option>A</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <Select aria-label="fruit">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </Select>
    );
    // Native <select> renders no extra DOM when open, so the "open" state
    // is exercised by making a selection before scanning.
    await user.selectOptions(screen.getByRole('combobox'), 'banana');
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('SelectCore', () => {
  it('renders the given value as the selected option', () => {
    render(
      <SelectCore value="banana" onChange={() => undefined} aria-label="core">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </SelectCore>
    );
    expect(screen.getByRole('combobox')).toHaveValue('banana');
  });

  it('calls onChange with the new value on selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectCore value="" onChange={onChange} aria-label="core">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </SelectCore>
    );
    await user.selectOptions(screen.getByRole('combobox'), 'banana');
    expect(onChange).toHaveBeenCalledWith('banana');
  });
});

const FRUITS = [
  <Option key="apple" value="apple">Apple</Option>,
  <Option key="banana" value="banana">Banana</Option>,
  <Option key="cherry" value="cherry">Cherry</Option>,
];

describe('Select multiple', () => {
  it('renders a combobox trigger with listbox semantics and the placeholder', () => {
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    const trigger = screen.getByRole('combobox', { name: 'fruit' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();
    expect(screen.getByText('Select…')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(
      <Select multiple className="custom" aria-label="fruit">
        {FRUITS}
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom');
  });

  it('accepts a placeholder override', () => {
    render(
      <Select multiple placeholder="Pick fruit" aria-label="fruit">
        {FRUITS}
      </Select>
    );
    expect(screen.getByText('Pick fruit')).toBeInTheDocument();
  });

  it('opens a multi-select listbox on click and toggles it closed on a second click', async () => {
    const user = userEvent.setup();
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('exposes set size and position on each option', async () => {
    const user = userEvent.setup();
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    await user.click(screen.getByRole('combobox'));
    screen.getAllByRole('option').forEach((option, i) => {
      expect(option).toHaveAttribute('aria-setsize', '3');
      expect(option).toHaveAttribute('aria-posinset', String(i + 1));
    });
  });

  it('renders chips for an uncontrolled initial value', () => {
    render(
      <Select multiple value={['apple', 'cherry']} aria-label="fruit">
        {FRUITS}
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
    expect(within(trigger).getByText('Cherry')).toBeInTheDocument();
  });

  it('toggles options on click, updating chips and aria-selected, keeping the panel open', async () => {
    const user = userEvent.setup();
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    await user.click(screen.getByRole('combobox'));
    const trigger = screen.getByRole('combobox');
    const apple = screen.getByRole('option', { name: 'Apple' });
    await user.click(apple);
    expect(apple).toHaveAttribute('aria-selected', 'true');
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(apple);
    expect(apple).toHaveAttribute('aria-selected', 'false');
    expect(within(trigger).queryByText('Apple')).not.toBeInTheDocument();
  });

  it('calls onValuesChange with the next selection array', async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <Select
        multiple
        value={['apple']}
        onValuesChange={onValuesChange}
        aria-label="fruit"
      >
        {FRUITS}
      </Select>
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onValuesChange).toHaveBeenCalledWith(['apple', 'banana']);
  });

  it('works controlled: updates flow through the control and back', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, , ctrl] = useControl<string[]>(['apple']);
      return (
        <>
          <Select multiple value={ctrl} aria-label="fruit">
            {FRUITS}
          </Select>
          <output data-testid="value">{value.join(',')}</output>
        </>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.getByTestId('value')).toHaveTextContent('apple,banana');

    // Chip removal goes through the same control channel.
    await user.click(within(screen.getByRole('combobox')).getAllByText('×')[0]!);
    expect(screen.getByTestId('value')).toHaveTextContent('banana');
  });

  it('removes a chip through its × affordance', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple value={['apple', 'banana']} aria-label="fruit">
        {FRUITS}
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    await user.click(within(trigger).getAllByText('×')[0]!);
    expect(within(trigger).queryByText('Apple')).not.toBeInTheDocument();
    expect(within(trigger).getByText('Banana')).toBeInTheDocument();
  });

  it('removes the last selection with Backspace', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple value={['apple', 'banana']} aria-label="fruit">
        {FRUITS}
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{Backspace}');
    expect(within(trigger).queryByText('Banana')).not.toBeInTheDocument();
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
  });

  it('supports the full keyboard path: arrows, Enter/Space, Home/End, Escape', async () => {
    const user = userEvent.setup();
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    const trigger = screen.getByRole('combobox');
    trigger.focus();

    // Arrows are the keyboard open path; the first ArrowDown highlights
    // the first option.
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Apple' }).id
    );

    // Enter toggles the highlighted option without collapsing the panel
    // (the button's native activation is suppressed).
    await user.keyboard('{Enter}');
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Banana' }).id
    );
    await user.keyboard('{Space}');
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await user.keyboard('{End}');
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Cherry' }).id
    );
    await user.keyboard('{Home}');
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Apple' }).id
    );

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-activedescendant');
  });

  it('opens with ArrowUp from the closed state without underflowing', async () => {
    const user = userEvent.setup();
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{ArrowUp}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Clamped at the first option — no -1 highlight.
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Apple' }).id
    );
  });

  it('closes on outside pointerdown', () => {
    render(
      <div>
        <Select multiple aria-label="fruit">
          {FRUITS}
        </Select>
        <button>outside</button>
      </div>
    );
    const trigger = screen.getByRole('combobox', { name: 'fruit' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.pointerDown(screen.getByText('outside'));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('forwards the disabled state to the trigger', () => {
    render(
      <Select multiple disabled aria-label="fruit">
        {FRUITS}
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Select multiple value={['apple']} aria-label="fruit">
        {FRUITS}
      </Select>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when the listbox is open with a keyboard highlight', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <Select multiple value={['apple']} aria-label="fruit">
        {FRUITS}
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    // Highlight an option before scanning — the activedescendant state
    // on the combobox trigger must itself be axe-clean (the old plain
    // button role tripped aria-allowed-attr here).
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-activedescendant');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('SelectCore multiple', () => {
  it('renders the multiple trigger path with plain <option> children', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectCore multiple value={[]} onChange={onChange} aria-label="core">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </SelectCore>
    );
    const trigger = screen.getByRole('combobox', { name: 'core' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenCalledWith(['banana']);
  });
});

describe('Select multiple virtualization', () => {
  // Row height of the virtualized path — OPTION_ROW_HEIGHT in
  // SelectMultiple.tsx (space-1 padding top+bottom + the taller of the
  // text-sm line box at leading-normal and the 1.125rem checkbox).
  const ROW_HEIGHT = 29;

  function makeOptions(count: number) {
    return Array.from({ length: count }, (_, i) => (
      <Option key={i} value={`opt-${i}`}>
        Option {i}
      </Option>
    ));
  }

  // jsdom has no layout: scrollHeight reads 0, which clamps every
  // programmatic scrollTop to 0. Give the scrollport a real range.
  function giveScrollRange(port: HTMLElement, rows: number) {
    Object.defineProperty(port, 'scrollHeight', {
      value: rows * ROW_HEIGHT,
      configurable: true,
    });
  }

  it('mounts only the visible window for 1000 options', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple virtualized aria-label="fruit">
        {makeOptions(1000)}
      </Select>
    );
    await user.click(screen.getByRole('combobox'));
    const mounted = screen.getAllByRole('option');
    expect(mounted.length).toBeGreaterThan(0);
    expect(mounted.length).toBeLessThan(60);
    // Windowed rows keep complete set semantics for the whole list.
    expect(mounted[0]).toHaveAttribute('aria-setsize', '1000');
    expect(mounted[0]).toHaveAttribute('aria-posinset', '1');
  });

  it('keeps the full plain DOM list when virtualized is off', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple aria-label="fruit">
        {makeOptions(1000)}
      </Select>
    );
    await user.click(screen.getByRole('combobox'));
    expect(document.querySelector('[data-virtualized]')).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(1000);
  });

  it('navigates across the window edge with the highlight scrolled into view', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple virtualized aria-label="fruit">
        {makeOptions(1000)}
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
    giveScrollRange(port, 1000);

    await user.keyboard('{ArrowDown}'.repeat(15));
    // Highlight lands on row 14 (the first press reaches row 0). Rows
    // leave the 200px viewport once top+29 > scrollTop+200: scrolling
    // trips at row 6 (→174) and row 12 (→348); row 14 stays visible.
    expect(port.scrollTop).toBe(348);
    const highlighted = screen.getByRole('option', { name: 'Option 14' });
    expect(trigger).toHaveAttribute('aria-activedescendant', highlighted.id);
  });

  it('jumps to the list ends with Home/End across the full range', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple virtualized aria-label="fruit">
        {makeOptions(1000)}
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
    giveScrollRange(port, 1000);

    await user.keyboard('{End}');
    // Row 999 aligns to the top, clamped to max scroll 29000 − 200.
    expect(port.scrollTop).toBe(28800);
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Option 999' }).id
    );

    await user.keyboard('{Home}');
    // Row 0 enters from above → 'end' alignment clamps to 0.
    expect(port.scrollTop).toBe(0);
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Option 0' }).id
    );
  });

  it('selects windowed options through the keyboard path', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple virtualized aria-label="fruit">
        {makeOptions(1000)}
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
    giveScrollRange(port, 1000);

    await user.keyboard('{ArrowDown}'.repeat(4) + '{Enter}');
    const selected = screen.getByRole('option', { name: 'Option 3' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(within(trigger).getByText('Option 3')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{ArrowDown}{Space}');
    expect(screen.getByRole('option', { name: 'Option 4' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('honors a custom overscan of zero', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple virtualized={{ overscan: 0 }} aria-label="fruit">
        {makeOptions(1000)}
      </Select>
    );
    await user.click(screen.getByRole('combobox'));
    // Exactly the rows intersecting the 200px viewport: rows 0–6 (row 7
    // starts at 203, past the bottom edge).
    expect(screen.getAllByRole('option')).toHaveLength(7);
  });

  it('has no axe violations when the listbox is virtualized', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <Select multiple virtualized value={['opt-2']} aria-label="fruit">
        {makeOptions(1000)}
      </Select>
    );
    // Open + keyboard-highlight before scanning: the trigger carries
    // role="combobox" (APG select-only combobox), so
    // aria-activedescendant/aria-expanded/aria-controls are all legal
    // there — the highlight state must stay axe-clean too.
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-activedescendant');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
