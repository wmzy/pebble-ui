import type { SortingState } from '@tanstack/react-table';

import type { DataTableColumnDef, FieldValidator } from '@/lib';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@linaria/core';
import { z } from 'zod';
import { Form, useForm } from 'react-f0rm';
import { useControl } from 'react-use-control';

import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  FormItem,
  Input,
  InputCore,
  Option,
  SelectCore,
  ToastContainer,
  useToast,
  zodResolver,
} from '@/lib';

/*
 * The live source behind the Recipes "CRUD table" section — the docs
 * show this very file via ?raw, so demo and code never drift. Shape is
 * the classic CRUD screen: list + search + server pagination/sorting +
 * create/edit dialog form + delete confirm + toast feedback.
 */

// ─── The fake server ────────────────────────────────────────────────────
// Same contract a real backend offers: query(page, sorting, search) →
// { rows, pageCount } plus create/update/delete mutations. The demo
// shell adds a 300ms roundtrip delay so loading states are visible;
// swap the bodies for fetch() calls and nothing else changes.

type MemberRole = 'admin' | 'editor' | 'viewer';

type MemberRow = {
  id: number;
  name: string;
  email: string;
  role: MemberRole;
};

const CRUD_PAGE_SIZE = 6;

const SERVER_MEMBERS: MemberRow[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@haze.dev', role: 'admin' },
  { id: 2, name: 'Grace Hopper', email: 'grace@haze.dev', role: 'editor' },
  { id: 3, name: 'Alan Turing', email: 'alan@haze.dev', role: 'viewer' },
  { id: 4, name: 'Katherine Johnson', email: 'katherine@haze.dev', role: 'editor' },
  { id: 5, name: 'Edsger Dijkstra', email: 'edsger@haze.dev', role: 'viewer' },
  { id: 6, name: 'Barbara Liskov', email: 'barbara@haze.dev', role: 'admin' },
  { id: 7, name: 'Donald Knuth', email: 'donald@haze.dev', role: 'viewer' },
  { id: 8, name: 'Margaret Hamilton', email: 'margaret@haze.dev', role: 'editor' },
  { id: 9, name: 'Dennis Ritchie', email: 'dennis@haze.dev', role: 'viewer' },
  { id: 10, name: 'Radia Perlman', email: 'radia@haze.dev', role: 'editor' },
  { id: 11, name: 'Tim Berners-Lee', email: 'tim@haze.dev', role: 'viewer' },
  { id: 12, name: 'Anita Borg', email: 'anita@haze.dev', role: 'admin' },
  { id: 13, name: 'Linus Torvalds', email: 'linus@haze.dev', role: 'viewer' },
];

function nextMemberId() {
  return SERVER_MEMBERS.reduce((max, member) => Math.max(max, member.id), 0) + 1;
}

function createMember(values: MemberFormValues) {
  // Newest first — most real CRUD endpoints default to reverse-chronological
  // order, and it is what makes "go to page 1" after a create land the new
  // record on screen.
  SERVER_MEMBERS.unshift({ id: nextMemberId(), ...values, role: values.role as MemberRole });
}

function updateMember(id: number, values: MemberFormValues) {
  const index = SERVER_MEMBERS.findIndex((member) => member.id === id);
  if (index !== -1) {
    SERVER_MEMBERS[index] = {
      ...SERVER_MEMBERS[index]!,
      ...values,
      role: values.role as MemberRole,
    };
  }
}

function deleteMember(id: number) {
  const index = SERVER_MEMBERS.findIndex((member) => member.id === id);
  if (index !== -1) SERVER_MEMBERS.splice(index, 1);
}

function queryMembers(
  page: number,
  sorting: SortingState,
  search: string
): { rows: MemberRow[]; pageCount: number } {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? SERVER_MEMBERS.filter(
        (member) =>
          member.name.toLowerCase().includes(q) ||
          member.email.toLowerCase().includes(q)
      )
    : SERVER_MEMBERS;
  const first = sorting[0];
  const sorted = first
    ? [...filtered].sort((a, b) => {
        // key narrows past 'id' in the else branch → plain string compare
        const key = first.id as keyof MemberRow;
        const cmp = key === 'id' ? a.id - b.id : a[key].localeCompare(b[key]);
        return first.desc ? -cmp : cmp;
      })
    : filtered;
  return {
    rows: sorted.slice((page - 1) * CRUD_PAGE_SIZE, page * CRUD_PAGE_SIZE),
    pageCount: Math.max(1, Math.ceil(filtered.length / CRUD_PAGE_SIZE)),
  };
}

