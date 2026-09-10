import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import Textarea from './Textarea';
import TextareaCore from './TextareaCore';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text').nodeName).toBe('TEXTAREA');
  });

  it('applies className', () => {
    render(<Textarea className="custom" placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveClass('custom');
  });

  it('works as uncontrolled with default empty value', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="test" />);
    const textarea = screen.getByPlaceholderText('test');
    await user.type(textarea, 'hello');
    expect(textarea).toHaveValue('hello');
  });

  it('works as uncontrolled with initial string value', () => {
    render(<Textarea value="initial" placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveValue('initial');
  });

  it('calls onChange handler', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea placeholder="test" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('test'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards native props like disabled and rows', () => {
    render(<Textarea disabled rows={5} placeholder="test" />);
    const textarea = screen.getByPlaceholderText('test');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Textarea aria-label="Bio" placeholder="Enter text" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('TextareaCore', () => {
  it('renders the given value as a controlled textarea', () => {
    render(<TextareaCore value="hello" onChange={() => undefined} aria-label="core" />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('calls onChange with the new value on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextareaCore value="" onChange={onChange} aria-label="core" />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

describe('Textarea ref forwarding', () => {
  it('forwards ref to the textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label='Notes' />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
