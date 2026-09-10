import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import PasswordInput from './PasswordInput';
import PasswordInputCore from './PasswordInputCore';

describe('PasswordInput', () => {
  it('renders a password input', () => {
    const { container } = render(<PasswordInput />);
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('displays initial value', () => {
    const { container } = render(<PasswordInput value="secret" />);
    expect(container.querySelector('input')).toHaveValue('secret');
  });

  it('applies className', () => {
    const { container } = render(<PasswordInput className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('calls onChange on input change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<PasswordInput onChange={onChange} />);
    await user.type(container.querySelector('input')!, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    const { container } = render(<PasswordInput value="secret" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'password');
    const button = screen.getByRole('button');
    await user.click(button);
    expect(container.querySelector('input')).toHaveAttribute('type', 'text');
    await user.click(button);
    expect(container.querySelector('input')).toHaveAttribute('type', 'password');
  });

  it('renders with placeholder', () => {
    const { container } = render(<PasswordInput placeholder="Enter password" />);
    expect(container.querySelector('input[placeholder="Enter password"]')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<PasswordInput value="secret" />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when password is visible', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<PasswordInput value="secret" />);
    await user.click(screen.getByRole('button'));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('PasswordInputCore', () => {
  it('renders the given value', () => {
    const { container } = render(
      <PasswordInputCore value="secret" onChange={() => undefined} />
    );
    expect(container.querySelector('input')).toHaveValue('secret');
  });

  it('calls onChange with the new value on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<PasswordInputCore value="" onChange={onChange} />);
    await user.type(container.querySelector('input')!, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('toggles visibility without touching onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <PasswordInputCore value="secret" onChange={onChange} />
    );
    await user.click(screen.getByRole('button'));
    expect(container.querySelector('input')).toHaveAttribute('type', 'text');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('PasswordInput ref forwarding', () => {
  it('forwards ref to the inner password input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
