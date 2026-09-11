import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import Datepicker from './Datepicker';
import DatepickerCore from './DatepickerCore';

function getMonthLabel(year: number, month: number) {
  return new Date(year, month).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
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

describe('Datepicker', () => {
  it('renders an input with placeholder', () => {
    render(<Datepicker />);
    expect(screen.getByPlaceholderText('Select date')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<Datepicker placeholder="Pick a date" />);
    expect(screen.getByPlaceholderText('Pick a date')).toBeInTheDocument();
  });

  it('opens calendar on input click', async () => {
    const user = userEvent.setup();
    render(<Datepicker />);
    await user.click(screen.getByPlaceholderText('Select date'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('selects a date from calendar', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    const day20Buttons = screen.getAllByText('20');
    await user.click(day20Buttons[0]!);
    expect(screen.getByPlaceholderText('Select date')).toHaveValue('2025-01-20');
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    const label = getMonthLabel(2025, 0);
    expect(screen.getByText(label)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    const nextLabel = getMonthLabel(2025, 1);
    expect(screen.getByText(nextLabel)).toBeInTheDocument();
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-02-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    const prevLabel = getMonthLabel(2025, 0);
    expect(screen.getByText(prevLabel)).toBeInTheDocument();
  });

  it('disables dates outside min/max range', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" min="2025-01-10" max="2025-01-20" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    const grid = screen.getByRole('grid');
    const disabledButtons = grid.querySelectorAll('button[disabled]');
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Datepicker />
        <button>outside</button>
      </div>
    );
    await user.click(screen.getByPlaceholderText('Select date'));
    await user.click(screen.getByText('outside'));
  });

  it('applies className', () => {
    const { container } = render(<Datepicker className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('navigates Dec -> Jan across year boundary', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-12-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    const janLabel = getMonthLabel(2026, 0);
    expect(screen.getByText(janLabel)).toBeInTheDocument();
  });

  it('navigates Jan -> Dec across year boundary', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    const decLabel = getMonthLabel(2024, 11);
    expect(screen.getByText(decLabel)).toBeInTheDocument();
  });

  it('renders legacy weekday headers in Sunday-first order by default', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
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

  it('starts the week on Monday when weekStartsOn is 1', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" weekStartsOn={1} />);
    await user.click(screen.getByPlaceholderText('Select date'));
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

  it('formats month label and weekday headers for locale="zh-CN"', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" locale="zh-CN" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    expect(
      screen.getByText(getLocalizedMonthLabel(2025, 0, 'zh-CN'))
    ).toBeInTheDocument();
    expect(getWeekdayHeaders()).toEqual(
      getLocalizedWeekdays('zh-CN', getLocaleWeekStart('zh-CN'))
    );
  });

  it('lets weekStartsOn override the locale week info', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" locale="zh-CN" weekStartsOn={0} />);
    await user.click(screen.getByPlaceholderText('Select date'));
    expect(getWeekdayHeaders()).toEqual(getLocalizedWeekdays('zh-CN', 0));
  });
});

describe('DatepickerCore', () => {
  it('renders the given value and controlled open state', () => {
    render(
      <DatepickerCore value="2025-01-15" onChange={() => undefined} open onOpenChange={() => undefined} />
    );
    expect(screen.getByPlaceholderText('Select date')).toHaveValue('2025-01-15');
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders no calendar while open=false', () => {
    const { container } = render(
      <DatepickerCore value="" onChange={() => undefined} open={false} onOpenChange={() => undefined} />
    );
    // jsdom applies no CSS, so the closed dropdown stays in the DOM with
    // the hidden-style class attached; assert that instead of visibility.
    // Calendar root (calendarWrapper) sits inside the FloatingPanel div,
    // which carries visual skin + fallback-placement + hidden + animated
    // (fade, opacity-only) classes. The panel was never opened, so the
    // animated exit already counts as settled and the hidden class is
    // applied synchronously.
    const grid = container.querySelector('[role="grid"]')!;
    const panel = grid.parentElement!.parentElement!;
    expect(panel.className.split(' ').length).toBe(4);
    expect(panel).toHaveAttribute('data-state', 'closed');
  });

  it('mirrors the animated lifecycle as data-state on the panel', async () => {
    const user = userEvent.setup();
    render(<Datepicker />);
    const input = screen.getByPlaceholderText('Select date');
    const panel = document.getElementById(input.getAttribute('aria-controls')!)!;
    expect(panel).toHaveAttribute('data-state', 'closed');
    await user.click(input);
    expect(panel).toHaveAttribute('data-state', 'open');
    fireEvent.pointerDown(document.body);
    expect(panel).toHaveAttribute('data-state', 'closed');
  });

  it('calls onChange with the selected date and onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DatepickerCore
        value="2025-01-15"
        onChange={onChange}
        open
        onOpenChange={onOpenChange}
      />
    );
    const day20Buttons = screen.getAllByText('20');
    await user.click(day20Buttons[0]!);
    expect(onChange).toHaveBeenCalledWith('2025-01-20');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(true) when the input is clicked while closed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <DatepickerCore
        value=""
        onChange={() => undefined}
        open={false}
        onOpenChange={onOpenChange}
      />
    );
    await user.click(screen.getByPlaceholderText('Select date'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange(false) on Escape while open', () => {
    const onOpenChange = vi.fn();
    render(
      <DatepickerCore
        value=""
        onChange={() => undefined}
        open
        onOpenChange={onOpenChange}
      />
    );
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('forwards locale and weekStartsOn to the calendar', () => {
    render(
      <DatepickerCore
        value="2025-01-15"
        onChange={() => undefined}
        open
        onOpenChange={() => undefined}
        locale="zh-CN"
        weekStartsOn={0}
      />
    );
    expect(
      screen.getByText(getLocalizedMonthLabel(2025, 0, 'zh-CN'))
    ).toBeInTheDocument();
    expect(getWeekdayHeaders()).toEqual(getLocalizedWeekdays('zh-CN', 0));
  });

  it('has no axe violations when the calendar is open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Datepicker ref forwarding', () => {
  it('forwards ref to the trigger input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Datepicker ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});

describe('Datepicker picker modes', () => {
  const shortMonth = (month: number) =>
    new Date(2026, month, 15).toLocaleString('default', { month: 'short' });

  it('opens a month grid and serializes the pick as "YYYY-MM"', async () => {
    const user = userEvent.setup();
    render(<Datepicker picker='month' value='2026-03' />);
    await user.click(screen.getByPlaceholderText('Select date'));
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: shortMonth(5) }));
    expect(screen.getByPlaceholderText('Select date')).toHaveValue('2026-06');
  });

  it('opens a quarter grid and serializes the pick as "YYYY-Qn"', async () => {
    const user = userEvent.setup();
    render(<Datepicker picker='quarter' value='2026-Q2' />);
    await user.click(screen.getByPlaceholderText('Select date'));
    await user.click(screen.getByRole('button', { name: 'Q3' }));
    expect(screen.getByPlaceholderText('Select date')).toHaveValue('2026-Q3');
  });

  it('opens a year grid and serializes the pick as "YYYY"', async () => {
    const user = userEvent.setup();
    render(<Datepicker picker='year' value='2026' />);
    await user.click(screen.getByPlaceholderText('Select date'));
    expect(screen.getByText('2020 – 2031')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2028' }));
    expect(screen.getByPlaceholderText('Select date')).toHaveValue('2028');
  });

  it('renders the day grid by default (picker stays "date")', async () => {
    const user = userEvent.setup();
    render(<Datepicker value='2026-01-15' />);
    await user.click(screen.getByPlaceholderText('Select date'));
    expect(
      screen.queryByRole('grid', { name: 'Select month' })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
  });
});

describe('Datepicker disabledDate', () => {
  it('disables predicate days on the panel calendar', () => {
    render(
      <DatepickerCore
        value="2026-01-15"
        onChange={() => undefined}
        open
        onOpenChange={() => undefined}
        disabledDate={(date) => date.getDay() === 0}
      />
    );
    const day = (date: string) =>
      document.querySelector<HTMLButtonElement>(`[data-haze-day="${date}"]`);
    expect(day('2026-01-11')).toBeDisabled();
    expect(day('2026-01-15')).toBeEnabled();
  });
});

describe('Datepicker presets', () => {
  const presets = [
    { label: 'Start of May', value: '2026-05-01' },
    { label: 'Mid May', value: '2026-05-15' },
  ];

  it('renders shortcut rows above the calendar and applies one on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <DatepickerCore
        value=""
        onChange={onChange}
        open
        onOpenChange={onOpenChange}
        presets={presets}
      />
    );
    // Presets sit in the same panel as the calendar grid.
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mid May' }));
    expect(onChange).toHaveBeenCalledWith('2026-05-15');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('sets the value and closes the panel in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<Datepicker presets={presets} />);
    const input = screen.getByPlaceholderText('Select date');
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Start of May' }));
    expect(input).toHaveValue('2026-05-01');
    // Panel closed: the panel's data-state flips back to closed.
    const panel = document.getElementById(input.getAttribute('aria-controls')!)!;
    expect(panel).toHaveAttribute('data-state', 'closed');
  });

  it('renders no preset block when presets is empty', () => {
    render(
      <DatepickerCore
        value=""
        onChange={() => undefined}
        open
        onOpenChange={() => undefined}
        presets={[]}
      />
    );
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start of May' })).not.toBeInTheDocument();
  });
});

describe('Datepicker showTime', () => {
  it('serializes a pick as "YYYY-MM-DD HH:mm" and keeps the panel open', async () => {
    const user = userEvent.setup();
    render(<Datepicker showTime value="2025-01-15" />);
    const input = screen.getByPlaceholderText('Select date');
    await user.click(input);
    const panel = document.getElementById(input.getAttribute('aria-controls')!)!;
    expect(panel).toHaveAttribute('data-state', 'open');
    // Editing the time with a date already chosen re-serializes live.
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '09:30' },
    });
    expect(input).toHaveValue('2025-01-15 09:30');
    // A day pick swaps the date part, keeping the time.
    await user.click(screen.getAllByText('20')[0]!);
    expect(input).toHaveValue('2025-01-20 09:30');
    // The panel stays open so the time can still be adjusted.
    expect(panel).toHaveAttribute('data-state', 'open');
  });

  it('round-trips: reopening parses the time and highlights the day', async () => {
    const user = userEvent.setup();
    render(<Datepicker showTime value="2025-01-15 23:45" />);
    const input = screen.getByPlaceholderText('Select date');
    expect(input).toHaveValue('2025-01-15 23:45');
    await user.click(input);
    expect(screen.getByLabelText('Time')).toHaveValue('23:45');
    // The calendar navigates by the date part alone.
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2025, 0) })
    ).toBeInTheDocument();
    expect(
      document
        .querySelector('[data-haze-day="2025-01-15"]')!
        .closest('[role="gridcell"]')
    ).toHaveAttribute('aria-selected', 'true');
    // A pick without touching the time keeps the parsed time.
    await user.click(screen.getAllByText('20')[0]!);
    expect(input).toHaveValue('2025-01-20 23:45');
  });

  it('defaults the time to 00:00 when untouched', async () => {
    const user = userEvent.setup();
    render(<Datepicker showTime value="2025-01-15" />);
    const input = screen.getByPlaceholderText('Select date');
    await user.click(input);
    expect(screen.getByLabelText('Time')).toHaveValue('00:00');
    await user.click(screen.getAllByText('20')[0]!);
    expect(input).toHaveValue('2025-01-20 00:00');
  });

  it('combines a time typed before the first date pick', async () => {
    const user = userEvent.setup();
    render(<Datepicker showTime />);
    const input = screen.getByPlaceholderText('Select date');
    await user.click(input);
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '08:15' },
    });
    // No date yet: the value stays empty while the time parks — the
    // panel opens on the current month, so today's cell is in view.
    expect(input).toHaveValue('');
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await user.click(document.querySelector(`[data-haze-day="${today}"]`)!);
    expect(input).toHaveValue(`${today} 08:15`);
  });

  it('keeps the pure-date format and renders no time row without showTime', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    const input = screen.getByPlaceholderText('Select date');
    await user.click(input);
    expect(screen.queryByLabelText('Time')).not.toBeInTheDocument();
    await user.click(screen.getAllByText('20')[0]!);
    expect(input).toHaveValue('2025-01-20');
  });

  it('ignores showTime on coarser granularities', () => {
    render(
      <DatepickerCore
        value="2026-03"
        onChange={() => undefined}
        open
        onOpenChange={() => undefined}
        picker="month"
        showTime
      />
    );
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Time')).not.toBeInTheDocument();
  });

  it('has no axe violations with the time footer open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Datepicker showTime value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Datepicker year quick jump', () => {
  const shortMonth = (month: number) =>
    new Date(2026, month, 15).toLocaleString('default', { month: 'short' });

  it('jumps to a year from the panel header and lands back on the month view', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    await user.click(
      screen.getByRole('button', { name: getMonthLabel(2025, 0) })
    );
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    // The toolbar year drills into the decade grid.
    await user.click(screen.getByRole('button', { name: '2025' }));
    expect(
      screen.getByRole('grid', { name: 'Select year' })
    ).toBeInTheDocument();
    expect(screen.getByText('2020 – 2031')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '2028' }));
    // Back on the month view, now anchored to the picked year.
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2028' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: shortMonth(2) }));
    expect(
      screen.getByRole('grid', { name: getMonthLabel(2028, 2) })
    ).toBeInTheDocument();
    await user.click(screen.getAllByText('20')[0]!);
    expect(screen.getByPlaceholderText('Select date')).toHaveValue(
      '2028-03-20'
    );
  });

  it('reaches the year grid by keyboard and roves its cells', async () => {
    const user = userEvent.setup();
    render(<Datepicker value="2025-01-15" />);
    await user.click(screen.getByPlaceholderText('Select date'));
    const title = screen.getByRole('button', {
      name: getMonthLabel(2025, 0),
    });
    title.focus();
    await user.keyboard('{Enter}');
    // Tab back out to the toolbar year button (last toolbar button
    // first, then the year toggle) and activate it.
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    await user.keyboard('{Enter}');
    const yearGrid = screen.getByRole('grid', { name: 'Select year' });
    expect(yearGrid).toBeInTheDocument();
    // Opening focuses the quick year's cell.
    expect(yearGrid.querySelector('[data-haze-year="2025"]')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(yearGrid.querySelector('[data-haze-year="2026"]')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('grid', { name: 'Select month' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2026' })).toBeInTheDocument();
  });
});
