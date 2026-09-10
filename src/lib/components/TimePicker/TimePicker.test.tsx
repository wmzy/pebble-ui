import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import TimePicker from './TimePicker';
import TimePickerCore from './TimePickerCore';

describe('TimePicker', () => {
  it('renders a time input', () => {
    const { container } = render(<TimePicker />);
    expect(container.querySelector('input[type="time"]')).toBeInTheDocument();
  });

  it('displays initial value', () => {
    render(<TimePicker value="14:30" />);
    expect(screen.getByDisplayValue('14:30')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<TimePicker className="custom" />);
    expect(container.querySelector('input[type="time"]')).toHaveClass('custom');
  });

  it('calls onChange on input change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker onChange={onChange} />);
    const input = document.querySelector('input[type="time"]')!;
    await user.type(input, '10:00');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders with placeholder', () => {
    const { container } = render(<TimePicker placeholder="Select time" />);
    expect(container.querySelector('input[placeholder="Select time"]')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<TimePicker aria-label="Start time" value="14:30" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('TimePickerCore', () => {
  it('renders the given value', () => {
    render(<TimePickerCore value="14:30" onChange={() => undefined} />);
    expect(screen.getByDisplayValue('14:30')).toBeInTheDocument();
  });

  it('calls onChange with the new value on input', () => {
    const onChange = vi.fn();
    render(<TimePickerCore value="" onChange={onChange} />);
    const input = document.querySelector('input[type="time"]')!;
    fireEvent.change(input, {target: {value: '10:00'}});
    expect(onChange).toHaveBeenCalledWith('10:00');
  });
});

describe('TimePicker ref forwarding', () => {
  it('forwards ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TimePicker ref={ref} aria-label='Start time' />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
