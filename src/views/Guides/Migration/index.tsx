import { css } from '@linaria/core';

import { CodeBlock } from '@/lib';
import { intro, page, section } from '@/views/ComponentDetail/styles';

/*
 * Migration guide: concept mapping from AntD and shadcn/ui onto haze-ui.
 * Every row pairs a before/after snippet; the big semantic traps
 * (ControlOrValue, sugar onChange = native event) get their own callouts.
 */

const paragraph = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  margin: 0 0 var(--haze-space-4);
`;

const inlineCode = css`
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  padding: 0.15em 0.4em;
  font-family: var(--haze-font-mono);
  font-size: 0.9em;
`;

const note = css`
  background: var(--haze-color-primary-subtle);
  border-left: 3px solid var(--haze-color-primary);
  border-radius: 0 var(--haze-radius-md) var(--haze-radius-md) 0;
  padding: var(--haze-space-3) var(--haze-space-4);
  margin: var(--haze-space-4) 0;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-normal);
`;

const warning = css`
  background: var(--haze-color-danger-subtle);
  border-left: 3px solid var(--haze-color-danger);
  border-radius: 0 var(--haze-radius-md) var(--haze-radius-md) 0;
  padding: var(--haze-space-3) var(--haze-space-4);
  margin: var(--haze-space-4) 0;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-normal);
`;

const tableWrap = css`
  overflow-x: auto;
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const mapTable = css`
  border-collapse: collapse;
  width: 100%;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);

  th,
  td {
    border: 1px solid var(--haze-color-border);
    padding: var(--haze-space-2) var(--haze-space-3);
    text-align: start;
    vertical-align: top;
  }

  th {
    background: var(--haze-color-bg-subtle);
    font-weight: var(--haze-weight-medium);
  }

  td:first-child,
  td:nth-child(2),
  td:nth-child(3) {
    font-family: var(--haze-font-mono);
    font-size: 0.9em;
    white-space: nowrap;
  }
`;

const compareGrid = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--haze-space-3);
  margin: var(--haze-space-2) 0 var(--haze-space-4);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const compareCol = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  min-width: 0;
