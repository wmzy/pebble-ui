import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Combobox from './Combobox';

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('Combobox', () => {
  it('renders a combobox input', () => {
    render(<Combobox options={OPTIONS} placeholder="Search fruit" />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search fruit')).toBeInTheDocument();
  });

  it('renders a listbox', () => {
    render(<Combobox options={OPTIONS} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('shows options on click', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('does not open on focus alone (pointer-safe open path)', () => {
    // Focus used to open the list mid-gesture, which Chromium
    // light-dismissed — the first pointer click on an unfocused input
    // left the panel closed. Opening now belongs to click/typing/arrows.
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    input.focus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with ArrowDown from the closed state', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    input.focus();
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
    // The first arrow lands on the first option.
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Apple' }).id
    );
  });

  it('toggles the listbox closed on a second click', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters options by query', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    await user.type(screen.getByRole('combobox'), 'ban');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('selects an option on click', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Cherry'));
    expect(screen.getByRole('combobox')).toHaveValue('Cherry');
  });

  it('navigates with ArrowDown/ArrowUp and selects with Enter', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}');
    expect(input).toHaveValue('Apple');
  });

  it('points aria-activedescendant at the keyboard-highlighted option', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    // No highlight yet — the attribute is absent, not empty.
    expect(input).not.toHaveAttribute('aria-activedescendant');

    await user.keyboard('{ArrowDown}');
    const apple = screen.getByRole('option', { name: 'Apple' });
    expect(apple.id).not.toBe('');
    expect(input).toHaveAttribute('aria-activedescendant', apple.id);

    await user.keyboard('{ArrowDown}');
    const banana = screen.getByRole('option', { name: 'Banana' });
    expect(input).toHaveAttribute('aria-activedescendant', banana.id);
  });

  it('clears aria-activedescendant when the listbox closes', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Combobox options={OPTIONS} />
        <button>outside</button>
      </div>
    );
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant');
    await user.keyboard('{Escape}');
    expect(input).not.toHaveAttribute('aria-activedescendant');

    // Reopen and close through light dismiss — same clearing.
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant');
    fireEvent.pointerDown(screen.getByText('outside'));
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('keeps option ids stable across open/close cycles', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    const appleId = screen.getByRole('option', { name: 'Apple' }).id;
    await user.keyboard('{Escape}');
    await user.click(input);
    expect(screen.getByRole('option', { name: 'Apple' }).id).toBe(appleId);
    // The persistent highlight recovers on reopen, pointing at the same id.
    expect(input).toHaveAttribute('aria-activedescendant', appleId);
  });

  it('marks the highlighted option aria-selected alongside the selected value', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(input).toHaveValue('Banana');

    // Reopen: the query 'Banana' filters the list down to the selected row.
    await user.click(input);
    expect(
      screen.getByRole('option', { name: 'Banana' })
    ).toHaveAttribute('aria-selected', 'true');

    // A fresh query resets the highlight; ArrowDown highlights Apple while
    // Banana stays the selected value — highlight and selection are both
    // true, unhighlighted Cherry is not.
    await user.clear(input);
    await user.keyboard('{ArrowDown}');
    expect(
      screen.getByRole('option', { name: 'Apple' })
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('option', { name: 'Banana' })
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('option', { name: 'Cherry' })
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('exposes set size and position on each option', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    screen.getAllByRole('option').forEach((option, i) => {
      expect(option).toHaveAttribute('aria-setsize', '3');
      expect(option).toHaveAttribute('aria-posinset', String(i + 1));
    });
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on outside pointerdown', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Combobox options={OPTIONS} />
        <button>outside</button>
      </div>
    );
    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    fireEvent.pointerDown(screen.getByText('outside'));
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies className', () => {
    const { container } = render(<Combobox options={OPTIONS} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('mirrors the animated lifecycle as data-state on the listbox', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    const listbox = document.getElementById(input.getAttribute('aria-controls')!)!;
    expect(listbox).toHaveAttribute('data-state', 'closed');
    await user.click(input);
    expect(listbox).toHaveAttribute('data-state', 'open');
    await user.keyboard('{Escape}');
    expect(listbox).toHaveAttribute('data-state', 'closed');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Combobox options={OPTIONS} placeholder="Search fruit" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when the listbox is open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} placeholder="Search fruit" />);
    await user.click(screen.getByRole('combobox'));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  describe('virtualization', () => {
    // Row height of the virtualized path — OPTION_ROW_HEIGHT in
    // Combobox.tsx (space-2 padding top+bottom + text-sm at 1.5).
    const ROW_HEIGHT = 37;

    function makeOptions(count: number) {
      return Array.from({ length: count }, (_, i) => ({
        value: `opt-${i}`,
        label: `Option ${i}`,
      }));
    }

    // jsdom has no layout: scrollHeight reads 0, which clamps every
    // programmatic scrollTop to 0. Give the scrollport a real range.
    function giveScrollRange(port: HTMLElement, rows: number) {
      Object.defineProperty(port, 'scrollHeight', {
        value: rows * ROW_HEIGHT,
        configurable: true,
      });
    }

    it('renders the list through VirtualList above the threshold', async () => {
      const user = userEvent.setup();
      render(<Combobox options={makeOptions(30)} virtualThreshold={10} />);
      await user.click(screen.getByRole('combobox'));
      expect(document.querySelector('[data-virtualized]')).not.toBeNull();
      // Windowed: only the visible window plus overscan is mounted.
      expect(screen.getAllByRole('option').length).toBeLessThan(30);
      expect(screen.getByText('Option 0')).toBeInTheDocument();
    });

    it('virtualizes past the default threshold of 100', async () => {
      const user = userEvent.setup();
      render(<Combobox options={makeOptions(101)} />);
      await user.click(screen.getByRole('combobox'));
      expect(document.querySelector('[data-virtualized]')).not.toBeNull();
      expect(screen.getAllByRole('option').length).toBeLessThan(101);
    });

    it('keeps the plain DOM below the threshold', async () => {
      const user = userEvent.setup();
      render(<Combobox options={makeOptions(15)} virtualThreshold={20} />);
      await user.click(screen.getByRole('combobox'));
      expect(document.querySelector('[data-virtualized]')).toBeNull();
      const listbox = screen.getByRole('listbox');
      expect(screen.getAllByRole('option')).toHaveLength(15);
      // Options stay direct children of the listbox, as before.
      expect(listbox.children).toHaveLength(15);
    });

    it('never virtualizes when virtualThreshold is 0', async () => {
      const user = userEvent.setup();
      render(<Combobox options={makeOptions(30)} virtualThreshold={0} />);
      await user.click(screen.getByRole('combobox'));
      expect(document.querySelector('[data-virtualized]')).toBeNull();
      expect(screen.getAllByRole('option')).toHaveLength(30);
    });

    it('scrolls the highlighted row into view while navigating', async () => {
      const user = userEvent.setup();
      render(<Combobox options={makeOptions(30)} virtualThreshold={10} />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
      giveScrollRange(port, 30);

      await user.keyboard('{ArrowDown}'.repeat(12));
      // Row 5 first leaves the viewport and 'auto' aligns rows entering
      // from below to the top; rows 11–12 stay visible without scrolling.
      expect(port.scrollTop).toBe(370);
      expect(screen.getByRole('option', { name: 'Option 12' })).toBeInTheDocument();

      await user.keyboard('{ArrowUp}'.repeat(3));
      // Row 9 enters from above → aligned to the viewport bottom instead.
      expect(port.scrollTop).toBe(170);
      expect(screen.getByRole('option', { name: 'Option 9' })).toBeInTheDocument();
    });

    it('scrolls the highlighted row back into view when the listbox reopens', async () => {
      const user = userEvent.setup();
      render(<Combobox options={makeOptions(30)} virtualThreshold={10} />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
      giveScrollRange(port, 30);

      await user.keyboard('{ArrowDown}'.repeat(6));
      expect(port.scrollTop).toBe(185);
      await user.keyboard('{Escape}');
      // Scrolled elsewhere while closed — the live highlight must be
      // recovered on reopen.
      port.scrollTop = 0;
      fireEvent.scroll(port);
      await user.click(input);
      expect(port.scrollTop).toBe(185);
    });

    it('reports the full set size and position on windowed options', async () => {
    const user = userEvent.setup();
    render(<Combobox options={makeOptions(30)} virtualThreshold={10} />);
    await user.click(screen.getByRole('combobox'));
    // Windowed — only a slice is mounted, but the set is all 30 rows.
    expect(screen.getAllByRole('option').length).toBeLessThan(30);
    const first = screen.getByRole('option', { name: 'Option 0' });
    expect(first).toHaveAttribute('aria-setsize', '30');
    expect(first).toHaveAttribute('aria-posinset', '1');
  });

  it('keeps aria-activedescendant pointing at the mounted windowed row', async () => {
    const user = userEvent.setup();
    render(<Combobox options={makeOptions(30)} virtualThreshold={10} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
    giveScrollRange(port, 30);

    await user.keyboard('{ArrowDown}'.repeat(13));
    const highlighted = screen.getByRole('option', { name: 'Option 12' });
    expect(input).toHaveAttribute('aria-activedescendant', highlighted.id);
  });

  it('has no axe violations when the list is virtualized', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      render(<Combobox options={makeOptions(150)} placeholder="Search" />);
      await user.click(screen.getByRole('combobox'));
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });

    describe('explicit virtualized prop', () => {
      it('forces the VirtualList path below the threshold', async () => {
        const user = userEvent.setup();
        render(<Combobox options={OPTIONS} virtualized />);
        await user.click(screen.getByRole('combobox'));
        expect(document.querySelector('[data-virtualized]')).not.toBeNull();
        // The window covers the whole short list.
        expect(screen.getAllByRole('option')).toHaveLength(3);
      });

      it('sizes the scrollport to short lists instead of the full cap', async () => {
        const user = userEvent.setup();
        render(<Combobox options={OPTIONS} virtualized />);
        await user.click(screen.getByRole('combobox'));
        const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
        // 3 rows × 37px — the panel no longer claims the 200px cap.
        expect(port.style.height).toBe('111px');
      });

      it('never virtualizes above the threshold with false', async () => {
        const user = userEvent.setup();
        render(<Combobox options={makeOptions(150)} virtualized={false} />);
        await user.click(screen.getByRole('combobox'));
        expect(document.querySelector('[data-virtualized]')).toBeNull();
        expect(screen.getAllByRole('option')).toHaveLength(150);
      });

      it('applies custom itemHeight and overscan from the config object', async () => {
        const user = userEvent.setup();
        render(
          <Combobox
            options={makeOptions(30)}
            virtualized={{ itemHeight: 50, overscan: 0 }}
          />
        );
        await user.click(screen.getByRole('combobox'));
        const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
        expect(port.style.height).toBe('200px');
        // Exactly the rows intersecting the 200px viewport at 50px each.
        expect(screen.getAllByRole('option')).toHaveLength(4);
      });

      it('keeps keyboard navigation, filtering and selection working', async () => {
        const user = userEvent.setup();
        render(<Combobox options={makeOptions(150)} virtualized />);
        const input = screen.getByRole('combobox');
        await user.click(input);
        const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
        giveScrollRange(port, 150);

        await user.keyboard('{ArrowDown}'.repeat(12));
        expect(port.scrollTop).toBe(370);
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Option 11' }).id
        );

        // Typeahead keeps filtering the virtualized list: the query
        // 'Option 14' matches 11 labels; the retained scroll offset
        // windows a slice of them, but set semantics stay complete.
        await user.clear(input);
        await user.type(input, 'Option 14');
        expect(screen.getAllByRole('option').length).toBeLessThanOrEqual(11);
        expect(screen.getAllByRole('option')[0]).toHaveAttribute(
          'aria-setsize',
          '11'
        );
        await user.keyboard('{ArrowDown}{Enter}');
        expect(input).toHaveValue('Option 14');
      });

      it('has no axe violations with the explicit prop', async () => {
        const { axe } = await import('jest-axe');
        const user = userEvent.setup();
        render(
          <Combobox options={makeOptions(1000)} virtualized placeholder="Search" />
        );
        await user.click(screen.getByRole('combobox'));
        await user.keyboard('{ArrowDown}{ArrowDown}');
        const results = await axe(document.body, {
          rules: { region: { enabled: false } },
        });
        expect(results.violations).toEqual([]);
      });
    });
  });

  describe('multiple', () => {
    it('renders selected values as chips inside the trigger box', async () => {
      const user = userEvent.setup();
      render(<Combobox multiple options={OPTIONS} placeholder="Pick fruit" />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}{Enter}');
      const box = input.parentElement!;
      expect(within(box).getByText('Apple')).toBeInTheDocument();
      // The panel stays open for continued selection.
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('marks the listbox aria-multiselectable', async () => {
      const user = userEvent.setup();
      render(<Combobox multiple options={OPTIONS} />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      const listbox = document.getElementById(
        input.getAttribute('aria-controls')!
      )!;
      expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    });

    it('toggles options with Enter without closing the panel', async () => {
      const user = userEvent.setup();
      render(<Combobox multiple options={OPTIONS} />);
      const input = screen.getByRole('combobox');
      const box = input.parentElement!;
      await user.click(input);

      await user.keyboard('{ArrowDown}{Enter}');
      expect(within(box).getByText('Apple')).toBeInTheDocument();

      // The highlight persists across a toggle (an empty query never
      // changed), so one arrow steps to the next option.
      await user.keyboard('{ArrowDown}{Enter}');
      expect(within(box).getByText('Banana')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');

      // Enter on the still-highlighted selected option removes its chip.
      await user.keyboard('{Enter}');
      expect(within(box).queryByText('Banana')).not.toBeInTheDocument();
      expect(within(box).getByText('Apple')).toBeInTheDocument();
    });

    it('drops the last chip on Backspace with an empty query', async () => {
      const user = userEvent.setup();
      render(<Combobox multiple options={OPTIONS} />);
      const input = screen.getByRole('combobox');
      const box = input.parentElement!;
      await user.click(input);
      await user.keyboard('{ArrowDown}{Enter}{ArrowDown}{Enter}');
      expect(within(box).getByText('Banana')).toBeInTheDocument();

      await user.keyboard('{Backspace}');
      expect(within(box).queryByText('Banana')).not.toBeInTheDocument();
      expect(within(box).getByText('Apple')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('removes a chip through its × without toggling the panel', async () => {
      const user = userEvent.setup();
      render(<Combobox multiple options={OPTIONS} />);
      const input = screen.getByRole('combobox');
      const box = input.parentElement!;
      await user.click(input);
      await user.keyboard('{ArrowDown}{Enter}');
      expect(input).toHaveAttribute('aria-expanded', 'true');

      const remove = within(box).getByRole('button', { name: 'Remove' });
      await user.click(remove);
      expect(within(box).queryByText('Apple')).not.toBeInTheDocument();
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('fires onValuesChange with the selection arrays', async () => {
      const user = userEvent.setup();
      const onValuesChange = vi.fn();
      render(
        <Combobox multiple options={OPTIONS} onValuesChange={onValuesChange} />
      );
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onValuesChange).toHaveBeenCalledWith(['apple']);
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onValuesChange).toHaveBeenCalledWith(['apple', 'banana']);
    });

    it('works controlled through a value control', async () => {
      const user = userEvent.setup();
      function Harness() {
        const [value, , valueCtrl] = useControl<string[]>(undefined, []);
        return (
          <div>
            <Combobox multiple options={OPTIONS} value={valueCtrl} />
            <output data-testid="mirror">{value.join(',')}</output>
          </div>
        );
      }
      render(<Harness />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}{Enter}{ArrowDown}{Enter}');
      expect(screen.getByTestId('mirror')).toHaveTextContent('apple,banana');
      await user.keyboard('{Backspace}');
      expect(screen.getByTestId('mirror')).toHaveTextContent('apple');
    });

    it('has no axe violations with chips and an open panel', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      render(<Combobox multiple options={OPTIONS} placeholder="Pick fruit" />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}{Enter}{ArrowDown}');
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });

  describe('creatable', () => {
    it('offers the query as a create row when nothing matches', async () => {
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} creatable />);
      await user.type(screen.getByRole('combobox'), 'kiwi');
      const row = screen.getByRole('option', { name: 'Create "kiwi"' });
      expect(row).toHaveAttribute('aria-setsize', '1');
      expect(row).toHaveAttribute('aria-posinset', '1');
    });

    it('does not offer creation for a blank query', async () => {
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} creatable />);
      await user.click(screen.getByRole('combobox'));
      expect(screen.queryByText(/^Create/)).not.toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('suppresses the create row when options match', async () => {
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} creatable />);
      await user.type(screen.getByRole('combobox'), 'app');
      expect(screen.queryByText(/^Create/)).not.toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(1);
    });

    it('creates, selects and remembers the new option', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      render(<Combobox options={OPTIONS} creatable onCreate={onCreate} />);
      const input = screen.getByRole('combobox');
      await user.type(input, 'kiwi');
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onCreate).toHaveBeenCalledWith('kiwi');
      // Single mode: the created label becomes the query and value.
      expect(input).toHaveValue('kiwi');

      // The creation persists in the local option set — a later query
      // finds it as a regular option instead of offering creation.
      await user.click(input);
      await user.clear(input);
      await user.type(input, 'ki');
      expect(screen.getByRole('option', { name: 'kiwi' })).toBeInTheDocument();
      expect(screen.queryByText(/^Create/)).not.toBeInTheDocument();
    });

    it('trims the created value', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      render(<Combobox options={OPTIONS} creatable onCreate={onCreate} />);
      await user.type(screen.getByRole('combobox'), ' kiwi ');
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onCreate).toHaveBeenCalledWith('kiwi');
      expect(screen.getByRole('combobox')).toHaveValue('kiwi');
    });

    it('supports creatable in multiple mode', async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      render(
        <Combobox multiple options={OPTIONS} creatable onCreate={onCreate} />
      );
      const input = screen.getByRole('combobox');
      await user.type(input, 'kiwi');
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onCreate).toHaveBeenCalledWith('kiwi');
      const box = input.parentElement!;
      expect(within(box).getByText('kiwi')).toBeInTheDocument();
      // The query clears for the next pick; the panel stays open.
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('has no axe violations with the create row', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} creatable placeholder="Search" />);
      await user.type(screen.getByRole('combobox'), 'kiwi');
      await user.keyboard('{ArrowDown}');
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });

  describe('groups', () => {
    const GROUPED = [
      { value: 'apple', label: 'Apple', group: 'Fruits' },
      { value: 'banana', label: 'Banana', group: 'Fruits' },
      { value: 'carrot', label: 'Carrot', group: 'Vegetables' },
      { value: 'daikon', label: 'Daikon', group: 'Vegetables' },
    ];

    it('renders labelled group sections around their options', async () => {
      const user = userEvent.setup();
      render(<Combobox options={GROUPED} />);
      await user.click(screen.getByRole('combobox'));
      const fruits = screen.getByRole('group', { name: 'Fruits' });
      expect(within(fruits).getAllByRole('option')).toHaveLength(2);
      const vegetables = screen.getByRole('group', { name: 'Vegetables' });
      expect(within(vegetables).getAllByRole('option')).toHaveLength(2);
      // Set semantics stay flat across groups.
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveAttribute('aria-setsize', '4');
      expect(options[3]).toHaveAttribute('aria-posinset', '4');
    });

    it('hides a group entirely when every option filtered out', async () => {
      const user = userEvent.setup();
      render(<Combobox options={GROUPED} />);
      await user.type(screen.getByRole('combobox'), 'app');
      expect(
        screen.queryByRole('group', { name: 'Vegetables' })
      ).not.toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Fruits' })).toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(1);
    });

    it('keeps keyboard navigation continuous across groups', async () => {
      const user = userEvent.setup();
      render(<Combobox options={GROUPED} />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      // Three arrows land on the first option of the second group —
      // the flat index order continues across the group boundary.
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(input).toHaveAttribute(
        'aria-activedescendant',
        screen.getByRole('option', { name: 'Carrot' }).id
      );
      await user.keyboard('{ArrowDown}{Enter}');
      expect(input).toHaveValue('Daikon');
    });

    it('has no axe violations with open groups', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      render(<Combobox options={GROUPED} placeholder="Search" />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}{ArrowDown}');
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });

    describe('virtualized', () => {
      // jsdom ships no ResizeObserver; VirtualList's sticky group
      // headers measure through one (same stub shape as its own tests).
      class MockResizeObserver {
        private callback: (entries: ResizeObserverEntry[]) => void;
        constructor(callback: (entries: ResizeObserverEntry[]) => void) {
          this.callback = callback;
        }
        observe(target: Element) {
          this.callback([{ target } as ResizeObserverEntry]);
        }
        unobserve() {
          /* nothing to detach in the synchronous stub */
        }
        disconnect() {
          /* no observations to drop in the synchronous stub */
        }
      }

      beforeEach(() => {
        vi.stubGlobal('ResizeObserver', MockResizeObserver);
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      function groupedOptions(count: number) {
        return Array.from({ length: count }, (_, i) => ({
          value: `opt-${i}`,
          label: `Option ${i}`,
          group: i < count / 2 ? 'First half' : 'Second half',
        }));
      }

      it('renders sticky group headers over the windowed rows', async () => {
        const user = userEvent.setup();
        render(
          <Combobox options={groupedOptions(30)} virtualThreshold={10} />
        );
        const input = screen.getByRole('combobox');
        await user.click(input);
        expect(
          document.querySelector('[data-virtualized]')
        ).not.toBeNull();
        // The first group's header is mounted over the visible window.
        expect(
          document.querySelectorAll('[data-group-key]').length
        ).toBeGreaterThan(0);
        expect(screen.getByText('First half')).toBeInTheDocument();
        // Windowed rows carry the full flat set semantics.
        expect(screen.getAllByRole('option').length).toBeLessThan(30);
        expect(screen.getAllByRole('option')[0]).toHaveAttribute(
          'aria-setsize',
          '30'
        );
      });

      it('keeps keyboard navigation working across virtual groups', async () => {
        const user = userEvent.setup();
        render(
          <Combobox options={groupedOptions(30)} virtualThreshold={10} />
        );
        const input = screen.getByRole('combobox');
        await user.click(input);
        const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
        Object.defineProperty(port, 'scrollHeight', {
          value: 30 * 37,
          configurable: true,
        });
        await user.keyboard('{ArrowDown}'.repeat(16));
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('option', { name: 'Option 15' }).id
        );
        await user.keyboard('{Enter}');
        expect(input).toHaveValue('Option 15');
      });
    });
  });

  describe('match highlighting', () => {
    it('wraps the first case-insensitive match in a mark', async () => {
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} highlightMatches />);
      // Uppercase query against lowercase label interiors.
      await user.type(screen.getByRole('combobox'), 'A');
      const banana = screen.getByRole('option', { name: 'Banana' });
      const bananaMark = banana.querySelector('mark');
      expect(bananaMark).not.toBeNull();
      // The matched fragment keeps its original casing, and only the
      // first occurrence is wrapped.
      expect(bananaMark).toHaveTextContent('a');
      const apple = screen.getByRole('option', { name: 'Apple' });
      expect(apple.querySelector('mark')).toHaveTextContent('A');
      // A label without the query is filtered out entirely.
      expect(screen.queryByRole('option', { name: 'Cherry' })).toBeNull();
    });

    it('stays off by default', async () => {
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} />);
      await user.type(screen.getByRole('combobox'), 'ban');
      expect(
        screen.getByRole('option', { name: 'Banana' }).querySelector('mark')
      ).toBeNull();
    });

    it('highlights through the virtualized path', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          options={Array.from({ length: 30 }, (_, i) => ({
            value: `opt-${i}`,
            label: `Option ${i}`,
          }))}
          virtualThreshold={10}
          highlightMatches
        />
      );
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'Option 1');
      expect(document.querySelector('[data-virtualized]')).not.toBeNull();
      const first = screen.getAllByRole('option')[0]!;
      expect(first.querySelector('mark')).not.toBeNull();
    });

    it('has no axe violations with marks shown', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} highlightMatches placeholder="Search" />);
      await user.type(screen.getByRole('combobox'), 'an');
      await user.keyboard('{ArrowDown}');
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });

  describe('loading and empty states', () => {
    it('marks the input aria-busy and replaces options with a spinner', () => {
      render(<Combobox options={OPTIONS} loading />);
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull();
    });

    it('omits aria-busy when not loading', () => {
      render(<Combobox options={OPTIONS} />);
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-busy');
    });

    it('shows the localized no-results row', async () => {
      const user = userEvent.setup();
      render(<Combobox options={OPTIONS} />);
      await user.type(screen.getByRole('combobox'), 'zzz');
      const row = screen.getByRole('option', { name: 'No results' });
      expect(row).toHaveAttribute('aria-disabled', 'true');
      expect(row).toHaveAttribute('aria-selected', 'false');
    });

    it('renders a custom empty node', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          options={OPTIONS}
          empty={<em data-testid="custom-empty">Nothing here</em>}
        />
      );
      await user.type(screen.getByRole('combobox'), 'zzz');
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: 'No results' })
      ).not.toBeInTheDocument();
    });

    it('prefers loading over the empty state', () => {
      render(<Combobox options={OPTIONS} loading empty="custom empty" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('custom empty')).not.toBeInTheDocument();
    });

    it('has no axe violations while loading or empty', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      const { unmount } = render(
        <Combobox options={OPTIONS} loading placeholder="Search" />
      );
      let results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
      unmount();

      render(<Combobox options={OPTIONS} placeholder="Search" />);
      await user.type(screen.getByRole('combobox'), 'zzz');
      results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });

  describe('maxHeight', () => {
    function listboxOf(input: HTMLElement) {
      return document.getElementById(input.getAttribute('aria-controls')!)!;
    }

    it('leaves the default cap untouched when omitted', () => {
      render(<Combobox options={OPTIONS} />);
      const input = screen.getByRole('combobox');
      expect(listboxOf(input).style.maxHeight).toBe('');
    });

    it('caps the plain listbox through an inline style', () => {
      render(<Combobox options={OPTIONS} maxHeight={120} />);
      const input = screen.getByRole('combobox');
      expect(listboxOf(input).style.maxHeight).toBe('120px');
    });

    it('caps the virtualized scrollport', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          options={Array.from({ length: 30 }, (_, i) => ({
            value: `opt-${i}`,
            label: `Option ${i}`,
          }))}
          virtualThreshold={10}
          maxHeight={120}
        />
      );
      await user.click(screen.getByRole('combobox'));
      const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
      expect(port.style.height).toBe('120px');
    });

    it('keeps the 200px default cap on the virtualized scrollport', async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          options={Array.from({ length: 30 }, (_, i) => ({
            value: `opt-${i}`,
            label: `Option ${i}`,
          }))}
          virtualThreshold={10}
        />
      );
      await user.click(screen.getByRole('combobox'));
      const port = document.querySelector<HTMLElement>('[data-virtualized]')!;
      expect(port.style.height).toBe('200px');
    });
  });
});

describe('Combobox ref forwarding', () => {
  it('forwards ref to the combobox input in single mode', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Combobox ref={ref} options={OPTIONS} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it('forwards ref to the combobox input in multiple mode', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Combobox ref={ref} multiple options={OPTIONS} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
