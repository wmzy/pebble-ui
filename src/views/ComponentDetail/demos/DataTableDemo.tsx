import type { ExpandedState, RowSelectionState } from '@tanstack/react-table';

import type { DataTableColumnDef } from '@/lib';

import { useState } from 'react';

import { useControl } from 'react-use-control';

import { Badge, DataTable } from '@/lib';


import PropsTable from '../PropsTable';
import A11yNote from '../A11yNote';

import { intro, section, row } from '../styles';

import { CssVarsSection, dataTableNote } from './shared';

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

// Column widths + pinned columns: meta.width (number = px, or a CSS
// length string) flows into a shared <colgroup>; meta.fixed pins the
// column to the scroll area's edge. Fixed columns should declare px
// widths — the sticky offset sums the preceding fixed widths.
const wideColumns: DataTableColumnDef<EmployeeRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info) => <strong>{info.getValue() as string}</strong>,
    meta: { width: 140, fixed: 'left' },
  },
  { accessorKey: 'role', header: 'Role', meta: { width: '32%' } },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => statusBadge(info.getValue() as EmployeeStatus),
    meta: { sortable: false },
  },
  { accessorKey: 'score', header: 'Score', meta: { width: 90 } },
  { accessorKey: 'joined', header: 'Joined', meta: { width: 120, fixed: 'right' } },
];

// Enterprise combination — per-column switches on top of the table-level
// ones: Status is pinned in the visibility menu (meta.hideable), Score
// opts out of the filter row (meta.filterable).
const enterpriseColumns: DataTableColumnDef<EmployeeRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info) => <strong>{info.getValue() as string}</strong>,
    meta: { width: 150 },
  },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => statusBadge(info.getValue() as EmployeeStatus),
    meta: { hideable: false },
  },
  { accessorKey: 'score', header: 'Score', meta: { filterable: false } },
  { accessorKey: 'joined', header: 'Joined', meta: { width: 120 } },
];

export default function DataTableDemo() {
  const [loading, setLoading] = useState(false);
  const [, setSelection, selectionCtrl] = useControl(
    undefined,
    {} as RowSelectionState
  );
  // Controlled expansion (ctrl form): the buttons below drive the same
  // Control the table binds to.
  const [, setExpanded, expandedCtrl] = useControl<ExpandedState>(undefined, {});

  return (
    <>
      <h1>DataTable</h1>
      <p className={intro}>
        Feature-complete table on top of TanStack Table v9 with the haze skin:
        opt-in sorting, row selection, pagination, loading skeleton, empty
        state, sticky header, column resizing, per-column filtering, column
        visibility and expandable rows. The plain <code>Table</code>{' '}
        primitives remain available for bespoke layouts.
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
        <h2>Column widths &amp; fixed columns</h2>
        <p className={dataTableNote}>
          Declare sizing through <code>meta.width</code> — a number is px,
          strings pass through as CSS lengths (<code>&apos;32%&apos;</code>,{' '}
          <code>&apos;12rem&apos;</code>; the native TanStack{' '}
          <code>size</code> field works as a px fallback). Pin columns with{' '}
          <code>meta.fixed</code> so they stay visible while the rest
          scrolls horizontally — here <em>Name</em> sticks left and{' '}
          <em>Joined</em> right in a narrowed viewport. Normal mode only;
          virtualized tables ignore <code>fixed</code>.
        </p>
        <div style={{ maxWidth: 560 }}>
          <DataTable
            columns={wideColumns}
            data={PEOPLE}
            sortable
            getRowId={(employee) => String(employee.id)}
          />
        </div>
      </div>

      <div className={section}>
        <h2>Enterprise: resize, filter, column menu &amp; expansion</h2>
        <p className={dataTableNote}>
          Four independent opt-ins that compose: <code>resizable</code> adds
          header drag handles (double-click resets to the declared width;
          ArrowLeft/ArrowRight nudge ±5px, mirrored under RTL),{' '}
          <code>filterable</code> adds a filter row under the header
          (case-insensitive contains; <em>Score</em> opts out via{' '}
          <code>meta.filterable</code>), <code>columnToggle</code> adds the
          column visibility menu (<em>Status</em> is pinned through{' '}
          <code>meta.hideable</code>), and <code>getRowCanExpand</code> +{' '}
          <code>renderExpandedRow</code> add expandable detail rows — here
          only for high scorers, driven through a controlled{' '}
          <code>expanded</code> Control.
        </p>
        <div className={row}>
          <button onClick={() => setExpanded(true)}>Expand all</button>
          <button onClick={() => setExpanded({})}>Collapse all</button>
        </div>
        <DataTable
          columns={enterpriseColumns}
          data={PEOPLE}
          sortable
          resizable
          filterable
          columnToggle
          expanded={expandedCtrl}
          getRowCanExpand={(row) => row.original.score >= 85}
          renderExpandedRow={(row) => (
            <p>
              <strong>{row.original.name}</strong> — {row.original.role},
              joined {row.original.joined}. Current score{' '}
              {row.original.score}.
            </p>
          )}
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
            <li>
              Resize handles are focusable <code>separator</code> widgets:
              ArrowLeft/ArrowRight nudge the width (mirrored under RTL),
              double-click resets it
            </li>
            <li>
              Expander buttons expose <code>aria-expanded</code> and{' '}
              <code>aria-controls</code>; the panel is a row spanning every
              column
            </li>
            <li>
              Filter inputs are labeled textboxes; the column menu&apos;s
              checkboxes carry <code>menuitemcheckbox</code> semantics
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='data-table' />
    </>
  );
}
