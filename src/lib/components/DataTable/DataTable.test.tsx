import type { MockInstance } from 'vitest';

import type { ExpandedState, RowSelectionState } from '@tanstack/react-table';

import type { DataTableColumnDef, DataTableProps } from './DataTable';

import { render, screen, act, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import DataTable from './DataTable';
import { dataTableAvg, dataTableCount, dataTableSum } from './summary';

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

  it('applies per-column widths through a colgroup', () => {
    const widthColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { width: 160 } },
      { accessorKey: 'age', header: 'Age', size: 80 },
      { accessorKey: 'id', header: 'ID', meta: { width: '10%' } },
    ];
    const { container } = render(
      <DataTable columns={widthColumns} data={people} selectable getRowId={rowId} />
    );

    const cols = Array.from(container.querySelectorAll('col'));
    // Selection column first at its fixed narrow width, then one col per
    // data column: meta.width (px), the native `size` fallback, string
    // passthrough.
    expect(cols).toHaveLength(4);
    expect(cols[0]!.style.width).toBe(
      'calc(var(--haze-space-3) * 2 + var(--haze-space-5))'
    );
    expect(cols[1]!.style.width).toBe('160px');
    expect(cols[2]!.style.width).toBe('80px');
    expect(cols[3]!.style.width).toBe('10%');

    // Columns without a width stay auto — no width on the col.
    const partialColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { width: 160 } },
      { accessorKey: 'age', header: 'Age' },
    ];
    const partial = render(
      <DataTable columns={partialColumns} data={people} />
    ).container;
    const partialCols = Array.from(partial.querySelectorAll('col'));
    expect(partialCols).toHaveLength(2);
    expect(partialCols[1]!.style.width).toBe('');
  });

  it('renders no colgroup when no column declares a width', () => {
    const { container } = render(
      <DataTable columns={columns} data={people} selectable />
    );

    expect(container.querySelector('colgroup')).toBeNull();
    expect(container.querySelectorAll('col')).toHaveLength(0);
    // Unfixed cells carry no sticky offsets.
    container.querySelectorAll<HTMLElement>('th, td').forEach((cell) => {
      expect(cell.style.left).toBe('');
      expect(cell.style.right).toBe('');
      expect(cell.className).not.toContain('fixedCell');
    });
  });

  it('sticks fixed columns to the scroll edges with accumulated offsets', async () => {
    const user = userEvent.setup();
    const fixedColumns: DataTableColumnDef<Person>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        meta: { width: 120, fixed: 'left' },
      },
      { accessorKey: 'age', header: 'Age', size: 100, meta: { fixed: 'left' } },
      { accessorKey: 'id', header: 'ID', meta: { width: 90, fixed: 'right' } },
    ];
    render(
      <DataTable
        columns={fixedColumns}
        data={people}
        selectable
        getRowId={rowId}
      />
    );

    const [selectionHeader, nameHeader, ageHeader, idHeader] =
      screen.getAllByRole('columnheader');
    // The selection column pins itself at the left edge and its width seeds
    // the offset of the first fixed data column; the second fixed column
    // accumulates the first one's width.
    expect(selectionHeader!.style.left).toBe('0px');
    expect(nameHeader!.style.left).toBe(
      'calc((var(--haze-space-3) * 2 + var(--haze-space-5)))'
    );
    expect(ageHeader!.style.left).toBe(
      'calc((var(--haze-space-3) * 2 + var(--haze-space-5)) + 120px)'
    );
    // Right-fixed columns pin from the right edge.
    expect(idHeader!.style.right).toBe('0px');
    expect(idHeader!.style.left).toBe('');
    expect(nameHeader!.className).toContain('fixedCell');
    expect(nameHeader!.className).toContain('fixedHeadCell');

    const rowCells = Array.from(bodyRows()[0]!.querySelectorAll('td'));
    expect(rowCells[0]!.style.left).toBe('0px');
    expect(rowCells[1]!.style.left).toBe(
      'calc((var(--haze-space-3) * 2 + var(--haze-space-5)))'
    );
    expect(rowCells[2]!.style.left).toBe(
      'calc((var(--haze-space-3) * 2 + var(--haze-space-5)) + 120px)'
    );
    expect(rowCells[3]!.style.right).toBe('0px');
    // The innermost column of each pinned run carries the scroll hint —
    // on body cells only, never on the header row.
    expect(rowCells[2]!.className).toContain('fixedLeftEdge');
    expect(rowCells[1]!.className).not.toContain('fixedLeftEdge');
    expect(rowCells[3]!.className).toContain('fixedRightEdge');
    expect(ageHeader!.className).not.toContain('fixedLeftEdge');

    // Selecting a row re-creates the selected background on fixed cells,
    // whose own background would otherwise cover the row's.
    await user.click(screen.getByRole('checkbox', { name: 'Select row u1' }));
    rowCells.forEach((cell) =>
      expect(cell.className).toContain('fixedCellSelected')
    );
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <DataTable
        columns={[
          {
            accessorKey: 'name',
            header: 'Name',
            meta: { width: 120, fixed: 'left' },
          },
          { accessorKey: 'age', header: 'Age' },
        ]}
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

