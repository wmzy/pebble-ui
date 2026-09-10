import { expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import Switch from './Switch';
import SwitchCore from './SwitchCore';

describe('Switch', () => {
  it('renders with switch role', () => {
    render(<Switch aria-label="toggle" />);
    expect(screen.getByRole('switch', { name: 'toggle' })).toBeInTheDocument();
  });

  it('has type="button"', () => {
    render(<Switch aria-label="toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('type', 'button');
  });

  it('applies className', () => {
    render(<Switch className="custom" aria-label="toggle" />);
    expect(screen.getByRole('switch')).toHaveClass('custom');
  });

  it('defaults to unchecked (aria-checked=false)', () => {
    render(<Switch aria-label="toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('can be initialized as checked', () => {
    render(<Switch checked aria-label="toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles on click', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="toggle" />);
    const sw = screen.getByRole('switch');
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onClick handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Switch aria-label="toggle" onClick={onClick} />);
    await user.click(screen.getByRole('switch'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('forwards disabled prop', () => {
    render(<Switch disabled aria-label="toggle" />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Switch aria-label="toggle" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when checked', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Switch aria-label="toggle" />);
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('SwitchCore', () => {
  it('renders the given checked value', () => {
    render(<SwitchCore checked onChange={() => undefined} aria-label="core" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the next checked value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SwitchCore checked={false} onChange={onChange} aria-label="core" />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle on its own: rerender drives the DOM', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const {rerender} = render(
      <SwitchCore checked={false} onChange={onChange} aria-label="core" />
    );
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    rerender(<SwitchCore checked onChange={onChange} aria-label="core" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Switch ref forwarding', () => {
  it('forwards ref to the switch button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch ref={ref} aria-label='Notifications' />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
