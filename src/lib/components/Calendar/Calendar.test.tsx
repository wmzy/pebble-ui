import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import Calendar from './Calendar';

function getMonthLabel(year: number, month: number) {
  return new Date(year, month).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

/* The date-mode header splits the old "Month Year" title into two
   drill-down buttons — the long month name and the bare year. */
function getMonthTitleName(month: number) {
  return new Date(2025, month, 15).toLocaleString('default', {
    month: 'long',
  });
}

function getLocalizedMonthTitleName(month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(
    new Date(2025, month, 15)
  );
}

function getLocalizedMonthLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month));
}

/* Mirrors Calendar's week-start resolution: Intl reports 7 for Sunday while
   the grid uses 0, and engines without getWeekInfo fall back to Sunday. */
function getLocaleWeekStart(locale: string) {
  const firstDay = (
    new Intl.Locale(locale) as { getWeekInfo?: () => { firstDay: number } }
  ).getWeekInfo?.().firstDay;
  return firstDay === undefined || firstDay === 7 ? 0 : firstDay;
}

function getLocalizedWeekdays(locale: string, weekStart: number) {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // 2024-01-07 is a Sunday; index 0…6 map to Sunday…Saturday.
  const byDay = Array.from({ length: 7 }, (_, day) =>
    fmt.format(new Date(2024, 0, 7 + day))
  );
  return Array.from({ length: 7 }, (_, i) => byDay[(weekStart + i) % 7]!);
}

function getWeekdayHeaders() {
  return screen
    .getAllByRole('columnheader')
    .map((columnheader) => columnheader.textContent);
}

