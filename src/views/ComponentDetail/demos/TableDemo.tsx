import { Table, TableHead, TableBody, TableRow, TableCell } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Table ─────────────────────────────────────────────────────
export default function TableDemo() {
  return (
    <>
      <h1>Table</h1>
      <p className={intro}>
        Semantic table components with striped and bordered variants.
      </p>

      <div className={section}>
        <h2>Default</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell as='th'>Name</TableCell>
              <TableCell as='th'>Role</TableCell>
              <TableCell as='th'>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Alice</TableCell>
              <TableCell>Engineer</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bob</TableCell>
              <TableCell>Designer</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Carol</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Away</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className={section}>
        <h2>Striped + Bordered</h2>
        <Table striped bordered>
          <TableHead>
            <TableRow>
              <TableCell as='th'>Product</TableCell>
              <TableCell as='th'>Price</TableCell>
              <TableCell as='th'>Stock</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Widget A</TableCell>
              <TableCell>$10</TableCell>
              <TableCell>150</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Widget B</TableCell>
              <TableCell>$25</TableCell>
              <TableCell>80</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Widget C</TableCell>
              <TableCell>$15</TableCell>
              <TableCell>200</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className={section}>
        <h2>Table Props</h2>
        <PropsTable of='TableProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses semantic <strong>&lt;table&gt;</strong>,{' '}
              <strong>&lt;thead&gt;</strong>, <strong>&lt;tbody&gt;</strong>,{' '}
              <strong>&lt;th&gt;</strong>, <strong>&lt;td&gt;</strong>
            </li>
            <li>Screen readers announce row/column context automatically</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='table' />
    </>
  );
}
