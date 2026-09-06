import type { RowSelectionState } from '@tanstack/react-table';

import type { DataTableColumnDef } from './DataTable';

import { render, screen } from '@testing-library/react';
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
