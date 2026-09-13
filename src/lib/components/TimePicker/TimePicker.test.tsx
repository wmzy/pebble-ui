import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import LocaleProvider from '../LocaleProvider/LocaleProvider';

import TimePicker from './TimePicker';
import TimePickerCore from './TimePickerCore';

/** All hour options of the named column, in DOM order. */
function optionNames(columnName: string): string[] {
  const list = screen.getByRole('listbox', { name: columnName });
  return within(list)
    .getAllByRole('option')
    .map((option) => option.textContent);
}

describe('TimePicker', () => {
  it('renders a readonly combobox trigger by default', () => {
    render(<TimePicker aria-label="Start time" />);
    const trigger = screen.getByRole('combobox', { name: 'Start time' });
    expect(trigger).toHaveAttribute('readonly');
    // The native form is opt-in only.
    expect(document.querySelector('input[type="time"]')).toBeNull();
  });

  it('displays initial value', () => {
    render(<TimePicker value="14:30" />);
    expect(screen.getByRole('combobox')).toHaveValue('14:30');
  });

  it('applies className to the wrapper', () => {
    const { container } = render(<TimePicker className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('passes placeholder through to the trigger', () => {
    render(<TimePicker placeholder="Select time" />);
    expect(screen.getByPlaceholderText('Select time')).toBeInTheDocument();
  });

  it('opens the column panel on trigger click', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Minute' })).toBeInTheDocument();
    // HH:mm default: no second column.
    expect(screen.queryByRole('listbox', { name: 'Second' })).toBeNull();
    // Each column highlights the current value.
    expect(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '14',
      })
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <TimePicker />
        <button>outside</button>
      </div>
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByText('outside'));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with a controlled initial open value', () => {
    render(<TimePicker value="14:30" open />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
  });

  it('commits an hour pick without closing the panel', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '09',
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('09:30');
    // Column picks keep the panel open for follow-up picks.
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '09',
      })
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('commits a minute pick', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Minute' })).getByRole('option', {
        name: '45',
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('14:45');
  });

  it('does not open the panel from a disabled trigger', async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="Start time" disabled />);
    const trigger = screen.getByRole('combobox', { name: 'Start time' });
    expect(trigger).toBeDisabled();
    // jsdom still dispatches pointer events on disabled inputs that
    // browsers swallow — the component must guard both paths.
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('TimePicker format', () => {
  it('adds a second column for HH:mm:ss and commits second picks', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30:45" format="HH:mm:ss" />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox', { name: 'Second' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('listbox', { name: 'Second' })).getByRole('option', {
        name: '45',
      })
    ).toHaveAttribute('aria-selected', 'true');
    await user.click(
      within(screen.getByRole('listbox', { name: 'Second' })).getByRole('option', {
        name: '05',
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('14:30:05');
  });

  it('serializes HH:mm:ss values without seconds when format is HH:mm', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" format="HH:mm" />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Minute' })).getByRole('option', {
        name: '05',
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('14:05');
  });
});

describe('TimePicker steps', () => {
  it('shows only hourStep multiples in the hour column', async () => {
    const user = userEvent.setup();
    render(<TimePicker hourStep={3} />);
    await user.click(screen.getByRole('combobox'));
    expect(optionNames('Hour')).toEqual([
      '00', '03', '06', '09', '12', '15', '18', '21',
    ]);
  });

  it('shows only minuteStep multiples in the minute column', async () => {
    const user = userEvent.setup();
    render(<TimePicker minuteStep={15} />);
    await user.click(screen.getByRole('combobox'));
    expect(optionNames('Minute')).toEqual(['00', '15', '30', '45']);
  });

  it('shows only secondStep multiples in the second column', async () => {
    const user = userEvent.setup();
    render(<TimePicker format="HH:mm:ss" secondStep={10} />);
    await user.click(screen.getByRole('combobox'));
    expect(optionNames('Second')).toEqual([
      '00', '10', '20', '30', '40', '50',
    ]);
  });
});