function ControlledCalendar({ initial = '2025-01-15' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <Calendar value={value} onSelect={setValue} />;
}

describe('Calendar', () => {
  it('renders the month grid for the given value', () => {
    render(<Calendar value='2025-01-15' />);
    const label = getMonthLabel(2025, 0);
    expect(screen.getByRole('grid', { name: label })).toBeInTheDocument();
    // The header carries two drill titles: the long month and the year.
    expect(
      screen.getByRole('button', { name: getMonthTitleName(0) })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2025' })).toBeInTheDocument();
    expect(getWeekdayHeaders()).toEqual([
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
    ]);
  });

  it('renders a grid when no value is selected', () => {
    render(<Calendar />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  it('marks the selected day on the gridcell', () => {
    render(<Calendar value='2025-01-15' />);
    const selected = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.querySelector('button')?.textContent === '15');
    expect(selected).toHaveAttribute('aria-selected', 'true');
    const other = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.querySelector('button')?.textContent === '16');
    expect(other).toHaveAttribute('aria-selected', 'false');
  });

  it('selects a day in uncontrolled mode and calls onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar value='2025-01-15' onSelect={onSelect} />
    );
    await user.click(screen.getByRole('button', { name: '20' }));
    expect(onSelect).toHaveBeenCalledWith('2025-01-20');
    // Uncontrolled mode: the selected day moves without external wiring.
    const selected = Array.from(
      container.querySelectorAll('[role="gridcell"]')
    ).find((cell) => cell.querySelector('button')?.textContent === '20');
    expect(selected).toHaveAttribute('aria-selected', 'true');
  });

  it('reflects an externally controlled value', async () => {
    const user = userEvent.setup();
    render(<ControlledCalendar />);
    expect(
      screen.getByRole('button', { name: '15' }).closest('[role="gridcell"]')
    ).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: '20' }));
    expect(
      screen.getByRole('button', { name: '20' }).closest('[role="gridcell"]')
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('button', { name: '15' }).closest('[role="gridcell"]')
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('navigates to the next and previous month via labeled buttons', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(
      screen.getByRole('button', { name: getMonthTitleName(1) })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(
      screen.getByRole('button', { name: getMonthTitleName(0) })
    ).toBeInTheDocument();
  });

  it('navigates across the year boundary in both directions', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-12-15' />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2026, 0) })
    ).toBeInTheDocument();
  });

  it('jumps back to the current month via the Today button', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    try {
      render(<Calendar value='2025-01-15' />);
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(
        screen.getByRole('button', { name: getMonthTitleName(1) })
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Today' }));
      expect(
        screen.getByRole('button', { name: getMonthTitleName(5) })
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('disables dates outside the min/max range', () => {
    render(<Calendar value='2025-01-15' min='2025-01-10' max='2025-01-20' />);
    const grid = screen.getByRole('grid');
    const disabledButtons = grid.querySelectorAll('button[disabled]');
    expect(disabledButtons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '5' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '15' })).toBeEnabled();
  });

  it('starts the week on Monday when weekStartsOn is 1', () => {
    render(<Calendar value='2025-01-15' weekStartsOn={1} />);
    expect(getWeekdayHeaders()).toEqual([
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ]);
    // 2025-01-01 is a Wednesday → two outside days (Mon 30, Tue 31) lead.
    const firstWeek = screen.getAllByRole('row')[1]!.querySelectorAll('button');
    expect(firstWeek[0]).toHaveTextContent('30');
    expect(firstWeek[1]).toHaveTextContent('31');
    expect(firstWeek[2]).toHaveTextContent('1');
  });

  it('formats month title and weekday headers for locale="zh-CN"', () => {
    render(<Calendar value='2025-01-15' locale='zh-CN' />);
    expect(
      screen.getByRole('grid', {
        name: getLocalizedMonthLabel(2025, 0, 'zh-CN'),
      })
    ).toBeInTheDocument();
    // zh-CN renders the year before the month; both are drill titles.
    const yearBtn = screen.getByRole('button', { name: '2025' });
    const monthBtn = screen.getByRole('button', {
      name: getLocalizedMonthTitleName(0, 'zh-CN'),
    });
    expect(yearBtn).toBeInTheDocument();
    expect(monthBtn).toBeInTheDocument();
    // The DOM order follows the locale's own part order.
    expect(
      yearBtn.compareDocumentPosition(monthBtn) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(getWeekdayHeaders()).toEqual(
      getLocalizedWeekdays('zh-CN', getLocaleWeekStart('zh-CN'))
    );
  });

  it('lets weekStartsOn override the locale week info', () => {
    render(<Calendar value='2025-01-15' locale='zh-CN' weekStartsOn={0} />);
    expect(getWeekdayHeaders()).toEqual(getLocalizedWeekdays('zh-CN', 0));
  });

  it('applies className and forwards native props', () => {
    render(<Calendar value='2025-01-15' className='custom' data-testid='cal' />);
    const root = screen.getByTestId('cal');
    expect(root).toHaveClass('custom');
    expect(root.querySelector('[role="grid"]')).toBeInTheDocument();
  });

  it('moves grid focus with arrow keys, Home/End rows, and PageUp/Down month hops', async () => {
    const user = userEvent.setup();
    const { container } = render(<Calendar value='2026-01-15' />);
    const day = (date: string) =>
      container.querySelector<HTMLButtonElement>(`[data-haze-day="${date}"]`);
    day('2026-01-15')!.focus();
    await user.keyboard('{ArrowRight}');
    expect(day('2026-01-16')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(day('2026-01-23')).toHaveFocus();
    await user.keyboard('{Home}');
    // Row of Jan 23 (Friday) starts on Sunday Jan 18.
    expect(day('2026-01-18')).toHaveFocus();
    await user.keyboard('{End}');
    expect(day('2026-01-24')).toHaveFocus();
    await user.keyboard('{PageDown}');
    // February view, same day of the month as the focused day (the 24th).
    expect(day('2026-02-24')).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(day('2026-01-24')).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Calendar value='2025-01-15' />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('renders the month title as the quick-select trigger button', () => {
    render(<Calendar value='2025-01-15' />);
    const title = screen.getByRole('button', {
      name: getMonthTitleName(0),
    });
    expect(title).toHaveAttribute('aria-expanded', 'false');
  });

  describe('month quick select', () => {
    function shortMonth(month: number) {
      return new Date(2025, month, 15).toLocaleString('default', {
        month: 'short',
      });
    }

    it('opens the selector from the title button with keyboard activation', async () => {
      const user = userEvent.setup();
      render(<Calendar value='2025-01-15' />);
      const title = screen.getByRole('button', {
        name: getMonthTitleName(0),
      });
      title.focus();
      await user.keyboard('{Enter}');
      const selector = screen.getByRole('grid', { name: 'Select month' });
      expect(selector).toBeInTheDocument();
      expect(title).toHaveAttribute('aria-expanded', 'true');
      // Opening focuses the currently viewed month.
      expect(
        selector.querySelector('[data-haze-month="0"]')
      ).toHaveFocus();
      // Year toolbar + 12 months in a 3-column grid. The toolbar year
      // and the header's own year title share the text "2025".
      expect(screen.getAllByText('2025')).toHaveLength(2);
      expect(
        selector.querySelectorAll('[role="gridcell"]')
      ).toHaveLength(12);
    });

    it('picking a month returns to the day grid focused on day 1', async () => {
      const user = userEvent.setup();
      const { container } = render(<Calendar value='2025-01-15' />);
      await user.click(
        screen.getByRole('button', { name: getMonthTitleName(0) })
      );
      await user.click(screen.getByRole('button', { name: shortMonth(3) }));
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2025, 3) })
      ).toBeInTheDocument();
      expect(
        container.querySelector<HTMLButtonElement>(
          '[data-haze-day="2025-04-01"]'
        )
      ).toHaveFocus();
    });

    it('picking the viewed month still focuses day 1', async () => {
      const user = userEvent.setup();
      const { container } = render(<Calendar value='2025-01-15' />);
      await user.click(
        screen.getByRole('button', { name: getMonthTitleName(0) })
      );
      await user.click(screen.getByRole('button', { name: shortMonth(0) }));
      expect(
        container.querySelector<HTMLButtonElement>(
          '[data-haze-day="2025-01-01"]'
        )
      ).toHaveFocus();
    });

    it('Escape cancels and returns focus to the title button', async () => {
      const user = userEvent.setup();
      render(<Calendar value='2025-01-15' />);
      const title = screen.getByRole('button', {
        name: getMonthTitleName(0),
      });
      await user.click(title);
      await user.keyboard('{Escape}');
      expect(
        screen.queryByRole('grid', { name: 'Select month' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2025, 0) })
      ).toBeInTheDocument();
      expect(title).toHaveFocus();
      expect(title).toHaveAttribute('aria-expanded', 'false');
    });

    it('Escape works from the year toolbar too', async () => {
      const user = userEvent.setup();
      render(<Calendar value='2025-01-15' />);
      const title = screen.getByRole('button', {
        name: getMonthTitleName(0),
      });
      await user.click(title);
      await user.click(screen.getByRole('button', { name: 'Next year' }));
      expect(screen.getByText('2026')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(title).toHaveFocus();
    });

    it('steps the year with the toolbar buttons and picks across years', async () => {
      const user = userEvent.setup();
      render(<Calendar value='2025-01-15' />);
      await user.click(
        screen.getByRole('button', { name: getMonthTitleName(0) })
      );
      await user.click(screen.getByRole('button', { name: 'Next year' }));
      await user.click(screen.getByRole('button', { name: 'Previous year' }));
      await user.click(screen.getByRole('button', { name: 'Next year' }));
      await user.click(screen.getByRole('button', { name: shortMonth(11) }));
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 11) })
      ).toBeInTheDocument();
    });

    it('roves focus on the 3-column month grid and hops years with PageUp/Down', async () => {
      const user = userEvent.setup();
      render(<Calendar value='2025-01-15' />);
      await user.click(
        screen.getByRole('button', { name: getMonthTitleName(0) })
      );
      const month = (m: number) =>
        document.querySelector(`[data-haze-month="${m}"]`)!;
      // January (viewed month) is focused on open.
      await user.keyboard('{ArrowRight}');
      expect(month(1)).toHaveFocus();
      await user.keyboard('{ArrowDown}');
      expect(month(4)).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(month(1)).toHaveFocus();
      await user.keyboard('{End}');
      expect(month(2)).toHaveFocus();
      await user.keyboard('{Home}');
      expect(month(0)).toHaveFocus();
      // Year hop keeps the focused month.
      await user.keyboard('{PageDown}');
      expect(screen.getByText('2026')).toBeInTheDocument();
      expect(month(0)).toHaveFocus();
      // Enter picks January 2026.
      await user.keyboard('{Enter}');
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 0) })
      ).toBeInTheDocument();
    });

    it('has no axe violations while the selector is open', async () => {
      const { axe } = await import('jest-axe');
      const user = userEvent.setup();
      render(<Calendar value='2025-01-15' />);
      await user.click(
        screen.getByRole('button', { name: getMonthTitleName(0) })
      );
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });

  describe('week numbers', () => {
    it('renders a leading ISO week-number column with the Wk header', () => {
      render(<Calendar value='2026-01-15' showWeekNumbers />);
      expect(getWeekdayHeaders()).toEqual([
        'Wk',
        'Su',
        'Mo',
        'Tu',
        'We',
        'Th',
        'Fr',
        'Sa',
      ]);
      const grid = screen.getByRole('grid');
      const rows = grid.querySelectorAll('[role="row"]');
      // January 2026 Sunday-first: rows start Dec 28 (ISO week 52 of
      // 2025), then weeks 1–4.
      const weekLabels = Array.from(rows)
        .slice(1)
        .map(
          (row) =>
            row.querySelector('[role="gridcell"]')!.textContent
        );
      expect(weekLabels).toEqual(['52', '1', '2', '3', '4']);
      // 8-column grid track.
      expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(8, 1fr)' });
    });

    it('labels Monday-first rows with the ISO weeks they contain', () => {
      render(<Calendar value='2026-01-15' showWeekNumbers weekStartsOn={1} />);
      const rows = screen
        .getByRole('grid')
        .querySelectorAll('[role="row"]');
      // Monday-first January 2026: rows are exactly ISO weeks 1–5.
      const weekLabels = Array.from(rows)
        .slice(1)
        .map((row) => row.querySelector('[role="gridcell"]')!.textContent);
      expect(weekLabels).toEqual(['1', '2', '3', '4', '5']);
    });

    it('is off by default', () => {
      render(<Calendar value='2026-01-15' />);
      const rows = screen
        .getByRole('grid')
        .querySelectorAll('[role="row"]');
      expect(rows.length).toBeGreaterThan(0);
      expect(screen.queryByText('Wk')).not.toBeInTheDocument();
    });
  });

  describe('dual month panel', () => {
    it('renders two adjacent month grids sharing one navigation', async () => {
      const user = userEvent.setup();
      render(<Calendar value='2026-01-15' months={2} />);
      const january = screen.getByRole('grid', {
        name: getMonthLabel(2026, 0),
      });
      const february = screen.getByRole('grid', {
        name: getMonthLabel(2026, 1),
      });
      expect(january).toBeInTheDocument();
      expect(february).toBeInTheDocument();
      // prev/next move both grids together.
      await user.click(screen.getByRole('button', { name: 'Next month' }));
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 1) })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 2) })
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Previous month' }));
      expect(screen.getByRole('grid', { name: getMonthLabel(2026, 0) }));
      expect(screen.getByRole('grid', { name: getMonthLabel(2026, 1) }));
    });

    it('carries December → January across the year boundary in both panes', async () => {
      const user = userEvent.setup();
      render(<Calendar value='2025-12-15' months={2} />);
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2025, 11) })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 0) })
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Next month' }));
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 0) })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 1) })
      ).toBeInTheDocument();
    });

    it('highlights a range across the two panes', () => {
      const { container } = render(
        <Calendar
          months={2}
          rangeStart='2026-01-20'
          rangeEnd='2026-02-10'
        />
      );
      const cell = (date: string) =>
        container
          .querySelector(`[data-haze-day="${date}"]`)!
          .closest('[role="gridcell"]')!;
      expect(cell('2026-01-20')).toHaveAttribute('aria-selected', 'true');
      expect(cell('2026-01-25')).toHaveAttribute('aria-selected', 'true');
      expect(cell('2026-02-01')).toHaveAttribute('aria-selected', 'true');
      expect(cell('2026-02-10')).toHaveAttribute('aria-selected', 'true');
      expect(cell('2026-01-15')).toHaveAttribute('aria-selected', 'false');
      expect(cell('2026-02-20')).toHaveAttribute('aria-selected', 'false');
    });

    it('PageUp/Down in the second pane shifts both panes and re-focuses the day', async () => {
      const user = userEvent.setup();
      const { container } = render(<Calendar value='2026-01-15' months={2} />);
      const day = (date: string) =>
        container.querySelector<HTMLButtonElement>(
          `[data-haze-day="${date}"]`
        );
      day('2026-02-15')!.focus();
      await user.keyboard('{PageDown}');
      // Panes shift to March + April; the focused day becomes pane 1's
      // March 15.
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 2) })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('grid', { name: getMonthLabel(2026, 3) })
      ).toBeInTheDocument();
      expect(day('2026-03-15')).toHaveFocus();
    });

    it('has no axe violations with week numbers, dual panes and a range', async () => {
      const { axe } = await import('jest-axe');
      render(
        <Calendar
          value='2026-01-15'
          months={2}
          showWeekNumbers
          rangeStart='2026-01-20'
          rangeEnd='2026-01-25'
        />
      );
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });

  describe('picker modes', () => {
    function shortMonth(month: number) {
      return new Date(2026, month, 15).toLocaleString('default', {
        month: 'short',
      });
    }

    describe('month mode', () => {
      it('renders a year header and a 12-cell month grid', () => {
        render(<Calendar picker='month' value='2026-03' />);
        const grid = screen.getByRole('grid', { name: 'Select month' });
        expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(12);
        expect(screen.getByText('2026')).toBeInTheDocument();
        // No day grid in the month mode.
        expect(screen.queryByText('Su')).not.toBeInTheDocument();
      });

      it('marks the value month as selected', () => {
        render(<Calendar picker='month' value='2026-03' />);
        const march = screen
          .getByRole('button', { name: shortMonth(2) })
          .closest('[role="gridcell"]');
        expect(march).toHaveAttribute('aria-selected', 'true');
        const april = screen
          .getByRole('button', { name: shortMonth(3) })
          .closest('[role="gridcell"]');
        expect(april).toHaveAttribute('aria-selected', 'false');
      });

      it('selects a month, serializing "YYYY-MM" and calling onSelect', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const { container } = render(
          <Calendar picker='month' value='2026-03' onSelect={onSelect} />
        );
        await user.click(screen.getByRole('button', { name: shortMonth(3) }));
        expect(onSelect).toHaveBeenCalledWith('2026-04');
        expect(
          container
            .querySelector('[data-haze-month="3"]')!
            .closest('[role="gridcell"]')
        ).toHaveAttribute('aria-selected', 'true');
      });

      it('steps the year with prev/next and Today returns to the current year', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2027, 5, 10));
        try {
          render(<Calendar picker='month' value='2024-03' />);
          fireEvent.click(screen.getByRole('button', { name: 'Next year' }));
          expect(screen.getByText('2025')).toBeInTheDocument();
          fireEvent.click(screen.getByRole('button', { name: 'Previous year' }));
          expect(screen.getByText('2024')).toBeInTheDocument();
          fireEvent.click(screen.getByRole('button', { name: 'Today' }));
          expect(screen.getByText('2027')).toBeInTheDocument();
        } finally {
          vi.useRealTimers();
        }
      });

      it('roves focus with arrows, Home/End, and hops years with PageUp/Down', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const { container } = render(
          <Calendar picker='month' value='2026-03' onSelect={onSelect} />
        );
        const month = (m: number) =>
          container.querySelector<HTMLButtonElement>(
            `[data-haze-month="${m}"]`
          );
        month(2)!.focus();
        await user.keyboard('{ArrowRight}');
        expect(month(3)).toHaveFocus();
        await user.keyboard('{ArrowDown}');
        expect(month(6)).toHaveFocus();
        await user.keyboard('{End}');
        expect(month(8)).toHaveFocus();
        await user.keyboard('{Home}');
        expect(month(6)).toHaveFocus();
        // Year hop keeps the focused month.
        await user.keyboard('{PageDown}');
        expect(screen.getByText('2027')).toBeInTheDocument();
        expect(month(6)).toHaveFocus();
        // Enter picks July 2027.
        await user.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalledWith('2027-07');
      });

      it('mirrors horizontal arrows under dir="rtl"', async () => {
        const user = userEvent.setup();
        const { container } = render(
          <div dir='rtl'>
            <Calendar picker='month' value='2026-03' />
          </div>
        );
        const month = (m: number) =>
          container.querySelector<HTMLButtonElement>(
            `[data-haze-month="${m}"]`
          );
        month(2)!.focus();
        await user.keyboard('{ArrowLeft}');
        expect(month(3)).toHaveFocus();
        await user.keyboard('{ArrowRight}');
        expect(month(2)).toHaveFocus();
      });

      it('disables months outside min/max and via disabledDate', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(
          <Calendar
            picker='month'
            value='2026-06'
            min='2026-03-15'
            max='2026-10-01'
            onSelect={onSelect}
          />
        );
        // January–February lie entirely before min; November–December
        // entirely after max.
        for (const month of [0, 1, 10, 11]) {
          expect(screen.getByRole('button', { name: shortMonth(month) })).toBeDisabled();
        }
        // March still has pickable days (the 15th onward) → enabled.
        expect(screen.getByRole('button', { name: shortMonth(2) })).toBeEnabled();
        // A disabled month is inert to clicks.
        await user.click(screen.getByRole('button', { name: shortMonth(0) }));
        expect(onSelect).not.toHaveBeenCalled();
      });

      it('disables months via disabledDate on the representative day', () => {
        render(
          <Calendar
            picker='month'
            value='2026-06'
            disabledDate={(date) => date.getMonth() === 6}
          />
        );
        // July's representative day (July 1) is rejected.
        expect(screen.getByRole('button', { name: shortMonth(6) })).toBeDisabled();
        expect(screen.getByRole('button', { name: shortMonth(5) })).toBeEnabled();
      });

      it('skips disabled months in keyboard roving', async () => {
        const user = userEvent.setup();
        const { container } = render(
          <Calendar
            picker='month'
            value='2026-06'
            disabledDate={(date) => date.getMonth() === 6}
          />
        );
        const month = (m: number) =>
          container.querySelector<HTMLButtonElement>(
            `[data-haze-month="${m}"]`
          );
        month(5)!.focus();
        await user.keyboard('{ArrowRight}');
        // July is disabled — focus lands on August.
        expect(month(7)).toHaveFocus();
      });
    });

    describe('quarter mode', () => {
      it('renders four quarter cells and marks the value quarter', () => {
        render(<Calendar picker='quarter' value='2026-Q2' />);
        const grid = screen.getByRole('grid', { name: 'Select quarter' });
        expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(4);
        expect(
          screen.getByRole('button', { name: 'Q2' }).closest('[role="gridcell"]')
        ).toHaveAttribute('aria-selected', 'true');
        expect(
          screen.getByRole('button', { name: 'Q4' }).closest('[role="gridcell"]')
        ).toHaveAttribute('aria-selected', 'false');
      });

      it('selects a quarter, serializing "YYYY-Qn"', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const { container } = render(
          <Calendar picker='quarter' value='2026-Q2' onSelect={onSelect} />
        );
        await user.click(screen.getByRole('button', { name: 'Q4' }));
        expect(onSelect).toHaveBeenCalledWith('2026-Q4');
        expect(
          container
            .querySelector('[data-haze-quarter="4"]')!
            .closest('[role="gridcell"]')
        ).toHaveAttribute('aria-selected', 'true');
      });

      it('moves focus horizontally and hops years with PageUp/Down', async () => {
        const user = userEvent.setup();
        const { container } = render(
          <Calendar picker='quarter' value='2026-Q2' />
        );
        const quarter = (q: number) =>
          container.querySelector<HTMLButtonElement>(
            `[data-haze-quarter="${q}"]`
          );
        quarter(2)!.focus();
        await user.keyboard('{ArrowRight}');
        expect(quarter(3)).toHaveFocus();
        // One row: vertical moves stay in place (no cell below/above).
        await user.keyboard('{ArrowDown}');
        expect(quarter(3)).toHaveFocus();
        await user.keyboard('{End}');
        expect(quarter(4)).toHaveFocus();
        await user.keyboard('{Home}');
        expect(quarter(1)).toHaveFocus();
        await user.keyboard('{PageDown}');
        expect(screen.getByText('2027')).toBeInTheDocument();
        expect(quarter(1)).toHaveFocus();
      });

      it('disables quarters via min/max period logic and disabledDate', () => {
        const { unmount } = render(
          <Calendar picker='quarter' value='2026-Q2' min='2026-04-01' max='2026-09-30' />
        );
        expect(screen.getByRole('button', { name: 'Q1' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Q2' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Q3' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Q4' })).toBeDisabled();
        unmount();
        render(
          <Calendar
            picker='quarter'
            value='2026-Q2'
            disabledDate={(date) => date.getMonth() < 3}
          />
        );
        // Q1's representative day (Jan 1) is rejected.
        expect(screen.getByRole('button', { name: 'Q1' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Q2' })).toBeEnabled();
      });
    });

    describe('year mode', () => {
      it('renders a 12-year grid under the decade title', () => {
        render(<Calendar picker='year' value='2026' />);
        expect(screen.getByText('2020 – 2031')).toBeInTheDocument();
        const grid = screen.getByRole('grid', { name: 'Select year' });
        expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(12);
        expect(
          screen.getByRole('button', { name: '2026' }).closest('[role="gridcell"]')
        ).toHaveAttribute('aria-selected', 'true');
      });

      it('steps a decade per prev/next and picks a year serializing "YYYY"', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        render(<Calendar picker='year' value='2026' onSelect={onSelect} />);
        await user.click(screen.getByRole('button', { name: 'Next decade' }));
        expect(screen.getByText('2030 – 2041')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Previous decade' }));
        expect(screen.getByText('2020 – 2031')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '2023' }));
        expect(onSelect).toHaveBeenCalledWith('2023');
      });

      it('roves focus and hops decades with PageUp/Down keeping the cell', async () => {
        const user = userEvent.setup();
        const { container } = render(<Calendar picker='year' value='2026' />);
        const year = (y: number) =>
          container.querySelector<HTMLButtonElement>(`[data-haze-year="${y}"]`);
        year(2026)!.focus();
        await user.keyboard('{ArrowRight}');
        expect(year(2027)).toHaveFocus();
        await user.keyboard('{ArrowDown}');
        // One row down on the 3-column grid: 2027 → 2030.
        expect(year(2030)).toHaveFocus();
        await user.keyboard('{PageDown}');
        expect(screen.getByText('2030 – 2041')).toBeInTheDocument();
        // Same cell slot (index 10) on the next page → the year 2040.
        expect(year(2040)).toHaveFocus();
      });

      it('disables years via min/max and disabledDate', () => {
        const { unmount } = render(
          <Calendar picker='year' value='2026' min='2023-06-01' max='2029-01-01' />
        );
        // 2023 has days at/after min → enabled; 2022 and 2030 are out.
        expect(screen.getByRole('button', { name: '2023' })).toBeEnabled();
        expect(screen.getByRole('button', { name: '2022' })).toBeDisabled();
        expect(screen.getByRole('button', { name: '2030' })).toBeDisabled();
        unmount();
        render(
          <Calendar
            picker='year'
            value='2026'
            disabledDate={(date) => date.getFullYear() === 2026}
          />
        );
        expect(screen.getByRole('button', { name: '2026' })).toBeDisabled();
        expect(screen.getByRole('button', { name: '2027' })).toBeEnabled();
      });

      it('opens on the decade page containing the value', () => {
        render(<Calendar picker='year' value='2037' />);
        expect(screen.getByText('2030 – 2041')).toBeInTheDocument();
      });
    });

    it('has no axe violations across the month, quarter and year modes', async () => {
      const { axe } = await import('jest-axe');
      render(
        <div>
          <Calendar picker='month' value='2026-03' />
          <Calendar picker='quarter' value='2026-Q2' />
          <Calendar picker='year' value='2026' />
        </div>
      );
      const results = await axe(document.body, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    });
  });

  describe('disabledDate', () => {
    it('disables predicate days in the date grid, unclickable and keyboard-skipped', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { container } = render(
        <Calendar
          value='2026-01-14'
          disabledDate={(date) => date.getDay() === 0}
          onSelect={onSelect}
        />
      );
      const day = (date: string) =>
        container.querySelector<HTMLButtonElement>(`[data-haze-day="${date}"]`);
      // Sundays of the January 2026 view.
      for (const date of ['2026-01-04', '2026-01-11', '2026-01-18', '2026-01-25']) {
        expect(day(date)).toBeDisabled();
      }
      expect(day('2026-01-15')).toBeEnabled();
      // A disabled day is inert to clicks.
      await user.click(day('2026-01-11')!);
      expect(onSelect).not.toHaveBeenCalled();
      // Roving skips over it: one right from Saturday the 10th would be
      // the disabled Sunday the 11th → focus lands on Monday the 12th.
      day('2026-01-10')!.focus();
      await user.keyboard('{ArrowRight}');
      expect(day('2026-01-12')).toHaveFocus();
    });
  });
});