`;

const compareLabel = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

/** Side-by-side before/after code pair; stacks on narrow screens. */
function Compare({
  before,
  after,
  beforeLabel = 'before',
  afterLabel = 'haze-ui',
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  return (
    <div className={compareGrid}>
      <div className={compareCol}>
        <div className={compareLabel}>{beforeLabel}</div>
        <CodeBlock language='tsx'>{before}</CodeBlock>
      </div>
      <div className={compareCol}>
        <div className={compareLabel}>{afterLabel}</div>
        <CodeBlock language='tsx'>{after}</CodeBlock>
      </div>
    </div>
  );
}

export default function MigrationGuide() {
  return (
    <div className={page}>
      <h1>Migrating from AntD / shadcn</h1>
      <p className={intro}>
        haze-ui borrows the best conventions from both worlds — AntD-grade
        compound components on a token system — but three core mechanisms
        differ: <strong>state is ControlOrValue</strong> (not
        controlled/uncontrolled prop pairs),{' '}
        <strong>sugar <code className={inlineCode}>onChange</code> is the
        native event handler</strong> (values flow through Controls or
        dedicated value callbacks), and{' '}
        <strong>forms run on react-f0rm with schema validators</strong>{' '}
        (not <code className={inlineCode}>rules</code> arrays or
        react-hook-form). This page maps the concepts and calls out every
        trap.
      </p>

      <div className={section}>
        <h2>Component map</h2>
        <div className={tableWrap}>
          <table className={mapTable}>
            <thead>
              <tr>
                <th>AntD</th>
                <th>shadcn/ui</th>
                <th>haze-ui</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Button</td>
                <td>Button</td>
                <td>Button</td>
                <td>solid / outline / ghost variants, token-driven colors</td>
              </tr>
              <tr>
                <td>Input, Textarea</td>
                <td>Input, Textarea</td>
                <td>Input, Textarea</td>
                <td>ControlOrValue value; onChange is the native event</td>
              </tr>
              <tr>
                <td>Select</td>
                <td>Select</td>
                <td>Select / Combobox</td>
                <td>
                  plain single = Select (add searchable for filtering);
                  type-ahead = Combobox
                </td>
              </tr>
              <tr>
                <td>DatePicker / RangePicker</td>
                <td>Calendar + Popover</td>
                <td>Datepicker / DateRangePicker</td>
                <td>Datepicker has showTime; DateRangePicker has presets</td>
              </tr>
              <tr>
                <td>Table</td>
                <td>Table</td>
                <td>Table / DataTable</td>
                <td>
                  static markup → Table; sort / select / paginate / edit →
                  DataTable (TanStack) with a manual server mode
                </td>
              </tr>
              <tr>
                <td>Modal</td>
                <td>Dialog</td>
                <td>Dialog</td>
                <td>native &lt;dialog&gt; + showModal</td>
              </tr>
              <tr>
                <td>Drawer</td>
                <td>Sheet</td>
                <td>Drawer</td>
                <td>same placement names — see below</td>
              </tr>
              <tr>
                <td>Menu / Dropdown</td>
                <td>DropdownMenu</td>
                <td>DropdownMenu</td>
                <td>compound parts — see below</td>
              </tr>
              <tr>
                <td>Popconfirm</td>
                <td>AlertDialog</td>
                <td>ConfirmDialog</td>
                <td>confirmText / cancelText / variant=&apos;danger&apos;</td>
              </tr>
              <tr>
                <td>message / notification</td>
                <td>Toast (sonner)</td>
                <td>useToast / toast</td>
                <td>fire-and-report inside a ToastContainer</td>
              </tr>
              <tr>
                <td>Form / Form.Item</td>
                <td>Form (react-hook-form)</td>
                <td>Form / FormItem (react-f0rm)</td>
                <td>schema validators — see below</td>
              </tr>
              <tr>
                <td>Tooltip, Tabs, Tag, Tree, Upload, Switch</td>
                <td>same names</td>
                <td>same names</td>
                <td>1:1 surface, ControlOrValue state</td>
              </tr>
              <tr>
                <td>Layout / Sider</td>
                <td>—</td>
                <td>AppShell / Sidebar</td>
                <td>composable shells</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={section}>
        <h2>Form.Item → FormItem</h2>
        <p className={paragraph}>
          AntD puts validation <em>rules</em> on the item; haze-ui puts a{' '}
          <code className={inlineCode}>validate</code> callback there —{' '}
          <code className={inlineCode}>
            (value, meta) =&gt; error | undefined
          </code>
          , sync or async. Schemas slot in through{' '}
          <code className={inlineCode}>zodResolver</code> (shipped with
          haze-ui): one adapter per schema, declared once at module scope.
          The rules-to-schema translation is mechanical —{' '}
          <code className={inlineCode}>required</code> becomes{' '}
          <code className={inlineCode}>.min(1, &apos;…&apos;)</code>,{' '}
          <code className={inlineCode}>type: &apos;email&apos;</code> becomes{' '}
          <code className={inlineCode}>z.email(&apos;…&apos;)</code>, custom
          validators become plain functions returning a message or{' '}
          <code className={inlineCode}>undefined</code>:
        </p>
        <Compare
          beforeLabel='AntD'
          afterLabel='haze-ui'
          before={`const RULES = {
  email: [
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Enter a valid email' },
  ],
  role: [{ required: true, message: 'Pick a role' }],
};

<Form.Item name="email" label="Email" rules={RULES.email}>
  <Input />
</Form.Item>`}
          after={`import { zodResolver } from 'haze-ui';

// one adapter per schema, reused by any number of fields
const validateEmail = zodResolver(z.email('Enter a valid email'));
const validateRole = zodResolver(
  z.enum(['admin', 'editor', 'viewer'], 'Pick a role')
);

<FormItem
  form={form}
  name='email'
  label='Email'
  validate={validateEmail}
  mode='onBlur'
  input={InputCore}   // FormItem wires id/aria/onBlur/onChange/value