describe('TimePicker use12Hours', () => {
  it('renders a 12-hour clock and period column, value stays 24h', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="15:20" use12Hours />);
    await user.click(screen.getByRole('combobox'));
    expect(optionNames('Hour')).toEqual([
      '12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
    ]);
    // 15:20 → 3 PM.
    expect(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '3',
      })
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      within(screen.getByRole('listbox', { name: 'AM/PM' })).getByRole('option', {
        name: 'PM',
      })
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('commits hour picks in the current period', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="15:20" use12Hours />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '5',
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('17:20');
  });

  it('flips the period without touching the 12-hour clock', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="15:20" use12Hours />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      within(screen.getByRole('listbox', { name: 'AM/PM' })).getByRole('option', {
        name: 'AM',
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('03:20');
  });

  it('reads midnight and noon as 12 AM / 12 PM', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="00:30" use12Hours />);
    await user.click(screen.getByRole('combobox'));
    expect(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '12',
      })
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      within(screen.getByRole('listbox', { name: 'AM/PM' })).getByRole('option', {
        name: 'AM',
      })
    ).toHaveAttribute('aria-selected', 'true');
  });
});

describe('TimePicker disabledTime', () => {
  it('disables matching cells and keeps them unselectable', async () => {
    const user = userEvent.setup();
    const disabledTime = (parts: { hour: number }) => parts.hour === 12;
    render(<TimePicker value="14:30" disabledTime={disabledTime} />);
    await user.click(screen.getByRole('combobox'));
    const noon = within(screen.getByRole('listbox', { name: 'Hour' })).getByRole(
      'option',
      { name: '12' }
    );
    expect(noon).toHaveAttribute('aria-disabled', 'true');
    await user.click(noon);
    expect(screen.getByRole('combobox')).toHaveValue('14:30');
  });

  it('disables minute cells against the selected hour', async () => {
    const user = userEvent.setup();
    render(
      <TimePicker value="14:30" disabledTime={(p) => p.hour === 14 && p.minute === 45} />
    );
    await user.click(screen.getByRole('combobox'));
    const minute45 = within(
      screen.getByRole('listbox', { name: 'Minute' })
    ).getByRole('option', { name: '45' });
    expect(minute45).toHaveAttribute('aria-disabled', 'true');
    await user.click(minute45);
    expect(screen.getByRole('combobox')).toHaveValue('14:30');
  });

  it('skips disabled hours when stepping from the trigger', async () => {
    const user = userEvent.setup();
    render(
      <TimePicker value="11:00" disabledTime={(p) => p.hour === 12} />
    );
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    // 12 is disabled — the step lands on 13.
    expect(screen.getByRole('combobox')).toHaveValue('13:00');
  });
});

describe('TimePicker Now', () => {
  it('commits the current time and closes the panel', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 12, 9, 5, 3));
    try {
      render(<TimePicker value="14:30" />);
      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByRole('button', { name: 'Now' }));
      expect(screen.getByRole('combobox')).toHaveValue('09:05');
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-expanded',
        'false'
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('serializes Now with seconds under HH:mm:ss', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 12, 23, 59, 7));
    try {
      render(<TimePicker format="HH:mm:ss" />);
      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByRole('button', { name: 'Now' }));
      expect(screen.getByRole('combobox')).toHaveValue('23:59:07');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('TimePicker native mode', () => {
  it('falls back to the bare input[type=time]', () => {
    const { container } = render(<TimePicker native aria-label="Start time" />);
    expect(container.querySelector('input[type="time"]')).toBeInTheDocument();
    expect(container.querySelector('input[readonly]')).toBeNull();
  });

  it('keeps the className on the input itself', () => {
    const { container } = render(<TimePicker native className="custom" />);
    expect(container.querySelector('input[type="time"]')).toHaveClass('custom');
  });

  it('calls onChange on input change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimePicker native onChange={onChange} />);
    const input = document.querySelector('input[type="time"]')!;
    await user.type(input, '10:00');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders with placeholder', () => {
    const { container } = render(<TimePicker native placeholder="Select time" />);
    expect(
      container.querySelector('input[placeholder="Select time"]')
    ).toBeInTheDocument();
  });
});

describe('TimePicker control', () => {
  it('shares state with a parent through a control', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue, control] = useControl('08:00');
      return (
        <div>
          <TimePicker value={control} onChange={onChange} />
          <button onClick={() => setValue('21:45')}>rewrite</button>
          <output data-testid="mirror">{value}</output>
        </div>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '09',
      })
    );
    // The pick flows into the parent-owned state…
    expect(onChange).toHaveBeenCalledWith('09:00');
    expect(screen.getByTestId('mirror')).toHaveTextContent('09:00');
    expect(screen.getByRole('combobox')).toHaveValue('09:00');
    // …and an external write drives the picker back.
    await user.click(screen.getByText('rewrite'));
    expect(screen.getByRole('combobox')).toHaveValue('21:45');
  });

  it('updates its own display when uncontrolled', async () => {
    const user = userEvent.setup();
    render(<TimePicker />);
    await user.click(screen.getByRole('combobox'));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Hour' })).getByRole('option', {
        name: '09',
      })
    );
    await user.click(
      within(screen.getByRole('listbox', { name: 'Minute' })).getByRole('option', {
        name: '15',
      })
    );
    expect(screen.getByRole('combobox')).toHaveValue('09:15');
  });

  it('accepts a value outside the step grid and re-highlights nothing', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:37" minuteStep={15} />);
    await user.click(screen.getByRole('combobox'));
    const minutes = within(screen.getByRole('listbox', { name: 'Minute' }))
      .getAllByRole('option')
      .filter((option) => option.getAttribute('aria-selected') === 'true');
    expect(minutes).toEqual([]);
    expect(screen.getByRole('combobox')).toHaveValue('14:37');
  });
});