// ─── Form: zod validators, one adapter per schema ──────────────────────

type MemberFormValues = { name: string; email: string; role: MemberRole | '' };

const validateName: FieldValidator<MemberFormValues, 'name'> = zodResolver(
  z.string().min(2, 'Name must be at least 2 characters')
);
const validateEmail: FieldValidator<MemberFormValues, 'email'> = zodResolver(
  z.email('Enter a valid email address')
);
const validateRole: FieldValidator<MemberFormValues, 'role'> = zodResolver(
  z.enum(['admin', 'editor', 'viewer'], { message: 'Pick a role' })
);

function roleBadge(role: MemberRole) {
  if (role === 'admin') return <Badge variant='info'>{role}</Badge>;
  if (role === 'editor') return <Badge variant='success'>{role}</Badge>;
  return <Badge>{role}</Badge>;
}

/**
 * One dialog form, fresh per open: the parent remounts it (key=session),
 * so `initialValues` alone loads the record being edited — no reset
 * plumbing. The `input` channel binds the cores declaratively; FormItem
 * wires id, aria attributes, onBlur/onChange and the value itself.
 */
function MemberForm({
  member,
  onCancel,
  onSubmit,
}: {
  member: MemberRow | null;
  onCancel: () => void;
  onSubmit: (values: MemberFormValues) => void;
}) {
  const form = useForm<MemberFormValues>({
    initialValues: member
      ? { name: member.name, email: member.email, role: member.role }
      : { name: '', email: '', role: '' },
  });

  return (
    <Form form={form} onValidSubmit={onSubmit}>
      <div className={formGrid}>
        <FormItem
          form={form}
          name='name'
          label='Name'
          validate={validateName}
          mode='onBlur'
          input={InputCore}
          placeholder='Ada Lovelace'
        />
        <FormItem
          form={form}
          name='email'
          label='Email'
          validate={validateEmail}
          mode='onBlur'
          input={InputCore}
          placeholder='ada@haze.dev'
        />
        <FormItem
          form={form}
          name='role'
          label='Role'
          validate={validateRole}
          mode='onBlur'
          input={SelectCore}
        >
          <Option value=''>Pick a role…</Option>
          <Option value='admin'>Admin</Option>
          <Option value='editor'>Editor</Option>
          <Option value='viewer'>Viewer</Option>
        </FormItem>
      </div>
      <div className={formFooter}>
        {/* haze Button renders type="button" — drive the form's submit
            flow explicitly, as the zod recipe does. */}
        <Button onClick={(e) => e.currentTarget.form?.requestSubmit()}>
          Save
        </Button>
        <Button variant='ghost' onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}

// ─── The screen ─────────────────────────────────────────────────────────

export function MemberCrudDemo() {
  return (
    <ToastContainer>
      <MemberCrud />
    </ToastContainer>
  );
}

function MemberCrud() {
  const toast = useToast();

  // Search flows through a Control: a plain value would be an
  // uncontrolled *initial* value — later prop changes are ignored. The
  // Input's own writes update `search`; the native onChange below only
  // restarts the pagination.
  const [search, , searchCtrl] = useControl(undefined, '');

  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  // Bumped by every mutation — the refetch trigger for the current
  // (page, sorting, search).
  const [reloadKey, setReloadKey] = useState(0);

  // The last answer the server gave. While it lags the requested
  // (page, sorting, search, reloadKey) the table shows the loading
  // skeleton — derived, never stored.
  const [snapshot, setSnapshot] = useState(() => ({
    page: 1,
    sorting: [] as SortingState,
    search: '',
    reloadKey: 0,
    ...queryMembers(1, [], ''),
  }));
  const pending =
    snapshot.page !== page ||
    snapshot.sorting !== sorting ||
    snapshot.search !== search ||
    snapshot.reloadKey !== reloadKey;

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      setSnapshot({
        page,
        sorting,
        search,
        reloadKey,
        ...queryMembers(page, sorting, search),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [pending, page, sorting, search, reloadKey]);

  // Dialog state: open travels through a Control (same rule as search);
  // `editing === null` means create mode, and `session` remounts the
  // form on every open so initialValues reload the record.
  const [, setDialogOpen, dialogOpenCtrl] = useControl(undefined, false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [session, setSession] = useState(0);

  const [, setConfirmOpen, confirmOpenCtrl] = useControl(undefined, false);
  const [pendingDelete, setPendingDelete] = useState<MemberRow | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setSession((s) => s + 1);
    setDialogOpen(true);
  }, [setDialogOpen]);
  const openEdit = useCallback(
    (member: MemberRow) => {
      setEditing(member);
      setSession((s) => s + 1);
      setDialogOpen(true);
    },
    [setDialogOpen]
  );
  const closeDialog = useCallback(() => setDialogOpen(false), [setDialogOpen]);

  const askDelete = useCallback(
    (member: MemberRow) => {
      setPendingDelete(member);
      setConfirmOpen(true);
    },
    [setConfirmOpen]
  );
  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    setPendingDelete(null);
  }, [setConfirmOpen]);

  const handleSubmit = (values: MemberFormValues) => {
    // onValidSubmit implies every validator passed — role is a MemberRole.
    if (editing) {
      updateMember(editing.id, values);
      toast(`Updated ${values.name}`, { variant: 'success' });
    } else {
      createMember(values);
      setPage(1); // newest-first server → the new record is on page 1
      toast(`Created ${values.name}`, { variant: 'success' });
    }
    setReloadKey((k) => k + 1);
    closeDialog();
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteMember(pendingDelete.id);
    // The current page may have just emptied — clamp before refetching.
    const { pageCount } = queryMembers(page, sorting, search);
    if (page > pageCount) setPage(pageCount);
    setReloadKey((k) => k + 1);
    toast(`Deleted ${pendingDelete.name}`, { variant: 'success' });
    setPendingDelete(null);
  };

  const columns = useMemo<DataTableColumnDef<MemberRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info) => <strong>{info.getValue() as string}</strong>,
      },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info) => roleBadge(info.getValue() as MemberRole),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className={rowActions}>
            <Button size='sm' variant='ghost' onClick={() => openEdit(row.original)}>
              Edit
            </Button>
            <Button size='sm' variant='ghost' onClick={() => askDelete(row.original)}>
              Delete
            </Button>
          </div>
        ),
        meta: { sortable: false },
      },
    ],
    [openEdit, askDelete]
  );

  return (
    <div className={frame}>
      <div className={toolbar}>
        <Input
          className={searchInput}
          value={searchCtrl}
          placeholder='Search name or email…'
          aria-label='Search members'
          onChange={() => setPage(1)} // a new query restarts at page 1
        />
        <Button onClick={openCreate}>New member</Button>
      </div>
      <DataTable
        columns={columns}
        data={snapshot.rows}
        manual
        sortable
        loading={pending}
        pageSize={CRUD_PAGE_SIZE}
        pageCount={snapshot.pageCount}
        onPageChange={setPage}
        onSortChange={(next) => {
          setSorting(next);
          setPage(1);
        }}
        getRowId={(member) => String(member.id)}
      />
      <Dialog
        open={dialogOpenCtrl}
        onClose={closeDialog}
        title={editing ? 'Edit member' : 'New member'}
      >
        <MemberForm
          key={session}
          member={editing}
          onCancel={closeDialog}
          onSubmit={handleSubmit}
        />
      </Dialog>
      <ConfirmDialog
        open={confirmOpenCtrl}
        title='Delete member'
        confirmText='Delete'
        variant='danger'
        onConfirm={confirmDelete}
        onCancel={closeConfirm}
        onClose={closeConfirm}
      >
        Delete {pendingDelete?.name}? There is no undo.
      </ConfirmDialog>
    </div>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────

const frame = css`
  max-width: 760px;
  margin: var(--haze-space-4) 0 var(--haze-space-6);
`;

const toolbar = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  margin-bottom: var(--haze-space-3);
`;

const searchInput = css`
  flex: 1;
  max-width: 280px;
`;

const rowActions = css`
  display: flex;
  justify-content: flex-end;
  gap: var(--haze-space-1);
`;

const formGrid = css`
  display: grid;
  gap: var(--haze-space-4);
`;

const formFooter = css`
  display: flex;
  justify-content: flex-end;
  gap: var(--haze-space-2);
  margin-top: var(--haze-space-4);
`;
