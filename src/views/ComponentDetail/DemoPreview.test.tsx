import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { darkTheme } from '@/lib';

import DemoPreview from './DemoPreview';

function previewArea(): HTMLElement {
  // The box below the toggle toolbar (the only element carrying a dir).
  return screen.getByText('demo body').parentElement!;
}

describe('DemoPreview', () => {
  it('renders demo content inside the preview box', () => {
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    expect(screen.getByText('demo body')).toBeInTheDocument();
  });

  it('exposes both toggles as pressed-state buttons', () => {
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    const dark = screen.getByRole('button', { name: 'Toggle dark preview' });
    const rtl = screen.getByRole('button', { name: 'Toggle RTL preview' });
    expect(dark).toHaveAttribute('aria-pressed', 'false');
    expect(rtl).toHaveAttribute('aria-pressed', 'false');
  });

  it('scopes darkTheme to the preview area only when toggled', async () => {
    const user = userEvent.setup();
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    const darkBtn = screen.getByRole('button', { name: 'Toggle dark preview' });
    const area = previewArea();

    expect(area).not.toHaveClass(darkTheme);
    await user.click(darkBtn);
    expect(area).toHaveClass(darkTheme);
    expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
    // The toolbar stays outside the dark scope: the toggles keep the
    // page theme regardless of the preview state.
    expect(darkBtn.closest('div')).not.toHaveClass(darkTheme);

    await user.click(darkBtn);
    expect(area).not.toHaveClass(darkTheme);
  });

  it('flips dir between rtl and ltr on the preview area only', async () => {
    const user = userEvent.setup();
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    const rtlBtn = screen.getByRole('button', { name: 'Toggle RTL preview' });
    const area = previewArea();

    expect(area).toHaveAttribute('dir', 'ltr');
    await user.click(rtlBtn);
    expect(area).toHaveAttribute('dir', 'rtl');
    expect(rtlBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(rtlBtn);
    expect(area).toHaveAttribute('dir', 'ltr');
  });

  it('keeps the two toggles independent', async () => {
    const user = userEvent.setup();
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    await user.click(screen.getByRole('button', { name: 'Toggle dark preview' }));
    await user.click(screen.getByRole('button', { name: 'Toggle RTL preview' }));

    const area = previewArea();
    expect(area).toHaveClass(darkTheme);
    expect(area).toHaveAttribute('dir', 'rtl');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    const { axe } = await import('jest-axe');
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('DemoPreview viewport presets', () => {
  function viewportGroup(): HTMLElement {
    return screen.getByRole('group', { name: 'Preview viewport width' });
  }

  /** The width-constrained wrapper inside the preview area, if present. */
  function constrainedWrapper(): HTMLElement | null {
    const body = screen.getByText('demo body');
    return body.parentElement!.getAttribute('dir') ? null : body.parentElement!;
  }

  it('defaults to Auto with no width wrapper and Auto readout', () => {
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    // Content sits directly in the preview area — exactly the old layout.
    expect(constrainedWrapper()).toBeNull();
    expect(screen.getByText('Auto', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '375' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('constrains content to 375px and shows the width label', async () => {
    const user = userEvent.setup();
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    await user.click(screen.getByRole('button', { name: '375' }));

    const wrapper = screen.getByText('demo body').parentElement!;
    expect(wrapper).toHaveStyle({ maxWidth: '375px' });
    expect(screen.getByText('375px')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '375' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Auto' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('switches to 768px and back to Auto (wrapper removed)', async () => {
    const user = userEvent.setup();
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    await user.click(screen.getByRole('button', { name: '375' }));
    await user.click(screen.getByRole('button', { name: '768' }));
    expect(screen.getByText('demo body').parentElement!).toHaveStyle({
      maxWidth: '768px',
    });
    expect(screen.getByText('768px')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Auto' }));
    expect(constrainedWrapper()).toBeNull();
    expect(screen.getByText('Auto', { selector: 'span' })).toBeInTheDocument();
  });

  it('coexists with the dark scope: wrapper lives inside darkTheme', async () => {
    const user = userEvent.setup();
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    await user.click(screen.getByRole('button', { name: 'Toggle dark preview' }));
    await user.click(screen.getByRole('button', { name: '768' }));

    const wrapper = screen.getByText('demo body').parentElement!;
    expect(wrapper).toHaveStyle({ maxWidth: '768px' });
    expect(wrapper.closest('div')).not.toHaveClass(darkTheme); // wrapper itself
    expect(wrapper.parentElement!).toHaveClass(darkTheme); // preview area
  });

  it('renders all three presets inside the labelled group', () => {
    render(
      <DemoPreview>
        <p>demo body</p>
      </DemoPreview>
    );
    const group = viewportGroup();
    const names = within(group)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(names).toEqual(['Auto', '375', '768']);
    expect(
      within(group)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-pressed'))
    ).toEqual(['true', 'false', 'false']);
  });
});
