import type { Route } from '@native-router/react';

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MemoryRouter, View, useMatched } from '@native-router/react';

import CommandPalette from './CommandPalette';

beforeEach(() => {
  // jsdom does not implement showModal/close for HTMLDialogElement
  // (same mock shape as Dialog.test.tsx / CommandDialog.test.tsx).
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

function HomeStub() {
  return <div>home-view</div>;
}

function ComponentDocStub() {
  const { params } = useMatched();
  return <div>doc-view:{params.name ?? ''}</div>;
}

function PageStub() {
  return <div>page-view</div>;
}

function GuideStub() {
  const { params } = useMatched();
  return <div>guide-view:{params.guide ?? ''}</div>;
}

const routes = [
  { path: '/', component: () => Promise.resolve({ default: HomeStub }) },
  {
    path: '/components/:name',
    component: () => Promise.resolve({ default: ComponentDocStub }),
  },
  {
    path: '/getting-started',
    component: () => Promise.resolve({ default: PageStub }),
  },
  {
    path: '/guides/:guide',
    component: () => Promise.resolve({ default: GuideStub }),
  },
] as Route[];

function renderApp() {
  return render(
    <MemoryRouter routes={routes} initialEntries={['/']}>
      <CommandPalette />
      <View />
    </MemoryRouter>
  );
}

/** Text of every visible palette option, in DOM (= rank) order. */
function optionTexts(): string[] {
  return screen
    .getAllByRole('option')
    .map((option) => option.textContent.trim());
}

describe('CommandPalette', () => {
  it('renders the header search button with the ⌘K hint', () => {
    renderApp();
    const btn = screen.getByRole('button', { name: 'Search components' });
    expect(within(btn).getByText('⌘K')).toBeInTheDocument();
  });

  it('opens the palette on click with the grouped component list', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');

    await user.click(screen.getByRole('button', { name: 'Search components' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Search components',
    });
    expect(dialog).toHaveAttribute('open');
    // Grouped shape mirrors the sidebar: group headings + all components.
    expect(within(dialog).getByText('General')).toBeInTheDocument();
    expect(within(dialog).getByText('Forms')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('option', { name: 'Button' })
    ).toBeInTheDocument();
  });

  it('opens and closes through the Ctrl/Cmd+K hotkey', async () => {
    renderApp();
    await screen.findByText('home-view');

    // jsdom on Linux resolves `mod` to ctrl.
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const dialog = await screen.findByRole('dialog', {
      name: 'Search components',
    });
    expect(dialog).toHaveAttribute('open');

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('fuzzy-filters by name across scoring tiers and ranks by tier', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    // Subsequence tier: "btn" still finds Button, while non-matching
    // components disappear.
    await user.type(input, 'btn');
    const btnTexts = optionTexts();
    expect(btnTexts.some((t) => t.startsWith('Button'))).toBe(true);
    expect(btnTexts.some((t) => t.startsWith('Accordion'))).toBe(false);

    // Rank order: prefix tier first — Upload via its "drag" alias (Forms
    // comes before Overlays in array order), then Drawer, DropdownMenu
    // by name prefix — before word-initials (DateRangePicker); each row
    // is trailed by its group label.
    await user.clear(input);
    await user.type(input, 'dr');
    expect(optionTexts().slice(0, 4)).toEqual([
      'UploadForms',
      'DrawerOverlays',
      'DropdownMenuOverlays',
      'DateRangePickerForms',
    ]);
  });

  it('matches through aliases (modal → Dialog)', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    await user.type(input, 'modal');
    const texts = optionTexts();
    expect(texts.some((t) => t.startsWith('Dialog'))).toBe(true);
    expect(texts.some((t) => t.startsWith('DialogOverlays'))).toBe(true);
    expect(texts.length).toBe(1);
  });

  it('shows a no-results row when nothing matches', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    await user.type(input, 'zzz');
    expect(
      screen.getByText('No results match “zzz”')
    ).toBeInTheDocument();
  });

  it('navigates to the component doc route and closes on select', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    await user.type(input, 'btn');
    await user.click(
      screen.getAllByRole('option').find((o) => o.textContent === 'ButtonGeneral')!
    );

    // Router landed on /components/button.
    expect(await screen.findByText('doc-view:button')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog', { name: 'Search components' });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('surfaces Docs-tier prop hits and navigates to the owning page', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    // "label width" matches no component name, but the FormItem docs
    // table row labelWidth does (multi-term AND across label/sublabel).
    await user.type(input, 'label width');
    const dialog = screen.getByRole('dialog', { name: 'Search components' });
    const docsGroup = within(dialog).getByRole('group', { name: 'Docs' });
    const row = within(docsGroup).getByRole('option', {
      name: /labelWidth/,
    });
    expect(
      within(row).getByText(/^FormItem — Horizontal label column width/)
    ).toBeInTheDocument();

    await user.click(row);
    expect(await screen.findByText('doc-view:form')).toBeInTheDocument();
  });

  it('surfaces guide pages in the Docs tier and navigates to the guide', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    await user.type(input, 'density');
    const dialog = screen.getByRole('dialog', { name: 'Search components' });
    await user.click(
      within(dialog).getByRole('option', { name: /Density \(compact\)/ })
    );
    expect(await screen.findByText('guide-view:density')).toBeInTheDocument();
  });

  it('Enter activates the focused Docs row', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    // Docs-only query: the first option is the Getting Started page.
    await user.type(input, 'getting started');
    await user.keyboard('[ArrowDown]');
    expect(document.activeElement).toBe(
      screen.getAllByRole('option')[0]
    );
    await user.keyboard('[Enter]');

    expect(await screen.findByText('page-view')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog', { name: 'Search components' });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('arrow keys traverse from the component tier into the Docs group', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    const input = await screen.findByRole('textbox');

    // Both tiers hit: Dialog (component) + a Docs group below it.
    await user.type(input, 'dialog');
    const dialog = screen.getByRole('dialog', { name: 'Search components' });
    const docsGroup = within(dialog).getByRole('group', { name: 'Docs' });
    const docsFirst = within(docsGroup).getAllByRole('option')[0]!;
    const index = within(dialog)
      .getAllByRole('option')
      .indexOf(docsFirst);

    // One ArrowDown per option from the input, landing on the first
    // Docs row — focus crossed the tier boundary inside the listbox.
    await user.keyboard('[ArrowDown]'.repeat(index + 1));
    expect(document.activeElement).toBe(docsFirst);

    await user.keyboard('[Enter]');
    expect(await screen.findByText(/doc-view:/)).toBeInTheDocument();
  });

  it('has no axe violations while open', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    await screen.findByText('home-view');
    await user.click(screen.getByRole('button', { name: 'Search components' }));
    await screen.findByRole('dialog', { name: 'Search components' });

    const { axe } = await import('jest-axe');
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