describe('DataTable column resizing', () => {
  const resizableColumns: DataTableColumnDef<Person>[] = [
    { accessorKey: 'name', header: 'Name', meta: { width: 120 } },
    { accessorKey: 'age', header: 'Age' },
  ];

  const colsOf = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('col'));

  it('renders no resize handles unless resizable', () => {
    render(<DataTable columns={columns} data={people} />);

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    // And no colgroup appears just because resizing exists as a feature.
    expect(document.querySelector('colgroup')).toBeNull();
  });

  it('renders a labeled separator handle per resizable leaf column', () => {
    const { container } = render(
      <DataTable columns={resizableColumns} data={people} resizable />
    );

    const nameHandle = screen.getByRole('separator', { name: 'Resize Name' });
    expect(nameHandle).toHaveAttribute('aria-orientation', 'vertical');
    expect(nameHandle).toHaveAttribute('tabindex', '0');
    expect(
      screen.getByRole('separator', { name: 'Resize Age' })
    ).toBeInTheDocument();
    // Resizing emits a colgroup so resized widths have a home; columns
    // without a declared width stay free.
    expect(colsOf(container).map((col) => col.style.width)).toEqual([
      '120px',
      '',
    ]);
  });

  it('resizes a column through pointer drag and reflects it in the colgroup', () => {
    const { container } = render(
      <DataTable columns={resizableColumns} data={people} resizable />
    );

    const handle = screen.getByRole('separator', { name: 'Resize Name' });
    // TanStack drag contract: mousedown on the handle, then document-level
    // mousemove/mouseup. From 120px at x=100 to x=140 → 160px.
    fireEvent.mouseDown(handle, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 140 });
    fireEvent.mouseUp(document, { clientX: 140 });

    expect(colsOf(container).map((col) => col.style.width)).toEqual([
      '160px',
      '',
    ]);
  });

  it('nudges the width with the keyboard arrows', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable columns={resizableColumns} data={people} resizable />
    );

    const handle = screen.getByRole('separator', { name: 'Resize Name' });
    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(colsOf(container)[0]!.style.width).toBe('125px');

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(colsOf(container)[0]!.style.width).toBe('115px');
  });

  it('mirrors the arrow keys under RTL, reading the DOM direction at event time', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div dir='rtl'>
        <DataTable columns={resizableColumns} data={people} resizable />
      </div>
    );

    const handle = screen.getByRole('separator', { name: 'Resize Name' });
    handle.focus();
    // In RTL the mirrored grid grows to the left.
    await user.keyboard('{ArrowLeft}');
    expect(colsOf(container)[0]!.style.width).toBe('125px');

    await user.keyboard('{ArrowRight}');
    expect(colsOf(container)[0]!.style.width).toBe('120px');
  });

  it('resets to the declared width on double click', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataTable columns={resizableColumns} data={people} resizable />
    );

    const handle = screen.getByRole('separator', { name: 'Resize Name' });
    handle.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(colsOf(container)[0]!.style.width).toBe('130px');

    await user.dblClick(handle);
    expect(colsOf(container)[0]!.style.width).toBe('120px');
  });

  it('hides the handle for columns switched off via meta.resizable', () => {
    const mixedColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { width: 120 } },
      {
        accessorKey: 'age',
        header: 'Age',
        meta: { width: 90, resizable: false },
      },
    ];
    render(<DataTable columns={mixedColumns} data={people} resizable />);

    expect(
      screen.getByRole('separator', { name: 'Resize Name' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('separator', { name: 'Resize Age' })
    ).not.toBeInTheDocument();
  });
});

