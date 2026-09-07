import type { MockInstance } from 'vitest';

import type { RowSelectionState } from '@tanstack/react-table';

import type { DataTableColumnDef } from './DataTable';

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import DataTable from './DataTable';

type Person = {
  id: string;
  name: string;
  age: number;
};

const people: Person[] = [
  { id: 'u1', name: 'Charlie', age: 35 },
  { id: 'u2', name: 'Alice', age: 28 },
  { id: 'u3', name: 'Bob', age: 42 },
  { id: 'u4', name: 'Diana', age: 31 },
  { id: 'u5', name: 'Evan', age: 24 },
];

const columns: DataTableColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
];

const rowId = (row: Person) => row.id;

/** Body rows only — the header row contains `th` cells. */
function bodyRows() {
  return screen.getAllByRole('row').filter((row) => !row.querySelector('th'));
}

describe('DataTable', () => {
  it('renders a table with headers and data rows', () => {
    render(<DataTable columns={columns} data={people} />);

    expect(
      screen.getByRole('columnheader', { name: 'Name' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Age' })
    ).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('applies className to the root and forwards native props to the table', () => {
    render(
      <DataTable
        columns={columns}
        data={people}
        className='custom'
        aria-label='Employees'
      />
    );

    const table = screen.getByRole('table', { name: 'Employees' });
    expect(table).toBeInTheDocument();
    // root → scroll area → table
    expect(table.parentElement?.parentElement).toHaveClass('custom');
  });

  it('renders sorting as opt-in: no sort buttons unless sortable', () => {
    render(<DataTable columns={columns} data={people} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Name' })
    ).not.toHaveAttribute('aria-sort');
  });

  it('sorts on header click and reflects it in aria-sort', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={people} sortable />);

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyRows()[0]).toHaveTextContent('Alice');
    expect(
      screen.getByRole('columnheader', { name: 'Age' })
    ).not.toHaveAttribute('aria-sort');

    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(bodyRows()[0]).toHaveTextContent('Evan');
  });

  it('lets column meta override the table-level sortable default', () => {
    const metaColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { sortable: true } },
      { accessorKey: 'age', header: 'Age' },
    ];
    render(<DataTable columns={metaColumns} data={people} />);

    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Age' })
    ).not.toBeInTheDocument();
  });

  it('selects rows through the checkbox column', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={people} selectable getRowId={rowId} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6); // select-all + one per row

    await user.click(screen.getByRole('checkbox', { name: 'Select row u2' }));
    expect(
      screen.getByRole('checkbox', { name: 'Select row u2' })
    ).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(
      screen.getByRole('checkbox', { name: 'Select row u1' })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Select row u5' })
    ).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(
      screen.getByRole('checkbox', { name: 'Select row u1' })
    ).not.toBeChecked();
  });

  it('supports controlled rowSelection through a Control', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [selection, , selectionCtrl] = useControl<RowSelectionState>(
        undefined,
        { u3: true }
      );
      const selected = Object.keys(selection)
        .filter((key) => selection[key])
        .join(' ');
      return (
        <>
          <DataTable
            columns={columns}
            data={people}
            selectable
            getRowId={rowId}
            rowSelection={selectionCtrl}
          />
          <output data-testid='selection'>{selected}</output>
        </>
      );
    }

    render(<Harness />);

    expect(
      screen.getByRole('checkbox', { name: 'Select row u3' })
    ).toBeChecked();
    expect(screen.getByTestId('selection')).toHaveTextContent('u3');

    await user.click(screen.getByRole('checkbox', { name: 'Select row u1' }));
    expect(screen.getByTestId('selection')).toHaveTextContent('u3 u1');

    await user.click(screen.getByRole('checkbox', { name: 'Select row u3' }));
    expect(screen.getByTestId('selection')).toHaveTextContent('u1');
  });

  it('paginates rows and reflects the current page', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={people} pageSize={2} />);

    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Evan')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(1);
  });

  it('supports a controlled page through a Control', () => {
    function Harness() {
      const [, , pageCtrl] = useControl(undefined, 2);
      return (
        <DataTable
          columns={columns}
          data={people}
          pageSize={2}
          page={pageCtrl}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  it('renders skeleton rows while loading', () => {
    const { container } = render(
      <DataTable columns={columns} data={people} loading pageSize={2} />
    );

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(bodyRows()).toHaveLength(2);
    expect(container.querySelectorAll('tbody span').length).toBe(4);
  });

  it('shows the empty state when data is empty and not loading', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('No data').closest('td')).toHaveAttribute(
      'colspan',
      '2'
    );
  });

  it('renders a custom empty node', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        empty={<button type='button'>Add item</button>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Add item' })
    ).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  it('keeps row identity stable across sorting via getRowId', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={people} sortable getRowId={rowId} />
    );

    const bobRow = bodyRows().find((row) => row.textContent.includes('Bob'));
    expect(bobRow).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Name' }));

    const bobRowAfter = bodyRows().find((row) =>
      row.textContent.includes('Bob')
    );
    expect(bobRowAfter).toBe(bobRow);
  });

  it('calls onRowClick with the row, ignoring interactive content', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={people}
        selectable
        getRowId={rowId}
        onRowClick={onRowClick}
      />
    );

    await user.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(people[1], expect.anything());

    await user.click(screen.getByRole('checkbox', { name: 'Select row u2' }));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });

  it('toggles the sticky header class', () => {
    const { rerender } = render(
      <DataTable columns={columns} data={people} stickyHeader />
    );
    const thead = document.querySelector('thead');
    expect(thead).not.toBeNull();
    expect(thead?.className).toContain('stickyHead');

    rerender(<DataTable columns={columns} data={people} />);
    expect(document.querySelector('thead')?.className).not.toContain(
      'stickyHead'
    );
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <DataTable
        columns={columns}
        data={people}
        sortable
        selectable
        pageSize={2}
        getRowId={rowId}
      />
    );
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('DataTable virtualization', () => {
  // jsdom 30 has no layout (getBoundingClientRect is all zeros) and no
  // ResizeObserver, so both are mocked after VirtualList's test pattern:
  // the observer records targets and fires synchronously on observe
  // (matching the spec's initial notification), while the rect mock
  // fabricates the heights DataTable measures — the scroll region (a div)
  // and the pinned header (a thead).
  type ObserveCallback = (entries: ResizeObserverEntry[]) => void;

  class MockResizeObserver {
    observed = new Set<Element>();

    constructor(private callback: ObserveCallback) {}

    report(target: Element) {
      this.callback([{ target } as ResizeObserverEntry]);
    }

    observe(target: Element) {
      if (this.observed.has(target)) return;
      this.observed.add(target);
      this.report(target);
    }

    unobserve(target: Element) {
      this.observed.delete(target);
    }

    disconnect() {
      this.observed.clear();
    }
  }

  let areaHeight = 400;
  let headerHeight = 40;
  let rectSpy: MockInstance;

  beforeEach(() => {
    areaHeight = 400;
    headerHeight = 40;
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        if (this.tagName === 'THEAD') {
          return { height: headerHeight } as DOMRect;
        }
        if (this.tagName === 'DIV') {
          return { height: areaHeight } as DOMRect;
        }
        return { height: 0 } as DOMRect;
      });
  });

  afterEach(() => {
    rectSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  const many: Person[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `u${i}`,
    name: `Person ${i}`,
    age: 20 + i,
  }));

  /** The VirtualList scrollport: parent chain of a rendered row wrapper. */
  function getScrollport() {
    const wrapper = document.querySelector<HTMLElement>('[data-index]');
    const port = wrapper?.parentElement?.parentElement;
    if (!port) throw new Error('no virtualized rows rendered');
    return port;
  }

  function scrollTo(el: HTMLElement, scrollTop: number) {
    act(() => {
      el.scrollTop = scrollTop;
      el.dispatchEvent(new Event('scroll'));
    });
  }

  it('renders only the windowed slice of a 1000-row table', () => {
    render(<DataTable columns={columns} data={many} virtualized getRowId={rowId} />);

    // viewport 400 − header 40 = 360px at 34px/row → rows 0–10 visible,
    // plus the default overscan of 5 → indices 0–15 mounted of 1000.
    expect(bodyRows()).toHaveLength(16);
    expect(bodyRows()[0]).toHaveTextContent('Person 0');
    expect(bodyRows()[15]).toHaveTextContent('Person 15');
    // The spacer keeps the scrollbar honest: 1000 × 34px.
    expect(document.querySelector('[data-index]')?.parentElement).toHaveStyle(
      { height: '34000px' }
    );
  });

  it('advances the window after scrolling', () => {
    render(<DataTable columns={columns} data={many} virtualized getRowId={rowId} />);

    // scrollTop 3400 = 100 rows × 34px → window start 100−5, end 111+5.
    scrollTo(getScrollport(), 3400);

    expect(bodyRows()).toHaveLength(21);
    expect(bodyRows()[0]).toHaveTextContent('Person 95');
    expect(bodyRows()[20]).toHaveTextContent('Person 115');
    expect(screen.queryByText('Person 94')).not.toBeInTheDocument();
    expect(screen.queryByText('Person 116')).not.toBeInTheDocument();
  });

  it('honors an explicit rowHeight and overscan', () => {
    render(
      <DataTable
        columns={columns}
        data={many}
        virtualized={{ rowHeight: 40, overscan: 0 }}
        getRowId={rowId}
      />
    );

    // 360px / 40px rows with no overscan → exactly rows 0–8.
    expect(bodyRows()).toHaveLength(9);
    expect(bodyRows()[8]).toHaveTextContent('Person 8');
    expect(document.querySelector('[data-index]')?.parentElement).toHaveStyle(
      { height: '40000px' }
    );
  });

  it('sorts before windowing, so out-of-window rows move in and out', async () => {
    const user = userEvent.setup();
    // Reverse order: the window shows the tail until sorting reorders it.
    const reversed = [...many].reverse();
    render(
      <DataTable
        columns={columns}
        data={reversed}
        sortable
        virtualized
        getRowId={rowId}
      />
    );

    expect(bodyRows()[0]).toHaveTextContent('Person 999');
    expect(bodyRows()[15]).toHaveTextContent('Person 984');

    await user.click(screen.getByRole('button', { name: 'Name' }));

    // Ascending natural sort brings rows 0–15 into the window and pushes
    // the previously visible tail out of it.
    expect(
      screen.getByRole('columnheader', { name: 'Name' })
    ).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyRows()[0]).toHaveTextContent('Person 0');
    expect(bodyRows()[15]).toHaveTextContent('Person 15');
    expect(screen.queryByText('Person 999')).not.toBeInTheDocument();
  });

  it('selects rows inside the window and select-all across the dataset', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={many}
        selectable
        virtualized
        getRowId={rowId}
      />
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select row u1' }));
    expect(
      screen.getByRole('checkbox', { name: 'Select row u1' })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Select row u0' })
    ).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    // All 1000 rows are selected even though only 16 are mounted.
    expect(
      screen.getByRole('checkbox', { name: 'Select row u0' })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Select row u15' })
    ).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(
      screen.getByRole('checkbox', { name: 'Select row u1' })
    ).not.toBeChecked();
  });

  it('paginates the virtualized window to the current page', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={many}
        pageSize={500}
        virtualized
        getRowId={rowId}
      />
    );

    // Page 1: rows 0–999 sliced to 0–499, window 0–15 of that slice.
    expect(bodyRows()[0]).toHaveTextContent('Person 0');
    expect(bodyRows()[15]).toHaveTextContent('Person 15');
    expect(screen.queryByText('Person 500')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(bodyRows()[0]).toHaveTextContent('Person 500');
    expect(screen.queryByText('Person 0')).not.toBeInTheDocument();
  });

  it('shows the empty state when virtualized with no rows', () => {
    render(<DataTable columns={columns} data={[]} virtualized />);

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('No data').closest('td')).toHaveAttribute(
      'colspan',
      '2'
    );
    expect(document.querySelector('[data-index]')).toBeNull();
  });

  it('renders skeleton rows while loading and virtualized', () => {
    render(
      <DataTable columns={columns} data={many} loading pageSize={2} virtualized />
    );

    expect(screen.queryByText('Person 0')).not.toBeInTheDocument();
    expect(bodyRows()).toHaveLength(2);
  });

  it('keeps every row a legal table structure with full cell semantics', () => {
    render(
      <DataTable
        columns={columns}
        data={many}
        selectable
        virtualized
        getRowId={rowId}
      />
    );

    for (const row of bodyRows()) {
      expect(row.tagName).toBe('TR');
      expect(row.closest('tbody')).toBeInstanceOf(HTMLTableSectionElement);
      expect(row.closest('table')).toBeInstanceOf(HTMLTableElement);
      // Checkbox column + two data columns.
      expect(row.querySelectorAll('td')).toHaveLength(3);
    }
    // The header stays a real table row outside the scroll window.
    const headerRow = screen
      .getAllByRole('row')
      .find((row) => row.querySelector('th'));
    expect(headerRow).toBeDefined();
    expect(headerRow?.closest('thead')).toBeInstanceOf(HTMLTableSectionElement);
  });

  it('renders every row when not virtualized', () => {
    render(<DataTable columns={columns} data={many.slice(0, 40)} />);

    expect(bodyRows()).toHaveLength(40);
    expect(document.querySelector('[data-index]')).toBeNull();
  });

  it('has no axe violations when virtualized', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <DataTable
        columns={columns}
        data={many}
        sortable
        selectable
        virtualized
        getRowId={rowId}
      />
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
