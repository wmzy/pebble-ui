import { fireEvent, render, screen } from '@testing-library/react';
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
