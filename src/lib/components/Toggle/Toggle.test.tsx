import { expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Toggle from './Toggle';
import ToggleCore from './ToggleCore';

describe('Toggle', () => {
  it('renders as a plain button with aria-pressed=false by default', () => {
    render(<Toggle aria-label="bold" />);
    expect(screen.getByRole('button', { name: 'bold' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('has type="button"', () => {
    render(<Toggle aria-label="bold" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('can be initialized pressed', () => {
    render(<Toggle pressed aria-label="bold" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies className', () => {
    render(<Toggle className="custom" aria-label="bold" />);
    expect(screen.getByRole('button')).toHaveClass('custom');
  });

  it('toggles aria-pressed on click', async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="bold" />);
    const toggle = screen.getByRole('button');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onClick handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Toggle aria-label="bold" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('forwards disabled prop', () => {
    render(<Toggle disabled aria-label="bold" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shares state with a parent through a control', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [pressed, , pressedControl] = useControl(undefined, false);
      return (
        <>
          <Toggle pressed={pressedControl} aria-label="bold" />
          <output data-testid="mirror">{pressed ? 'on' : 'off'}</output>
        </>
      );
    }
    render(<Controlled />);
    const toggle = screen.getByRole('button');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('mirror')).toHaveTextContent('on');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('mirror')).toHaveTextContent('off');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Toggle aria-label="bold" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when pressed', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Toggle aria-label="bold" />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('ToggleCore', () => {
  it('renders the given pressed value', () => {
    render(<ToggleCore pressed onPressedChange={() => undefined} aria-label="core" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onPressedChange with the next value on click', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<ToggleCore pressed={false} onPressedChange={onPressedChange} aria-label="core" />);
    await user.click(screen.getByRole('button'));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle on its own: rerender drives the DOM', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <ToggleCore pressed={false} onPressedChange={onPressedChange} aria-label="core" />
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <ToggleCore pressed onPressedChange={onPressedChange} aria-label="core" />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Toggle ref forwarding', () => {
  it('forwards ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Toggle ref={ref} aria-label='Bold' />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
