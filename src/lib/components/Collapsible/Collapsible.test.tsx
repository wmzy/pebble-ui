import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';

describe('Collapsible', () => {
  it('renders trigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
  });

  it('hides content by default', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('shows content when trigger clicked', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>
    );
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('hides content when trigger clicked again', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden again</CollapsibleContent>
      </Collapsible>
    );
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    // Collapse in flight: still mounted (the 0fr transition needs the
    // subtree alive) with the wrapper flipped to data-state="closed".
    expect(screen.getByText('Hidden again').closest('[data-state]')).toHaveAttribute(
      'data-state',
      'closed'
    );
    // Exit settled (jsdom reports no transition duration): unmounted.
    await waitFor(() =>
      expect(screen.queryByText('Hidden again')).not.toBeInTheDocument()
    );
  });

  it('drops collapsed content from the tab order once the exit settles', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>
          <button type="button">Inner action</button>
        </CollapsibleContent>
      </Collapsible>
    );
    expect(
      screen.getByRole('button', { name: 'Inner action' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Inner action' })
      ).not.toBeInTheDocument()
    );

    // With the content unmounted (and its collapsed state visibility:hidden
    // in real browsers), Tab never reaches the inner action: from body the
    // first (and only) tabbable is the trigger.
    (document.activeElement as HTMLElement | null)?.blur();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveFocus();
  });

  it('applies className', () => {
    const { container } = render(
      <Collapsible className="custom">
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('respects defaultOpen', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Open content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Open content')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>
    );
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByText('Visible content')).toBeInTheDocument();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Collapsible classNames slots', () => {
  it('applies root, trigger and content to their structural parts', () => {
    const { container } = render(
      <Collapsible
        defaultOpen
        classNames={{ root: 'c-root', trigger: 'c-trigger', content: 'c-content' }}
      >
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>
          <p data-testid="body">Visible content</p>
        </CollapsibleContent>
      </Collapsible>
    );
    expect(container.firstChild).toHaveClass('c-root');
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveClass('c-trigger');
    // The content slot lands on the animated outer row — the element
    // Presence injects data-state on (the p sits two wrappers deeper).
    const content = container.querySelector('[data-state="open"]');
    expect(content).toHaveClass('c-content');
  });

  it('keeps the class lists untouched when classNames is omitted', () => {
    const { container } = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>
    );
    const parts = [
      container.firstChild as HTMLElement,
      screen.getByRole('button', { name: 'Toggle' }),
      container.querySelector('[data-state="open"]')!,
    ];
    for (const el of parts) {
      expect(el.className).toBe(el.className.trim());
      expect(el.className).not.toContain('  ');
    }
  });
});