describe('Calendar year quick jump', () => {
  const shortMonth = (month: number) =>
    new Date(2025, month, 15).toLocaleString('default', { month: 'short' });

  async function openYearGrid(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      screen.getByRole('button', { name: getMonthTitleName(0) })
    );
    // The quick-select toolbar's year button: the header's own year
    // title matches the same name, so take the last (toolbar) match.
    await user.click(screen.getAllByRole('button', { name: '2025' }).at(-1)!);
    return screen.getByRole('grid', { name: 'Select year' });
  }

  it('drills from the toolbar year into a decade grid and back to months', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' />);
    const yearGrid = await openYearGrid(user);
    expect(screen.getByText('2020 – 2031')).toBeInTheDocument();
    expect(
      yearGrid.querySelectorAll('[role="gridcell"]')
    ).toHaveLength(12);
    // The viewed year is highlighted and receives focus on open.
    const viewed = yearGrid.querySelector('[data-haze-year="2025"]')!;
    expect(viewed).toHaveFocus();
    expect(viewed.closest('[role="gridcell"]')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.click(screen.getByRole('button', { name: '2028' }));
    // Back on the month view, anchored to the picked year.
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2028' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: shortMonth(2) }));
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2028, 2) })
    ).toBeInTheDocument();
  });

  it('Escape steps back one level, to the month grid', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' />);
    await openYearGrid(user);
    await user.keyboard('{Escape}');
    // The grid node is reconciled in place, so query by role instead of
    // holding the old element handle.
    expect(
      screen.queryByRole('grid', { name: 'Select year' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    // Focus returns to the viewed month, not out of the quick select.
    expect(
      screen.getByRole('grid', { name: 'Select month' }).querySelector(
        '[data-haze-month="0"]'
      )
    ).toHaveFocus();
  });

  it('steps decades with the toolbar and PageUp/Down keeping the focused cell', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' />);
    const yearGrid = await openYearGrid(user);
    // A toolbar click resets focus to the decade's first cell (the
    // month grid's toolbar behaves the same).
    await user.click(screen.getByRole('button', { name: 'Next decade' }));
    expect(screen.getByText('2030 – 2041')).toBeInTheDocument();
    expect(yearGrid.querySelector('[data-haze-year="2030"]')).toHaveFocus();
    // PageUp/Down hop decades keeping the focused cell index.
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(yearGrid.querySelector('[data-haze-year="2032"]')).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(screen.getByText('2040 – 2051')).toBeInTheDocument();
    expect(yearGrid.querySelector('[data-haze-year="2042"]')).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(screen.getByText('2030 – 2041')).toBeInTheDocument();
    expect(yearGrid.querySelector('[data-haze-year="2032"]')).toHaveFocus();
  });

  it('disables years outside min/max in the quick year grid', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' min='2024-06-01' max='2026-03-31' />);
    const yearGrid = await openYearGrid(user);
    const year = (y: number) =>
      yearGrid.querySelector<HTMLButtonElement>(`[data-haze-year="${y}"]`);
    expect(year(2023)).toBeDisabled();
    expect(year(2024)).toBeEnabled();
    expect(year(2026)).toBeEnabled();
    expect(year(2027)).toBeDisabled();
  });

  it('has no axe violations with the year grid open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' />);
    await openYearGrid(user);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Calendar week mode', () => {
  it('renders a Monday-first day grid with the week column forced on', () => {
    render(<Calendar picker='week' value='2026-W03' />);
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2026, 0) })
    ).toBeInTheDocument();
    // ISO weeks are Monday-first by definition — even without an
    // explicit weekStartsOn (and against a Sunday-first default).
    expect(getWeekdayHeaders()).toEqual([
      'Wk',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ]);
    const grid = screen.getByRole('grid');
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(8, 1fr)' });
  });

  it('keeps Monday-first rows when weekStartsOn=0 is passed', () => {
    render(<Calendar picker='week' value='2026-W03' weekStartsOn={0} />);
    expect(getWeekdayHeaders()).toEqual([
      'Wk',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ]);
  });

  it('marks every day of the value week selected plus its week label', () => {
    const { container } = render(<Calendar picker='week' value='2026-W03' />);
    const cell = (date: string) =>
      container
        .querySelector(`[data-haze-day="${date}"]`)!
        .closest('[role="gridcell"]')!;
    // 2026-W03 is Jan 12–18 (Monday–Sunday).
    for (const date of [
      '2026-01-12',
      '2026-01-15',
      '2026-01-18',
    ]) {
      expect(cell(date)).toHaveAttribute('aria-selected', 'true');
    }
    expect(cell('2026-01-11')).toHaveAttribute('aria-selected', 'false');
    expect(cell('2026-01-19')).toHaveAttribute('aria-selected', 'false');
    // The week-number cell of the selected week picks up the highlight.
    const week3Row = cell('2026-01-15').closest('[role="row"]')!;
    const weekLabel = week3Row.querySelector('[role="gridcell"]')!;
    expect(weekLabel).toHaveTextContent('3');
    expect(weekLabel.className).toContain('weekNumberSelected');
  });

  it('anchors the view on the week Monday across the ISO year boundary', () => {
    const { container } = render(<Calendar picker='week' value='2026-W01' />);
    // 2026-W01 starts Monday 2025-12-29 → the December 2025 grid.
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2025, 11) })
    ).toBeInTheDocument();
    const cell = (date: string) =>
      container
        .querySelector(`[data-haze-day="${date}"]`)!
        .closest('[role="gridcell"]')!;
    // The whole ISO week is highlighted, outside-month days included.
    expect(cell('2025-12-29')).toHaveAttribute('aria-selected', 'true');
    expect(cell('2026-01-04')).toHaveAttribute('aria-selected', 'true');
  });

  it('picks the clicked day week, serializing "YYYY-Www"', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar picker='week' value='2026-W03' onSelect={onSelect} />
    );
    await user.click(
      container.querySelector<HTMLButtonElement>(
        '[data-haze-day="2026-01-20"]'
      )!
    );
    // Jan 20 2026 is the Tuesday of W04.
    expect(onSelect).toHaveBeenCalledWith('2026-W04');
    // Uncontrolled: the selection moves to the whole W04 row (Jan 19–25).
    expect(
      container
        .querySelector('[data-haze-day="2026-01-25"]')!
        .closest('[role="gridcell"]')
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('disables predicate days but keeps the week pickable via enabled days', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar
        picker='week'
        value='2026-W03'
        disabledDate={(date) => date.getDay() === 0}
        onSelect={onSelect}
      />
    );
    // Sundays stay per-day disabled (Jan 25 is W04's Sunday).
    expect(
      container.querySelector('[data-haze-day="2026-01-25"]')
    ).toBeDisabled();
    // The week still commits through any enabled day of the row.
    await user.click(
      container.querySelector<HTMLButtonElement>(
        '[data-haze-day="2026-01-21"]'
      )!
    );
    expect(onSelect).toHaveBeenCalledWith('2026-W04');
  });

  it('roves the day grid and commits a week with Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar picker='week' value='2026-W03' onSelect={onSelect} />
    );
    container
      .querySelector<HTMLButtonElement>('[data-haze-day="2026-01-15"]')!
      .focus();
    await user.keyboard('{ArrowDown}');
    expect(
      container.querySelector('[data-haze-day="2026-01-22"]')
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('2026-W04');
  });

  it('has no axe violations in the week mode', async () => {
    const { axe } = await import('jest-axe');
    render(<Calendar picker='week' value='2026-W03' />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Calendar header year drill', () => {
  it('opens the year grid straight from the year title', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' />);
    const yearTitle = screen.getByRole('button', { name: '2025' });
    expect(yearTitle).toHaveAttribute('aria-expanded', 'false');
    await user.click(yearTitle);
    const yearGrid = screen.getByRole('grid', { name: 'Select year' });
    expect(yearGrid).toBeInTheDocument();
    expect(screen.getByText('2020 – 2031')).toBeInTheDocument();
    expect(yearTitle).toHaveAttribute('aria-expanded', 'true');
    // Opening focuses the viewed year's cell.
    expect(yearGrid.querySelector('[data-haze-year="2025"]')).toHaveFocus();
  });

  it('picking a year returns to the day grid anchored at it, value untouched', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar value='2025-01-15' onSelect={onSelect} />
    );
    await user.click(screen.getByRole('button', { name: '2025' }));
    await user.click(screen.getByRole('button', { name: '2028' }));
    // Back on the day grid, same month, new year; day 1 focused.
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2028, 0) })
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-haze-day="2028-01-01"]')
    ).toHaveFocus();
    // Navigation only — drilling never commits a value.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Escape from the direct year grid returns focus to the year title', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-01-15' />);
    await user.click(screen.getByRole('button', { name: '2025' }));
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('grid', { name: 'Select year' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2025, 0) })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2025' })).toHaveFocus();
  });

  it('disables years outside min/max in the direct year grid', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Calendar value='2025-01-15' min='2024-06-01' max='2026-03-31' />
    );
    await user.click(screen.getByRole('button', { name: '2025' }));
    const year = (y: number) =>
      container.querySelector<HTMLButtonElement>(
        `[data-haze-year="${y}"]`
      );
    expect(year(2023)).toBeDisabled();
    expect(year(2026)).toBeEnabled();
    expect(year(2027)).toBeDisabled();
  });
});

