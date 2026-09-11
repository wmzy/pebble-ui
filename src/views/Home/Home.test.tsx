import type { Route } from '@native-router/react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MemoryRouter } from '@native-router/react';

import propsJson from '@/generated/props.json';
import sizeReportJson from '@/generated/size-report.json';

import Home from './index';

const componentCount = Object.keys(propsJson.components).length;

const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;

const routes = [
  { path: '/', component: () => Promise.resolve({ default: () => null }) },
  { path: '/getting-started', component: () => Promise.resolve({ default: () => null }) },
  { path: '/components', component: () => Promise.resolve({ default: () => null }) },
] as Route[];

function renderHome() {
  return render(
    <MemoryRouter routes={routes} initialEntries={['/']}>
      <Home />
    </MemoryRouter>
  );
}

/** jsdom has neither navigator.clipboard nor execCommand — stub the async
 * API so the copy success path runs (same pattern as ChatMessage.test.tsx).
 * user-event's setup() attaches its own clipboard stub, so install ours
 * after calling setup(). */
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

describe('Home', () => {
  it('renders the hero with the live component count', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Build faster with Haze UI' })
    ).toBeInTheDocument();
    // Feature card title and hero subtitle both derive from props.json.
    expect(screen.getByText(`${componentCount}+ Components`)).toBeInTheDocument();
    expect(screen.getByText(/production-ready components/)).toBeInTheDocument();
    // The stale pre-docgen numbers must not resurface.
    expect(screen.queryByText(/33\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/32KB/)).not.toBeInTheDocument();
  });

  it('renders four stat cards sourced from props.json and size-report.json', () => {
    renderHome();
    expect(screen.getByText(String(componentCount))).toBeInTheDocument();
    expect(
      screen.getByText(formatBytes(sizeReportJson.aggregate.cssGzipBytes))
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `CSS full bundle \u00b7 ${formatBytes(sizeReportJson.aggregate.cssBytes)} raw`
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Runtime JS for styles')).toBeInTheDocument();
    expect(screen.getByText('Built-in themes')).toBeInTheDocument();
  });

  it('copies the install command and flashes a Copied confirmation', async () => {
    const user = userEvent.setup();
    const clipboard = stubClipboard(() => Promise.resolve());
    try {
      renderHome();
      await user.click(screen.getByRole('button', { name: 'Copy install command' }));
      expect(clipboard.fn).toHaveBeenCalledWith('pnpm add haze-ui');
      expect(await screen.findByText('Copied')).toBeInTheDocument();
    } finally {
      clipboard.restore();
    }
  });

  it('renders the live component wall with 8+ interactive components', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { name: 'Real components, not screenshots' })
    ).toBeInTheDocument();
    // Button
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    // Switch
    expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument();
    // Slider
    expect(screen.getByRole('slider', { name: 'Opacity' })).toBeInTheDocument();
    // Segmented (options render as buttons)
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    // Rating
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    // Progress
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Input
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeInTheDocument();
    // Pagination
    expect(screen.getByRole('navigation', { name: 'Demo pages' })).toBeInTheDocument();
  });

  it('drives the Switch from outside through its control', async () => {
    const user = userEvent.setup();
    renderHome();
    const sw = screen.getByRole('switch', { name: 'Notifications' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('On')).toBeInTheDocument();
  });
});
