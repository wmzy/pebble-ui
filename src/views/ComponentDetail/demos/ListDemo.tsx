import { List, ListItem } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── List ──────────────────────────────────────────────────────
export default function ListDemo() {
  return (
    <>
      <h1>List</h1>
      <p className={intro}>
        Styled list component with ordered, unordered, and plain variants.
      </p>

      <div className={section}>
        <h2>Unordered</h2>
        <List variant='unordered'>
          <ListItem>First item</ListItem>
          <ListItem>Second item</ListItem>
          <ListItem>Third item</ListItem>
        </List>
      </div>

      <div className={section}>
        <h2>Ordered</h2>
        <List variant='ordered'>
          <ListItem>Step one</ListItem>
          <ListItem>Step two</ListItem>
          <ListItem>Step three</ListItem>
        </List>
      </div>

      <div className={section}>
        <h2>List Props</h2>
        <PropsTable of='ListProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses semantic <strong>&lt;ul&gt;</strong> or{' '}
              <strong>&lt;ol&gt;</strong> elements
            </li>
            <li>Screen readers announce list item count</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='list' />
    </>
  );
}
