//
// RTL rendering smoke test (default jsdom environment): each fixture is
// rendered inside a dir='rtl' subtree and asserted on three things:
//
//   1. it renders at all (jsdom + Linaria handle the logical properties
//      added in the RTL audit — margin-inline-*, padding-inline-*,
//      inset-inline-*, text-align: start/end, border-end-*-radius —
//      without throwing);
//   2. axe reports no violations (RTL must not cost accessibility);
//   3. the component's key aria contract is unchanged by direction.
//
// jsdom does no layout, so visual mirroring (fill growing from the
// inline-start edge, flipped carousel arrows, mirrored bubble tails)
// cannot be asserted here — this file is a regression smoke net, not a
// mirror proof. The visual behavior comes from CSS logical properties
// resolved by the browser at paint time.
import type { ReactElement } from 'react';

import { render, screen } from '@testing-library/react';

// Direct component-file imports, mirroring ssr-render.node.test.tsx (the
// ./index barrel drags in tokens/colors.ts, whose Linaria interpolation is
// irrelevant here and slows node-env runs; see that file's note).
import Alert from './components/Alert/Alert';
import Badge from './components/Badge/Badge';
import Dialog from './components/Dialog/Dialog';
import Progress from './components/Progress/Progress';
import Tag from './components/Tag/Tag';

/** Render inside a dir='rtl' subtree, mirroring an RTL host document.
 * Custom containers are not auto-appended to body — axe(document.body)
 * needs the tree attached to scan it. */
function renderRtl(ui: ReactElement) {
  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  document.body.appendChild(container);
  return render(ui, { container });
}

// 'region' fires for content outside a landmark — an artifact of the bare
// test document, not the component (same exemption as component tests).
const axeOptions = { rules: { region: { enabled: false } } };

describe('RTL rendering smoke (dir=rtl)', () => {
  it('renders Progress with the progressbar aria contract intact', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(<Progress value={50} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders Alert with the alert role and close button intact', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(
      <Alert variant='warning' closable>
        Storage almost full
      </Alert>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Storage almost full');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders Badge content', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(<Badge variant='success'>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders closable Tag with the remove button intact', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(
      <Tag variant='primary' closable>
        design
      </Tag>
    );
    expect(screen.getByText('design')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });

  it('renders a closed Dialog staying closed and labelled', async () => {
    const { axe } = await import('jest-axe');
    renderRtl(
      <Dialog title='Confirm removal'>Dialog body</Dialog>
    );
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('data-state', 'closed');
    expect(dialog).not.toHaveAttribute('open');
    expect(dialog).toHaveAttribute(
      'aria-labelledby',
      screen.getByText('Confirm removal').id
    );
    expect(await axe(document.body, axeOptions)).toEqual(
      expect.objectContaining({ violations: [] })
    );
  });
});