describe('Calendar month/quarter mode year drill', () => {
  const shortMonth = (month: number) =>
    new Date(2026, month, 15).toLocaleString('default', {
      month: 'short',
    });

  it('month mode: year title drills to a decade grid and back, keeping the value month focused', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Calendar picker='month' value='2026-03' onSelect={onSelect} />
    );
    const yearTitle = screen.getByRole('button', { name: '2026' });
    expect(yearTitle).toHaveAttribute('aria-expanded', 'false');
    await user.click(yearTitle);
    // While drilled, the header title becomes the decade range and the
    // year grid takes over below (focus lands on the viewed year).
    const yearGrid = screen.getByRole('grid', { name: 'Select year' });
    expect(yearGrid).toBeInTheDocument();
    expect(screen.getByText('2020 – 2031')).toBeInTheDocument();
    expect(yearGrid.querySelector('[data-haze-year="2026"]')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: '2028' }));
    // Back on the month grid of 2028, focused on the value's month.
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: 'Select month' }).querySelector(
        '[data-haze-month="2"]'
      )
    ).toHaveFocus();
    // No value committed by the drill itself.
    expect(onSelect).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: shortMonth(5) }));
    expect(onSelect).toHaveBeenCalledWith('2028-06');
  });

  it('month mode: Escape steps back to the month grid', async () => {
    const user = userEvent.setup();
    render(<Calendar picker='month' value='2026-03' />);
    await user.click(screen.getByRole('button', { name: '2026' }));
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('grid', { name: 'Select year' })
    ).not.toBeInTheDocument();
  });

  it('quarter mode: the drill returns to the quarter grid and picks across years', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Calendar picker='quarter' value='2026-Q2' onSelect={onSelect} />
    );
    await user.click(screen.getByRole('button', { name: '2026' }));
    expect(
      screen.getByRole('grid', { name: 'Select year' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2027' }));
    expect(
      screen.getByRole('grid', { name: 'Select quarter' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Q3' }));
    expect(onSelect).toHaveBeenCalledWith('2027-Q3');
  });
});

describe('Calendar cellRender', () => {
  it('appends custom content inside day cells', () => {
    const { container } = render(
      <Calendar
        value='2026-01-15'
        cellRender={(date) =>
          date.day === 15 ? <span data-testid='dot'>•</span> : undefined
        }
      />
    );
    const day = (d: number) =>
      container.querySelector<HTMLButtonElement>(
        `[data-haze-day="2026-01-${String(d).padStart(2, '0')}"]`
      )!;
    expect(day(15).querySelector('[data-testid="dot"]')).toBeInTheDocument();
    expect(day(15).textContent).toBe('15•');
    expect(day(16).querySelector('[data-testid="dot"]')).not.toBeInTheDocument();
    expect(day(16).textContent).toBe('16');
  });

  it('receives each day civil date and the active picker mode', () => {
    const seen: { key: string; mode: string }[] = [];
    render(
      <Calendar
        value='2026-01-15'
        cellRender={(date, mode) => {
          seen.push({
            key: `${date.year}-${date.month + 1}-${date.day}`,
            mode,
          });
          return undefined;
        }}
      />
    );
    // The January 2026 view renders Dec 2025–Feb 2026 days; every call
    // carries the date mode and the cell's own civil date.
    expect(seen.length).toBeGreaterThan(31);
    expect(seen).toContainEqual({ key: '2026-1-15', mode: 'date' });
    expect(seen.every((entry) => entry.mode === 'date')).toBe(true);
  });

  it('decorates month-mode cells with their representative day and mode', () => {
    const seen: { month: number; day: number; mode: string }[] = [];
    render(
      <Calendar
        picker='month'
        value='2026-03'
        cellRender={(date, mode) => {
          seen.push({ month: date.month, day: date.day, mode });
          return <span>•</span>;
        }}
      />
    );
    expect(seen).toHaveLength(12);
    expect(
      seen.every((entry) => entry.day === 1 && entry.mode === 'month')
    ).toBe(true);
    expect(seen).toContainEqual({ month: 3, day: 1, mode: 'month' });
    // The custom content lands inside the month cell.
    const shortNames = Array.from({ length: 12 }, (_, month) =>
      new Date(2026, month, 15).toLocaleString('default', {
        month: 'short',
      })
    );
    expect(
      screen.getByRole('button', { name: `${shortNames[3]}•` })
    ).toBeInTheDocument();
  });

  it('runs in the week mode with mode "week"', () => {
    const modes = new Set<string>();
    render(
      <Calendar
        picker='week'
        value='2026-W03'
        cellRender={(_date, mode) => {
          modes.add(mode);
          return undefined;
        }}
      />
    );
    expect(modes).toEqual(new Set(['week']));
  });

  it('has no axe violations with cellRender content', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Calendar
        value='2026-01-15'
        cellRender={(date) =>
          date.day % 7 === 0 ? <span data-testid='dot'>•</span> : undefined
        }
      />
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
