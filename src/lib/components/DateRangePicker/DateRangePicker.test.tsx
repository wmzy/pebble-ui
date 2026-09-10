import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DateRangePicker from './DateRangePicker';
import DateRangePickerCore from './DateRangePickerCore';

describe('DateRangePicker', () => {
  it('renders two date inputs', () => {
    const { container } = render(<DateRangePicker />);
    const inputs = container.querySelectorAll('input[type="date"]');
    expect(inputs.length).toBe(2);
  });

  it('applies className', () => {
    const { container } = render(<DateRangePicker className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('displays initial values', () => {
    render(<DateRangePicker startDate="2024-01-01" endDate="2024-01-31" />);
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-31')).toBeInTheDocument();
  });

  it('calls onStartChange', async () => {
    const user = userEvent.setup();
    const onStartChange = vi.fn();
    render(<DateRangePicker onStartChange={onStartChange} />);
    const input = document.querySelector('input[type="date"]')!;
    await user.type(input, '2024-01-01');
    expect(onStartChange).toHaveBeenCalled();
  });

  it('renders separator', () => {
    render(<DateRangePicker separator="to" />);
    expect(screen.getByText('to')).toBeInTheDocument();
  });

  it('renders no calendar grid by default', () => {
    render(<DateRangePicker />);
    expect(document.querySelector('[role="grid"]')).not.toBeInTheDocument();
  });
});

describe('DateRangePicker dual-month panel', () => {
  function monthLabel(year: number, month: number) {
    return new Date(year, month).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  it('renders two adjacent month grids below the inputs', () => {
    render(<DateRangePicker startDate="2026-01-15" months={2} />);
    expect(
      screen.getByRole('grid', { name: monthLabel(2026, 0) })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: monthLabel(2026, 1) })
    ).toBeInTheDocument();
    // The two date inputs stay in place.
    expect(document.querySelectorAll('input[type="date"]')).toHaveLength(2);
  });

  it('completes a cross-month range from calendar clicks', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DateRangePicker startDate="2026-01-15" months={2} />
    );
    const february = screen.getByRole('grid', { name: monthLabel(2026, 1) });
    // A start date is already set, so the first calendar pick completes
    // the range with the end date.
    await user.click(february.querySelector('[data-haze-day="2026-02-10"]')!);
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-01-15');
    expect(screen.getByLabelText('End date')).toHaveValue('2026-02-10');

    // Cross-month range highlight spans both panes.
    const cell = (date: string) =>
      container
        .querySelector(`[data-haze-day="${date}"]`)!
        .closest('[role="gridcell"]')!;
    expect(cell('2026-01-15')).toHaveAttribute('aria-selected', 'true');
    expect(cell('2026-01-25')).toHaveAttribute('aria-selected', 'true');
    expect(cell('2026-02-05')).toHaveAttribute('aria-selected', 'true');
    expect(cell('2026-02-10')).toHaveAttribute('aria-selected', 'true');
    expect(cell('2026-01-08')).toHaveAttribute('aria-selected', 'false');
    expect(cell('2026-02-20')).toHaveAttribute('aria-selected', 'false');
  });

  it('sets the start on the first pick and completes it on the second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    try {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      // Pinned "today" makes the initial view deterministic: January +
      // February 2026. Core is fully controlled, so the harness feeds
      // each pick back through rerender like a real owner would.
      const props = (start: string, end: string) => (
        <DateRangePickerCore
          startDate={start}
          endDate={end}
          months={2}
          onStartChange={onStartChange}
          onEndChange={onEndChange}
        />
      );
      const view = render(props('', ''));

      // First pick starts a fresh range (end cleared).
      const january = screen.getByRole('grid', { name: monthLabel(2026, 0) });
      fireEvent.click(january.querySelector('[data-haze-day="2026-01-20"]')!);
      expect(onStartChange).toHaveBeenCalledWith('2026-01-20');
      expect(onEndChange).toHaveBeenCalledWith('');

      // Second pick at or after the start completes the range.
      view.rerender(props('2026-01-20', ''));
      const february = screen.getByRole('grid', { name: monthLabel(2026, 1) });
      fireEvent.click(february.querySelector('[data-haze-day="2026-02-10"]')!);
      expect(onEndChange).toHaveBeenCalledWith('2026-02-10');
      expect(onStartChange).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('restarts the range when the second pick precedes the start', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-15" months={2} />);
    const january = screen.getByRole('grid', { name: monthLabel(2026, 0) });
    await user.click(january.querySelector('[data-haze-day="2026-01-20"]')!);
    await user.click(january.querySelector('[data-haze-day="2026-01-08"]')!);
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-01-08');
    expect(screen.getByLabelText('End date')).toHaveValue('');
  });

  it('moves both grids together with prev/next', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-15" months={2} />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(
      screen.getByRole('grid', { name: monthLabel(2026, 1) })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: monthLabel(2026, 2) })
    ).toBeInTheDocument();
  });

  it('has no axe violations with the panel open', async () => {
    const { axe } = await import('jest-axe');
    render(<DateRangePicker startDate="2026-01-15" months={2} separator="to" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('DateRangePickerCore', () => {
  it('renders the given start and end values', () => {
    render(
      <DateRangePickerCore
        startDate="2024-01-01"
        endDate="2024-01-31"
        onStartChange={() => undefined}
        onEndChange={() => undefined}
      />
    );
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-31')).toBeInTheDocument();
  });

  it('calls onStartChange with the new start value', () => {
    const onStartChange = vi.fn();
    render(
      <DateRangePickerCore
        startDate=""
        endDate=""
        onStartChange={onStartChange}
        onEndChange={() => undefined}
      />
    );
    const input = document.querySelector('input[type="date"]')!;
    fireEvent.change(input, {target: {value: '2024-01-01'}});
    expect(onStartChange).toHaveBeenCalledWith('2024-01-01');
  });

  it('calls onEndChange with the new end value', () => {
    const onEndChange = vi.fn();
    render(
      <DateRangePickerCore
        startDate=""
        endDate=""
        onStartChange={() => undefined}
        onEndChange={onEndChange}
      />
    );
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[1]!, {target: {value: '2024-01-31'}});
    expect(onEndChange).toHaveBeenCalledWith('2024-01-31');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <DateRangePicker startDate="2024-01-01" endDate="2024-01-31" separator="to" />
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('DateRangePicker presets', () => {
  const presets = [
    { label: 'First fortnight', range: ['2026-01-01', '2026-01-14'] as [string, string] },
    { label: 'Rest of January', range: ['2026-01-15', '2026-01-31'] as [string, string] },
  ];

  it('renders shortcut rows above the dual-month panel and applies a range', async () => {
    const user = userEvent.setup();
    const onStartChange = vi.fn();
    const onEndChange = vi.fn();
    render(
      <DateRangePickerCore
        startDate=""
        endDate=""
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        months={2}
        presets={presets}
      />
    );
    // Presets share the panel with the calendars.
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Rest of January' }));
    expect(onStartChange).toHaveBeenCalledWith('2026-01-15');
    expect(onEndChange).toHaveBeenCalledWith('2026-01-31');
  });

  it('applies presets through the sugar component (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        months={2}
        presets={presets}
      />
    );
    await user.click(screen.getByRole('button', { name: 'First fortnight' }));
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('End date')).toHaveValue('2026-01-14');
  });

  it('renders the preset panel without calendars when months stays 1', () => {
    render(<DateRangePicker presets={presets} />);
    expect(
      screen.getByRole('button', { name: 'First fortnight' })
    ).toBeInTheDocument();
    expect(document.querySelector('[role="grid"]')).not.toBeInTheDocument();
  });
});

describe('DateRangePicker disabledDate', () => {
  it('disables predicate days on the dual-month calendar', () => {
    render(
      <DateRangePicker
        startDate="2026-01-15"
        months={2}
        disabledDate={(date) => date.getDay() === 0}
      />
    );
    const day = (date: string) =>
      document.querySelector<HTMLButtonElement>(`[data-haze-day="${date}"]`);
    expect(day('2026-01-04')).toBeDisabled();
    expect(day('2026-01-15')).toBeEnabled();
  });
});