describe('TimePicker keyboard', () => {
  it('moves the hour by hourStep from the trigger', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveValue('15:30');
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('combobox')).toHaveValue('14:30');
  });

  it('honors hourStep on trigger arrows', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" hourStep={3} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveValue('17:30');
  });

  it('starts from midnight when stepping an empty value', async () => {
    const user = userEvent.setup();
    render(<TimePicker />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveValue('01:00');
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('combobox')).toHaveValue('23:00');
  });

  it('opens the panel with Enter and toggles with Space', async () => {
    const user = userEvent.setup();
    render(<TimePicker />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    // Raw `[Space]` — the braced descriptor is printable-text input,
    // which user-event refuses to type into the readonly trigger.
    await user.keyboard('[Space]');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
  });

  it('focuses the hour column on open', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" />);
    await user.click(screen.getByRole('combobox'));
    expect(document.activeElement).toHaveAttribute('aria-label', 'Hour');
  });

  it('steps within columns with arrow keys', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" format="HH:mm:ss" />);
    await user.click(screen.getByRole('combobox'));
    // Focus starts on the hour column.
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveValue('15:30:00');
    const minuteColumn = screen.getByRole('listbox', { name: 'Minute' });
    minuteColumn.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveValue('15:31:00');
    const secondColumn = screen.getByRole('listbox', { name: 'Second' });
    secondColumn.focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('combobox')).toHaveValue('15:31:59');
  });

  it('flips the period column with arrows', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="15:20" use12Hours />);
    await user.click(screen.getByRole('combobox'));
    const periodColumn = screen.getByRole('listbox', { name: 'AM/PM' });
    periodColumn.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('combobox')).toHaveValue('03:20');
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('combobox')).toHaveValue('15:20');
  });

  it('returns focus to the trigger on Escape', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="14:30" />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('runs a consumer onKeyDown after the built-in handling', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<TimePicker onKeyDown={onKeyDown} />);
    screen.getByRole('combobox').focus();
    await user.keyboard('{ArrowDown}');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('combobox')).toHaveValue('01:00');
  });
});

describe('TimePicker locale', () => {
  it('uses the zh-CN pack for panel copy', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="zh-CN">
        <TimePicker value="14:30" />
      </LocaleProvider>
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox', { name: '小时' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '分钟' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '现在' })).toBeInTheDocument();
  });

  it('uses the zh-CN AM/PM labels', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="zh-CN">
        <TimePicker value="15:20" use12Hours />
      </LocaleProvider>
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox', { name: '上午/下午' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('listbox', { name: '上午/下午' })).getByRole('option', {
        name: '下午',
      })
    ).toHaveAttribute('aria-selected', 'true');
  });
});

describe('TimePicker ref forwarding', () => {
  it('forwards ref to the trigger input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TimePicker ref={ref} aria-label="Start time" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it('forwards ref to the native input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TimePicker native ref={ref} aria-label="Start time" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});

describe('TimePicker a11y', () => {
  it('has no axe violations closed', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(<TimePicker aria-label="Start time" value="14:30" />);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations with the full panel open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<TimePicker aria-label="Start time" value="14:30" format="HH:mm:ss" use12Hours />);
    await user.click(screen.getByRole('combobox'));
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('TimePickerCore', () => {
  it('renders the given value', () => {
    render(<TimePickerCore value="14:30" onChange={() => undefined} />);
    expect(screen.getByDisplayValue('14:30')).toBeInTheDocument();
  });

  it('calls onChange with the new value on input', () => {
    const onChange = vi.fn();
    render(<TimePickerCore value="" onChange={onChange} />);
    const input = document.querySelector('input[type="time"]')!;
    fireEvent.change(input, { target: { value: '10:00' } });
    expect(onChange).toHaveBeenCalledWith('10:00');
  });
});
