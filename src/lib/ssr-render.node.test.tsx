// @vitest-environment node
/* eslint-disable react/jsx-key --
   the CASES fixtures are [name, element, expects] tuples rendered one
   element per test through renderToString — never as array children — so
   keys would be dead weight; the rule cannot tell fixtures from real lists. */
//
// SSR smoke test in a REAL window-less environment: every fixture below
// goes through react-dom/server's renderToString, so any module-top-level
// or render-time access to window/document/navigator throws here instead
// of silently shipping a broken server render. Effects never run on the
// server, so only import time and the render path are under test.
//
// SSR exemption list: EMPTY — every component below renders on the server.
import type { ReactElement } from 'react';

import { renderToString } from 'react-dom/server';

import { useForm } from 'react-f0rm';

// Imports go to the component files directly (not the `./index` barrel):
// the barrel also pulls in tokens/colors.ts, whose Linaria interpolation
// keeps a vite handle open when evaluated inside a node-environment test
// file (10s "close timed out" at the end of the run). The components
// themselves never import tokens/colors — they reference var(--haze-*)
// only — so direct imports keep this suite fast and self-contained.
import Accordion from './components/Accordion/Accordion';
import AccordionItem from './components/Accordion/AccordionItem';
import Banner from './components/Banner/Banner';
import Button from './components/Button/Button';
import ButtonLink from './components/Button/ButtonLink';
import ChatMessage from './components/ChatMessage/ChatMessage';
import Checkbox from './components/Checkbox/Checkbox';
import Combobox from './components/Combobox/Combobox';
import Datepicker from './components/Datepicker/Datepicker';
import Dialog from './components/Dialog/Dialog';
import FormItem from './form/FormItem';
import Input from './components/Input/Input';
import InputCore from './components/Input/InputCore';
import MarkdownRenderer from './components/MarkdownRenderer/MarkdownRenderer';
import Option from './components/Select/Option';
import Popover from './components/Popover/Popover';
import SelectCore from './components/Select/SelectCore';
import Step from './components/Stepper/Step';
import Stepper from './components/Stepper/Stepper';
import StreamingText from './components/StreamingText/StreamingText';
import Switch from './components/Switch/Switch';
import Table from './components/Table/Table';
import TableBody from './components/Table/TableBody';
import TableCell from './components/Table/TableCell';
import TableHead from './components/Table/TableHead';
import TableRow from './components/Table/TableRow';
import Tab from './components/Tabs/Tab';
import TabList from './components/Tabs/TabList';
import TabPanel from './components/Tabs/TabPanel';
import Tabs from './components/Tabs/Tabs';
import Tooltip from './components/Tooltip/Tooltip';
import Tree from './components/Tree/Tree';

function TabsFixture() {
  return (
    <Tabs value="one">
      <TabList>
        <Tab value="one">Tab 1</Tab>
        <Tab value="two">Tab 2</Tab>
      </TabList>
      <TabPanel value="one">Panel 1</TabPanel>
      <TabPanel value="two">Panel 2</TabPanel>
    </Tabs>
  );
}

function TableFixture() {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell as="th">Name</TableCell>
          <TableCell as="th">Age</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Alice</TableCell>
          <TableCell>30</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function FormItemFixture() {
  const form = useForm({ initialValues: { email: 'a@b.c' } });
  return (
    <FormItem form={form} name="email" label="Email">
      {({ id, errorId, invalid, value, onChange }) => (
        <InputCore
          id={id}
          value={value}
          onChange={onChange}
          aria-invalid={invalid}
          aria-describedby={errorId}
        />
      )}
    </FormItem>
  );
}

const TREE_DATA = [
  {
    key: 'docs',
    title: 'Docs',
    children: [{ key: 'guide', title: 'Guide' }],
  },
];

const COMBOBOX_OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
];

// name → element + the substrings the server HTML must contain (key text
// or role/state attributes). Every entry also asserts non-empty output.
const noop = () => undefined;