/>`}
        />
        <p className={paragraph}>
          Prefer one object schema? Declare a{' '}
          <code className={inlineCode}>z.object</code> and derive per-field
          validators from it:{' '}
          <code className={inlineCode}>
            zodResolver(schema.shape.email)
          </code>{' '}
          — the field path stays the source of truth. Non-zod validation
          works through{' '}
          <code className={inlineCode}>standardSchemaResolver</code> (any
          Standard Schema v1 implementation) or a hand-written{' '}
          <code className={inlineCode}>(value) =&gt; message | undefined</code>.
          The Recipes page shows all three live, including async availability
          checks with <code className={inlineCode}>meta.signal</code>{' '}
          cancellation.
        </p>
        <div className={note}>
          AntD&apos;s <code className={inlineCode}>Form</code> instance maps
          to react-f0rm&apos;s <code className={inlineCode}>useForm</code>{' '}
          (re-exported from <code className={inlineCode}>haze-ui</code>):{' '}
          <code className={inlineCode}>form.setFieldsValue</code> →{' '}
          per-field <code className={inlineCode}>setValue(form, path, value)</code>{' '}
          (or <code className={inlineCode}>reset(form, values)</code> for a
          full load — the pattern the CRUD recipe uses to open an edit
          dialog), <code className={inlineCode}>form.resetFields</code> →{' '}
          <code className={inlineCode}>reset(form, initialValues)</code>,{' '}
          <code className={inlineCode}>form.validateFields</code> → the
          submit flow you already drive via{' '}
          <code className={inlineCode}>onValidSubmit</code> /
          <code className={inlineCode}>onInvalidSubmit</code>. shadcn&apos;s
          react-hook-form migration is the same shape —{' '}
          <code className={inlineCode}>register</code>/
          <code className={inlineCode}>Controller</code> collapses into the{' '}
          <code className={inlineCode}>input</code> channel or the{' '}
          <code className={inlineCode}>children</code> render-prop, which
          hands you <code className={inlineCode}>&#123;value, onChange&#125;</code>{' '}
          plus the id/aria wiring.
        </div>
      </div>

      <div className={section}>
        <h2>defaultValue → &ldquo;the value is the uncontrolled initial&rdquo;</h2>
        <p className={paragraph}>
          The biggest mental-model shift: haze stateful components take{' '}
          <code className={inlineCode}>ControlOrValue&lt;T&gt;</code> — the
          same prop is the uncontrolled initial value <em>or</em> the
          controlled channel, distinguished by type, not by prop name:
        </p>
        <Compare
          beforeLabel='AntD / shadcn'
          afterLabel='haze-ui'
          before={`// uncontrolled and controlled are different props
<Input defaultValue="hello" />
<Input value={text} onChange={(e) => setText(e.target.value)} />`}
          after={`import { useControl } from 'react-use-control';

const [text, setText, textCtrl] = useControl(undefined, 'hello');

// plain value → uncontrolled INITIAL (later prop changes ignored)
<Input value="hello" />