describe('DataTable expandable rows', () => {
  const renderExpandable = () =>
    render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        getRowCanExpand={(row) => row.original.age > 30}
        renderExpandedRow={(row) => <output>Panel {row.id}</output>}
      />
    );

  it('renders expander buttons only where getRowCanExpand allows', () => {
    renderExpandable();

    // u1 (35) and u3 (42) clear the bar; u2/u4/u5 do not.
    expect(
      screen.getByRole('button', { name: 'Expand row u1' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand row u3' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Expand row u2' })
    ).not.toBeInTheDocument();
  });

  it('renders no expanders without the expanding props', () => {
    render(<DataTable columns={columns} data={people} getRowId={rowId} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('makes every row expandable when only renderExpandedRow is given', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        renderExpandedRow={(row) => <output>Panel {row.id}</output>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Expand row u5' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand row u5' }));
    expect(screen.getByText('Panel u5')).toBeInTheDocument();
  });

  it('expands a row: panel content, aria wiring, spanning row', async () => {
    const user = userEvent.setup();
    renderExpandable();

    const expander = screen.getByRole('button', { name: 'Expand row u1' });
    expect(expander).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Panel u1')).not.toBeInTheDocument();

    await user.click(expander);

    expect(expander).toHaveAttribute('aria-expanded', 'true');
    expect(expander).toHaveAttribute('aria-label', 'Collapse row u1');
    const panel = screen.getByText('Panel u1').closest('td');
    expect(panel).toBeInTheDocument();
    // The panel spans every leaf column on its own row.
    expect(panel).toHaveAttribute('colspan', '2');
    // aria-controls points at the rendered panel cell.
    expect(panel?.id).toBe(expander.getAttribute('aria-controls'));
    // The panel row sits directly after its data row.
    const panelRow = panel?.closest('tr');
    const dataRow = screen.getByText('Charlie').closest('tr');
    expect(panelRow?.previousElementSibling).toBe(dataRow);

    await user.click(expander);
    expect(expander).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Panel u1')).not.toBeInTheDocument();
  });

  it('toggles expansion through the keyboard', async () => {
    const user = userEvent.setup();
    renderExpandable();

    const expander = screen.getByRole('button', { name: 'Expand row u3' });
    expander.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Panel u3')).toBeInTheDocument();

    await user.keyboard('{ }');
    expect(screen.queryByText('Panel u3')).not.toBeInTheDocument();
  });

  it('supports controlled expanded through a Control', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [expanded, , expandedCtrl] = useControl<ExpandedState>(undefined, {
        u3: true,
      });
      const keys = Object.keys(expanded as Record<string, boolean>)
        .sort()
        .join(' ');
      return (
        <>
          <DataTable
            columns={columns}
            data={people}
            getRowId={rowId}
            expanded={expandedCtrl}
            getRowCanExpand={() => true}
            renderExpandedRow={(row) => <output>Panel {row.id}</output>}
          />
          <output data-testid='expanded'>{keys}</output>
        </>
      );
    }

    render(<Harness />);

    expect(screen.getByText('Panel u3')).toBeInTheDocument();
    expect(screen.getByTestId('expanded')).toHaveTextContent('u3');

    await user.click(screen.getByRole('button', { name: 'Expand row u1' }));
    expect(screen.getByText('Panel u1')).toBeInTheDocument();
    expect(screen.getByTestId('expanded')).toHaveTextContent('u1 u3');

    await user.click(screen.getByRole('button', { name: 'Collapse row u3' }));
    expect(screen.queryByText('Panel u3')).not.toBeInTheDocument();
    expect(screen.getByTestId('expanded')).toHaveTextContent('u1');
  });
});

describe('DataTable column visibility', () => {
  const visColumns: DataTableColumnDef<Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'age', header: 'Age', meta: { hideable: false } },
  ];

  it('renders no settings trigger unless columnToggle', () => {
    render(<DataTable columns={visColumns} data={people} />);

    expect(
      screen.queryByRole('button', { name: 'Columns' })
    ).not.toBeInTheDocument();
  });

  it('toggles columns through the menu; hideable:false columns stay put', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={visColumns}
        data={people}
        getRowId={rowId}
        columnToggle
      />
    );

    await user.click(screen.getByRole('button', { name: 'Columns' }));

    const nameToggle = screen.getByRole('menuitemcheckbox', {
      name: 'Show Name',
    });
    expect(nameToggle).toHaveAttribute('aria-checked', 'true');
    // The pinned column is absent from the menu entirely.
    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Show Age' })
    ).not.toBeInTheDocument();

    await user.click(nameToggle);

    expect(nameToggle).toHaveAttribute('aria-checked', 'false');
    // The column drops from header and body.
    expect(
      screen.queryByRole('columnheader', { name: 'Name' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Age' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();

    // The menu stays open — bring the column back.
    await user.click(nameToggle);
    expect(
      screen.getByRole('columnheader', { name: 'Name' })
    ).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('supports controlled columnVisibility through a Control', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [visibility, , visibilityCtrl] = useControl(undefined, {});
      return (
        <>
          <DataTable
            columns={visColumns}
            data={people}
            getRowId={rowId}
            columnToggle
            columnVisibility={visibilityCtrl}
          />
          <output data-testid='visibility'>{JSON.stringify(visibility)}</output>
        </>
      );
    }

    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Show Name' })
    );

    expect(screen.getByTestId('visibility')).toHaveTextContent(
      '{"name":false}'
    );
    expect(
      screen.queryByRole('columnheader', { name: 'Name' })
    ).not.toBeInTheDocument();
  });

  it('places the trigger in the pagination row when paginating', () => {
    render(
      <DataTable columns={visColumns} data={people} pageSize={5} columnToggle />
    );

    // Same footer row as the pagination controls.
    const footer = screen.getByRole('button', { name: 'Next' }).closest('div');
    expect(footer).toContainElement(
      screen.getByRole('button', { name: 'Columns' })
    );
  });
});

