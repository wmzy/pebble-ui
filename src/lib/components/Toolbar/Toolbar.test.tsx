import { expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Toolbar from './Toolbar';
import ToolbarButton from './ToolbarButton';
import ToolbarSeparator from './ToolbarSeparator';

function renderToolbar(orientation?: 'vertical') {
  return render(
    <Toolbar aria-label="Text formatting" orientation={orientation}>
      <ToolbarButton>Bold</ToolbarButton>
      <ToolbarButton>Italic</ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton aria-pressed>Underline</ToolbarButton>
      <ToolbarButton disabled>Strikethrough</ToolbarButton>
    </Toolbar>
  );
}

/** Enabled roving items in DOM order (disabled ones drop out). */
function items(): [HTMLElement, HTMLElement, HTMLElement] {
  const bold = screen.getByRole('button', { name: 'Bold' });
  const italic = screen.getByRole('button', { name: 'Italic' });
  const underline = screen.getByRole('button', { name: 'Underline' });
  return [bold, italic, underline];
}

describe('Toolbar', () => {
  it('renders a toolbar with horizontal orientation by default', () => {
    renderToolbar();
    const toolbar = screen.getByRole('toolbar', { name: 'Text formatting' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('switches to vertical orientation', () => {
    renderToolbar('vertical');
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('keeps exactly one tab stop, initially the first item', () => {
    renderToolbar();
    const [bold, italic, underline] = items();
    expect(bold).toHaveAttribute('tabindex', '0');
    expect(italic).toHaveAttribute('tabindex', '-1');
    expect(underline).toHaveAttribute('tabindex', '-1');
  });

  it('moves the tab stop with focus', async () => {
    const user = userEvent.setup();
    renderToolbar();
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    const [bold, italic] = items();
    expect(italic).toHaveAttribute('tabindex', '0');
    expect(bold).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus forward with ArrowRight, wrapping and skipping disabled items', async () => {
    const user = userEvent.setup();
    renderToolbar();
    const [bold, italic, underline] = items();
    bold.focus();
    await user.keyboard('{ArrowRight}');
    expect(italic).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    // Skips the separator and the disabled Strikethrough item.
    expect(underline).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    // Wraps back to the first item.
    expect(bold).toHaveFocus();
  });

  it('moves focus backward with ArrowLeft, wrapping', async () => {
    const user = userEvent.setup();
    renderToolbar();
    const [bold, italic, underline] = items();
    bold.focus();
    await user.keyboard('{ArrowLeft}');
    // Wraps from the first item to the last.
    expect(underline).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(italic).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    renderToolbar();
    const [bold, , underline] = items();
    bold.focus();
    await user.keyboard('{End}');
    expect(underline).toHaveFocus();
    await user.keyboard('{Home}');
    expect(bold).toHaveFocus();
  });

  it('uses the vertical axis in vertical orientation', async () => {
    const user = userEvent.setup();
    renderToolbar('vertical');
    const [bold, italic] = items();
    bold.focus();
    await user.keyboard('{ArrowDown}');
    expect(italic).toHaveFocus();
    // The horizontal axis is inert in a vertical toolbar.
    await user.keyboard('{ArrowUp}');
    expect(bold).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(bold).toHaveFocus();
  });

  it('renders the separator with role and mirrored orientation', () => {
    const { unmount } = renderToolbar();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    unmount();

    renderToolbar('vertical');
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    renderToolbar();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('ToolbarButton', () => {
  it('has type="button" by default and forwards native props', () => {
    render(
      <Toolbar>
        <ToolbarButton disabled aria-label="Insert link">
          Link
        </ToolbarButton>
      </Toolbar>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Insert link');
  });

  it('applies className', () => {
    render(
      <Toolbar>
        <ToolbarButton className="custom">Bold</ToolbarButton>
      </Toolbar>
    );
    expect(screen.getByRole('button')).toHaveClass('custom');
  });

  it('calls onClick handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Toolbar>
        <ToolbarButton onClick={onClick}>Bold</ToolbarButton>
      </Toolbar>
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('passes aria-pressed through for toggle items', () => {
    const { rerender } = render(
      <Toolbar>
        <ToolbarButton aria-pressed="false">Bold</ToolbarButton>
      </Toolbar>
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <Toolbar>
        <ToolbarButton aria-pressed="true">Bold</ToolbarButton>
      </Toolbar>
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});
