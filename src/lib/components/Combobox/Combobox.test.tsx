import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  it('shows options on focus', async () => {
    const user = userEvent.setup();
    render(<Combobox options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(3);
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
  });
});