// control     → controlled: one state, writes flow through it
<Input value={textCtrl} onChange={(e) => log(e.target.value)} />
// text is already updated by the Input itself — onChange here is
// a native-event side channel, not the value pipeline`}
        />
        <div className={warning}>
          Migration trap: porting{' '}
          <code className={inlineCode}>value=&#123;x&#125;</code> verbatim
          from a controlled AntD/shadcn component compiles and renders — but
          a plain value is the uncontrolled <em>initial</em> value, so later
          prop changes are silently ignored. To stay controlled, pass the
          third element of{' '}
          <code className={inlineCode}>useControl</code>&apos;s return (the
          Control). There is no{' '}
          <code className={inlineCode}>defaultValue</code> prop to fall back
          on — <code className={inlineCode}>checked</code>,{' '}
          <code className={inlineCode}>open</code>,{' '}
          <code className={inlineCode}>expanded</code>,{' '}
          <code className={inlineCode}>activeKey</code>… all migrate the same
          way.
        </div>
      </div>

      <div className={section}>
        <h2>open / onOpenChange → open ControlOrValue</h2>
        <p className={paragraph}>
          AntD modals and shadcn/Radix dialogs are controlled boolean pairs:{' '}
          <code className={inlineCode}>open</code> +{' '}
          <code className={inlineCode}>onOpenChange</code> /
          <code className={inlineCode}>onClose</code>. haze keeps{' '}
          <code className={inlineCode}>open</code> but it is ControlOrValue,
          and there is only one callback —{' '}
          <code className={inlineCode}>onClose</code>, fired once per close
          from every exit path (ESC, backdrop, your own buttons drive the
          state themselves):
        </p>
        <Compare
          beforeLabel='AntD / shadcn'
          afterLabel='haze-ui'
          before={`const [open, setOpen] = useState(false);

<Modal
  open={open}
  onOk={() => setOpen(false)}
  onCancel={() => setOpen(false)}
/>

// shadcn: onOpenChange receives the next open state
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>…</DialogContent>
</Dialog>`}
          after={`const [, setOpen, openCtrl] = useControl(undefined, false);

<Dialog
  open={openCtrl}              // Control = controlled channel
  onClose={() => setOpen(false)} // single exit callback, all paths
  title='Edit member'
>
  <Button onClick={() => setOpen(false)}>Close</Button>
</Dialog>`}
        />
        <p className={paragraph}>
          The same trap as values applies:{' '}
          <code className={inlineCode}>open=&#123;condition&#125;</code>{' '}
          with a plain boolean is an <em>initial</em> value — the dialog
          opens on the first true and then manages itself. Drive it with a
          Control from <code className={inlineCode}>useControl</code> and it
          behaves like the boolean pair you are used to. Drawer, Popover,
          Tooltip, ConfirmDialog and the rest share the contract.
        </p>
      </div>

      <div className={section}>
        <h2>Select → Select / Combobox — the onChange trap</h2>
        <div className={warning}>
          <strong>Read this before porting any Select.</strong> In AntD and
          shadcn/Radix, <code className={inlineCode}>onChange</code> /
          <code className={inlineCode}>onValueChange</code> receives the
          selected <strong>value</strong>. In haze-ui, the sugar{' '}
          <code className={inlineCode}>onChange</code> is forwarded to the
          underlying native element — it receives the{' '}
          <strong>DOM event</strong> (and only exists where a native element
          does). The value callback is{' '}
          <code className={inlineCode}>onValuesChange</code>. Porting{' '}
          <code className={inlineCode}>onChange=&#123;(value) =&gt; …&#125;</code>{' '}
          verbatim compiles in single mode and then breaks:{' '}
          <code className={inlineCode}>value</code> is an event, not a
          string.
        </div>
        <Compare
          beforeLabel='AntD'
          afterLabel='haze-ui'
          before={`<Select
  defaultValue="admin"
  onChange={(value) => setRole(value)}   // value: string
  options={ROLES}                        // or <Option /> children
/>

// remote search: onSearch + loading
<Select
  showSearch
  filterOption={false}
  onSearch={setQuery}
  loading={fetching}
  options={results}
/>`}
          after={`<Select
  value={roleCtrl}                          // ControlOrValue
  onValuesChange={(value) => side(value)}   // value: string | string[]
  onChange={(e) => log(e.target.value)}     // native event (single mode)
>
  <Option value='admin'>Admin</Option>
  <Option value='editor'>Editor</Option>
</Select>

// remote search: onSearch suspends local filtering
<Select
  searchable
  loading={fetching}
  onSearch={setQuery}      // every query transition, '' included
>
  {results.map((r) => <Option key={r} value={r}>{r}</Option>)}
</Select>`}
        />
        <p className={paragraph}>
          Choosing the component: a plain single select (with or without{' '}
          <code className={inlineCode}>searchable</code> filtering) is{' '}
          <code className={inlineCode}>Select</code>; a free-typing input
          that completes against options — AntD&apos;s{' '}
          <code className={inlineCode}>AutoComplete</code> or a searchable
          multi-select — is{' '}
          <code className={inlineCode}>Combobox</code>, which adds{' '}
          <code className={inlineCode}>creatable</code>,{' '}
          <code className={inlineCode}>onCreate</code>, highlight-as-you-type
          and the same <code className={inlineCode}>onSearch</code> remote
          mode. Multiple selection lives on both (
          <code className={inlineCode}>multiple</code>), renders Chips, and
          reports through the same{' '}
          <code className={inlineCode}>onValuesChange</code> with{' '}
          <code className={inlineCode}>string[]</code>. One more AntD
          difference: options are always JSX children (
          <code className={inlineCode}>Option</code> /
          <code className={inlineCode}>OptionGroup</code>) or — on Combobox
          — a plain <code className={inlineCode}>options</code> array; there
          is no <code className={inlineCode}>labelInValue</code> (compare
          against your own option source instead).
        </p>
      </div>

      <div className={section}>
        <h2>Menu / Dropdown → DropdownMenu</h2>
        <p className={paragraph}>
          AntD&apos;s config-driven{' '}
          <code className={inlineCode}>items</code> array becomes the
          shadcn-style compound tree — the structure you write is the
          structure you get, and submenus nest arbitrarily:
        </p>
        <Compare
          beforeLabel='AntD'
          afterLabel='haze-ui'
          before={`<Dropdown
  menu={{
    items: [
      { key: 'edit', label: 'Edit' },
      { key: 'share', children: [
        { key: 'link', label: 'Copy link' },
      ]},
    ],
    onClick: ({ key }) => act(key),
  }}
>
  <Button>Actions</Button>
</Dropdown>`}
          after={`<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant='outline'>Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => act('edit')}>
      Edit
    </DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => act('link')}>
          Copy link
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={destroy}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
        />
        <p className={paragraph}>
          The <code className={inlineCode}>key</code> → handler indirection
          disappears: each item carries its own{' '}
          <code className={inlineCode}>onClick</code>. Context menus use the
          same item tree behind{' '}
          <code className={inlineCode}>ContextMenu</code> +{' '}
          <code className={inlineCode}>ContextMenuTrigger</code> wrapping
          whatever element should react to right-clicks. Keyboard parity
          (arrows, type-ahead, Esc one level at a time) and RTL mirroring
          are built in.
        </p>
      </div>

      <div className={section}>
        <h2>Drawer / Sheet → Drawer</h2>
        <p className={paragraph}>
          AntD&apos;s <code className={inlineCode}>Drawer</code> and
          shadcn&apos;s <code className={inlineCode}>Sheet</code> map
          directly — haze keeps the four edge names AntD uses, and shadcn&apos;s{' '}
          <code className={inlineCode}>side</code> values translate
          mechanically:
        </p>
        <Compare
          beforeLabel='AntD / shadcn'
          afterLabel='haze-ui'
          before={`// AntD
<Drawer
  open={open}
  onClose={close}
  placement="right"   // left | right | top | bottom
  width={420}
>
  …

// shadcn (Sheet): side="right" | "left" | "top" | "bottom"
<Sheet>
  <SheetContent side="right">…</SheetContent>
</Sheet>`}
          after={`<Drawer
  open={openCtrl}        // ControlOrValue
  onClose={close}
  placement='right'      // same four names as AntD
>
  …
</Drawer>`}
        />
        <p className={paragraph}>
          Defaults match AntD (<code className={inlineCode}>right</code>).
          Sizing is CSS, not props: each placement ships a sensible panel
          size (320px on the long axis, clamped to the viewport) — pass a{' '}
          <code className={inlineCode}>className</code> with your own{' '}
          <code className={inlineCode}>width</code>/
          <code className={inlineCode}>height</code> to resize one drawer.
          Mobile bottom sheets are the sibling{' '}
          <code className={inlineCode}>BottomSheet</code> component.
        </p>
      </div>

      <div className={section}>
        <h2>shadcn specifics</h2>
        <p className={paragraph}>
          Beyond the pieces already covered, three conventions replace the
          shadcn stack:
        </p>
        <ul className={paragraph}>
          <li>
            <strong>No <code className={inlineCode}>cn()</code> / Tailwind
            glue.</strong> Components ship their own token-driven styles;
            customize with the{' '}
            <code className={inlineCode}>--haze-&lt;component&gt;-*</code>{' '}
            custom properties (see each component page&apos;s CSS variables
            section) instead of utility-class overrides. Your Tailwind
            utilities still compose around them — the Getting Started page
            covers the <code className={inlineCode}>@theme inline</code>{' '}
            bridge and layer interactions.
          </li>
          <li>
            <strong>No copy-paste ownership.</strong> shadcn drops source
            files into your repo; haze-ui is an installed dependency —
            updates arrive with the package, and per-component CSS
            subpaths (<code className={inlineCode}>haze-ui/css/*.css</code>)
            keep payloads pay-per-use.
          </li>
          <li>
            <strong>Copy is localizable.</strong> Every built-in literal
            flows through <code className={inlineCode}>useStrings</code>{' '}
            — mount <code className={inlineCode}>LocaleProvider</code> with
            a pack (zh-CN and ja-JP ship in the box) or partial overrides,
            instead of forking components to reword a button.
          </li>
        </ul>
      </div>

      <div className={section}>
        <h2>Where to go next</h2>
        <ul className={paragraph}>
          <li>
            <strong>Recipes</strong> — the CRUD recipe assembles the exact
            admin screen most AntD apps start from (server-paginated
            DataTable + dialog form + confirm + toasts); the zod recipe
            covers schema validation in depth.
          </li>
          <li>
            <strong>Dark mode guide</strong> — if you are leaving
            next-themes&apos;s{' '}
            <code className={inlineCode}>class</code> attribute behind, the
            guide shows the two haze token classes and their interop.
          </li>
          <li>
            <strong>Component pages</strong> — every component documents its
            props, CSS variable slots and accessibility notes; DataTable,
            Select and FormItem have the deepest migration surfaces.
          </li>
        </ul>
      </div>
    </div>
  );
}