describe('DataTable filtering', () => {
  it('renders no filter row unless filterable', () => {
    render(<DataTable columns={columns} data={people} />);

    expect(
      screen.queryByRole('textbox', { name: 'Filter Name' })
    ).not.toBeInTheDocument();
  });

  it('filters rows while typing and restores them when cleared', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={people} filterable />);

    const nameFilter = screen.getByRole('textbox', { name: 'Filter Name' });
    expect(
      screen.getByRole('textbox', { name: 'Filter Age' })
    ).toBeInTheDocument();

    await user.type(nameFilter, 'ali');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();

    await user.clear(nameFilter);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Evan')).toBeInTheDocument();
  });

  it('skips the input for columns switched off via meta.filterable', () => {
    const mixedColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age', meta: { filterable: false } },
    ];
    render(<DataTable columns={mixedColumns} data={people} filterable />);

    expect(
      screen.getByRole('textbox', { name: 'Filter Name' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Filter Age' })
    ).not.toBeInTheDocument();
  });

  it('lets a columnDef filterFn replace the default includesString', async () => {
    const user = userEvent.setup();
    const startsWithColumns: DataTableColumnDef<Person>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        // 'a' matches Alice only under startsWith — Charlie and Diana
        // merely contain it.
        filterFn: (row, columnId, filterValue) =>
          String(row.getValue(columnId))
            .toLowerCase()
            .startsWith(String(filterValue).toLowerCase()),
      },
      { accessorKey: 'age', header: 'Age', meta: { filterable: false } },
    ];
    render(<DataTable columns={startsWithColumns} data={people} filterable />);

    await user.type(screen.getByRole('textbox', { name: 'Filter Name' }), 'a');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    expect(screen.queryByText('Diana')).not.toBeInTheDocument();
  });
});

