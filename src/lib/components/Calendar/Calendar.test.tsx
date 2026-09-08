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
    expect(screen.getByText(label)).toBeInTheDocument();
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
    expect(screen.getByText(getMonthLabel(2025, 1))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText(getMonthLabel(2025, 0))).toBeInTheDocument();
  });

  it('navigates across the year boundary in both directions', async () => {
    const user = userEvent.setup();
    render(<Calendar value='2025-12-15' />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText(getMonthLabel(2026, 0))).toBeInTheDocument();
  });

  it('jumps back to the current month via the Today button', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    try {
      render(<Calendar value='2025-01-15' />);
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(screen.getByText(getMonthLabel(2025, 1))).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Today' }));
      expect(screen.getByText(getMonthLabel(2025, 5))).toBeInTheDocument();
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

  it('formats month label and weekday headers for locale="zh-CN"', () => {
    render(<Calendar value='2025-01-15' locale='zh-CN' />);
    expect(
      screen.getByText(getLocalizedMonthLabel(2025, 0, 'zh-CN'))
    ).toBeInTheDocument();
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
});
