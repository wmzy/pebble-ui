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
  it('renders a button trigger with listbox semantics and the placeholder', () => {
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    const trigger = screen.getByRole('button', { name: 'fruit' });
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
    expect(screen.getByRole('button')).toHaveClass('custom');
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
    const trigger = screen.getByRole('button');
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
    await user.click(screen.getByRole('button'));
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
    const trigger = screen.getByRole('button');
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
    expect(within(trigger).getByText('Cherry')).toBeInTheDocument();
  });

  it('toggles options on click, updating chips and aria-selected, keeping the panel open', async () => {
    const user = userEvent.setup();
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    await user.click(screen.getByRole('button'));
    const trigger = screen.getByRole('button');
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
    await user.click(screen.getByRole('button'));
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
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(screen.getByTestId('value')).toHaveTextContent('apple,banana');

    // Chip removal goes through the same control channel.
    await user.click(within(screen.getByRole('button')).getAllByText('×')[0]!);
    expect(screen.getByTestId('value')).toHaveTextContent('banana');
  });

  it('removes a chip through its × affordance', async () => {
    const user = userEvent.setup();
    render(
      <Select multiple value={['apple', 'banana']} aria-label="fruit">
        {FRUITS}
      </Select>
    );
    const trigger = screen.getByRole('button');
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
    const trigger = screen.getByRole('button');
    trigger.focus();
    await user.keyboard('{Backspace}');
    expect(within(trigger).queryByText('Banana')).not.toBeInTheDocument();
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
  });

  it('supports the full keyboard path: arrows, Enter/Space, Home/End, Escape', async () => {
    const user = userEvent.setup();
    render(<Select multiple aria-label="fruit">{FRUITS}</Select>);
    const trigger = screen.getByRole('button');
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
    const trigger = screen.getByRole('button');
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
    const trigger = screen.getByRole('button', { name: 'fruit' });
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
    expect(screen.getByRole('button')).toBeDisabled();
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

  it('has no axe violations when the listbox is open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <Select multiple value={['apple']} aria-label="fruit">
        {FRUITS}
      </Select>
    );
    await user.click(screen.getByRole('button'));
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
    const trigger = screen.getByRole('button', { name: 'core' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).toHaveBeenCalledWith(['banana']);
  });
});