describe('DataTable enterprise features accessibility', () => {
  it('has no axe violations with a row expanded and the filter row present', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        sortable
        filterable
        getRowCanExpand={() => true}
        renderExpandedRow={(row) => (
          <div>
            Details for {row.original.name} (age {row.original.age})
          </div>
        )}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Expand row u1' }));

    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations with the column settings menu open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        columnToggle
      />
    );
    await user.click(screen.getByRole('button', { name: 'Columns' }));

    const results = await axe(document.body, {
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

  it('mirrors one colgroup into the header and every row table', () => {
    const widthColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { width: 200 } },
      { accessorKey: 'age', header: 'Age' },
    ];
    const { container } = render(
      <DataTable
        columns={widthColumns}
        data={many}
        selectable
        virtualized
        getRowId={rowId}
      />
    );

    const tables = Array.from(container.querySelectorAll('table'));
    const widthsOf = (table: Element) =>
      Array.from(table.querySelectorAll('col')).map((col) => col.style.width);

    // Header table plus the windowed row tables — every sibling carries the
    // same col sequence, which is how they stay column-aligned.
    expect(tables.length).toBeGreaterThan(2);
    for (const table of tables) {
      expect(widthsOf(table)).toEqual(widthsOf(tables[0]!));
    }
    // Selection column fixed, `meta.width` pinned, remainder shared.
    expect(widthsOf(tables[0]!)).toEqual([
      'calc(var(--haze-space-3) * 2 + var(--haze-space-5))',
      '200px',
      '',
    ]);
  });

  it('leaves unspecified columns width-free so fixed layout shares the remainder equally', () => {
    const { container } = render(
      <DataTable columns={columns} data={many} virtualized getRowId={rowId} />
    );

    const headerTable = container.querySelector('table');
    expect(headerTable?.className).toContain('fixedLayout');
    const cols = headerTable?.querySelectorAll('col');
    expect(cols).toHaveLength(2);
    cols?.forEach((col) => expect(col.style.width).toBe(''));
  });

  it('ignores fixed columns when virtualized', () => {
    const fixedColumns: DataTableColumnDef<Person>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        meta: { width: 120, fixed: 'left' },
      },
      { accessorKey: 'age', header: 'Age', meta: { fixed: 'right' } },
    ];
    const { container } = render(
      <DataTable
        columns={fixedColumns}
        data={many}
        selectable
        virtualized
        getRowId={rowId}
      />
    );

    container.querySelectorAll<HTMLElement>('th, td').forEach((cell) => {
      expect(cell.style.left).toBe('');
      expect(cell.style.right).toBe('');
      expect(cell.className).not.toContain('fixedCell');
    });
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

// ─── Tree data (subRows) ───────────────────────────────────────

type OrgUnit = {
  id: string;
  name: string;
  headcount: number;
  subRows?: OrgUnit[];
};

const org: OrgUnit[] = [
  {
    id: 'eng',
    name: 'Engineering',
    headcount: 40,
    subRows: [
      {
        id: 'platform',
        name: 'Platform',
        headcount: 12,
        subRows: [{ id: 'infra', name: 'Infrastructure', headcount: 5 }],
      },
      { id: 'product', name: 'Product', headcount: 10 },
    ],
  },
  { id: 'sales', name: 'Sales', headcount: 8 },
];

const orgColumns: DataTableColumnDef<OrgUnit>[] = [
  { accessorKey: 'name', header: 'Team' },
  { accessorKey: 'headcount', header: 'Headcount' },
];

describe('DataTable tree data', () => {
  it('renders only roots until a parent is expanded', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={orgColumns} data={org} getRowId={(row) => row.id} />
    );

    expect(bodyRows()).toHaveLength(2);
    // Expanders appear on parents only — leaves stay bare.
    expect(
      screen.getByRole('button', { name: 'Expand row eng' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Expand row sales' })
    ).not.toBeInTheDocument();
    // Tree expanders carry no aria-controls: the controlled region is not
    // a single element (children are rows), unlike the panel flavor.
    expect(
      screen.getByRole('button', { name: 'Expand row eng' })
    ).not.toHaveAttribute('aria-controls');

    await user.click(screen.getByRole('button', { name: 'Expand row eng' }));

    // Children render as real rows in document order; grandchildren stay
    // hidden until their own parent opens.
    expect(bodyRows()).toHaveLength(4);
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.queryByText('Infrastructure')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Collapse row eng' })
    ).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Expand row platform' }));
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(5);
  });

  it('indents children by depth in the first content column', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={orgColumns} data={org} getRowId={(row) => row.id} />
    );

    await user.click(screen.getByRole('button', { name: 'Expand row eng' }));
    await user.click(
      screen.getByRole('button', { name: 'Expand row platform' })
    );

    const indentOf = (label: string) => {
      const row = screen.getByText(label).closest('tr');
      const firstCell = within(row as HTMLElement).getAllByRole('cell')[0];
      return firstCell?.querySelector<HTMLElement>(
        ':scope > span[aria-hidden="true"]'
      );
    };
    // One indent unit per depth level; roots carry none.
    expect(indentOf('Platform')?.style.width).toBe(
      'calc(var(--haze-space-4) * 1)'
    );
    expect(indentOf('Infrastructure')?.style.width).toBe(
      'calc(var(--haze-space-4) * 2)'
    );
    expect(indentOf('Engineering')).toBeNull();
    // The selection column, when present, keeps its own un-indented cell.
  });

  it('reads the tree from a custom subRowsKey', async () => {
    type Node = { id: string; name: string; children?: Node[] };
    const nodes: Node[] = [
      {
        id: 'root',
        name: 'Root',
        children: [{ id: 'leaf', name: 'Leaf' }],
      },
    ];
    const user = userEvent.setup();
    render(
      <DataTable
        columns={[{ accessorKey: 'name', header: 'Name' }] as DataTableColumnDef<Node>[]}
        data={nodes}
        getRowId={(row) => row.id}
        subRowsKey='children'
      />
    );

    await user.click(screen.getByRole('button', { name: 'Expand row root' }));
    expect(screen.getByText('Leaf')).toBeInTheDocument();
  });

  it('keeps expanded control semantics for tree rows', () => {
    function Harness() {
      const [, , expandedCtrl] = useControl<ExpandedState>(undefined, {
        eng: true,
      });
      return (
        <DataTable
          columns={orgColumns}
          data={org}
          getRowId={(row) => row.id}
          expanded={expandedCtrl}
        />
      );
    }

    render(<Harness />);

    // The controlled initial state opens the parent from the start.
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand row platform' })
    ).toBeInTheDocument();
  });

  it('gives explicit expansion props priority over subRows data', () => {
    render(
      <DataTable
        columns={orgColumns}
        data={org}
        getRowId={(row) => row.id}
        expanded={{ eng: true }}
        renderExpandedRow={(row) => <output>Panel {row.id}</output>}
      />
    );

    // The custom panel flavor wins: subRows are never read, so no child
    // rows flatten into the body — only the panel renders below the row.
    expect(screen.getByText('Panel eng')).toBeInTheDocument();
    expect(screen.queryByText('Platform')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand row platform' })).not.toBeInTheDocument();
  });

  it('ignores subRows data entirely without any expansion opt-in state', () => {
    // No explicit props and subRows present, but expanded state default {}
    // keeps everything collapsed — the plain flat view of the roots.
    render(
      <DataTable columns={orgColumns} data={org} getRowId={(row) => row.id} />
    );

    expect(bodyRows()).toHaveLength(2);
    expect(screen.queryByText('Platform')).not.toBeInTheDocument();
  });
});

