import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';
import { expect } from 'vitest';

import FloatButton from './FloatButton';
import FloatButtonGroup from './FloatButtonGroup';
import { anchored, shapes } from './float-button-styles';

describe('FloatButton', () => {
  it('renders a button with the default plus glyph', () => {
    const { container } = render(<FloatButton aria-label="Create" />);
    const button = screen.getByRole('button', { name: 'Create' });
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('a')).not.toBeInTheDocument();
  });

  it('renders an anchor when href is set', () => {
    render(<FloatButton href="/new" aria-label="Create" />);
    const link = screen.getByRole('link', { name: 'Create' });
    expect(link).toHaveAttribute('href', '/new');
  });

  it('applies className', () => {
    render(<FloatButton className="custom" aria-label="Create" />);
    expect(screen.getByRole('button')).toHaveClass('custom');
  });

  it('forwards native props', () => {
    render(<FloatButton disabled aria-label="Create" data-testid="fab" />);
    expect(screen.getByTestId('fab')).toBeDisabled();
  });

  it('uses description as the accessible name', () => {
    render(<FloatButton description="New item" />);
    expect(screen.getByRole('button', { name: 'New item' })).toBeInTheDocument();
  });

  it('applies the square shape class', () => {
    render(<FloatButton shape="square" aria-label="Create" />);
    expect(screen.getByRole('button')).toHaveClass(shapes.square);
    expect(screen.getByRole('button')).not.toHaveClass(shapes.circle);
  });

  it('renders a custom icon', () => {
    render(<FloatButton icon={<span data-testid="custom-icon" />} aria-label="Chat" />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    // the default plus is replaced, not stacked
    expect(screen.queryByRole('button', { name: 'Chat' })?.querySelector('svg')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <>
        <FloatButton description="New item" />
        <FloatButton aria-label="Share" variant="outline" shape="square" />
      </>
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('FloatButtonGroup', () => {
  it('renders the trigger with aria-expanded and aria-controls', () => {
    render(
      <FloatButtonGroup description="Actions">
        <FloatButton aria-label="Edit" />
      </FloatButtonGroup>
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
    const list = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('data-state', 'closed');
  });

  it('toggles the menu on trigger clicks', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <FloatButtonGroup onOpenChange={onOpenChange} description="Actions">
        <FloatButton aria-label="Edit" />
      </FloatButtonGroup>
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('marks the list open and closes it when a child activates', async () => {
    const user = userEvent.setup();
    const onChildClick = vi.fn();
    render(
      <FloatButtonGroup description="Actions">
        <FloatButton aria-label="Edit" onClick={onChildClick} />
      </FloatButtonGroup>
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    const list = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    expect(list).toHaveAttribute('data-state', 'open');

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onChildClick).toHaveBeenCalledOnce();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape', () => {
    render(
      <FloatButtonGroup description="Actions">
        <FloatButton aria-label="Edit" />
      </FloatButtonGroup>
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders child anchors that close the menu on click', async () => {
    const user = userEvent.setup();
    render(
      <FloatButtonGroup description="Actions">
        <FloatButton href="/docs" aria-label="Docs" />
      </FloatButtonGroup>
    );
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    await user.click(screen.getByRole('link', { name: 'Docs' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('child buttons drop the fixed anchor (the group owns it)', () => {
    const { container } = render(
      <FloatButtonGroup description="Actions">
        <FloatButton aria-label="Edit" />
      </FloatButtonGroup>
    );
    // the anchored class lives on the group container only — the child
    // renders inline inside the group's menu
    expect(container.firstChild).toHaveClass(anchored);
    expect(screen.getByRole('button', { name: 'Edit' })).not.toHaveClass(anchored);
  });

  it('respects a controlled open state', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen, control] = useControl(undefined, false);
      return (
        <>
          <output data-testid="mirror">{String(open)}</output>
          <button type="button" onClick={() => setOpen(!open)}>
            external
          </button>
          <FloatButtonGroup open={control} description="Actions">
            <FloatButton aria-label="Edit" />
          </FloatButtonGroup>
        </>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(screen.getByRole('button', { name: 'external' }));
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('mirror')).toHaveTextContent('true');
    await user.click(trigger);
    expect(screen.getByTestId('mirror')).toHaveTextContent('false');
  });

  it('applies className to the anchored container', () => {
    const { container } = render(
      <FloatButtonGroup className="custom" description="Actions">
        <FloatButton aria-label="Edit" />
      </FloatButtonGroup>
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('has no axe violations while open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    const { container } = render(
      <FloatButtonGroup description="Actions">
        <FloatButton aria-label="Edit" />
        <FloatButton aria-label="Delete" variant="outline" />
      </FloatButtonGroup>
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
