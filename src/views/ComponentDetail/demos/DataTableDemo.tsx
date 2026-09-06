import type { RowSelectionState } from '@tanstack/react-table';

import type { DataTableColumnDef } from '@/lib';

import { useState } from 'react';

import { useControl } from 'react-use-control';

import { Badge, DataTable } from '@/lib';


import PropsTable from '../PropsTable';
import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection } from './shared';

// ─── DataTable ─────────────────────────────────────────────────
type EmployeeStatus = 'active' | 'away' | 'offline';

type EmployeeRow = {
  id: number;
  name: string;
  role: string;
  status: EmployeeStatus;
  score: number;
  joined: string;
};

const PEOPLE: EmployeeRow[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', status: 'active', score: 92, joined: '2021-04-12' },
  { id: 2, name: 'Grace Hopper', role: 'Engineering Manager', status: 'active', score: 88, joined: '2019-09-02' },
  { id: 3, name: 'Alan Turing', role: 'Researcher', status: 'away', score: 79, joined: '2020-01-20' },
  { id: 4, name: 'Katherine Johnson', role: 'Data Analyst', status: 'active', score: 95, joined: '2018-06-15' },
  { id: 5, name: 'Edsger Dijkstra', role: 'Engineer', status: 'offline', score: 84, joined: '2022-11-30' },
  { id: 6, name: 'Barbara Liskov', role: 'Architect', status: 'active', score: 91, joined: '2017-03-08' },
  { id: 7, name: 'Donald Knuth', role: 'Researcher', status: 'away', score: 87, joined: '2016-05-19' },
  { id: 8, name: 'Margaret Hamilton', role: 'Engineering Manager', status: 'active', score: 90, joined: '2020-12-01' },
];

const statusBadge = (status: EmployeeStatus) => {
  const variant =
    status === 'active' ? 'success' : status === 'away' ? 'warning' : 'default';
  return <Badge variant={variant}>{status}</Badge>;
};

const baseColumns: DataTableColumnDef<EmployeeRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info) => <strong>{info.getValue() as string}</strong>,
  },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => statusBadge(info.getValue() as EmployeeStatus),
    meta: { sortable: false },
  },
  { accessorKey: 'score', header: 'Score' },
  { accessorKey: 'joined', header: 'Joined' },
];

export default function DataTableDemo() {
  const [loading, setLoading] = useState(false);
  const [, setSelection, selectionCtrl] = useControl(
    undefined,
    {} as RowSelectionState
  );

  return (
    <>
      <h1>DataTable</h1>
      <p className={intro}>
        Feature-complete table on top of TanStack Table v9 with the haze skin:
        opt-in sorting, row selection, pagination, loading skeleton, empty
        state and sticky header. The plain <code>Table</code> primitives
        remain available for bespoke layouts.
      </p>

      <div className={section}>
        <h2>Sortable, selectable, paginated</h2>
        <div className={row}>
          <button onClick={() => setLoading((v) => !v)}>
            {loading ? 'Show data' : 'Show loading'}
          </button>
          <button onClick={() => setSelection({})}>Clear selection</button>
        </div>
        <DataTable
          columns={baseColumns}
          data={loading ? [] : PEOPLE}
          sortable
          selectable
          rowSelection={selectionCtrl}
          pageSize={5}
          getRowId={(employee) => String(employee.id)}
          loading={loading}
          stickyHeader
          empty={<>No employees found</>}
        />
      </div>

      <div className={section}>
        <h2>Minimal — plain columns</h2>
        <DataTable
          columns={baseColumns.slice(0, 3)}
          data={PEOPLE.slice(0, 4)}
          getRowId={(employee) => String(employee.id)}
        />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DataTableProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Sortable headers expose <code>aria-sort</code> and act as buttons
            </li>
            <li>
              The selection column is a real checkbox column with an
              indeterminate select-all
            </li>
            <li>Pagination reuses the Pagination component&apos;s semantics</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='data-table' />
    </>
  );
}