// ─── Summary rows ──────────────────────────────────────────────

describe('DataTable summary', () => {
  const summaryOf: NonNullable<DataTableProps<Person>['summary']> = (rows) => [
    {
      label: 'Totals',
      cells: [
        `count ${dataTableCount(rows)}`,
        `sum ${dataTableSum(rows, 'age')}`,
      ],
    },
  ];

  it('renders a labeled tfoot row with one cell per column', () => {
    render(
      <DataTable columns={columns} data={people} summary={summaryOf} />
    );

    const summaryRow = screen.getByRole('row', { name: 'Totals' });
    expect(summaryRow.closest('tfoot')).toBeInTheDocument();
    const cells = within(summaryRow).getAllByRole('cell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent('count 5');
    expect(cells[1]).toHaveTextContent('sum 160');
  });

  it('summarizes the whole filtered data, not the current page', () => {
    render(
      <DataTable
        columns={columns}
        data={people}
        pageSize={2}
        summary={summaryOf}
      />
    );

    expect(screen.getByRole('row', { name: 'Totals' })).toHaveTextContent(
      'count 5'
    );
    expect(screen.getByRole('row', { name: 'Totals' })).toHaveTextContent(
      'sum 160'
    );
  });

  it('aligns the selection column with an empty leading cell', () => {
    render(
      <DataTable
        columns={columns}
        data={people}
        selectable
        getRowId={rowId}
        summary={summaryOf}
      />
    );

    const cells = within(
      screen.getByRole('row', { name: 'Totals' })
    ).getAllByRole('cell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveTextContent('');
    expect(cells[1]).toHaveTextContent('count 5');
  });

  it('skips the footer while loading or empty', () => {
    const { rerender } = render(
      <DataTable columns={columns} data={people} loading summary={summaryOf} />
    );
    expect(document.querySelector('tfoot')).toBeNull();

    rerender(<DataTable columns={columns} data={[]} summary={summaryOf} />);
    expect(document.querySelector('tfoot')).toBeNull();
  });

  it('applies the sticky footer variant only when stickyFooter', () => {
    const { rerender } = render(
      <DataTable columns={columns} data={people} summary={summaryOf} />
    );
    expect(document.querySelector('tfoot')?.className).not.toContain(
      'stickyFoot'
    );

    rerender(
      <DataTable
        columns={columns}
        data={people}
        stickyHeader
        stickyFooter
        summary={summaryOf}
      />
    );
    expect(document.querySelector('tfoot')?.className).toContain('stickyFoot');
  });

  it('toggles the summary through the helpers with sparse numeric data', () => {
    type Item = { id: string; label: string; qty?: number };
    const items: Item[] = [
      { id: 'a', label: 'A', qty: 2 },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C', qty: 4 },
    ];
    render(
      <DataTable
        columns={[
          { accessorKey: 'label', header: 'Label' },
          { accessorKey: 'qty', header: 'Qty' },
        ] as DataTableColumnDef<Item>[]}
        data={items}
        getRowId={(row) => row.id}
        summary={(rows) => [
          {
            cells: [
              `count ${dataTableCount(rows)}`,
              `sum ${dataTableSum(rows, 'qty')}`,
            ],
          },
          {
            cells: [
              `avg ${dataTableAvg(rows, 'qty')}`,
              `labelSum ${dataTableSum(rows, 'label')}`,
            ],
          },
          { cells: [() => dataTableAvg(rows, 'label') ?? '—', ''] },
        ]}
      />
    );

    // Missing cells drop out of both divisor and total; string columns sum
    // to 0 and never produce an average.
    expect(screen.getByText('count 3')).toBeInTheDocument();
    expect(screen.getByText('sum 6')).toBeInTheDocument();
    expect(screen.getByText('avg 3')).toBeInTheDocument();
    expect(screen.getByText('labelSum 0')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

// ─── Editable cells ────────────────────────────────────────────

describe('DataTable cell editing', () => {
  it('leaves cells inert unless editable', () => {
    render(<DataTable columns={columns} data={people} getRowId={rowId} />);

    expect(screen.getByText('Charlie').closest('td')).not.toHaveAttribute(
      'tabindex'
    );
  });

  it('enters edit mode on double-click with a labeled focused input', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={people} getRowId={rowId} editable />
    );

    const cell = screen.getByText('Charlie').closest('td')!;
    expect(cell).toHaveAttribute('tabindex', '0');
    await user.dblClick(cell);

    const input = screen.getByRole('textbox', {
      name: 'Edit Name in row u1',
    });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Charlie');
    // The resting cell content is replaced while editing.
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  it('enters edit mode with Enter on the focused cell', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={people} getRowId={rowId} editable />
    );

    const cell = screen.getByText('Alice').closest('td')!;
    cell.focus();
    await user.keyboard('{Enter}');

    expect(
      screen.getByRole('textbox', { name: 'Edit Name in row u2' })
    ).toBeInTheDocument();
  });

  it('saves on Enter and reports the edit without touching data', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        editable
        onCellEdit={onCellEdit}
      />
    );

    await user.dblClick(screen.getByText('Charlie').closest('td') as HTMLElement);
    const input = screen.getByRole('textbox', { name: 'Edit Name in row u1' });
    await user.type(input, ' Jr.');
    await user.keyboard('{Enter}');

    expect(onCellEdit).toHaveBeenCalledTimes(1);
    expect(onCellEdit).toHaveBeenCalledWith('u1', 'name', 'Charlie Jr.', 'Charlie');
    // The data is consumer-owned: the cell keeps rendering the old value.
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('cancels on Escape without reporting', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        editable
        onCellEdit={onCellEdit}
      />
    );

    await user.dblClick(screen.getByText('Charlie').closest('td') as HTMLElement);
    const input = screen.getByRole('textbox', { name: 'Edit Name in row u1' });
    await user.type(input, ' Jr.');
    await user.keyboard('{Escape}');

    expect(onCellEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    // Focus returns to the cell so keyboard flow continues.
    expect(screen.getByText('Charlie').closest('td')).toHaveFocus();
  });

  it('saves on blur when focus leaves the editor', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        editable
        onCellEdit={onCellEdit}
      />
    );

    await user.dblClick(screen.getByText('Bob').closest('td') as HTMLElement);
    const input = screen.getByRole('textbox', { name: 'Edit Name in row u3' });
    await user.type(input, '!');
    await user.tab();

    expect(onCellEdit).toHaveBeenCalledTimes(1);
    expect(onCellEdit).toHaveBeenCalledWith('u3', 'name', 'Bob!', 'Bob');
  });

  it('does not report when the value is unchanged', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={people}
        getRowId={rowId}
        editable
        onCellEdit={onCellEdit}
      />
    );

    await user.dblClick(screen.getByText('Charlie').closest('td') as HTMLElement);
    await user.keyboard('{Enter}');

    expect(onCellEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('parses numbers for the number editor, reporting null when cleared', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    const numberColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { editor: false } },
      { accessorKey: 'age', header: 'Age', meta: { editor: 'number' } },
    ];
    render(
      <DataTable
        columns={numberColumns}
        data={people}
        getRowId={rowId}
        editable
        onCellEdit={onCellEdit}
      />
    );

    await user.dblClick(screen.getByText('35').closest('td') as HTMLElement);
    const input = screen.getByRole('spinbutton', {
      name: 'Edit Age in row u1',
    });
    expect(input).toHaveAttribute('type', 'number');
    await user.clear(input);
    await user.type(input, '42');
    await user.keyboard('{Enter}');
    expect(onCellEdit).toHaveBeenCalledWith('u1', 'age', 42, 35);

    // Clearing the draft commits null rather than coercing to 0.
    await user.dblClick(screen.getByText('28').closest('td') as HTMLElement);
    const second = screen.getByRole('spinbutton', {
      name: 'Edit Age in row u2',
    });
    await user.clear(second);
    await user.keyboard('{Enter}');
    expect(onCellEdit).toHaveBeenCalledWith('u2', 'age', null, 28);
  });

  it('opts columns out through meta.editor false', async () => {
    const user = userEvent.setup();
    const mixedColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { editor: false } },
      { accessorKey: 'age', header: 'Age' },
    ];
    render(
      <DataTable columns={mixedColumns} data={people} getRowId={rowId} editable />
    );

    expect(screen.getByText('Charlie').closest('td')).not.toHaveAttribute(
      'tabindex'
    );
    expect(screen.getByText('35').closest('td')).toHaveAttribute(
      'tabindex',
      '0'
    );

    // Opted-out cells ignore double-clicks.
    await user.dblClick(screen.getByText('Charlie').closest('td') as HTMLElement);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders a custom editor with save and cancel channels', async () => {
    const user = userEvent.setup();
    const onCellEdit = vi.fn();
    const customColumns: DataTableColumnDef<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'age',
        header: 'Age',
        meta: {
          editor: ({ value, row, onSave, onCancel }) => (
            <div>
              <output>{`editing ${row.id}:${row.getValue('name') as string}`}</output>
              <button type='button' onClick={() => onSave(Number(value) + 1)}>
                Bump
              </button>
              <button type='button' onClick={onCancel}>
                Dismiss
              </button>
            </div>
          ),
        },
      },
    ];
    render(
      <DataTable
        columns={customColumns}
        data={people}
        getRowId={rowId}
        editable
        onCellEdit={onCellEdit}
      />
    );

    await user.dblClick(screen.getByText('35').closest('td') as HTMLElement);
    expect(screen.getByText('editing u1:Charlie')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(screen.getByText('35')).toBeInTheDocument();

    await user.dblClick(screen.getByText('35').closest('td') as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Bump' }));
    expect(onCellEdit).toHaveBeenCalledWith('u1', 'age', 36, 35);
    expect(screen.getByText('35')).toBeInTheDocument();
  });
});