const CASES: [name: string, element: ReactElement, expects: string[]][] = [
  ['Button', <Button>Save changes</Button>, ['Save changes', 'type="button"']],
  [
    'ButtonLink',
    <ButtonLink href="https://example.com">Read docs</ButtonLink>,
    ['Read docs', 'href="https://example.com"'],
  ],
  [
    'Input',
    <Input placeholder="Enter text" />,
    ['Enter text'],
  ],
  [
    'InputCore',
    <InputCore value="" onChange={noop} placeholder="Bare input" />,
    ['Bare input'],
  ],
  [
    'SelectCore',
    (
      <SelectCore value="" onChange={noop} aria-label="fruit">
        <Option value="apple">Apple</Option>
      </SelectCore>
    ),
    ['Apple', 'value="apple"'],
  ],
  [
    'Checkbox',
    <Checkbox aria-label="agree" label="Remember me" />,
    ['Remember me', 'type="checkbox"'],
  ],
  [
    'Switch',
    <Switch aria-label="toggle" />,
    ['role="switch"', 'aria-checked="false"'],
  ],
  [
    'Tabs',
    <TabsFixture />,
    ['Tab 1', 'Panel 1', 'aria-selected="true"'],
  ],
  [
    'Accordion',
    (
      <Accordion>
        <AccordionItem title="Section 1">Content 1</AccordionItem>
      </Accordion>
    ),
    ['<details', 'Section 1'],
  ],
  [
    'Dialog (closed)',
    <Dialog title="Confirm">Are you sure?</Dialog>,
    ['<dialog', 'Are you sure?', 'data-state="closed"'],
  ],
  [
    'Popover (closed)',
    <Popover content="Popover body">Trigger</Popover>,
    ['Trigger', 'Popover body', 'aria-expanded="false"'],
  ],
  [
    'Tooltip (closed)',
    (
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    ),
    ['Hover me', 'Help text', 'role="tooltip"'],
  ],
  [
    'Datepicker (closed)',
    <Datepicker />,
    ['Select date'],
  ],
  [
    'Combobox',
    <Combobox options={COMBOBOX_OPTIONS} placeholder="Search fruit" />,
    ['role="combobox"', 'Search fruit', 'Apple'],
  ],
  [
    'Tree',
    <Tree treeData={TREE_DATA} />,
    ['role="tree"', 'Docs'],
  ],
  [
    'Table',
    <TableFixture />,
    ['<table', 'Name', 'Alice'],
  ],
  [
    'Stepper',
    (
      <Stepper activeStep={1}>
        <Step title="Cart" />
        <Step title="Pay" />
      </Stepper>
    ),
    ['Cart', 'Pay', 'role="list"'],
  ],
  [
    'ChatMessage',
    <ChatMessage role="user" name="Alice">Hello there</ChatMessage>,
    ['Hello there', 'Alice'],
  ],
  [
    'MarkdownRenderer',
    <MarkdownRenderer content={'# Title\n\nSome **bold** text'} />,
    ['<h1>Title</h1>', '<strong>bold</strong>'],
  ],
  [
    'StreamingText',
    <StreamingText text="Hello world" />,
    // Streams start empty on the server; only the blinking cursor ships.
    [],
  ],
  [
    'Banner',
    <Banner>Scheduled maintenance</Banner>,
    ['role="alert"', 'Scheduled maintenance'],
  ],
  [
    'FormItem',
    <FormItemFixture />,
    ['Email', 'a@b.c'],
  ],
];

describe('SSR render (node environment, no window)', () => {
  it.each(CASES)('%s renders non-empty server HTML', (_name, element, expects) => {
    const html = renderToString(element);
    expect(html).toBeTruthy();
    expect(html.length).toBeGreaterThan(0);
    for (const expected of expects) {
      expect(html).toContain(expected);
    }
  });

  it('StreamingText starts empty with only the cursor element', () => {
    // The streamed text itself must NOT ship in the server HTML — the
    // stream restarts on the client (initial state is the empty prefix).
    const html = renderToString(<StreamingText text="Hello world" />);
    expect(html).not.toContain('Hello world');
    // wrapper <span> with the cursor <span> inside
    expect(html).toMatch(/<span[^>]*><span[^>]*><\/span><\/span>/);
  });
});
