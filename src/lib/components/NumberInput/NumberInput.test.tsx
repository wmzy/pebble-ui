import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import NumberInput from './NumberInput';
import NumberInputCore from './NumberInputCore';

describe('NumberInput', () => {
  it('renders a number input with stepper buttons', () => {
    render(<NumberInput aria-label="quantity" />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase' })).toBeInTheDocument();
  });

  it('defaults to 0', () => {
    render(<NumberInput aria-label="quantity" />);
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
  });

  it('accepts initial value', () => {
    render(<NumberInput value={10} aria-label="quantity" />);
    expect(screen.getByRole('spinbutton')).toHaveValue(10);
  });

  it('increments on + click', async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="quantity" />);
    await user.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });

  it('decrements on - click', async () => {
    const user = userEvent.setup();
    render(<NumberInput value={5} aria-label="quantity" />);
    await user.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(4);
  });

  it('respects min boundary', async () => {
    const user = userEvent.setup();
    render(<NumberInput value={0} min={0} aria-label="quantity" />);
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });

  it('respects max boundary', async () => {
    const user = userEvent.setup();
    render(<NumberInput value={10} max={10} aria-label="quantity" />);
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(9);
  });

  it('uses custom step', async () => {
    const user = userEvent.setup();
    render(<NumberInput value={0} step={5} aria-label="quantity" />);
    await user.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(5);
  });

  it('updates value on direct input change', () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="quantity" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } });
    expect(screen.getByRole('spinbutton')).toHaveValue(42);
    expect(onChange).toHaveBeenCalled();
  });

  it('ignores NaN input', () => {
    render(<NumberInput aria-label="quantity" />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: 'abc' } });
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
  });

  it('applies className', () => {
    const { container } = render(<NumberInput className="custom" aria-label="quantity" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<NumberInput value={5} aria-label="quantity" />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('NumberInputCore', () => {
  it('renders the given value', () => {
    render(<NumberInputCore value={10} onChange={() => undefined} aria-label="core" />);
    expect(screen.getByRole('spinbutton')).toHaveValue(10);
  });

  it('calls onChange with the incremented value on + click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInputCore value={0} onChange={onChange} aria-label="core" />);
    await user.click(screen.getByRole('button', {name: 'Increase'}));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with the decremented value on - click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInputCore value={5} onChange={onChange} aria-label="core" />);
    await user.click(screen.getByRole('button', {name: 'Decrease'}));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not step on its own: rerender drives the DOM', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const {rerender} = render(
      <NumberInputCore value={0} onChange={onChange} aria-label="core" />
    );
    await user.click(screen.getByRole('button', {name: 'Increase'}));
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
    rerender(<NumberInputCore value={1} onChange={onChange} aria-label="core" />);
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });
});

describe('NumberInput ref forwarding', () => {
  it('forwards ref to the inner number input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<NumberInput ref={ref} aria-label='Quantity' />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