// ─── Tree data + virtualization + summary interplay ────────────

describe('DataTable enterprise tree, virtualization and summary', () => {
  // Same jsdom mocks as the virtualization suite: no layout, no
  // ResizeObserver — the observer reports synchronously and the rect mock
  // fabricates the heights DataTable measures (scroll region 400, header 40).
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

  let rectSpy: MockInstance;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        if (this.tagName === 'THEAD') {
          return { height: 40 } as DOMRect;
        }
        if (this.tagName === 'DIV') {
          return { height: 400 } as DOMRect;
        }
        return { height: 0 } as DOMRect;
      });
  });

  afterEach(() => {
    rectSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  const groups = Array.from({ length: 100 }, (_, index) => ({
    id: `g${index}`,
    name: `Group ${index}`,
    subRows: [
      { id: `g${index}-a`, name: `Item ${index}.a` },
      { id: `g${index}-b`, name: `Item ${index}.b` },
    ],
  }));

  it('flows expanded tree children through the virtualized window', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={[{ accessorKey: 'name', header: 'Name' }] as DataTableColumnDef<(typeof groups)[number]>[]}
        data={groups}
        virtualized
        getRowId={(row) => row.id}
      />
    );

    expect(bodyRows()).toHaveLength(16);
    expect(screen.queryByText('Item 0.a')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand row g0' }));

    // The expanded row model already yields the flat display order, so
    // the window simply mounts 16 of the now-102 rows: g0's children slot
    // in right after it and push Group 14 out of the window.
    expect(bodyRows()).toHaveLength(16);
    expect(screen.getByText('Item 0.a')).toBeInTheDocument();
    expect(screen.getByText('Item 0.b')).toBeInTheDocument();
    expect(screen.queryByText('Group 14')).not.toBeInTheDocument();
  });

  it('pins the summary outside the virtualized scroll window', () => {
    render(
      <DataTable
        columns={columns}
        data={people}
        virtualized
        summary={(rows) => [{ label: 'Totals', cells: ['Total', dataTableSum(rows, 'age')] }]}
      />
    );

    // The summary is a single tfoot in its own sibling table below the
    // VirtualList — the header table never contains it.
    const tfoot = document.querySelector('tfoot');
    expect(tfoot).toBeInTheDocument();
    expect(tfoot?.querySelector('td')).toHaveTextContent('Total');
    const tables = document.querySelectorAll('table');
    // header + 5 row tables (all rows fit the window) + the summary table
    expect(tables).toHaveLength(7);
    expect(tables[0]?.contains(tfoot as Node)).toBe(false);
    expect(tables[6]).toContainElement(tfoot);
  });
});

describe('DataTable tree, summary and editing accessibility', () => {
  it('has no axe violations with a tree expanded, summary footer and an open editor', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        columns={orgColumns}
        data={org}
        getRowId={(row) => row.id}
        expanded={{ eng: true }}
        summary={(rows) => [
          { label: 'Totals', cells: ['Total', dataTableSum(rows, 'headcount')] },
        ]}
        editable
      />
    );
    await user.dblClick(screen.getByText('Sales').closest('td') as HTMLElement);

    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
