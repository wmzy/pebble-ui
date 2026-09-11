import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import JsonView from './JsonView';

/** jsdom has neither navigator.clipboard nor execCommand — stub the async
 * API so the success path runs (same pattern as ChatMessage.test.tsx). */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  const fn = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: fn },
    configurable: true,
  });
  return {
    fn,
    restore: () => {
      Reflect.deleteProperty(navigator, 'clipboard');
    },
  };
}

const sample = {
  name: 'haze-ui',
  stars: 128,
  openSource: true,
  tags: ['react', 'linaria'],
  meta: { version: '1.13.0', private: false, deprecated: null },
};

describe('JsonView', () => {
  it('renders keys and colored leaf values', () => {
    const { container } = render(<JsonView data={sample} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('"haze-ui"')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
    // value-kind coloring classes land on the leaf spans
    expect(container.querySelector('[class*="leafString"]')?.textContent).toBe(
      '"haze-ui"'
    );
    expect(container.querySelector('[class*="leafNumber"]')?.textContent).toBe('128');
    expect(container.querySelector('[class*="leafBoolean"]')?.textContent).toBe('true');
  });

  it('renders nested objects and arrays expanded by default', () => {
    render(<JsonView data={sample} />);
    expect(screen.getByText('tags')).toBeInTheDocument();
    expect(screen.getByText('meta')).toBeInTheDocument();
    expect(screen.getByText('version')).toBeInTheDocument();
    // array entries show their index keys
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('"react"')).toBeInTheDocument();
  });

  it('renders a bare primitive root', () => {
    render(<JsonView data={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders empty branches without a toggle', () => {
    render(<JsonView data={{ empty: {}, list: [] }} />);
    expect(screen.getByText('{}', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('[]', { exact: false })).toBeInTheDocument();
    // the empty branches themselves disclose nothing…
    expect(screen.queryByRole('button', { name: /empty/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /list/ })).not.toBeInTheDocument();
    // …only the non-empty root has a toggle
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('collapses nodes at defaultExpandedDepth and expands on click', async () => {
    const user = userEvent.setup();
    render(<JsonView data={sample} defaultExpandedDepth={0} />);
    // root collapsed: nested keys hidden, summary shown
    expect(screen.queryByText('name')).not.toBeInTheDocument();
    expect(screen.queryByText('version')).not.toBeInTheDocument();
    expect(screen.getByText(/\{ … \}/)).toBeInTheDocument();

    const rootToggle = screen.getByRole('button', { expanded: false });
    expect(rootToggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(rootToggle);
    // depth-1 keys visible again; depth-2 still collapsed (tags/meta)
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.queryByText('version')).not.toBeInTheDocument();

    const metaToggle = screen.getByRole('button', { name: /meta/ });
    expect(metaToggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(metaToggle);
    expect(screen.getByText('version')).toBeInTheDocument();
  });

  it('collapses an expanded node on second click', async () => {
    const user = userEvent.setup();
    render(<JsonView data={sample} />);
    expect(screen.getByRole('button', { name: /meta/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await user.click(screen.getByRole('button', { name: /meta/ }));
    // collapsed state re-renders a fresh toggle — re-query before asserting
    const collapsedToggle = screen.getByRole('button', { name: /meta/ });
    expect(collapsedToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('version')).not.toBeInTheDocument();
    // toggle target id only present while expanded
    expect(collapsedToggle).not.toHaveAttribute('aria-controls');
  });

  it('honours defaultExpandedDepth for nested levels', () => {
    render(<JsonView data={sample} defaultExpandedDepth={1} />);
    // depth-0 root expanded: keys visible, no root summary
    expect(screen.getByText('name')).toBeInTheDocument();
    // depth-1 branches (tags, meta) start collapsed with summaries
    expect(screen.queryByText('"react"')).not.toBeInTheDocument();
    expect(screen.queryByText('version')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /meta/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: /tags/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('truncates oversized collections with a "+N more" hint', () => {
    const big = Object.fromEntries(
      Array.from({ length: 150 }, (_, i) => [`k${i}`, i])
    );
    render(<JsonView data={big} />);
    expect(screen.getByText('k0')).toBeInTheDocument();
    expect(screen.getByText('k99')).toBeInTheDocument();
    expect(screen.queryByText('k100')).not.toBeInTheDocument();
    expect(screen.getByText('… +50 more')).toBeInTheDocument();
  });

  it('supports a custom moreLabel formatter', () => {
    const big = Object.fromEntries(
      Array.from({ length: 120 }, (_, i) => [`k${i}`, i])
    );
    render(<JsonView data={big} moreLabel={() => 'truncated'} />);
    expect(screen.getByText('k99')).toBeInTheDocument();
    expect(screen.queryByText('k100')).not.toBeInTheDocument();
    expect(screen.getByText('… truncated')).toBeInTheDocument();
  });

  it('stops at circular references instead of hanging', () => {
    const cyc: Record<string, unknown> = { name: 'cyclic' };
    cyc.self = cyc;
    render(<JsonView data={cyc} />);
    expect(screen.getByText('"cyclic"')).toBeInTheDocument();
    expect(screen.getByText('self')).toBeInTheDocument();
    // the cycle itself renders the ellipsis leaf, not an infinite tree
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });

  it('copies pretty-printed data when copyable', async () => {
    const user = userEvent.setup();
    const clipboard = stubClipboard(() => Promise.resolve());
    try {
      render(<JsonView data={sample} copyable />);
      await user.click(screen.getByRole('button', { name: 'Copy' }));
      expect(clipboard.fn).toHaveBeenCalledWith(JSON.stringify(sample, null, 2));
    } finally {
      clipboard.restore();
    }
  });

  it('falls back to String() when data cannot be serialized', async () => {
    const user = userEvent.setup();
    const cyc: Record<string, unknown> = { a: 1 };
    cyc.self = cyc;
    const clipboard = stubClipboard(() => Promise.resolve());
    try {
      render(<JsonView data={cyc} copyable />);
      await user.click(screen.getByRole('button', { name: 'Copy' }));
      expect(clipboard.fn).toHaveBeenCalledWith('[object Object]');
    } finally {
      clipboard.restore();
    }
  });

  it('uses the custom copy label', () => {
    render(<JsonView data={{ a: 1 }} copyable copyLabel="Copy JSON" />);
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument();
  });

  it('omits the copy button by default', () => {
    const { container } = render(<JsonView data={{ a: 1 }} />);
    expect(container.querySelector('button[aria-label]')).not.toBeInTheDocument();
  });

  it('applies className to the root', () => {
    const { container } = render(<JsonView data={{ a: 1 }} className="custom" />);
    expect(container.firstElementChild).toHaveClass('custom');
  });

  it('forwards native props to the root', () => {
    render(<JsonView data={{ a: 1 }} data-testid="json" aria-label="Payload" />);
    expect(screen.getByTestId('json')).toHaveAttribute('aria-label', 'Payload');
  });

  it('keeps sibling toggles independent', async () => {
    const user = userEvent.setup();
    render(
      <JsonView
        data={{
          first: { inner: 1 },
          second: { inner: 2 },
        }}
      />
    );
    const first = screen.getByRole('button', { name: /first/ });
    await user.click(first);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // collapsing one does not disturb the other's expanded marker
    expect(screen.getByRole('button', { name: /second/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <>
        <JsonView data={sample} copyable />
        <JsonView data={{ nested: { deep: [1, 2] } }} defaultExpandedDepth={0} />
      </>
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
