import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import Input from './Input';
import InputCore from './InputCore';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Input className="custom" placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveClass('custom');
  });

  it('works as uncontrolled with default empty value', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="test" />);
    const input = screen.getByPlaceholderText('test');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('works as uncontrolled with initial string value', () => {
    render(<Input value="initial" placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveValue('initial');
  });

  it('calls onChange handler', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="test" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('test'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards native props like disabled', () => {
    render(<Input disabled placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Input placeholder="Enter text" aria-label="Name" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('InputCore', () => {
  it('renders the given value as a controlled input', () => {
    render(<InputCore value="hello" onChange={() => undefined} aria-label="core" />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('calls onChange with the new value on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputCore value="" onChange={onChange} aria-label="core" />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('does not mutate the value on its own: rerender drives the DOM', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const {rerender} = render(
      <InputCore value="" onChange={onChange} aria-label="core" />
    );
    await user.type(screen.getByRole('textbox'), 'a');
    expect(screen.getByRole('textbox')).toHaveValue('');
    rerender(<InputCore value="a" onChange={onChange} aria-label="core" />);
    expect(screen.getByRole('textbox')).toHaveValue('a');
  });
});

describe('Input ref forwarding', () => {
  it('forwards ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label='Name' />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
