/**
 * Fixture for the pixel-baseline e2e spec (e2e/snapshots.spec.ts): every
 * non-overlay component mounted in a fully determined state — controlled
 * values, no timers, no network (avatars use initials, markdown has no
 * images). The spec screenshots one `[data-snap]` section per component,
 * so variants that matter (checked/unchecked, on/off, all colors) live in
 * the same section as a single baseline frame.
 *
 * Two sections opt out of animations via `frozen`: Spinner's spin and
 * Skeleton's shimmer are *infinite* keyframes, and Playwright freezes
 * infinite animations at their current phase — an arbitrary rotation /
 * opacity — when capturing. Pinning them to their unanimated base frame
 * keeps those baselines byte-stable while still covering shape, color
 * and size.
 *
 * The expansion sections cover the newer interactive surfaces: the
 * Button variant×size matrix, the multiple Select trigger (chip pills),
 * single + range Slider, and a width-bounded DataTable with pinned
 * columns (the spec scrolls it to its midpoint before capturing). The
 * `darkfields` section re-declares the theme on its own wrapper
 * (`darkTheme`) — the token classes apply to any ancestor, so a nested
 * dark island covers theme regressions without a second fixture page.
 */
import { css } from '@linaria/core';

import { Accordion, AccordionItem } from '../../src/lib/components/Accordion';
import { Avatar } from '../../src/lib/components/Avatar';
import { Badge } from '../../src/lib/components/Badge';
import { Button } from '../../src/lib/components/Button';
import { Card } from '../../src/lib/components/Card';
import { ChatMessage } from '../../src/lib/components/ChatMessage';
import { Checkbox } from '../../src/lib/components/Checkbox';
import { DataTable } from '../../src/lib/components/DataTable';
import type { DataTableColumnDef } from '../../src/lib/components/DataTable';
import { Descriptions } from '../../src/lib/components/Descriptions';
import { FilePreview } from '../../src/lib/components/FilePreview';
import { InlineCompletion } from '../../src/lib/components/InlineCompletion';
import { Input } from '../../src/lib/components/Input';
import { JsonView } from '../../src/lib/components/JsonView';
import { MarkdownRenderer } from '../../src/lib/components/MarkdownRenderer';
import { Masonry } from '../../src/lib/components/Masonry';
import { Pagination } from '../../src/lib/components/Pagination';
import { Progress } from '../../src/lib/components/Progress';
import { Radio, RadioGroup } from '../../src/lib/components/Radio';
import { Option, Select } from '../../src/lib/components/Select';
import { Signature } from '../../src/lib/components/Signature';
import { Skeleton } from '../../src/lib/components/Skeleton';
import { Slider } from '../../src/lib/components/Slider';
import { Sources } from '../../src/lib/components/Sources';
import { Spinner } from '../../src/lib/components/Spinner';
import { Switch } from '../../src/lib/components/Switch';
import { Tab, TabList, TabPanel, Tabs } from '../../src/lib/components/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '../../src/lib/components/Table';
import { Tag } from '../../src/lib/components/Tag';
import { Textarea } from '../../src/lib/components/Textarea';

import { darkTheme } from '../../src/lib/tokens/colors';

import { mountPage } from './components/mount';

const section = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--haze-space-3);
`;

const row = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  flex-wrap: wrap;
`;

const cardTitle = css`
  margin: 0 0 var(--haze-space-2);
  font-size: var(--haze-text-lg);
  font-weight: var(--haze-weight-semibold);
`;

const cardWidth = css`
  width: 360px;
`;

const jsonViewWidth = css`
  width: 420px;
`;

const masonryWidth = css`
  width: 360px;
`;

const masonryBlock = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  background: var(--haze-color-primary-subtle);
  color: var(--haze-color-text);
  border-radius: var(--haze-radius-md);
`;

const masonryBlockTall = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 104px;
  background: var(--haze-color-info-subtle);
  color: var(--haze-color-text);
  border-radius: var(--haze-radius-md);
`;

const progressWidth = css`
  width: 220px;
`;

const tabsWidth = css`
  width: 360px;
`;

/* Button matrix: one baseline for the full variant×size grid. */
const matrix = css`
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-items: start;
  gap: var(--haze-space-2) var(--haze-space-4);
`;

/* Dark theme island: re-declares every token on the wrapper (the theme
   classes are plain custom-property sets) and paints its own background,
   so the nested components render as they would inside a dark app. */
const darkPanel = css`
  background: var(--haze-color-bg);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  padding: var(--haze-space-4) var(--haze-space-5);
`;

const sliderWidth = css`
  width: 260px;
`;

/* Two triggers side by side (260 + 260 + gap) fit the 40rem shell. */
const selectMultiWidth = css`
  width: 260px;
`;

/* Narrower than the declared column widths, so the fixed left/right
   columns actually pin against a scrolling middle. The table itself
   must size to its <colgroup> sum: shrink-to-fit would instead squeeze
   the declared widths into the 520px container (auto table layout
   treats <col> widths as preferences), leaving nothing to scroll. */
const dataTableWidth = css`
  width: 520px;

  & table {
    width: max-content;
    min-width: 100%;
  }
`;

const frozen = css`
  & * {
    animation: none !important;
  }
`;

const MARKDOWN = [
  '### Release notes',
  'The **token pipeline** now derives *all* interaction states from `palette.ts`.',
  '- OKLCH scales for gray, blue, green, amber, red',
  '- relative-color hover and active formulas',
  '> Contrast floors verified at 4.5:1.',
].join('\n\n');

/* Widths deliberately overflow the 520px wrapper so the pinned columns
   have a scrollport to stick against; the spec scrolls to the midpoint
   before capturing. */
type PackageRow = {
  id: number;
  module: string;
  description: string;
  owner: string;
  version: string;
  released: string;
};

const PACKAGES: PackageRow[] = [
  { id: 1, module: 'tokens', description: 'OKLCH palette and semantic aliases', owner: 'core', version: '1.13.0', released: '2026-09-05' },
  { id: 2, module: 'button', description: 'Variant and size skin over base control', owner: 'core', version: '1.13.0', released: '2026-09-05' },
  { id: 3, module: 'datatable', description: 'TanStack Table v9 with pinned columns', owner: 'data', version: '1.12.0', released: '2026-08-28' },
  { id: 4, module: 'select', description: 'Single and multiple selection triggers', owner: 'forms', version: '1.12.0', released: '2026-08-28' },
  { id: 5, module: 'slider', description: 'Single and range thumbs on one rail', owner: 'forms', version: '1.12.0', released: '2026-08-28' },
  { id: 6, module: 'image', description: 'Fallback states and fullscreen preview', owner: 'media', version: '1.11.2', released: '2026-08-14' },
];

const PACKAGE_COLUMNS: DataTableColumnDef<PackageRow>[] = [
  {
    accessorKey: 'module',
    header: 'Module',
    cell: (info) => <strong>{info.getValue() as string}</strong>,
    meta: { width: 140, fixed: 'left' },
  },
  { accessorKey: 'description', header: 'Description', meta: { width: 260 } },
  { accessorKey: 'owner', header: 'Owner', meta: { width: 140 } },
  { accessorKey: 'version', header: 'Version', meta: { width: 90 } },
  { accessorKey: 'released', header: 'Released', meta: { width: 120, fixed: 'right' } },
];

mountPage(
  <>
    <section data-snap="button" className={section}>
      <div className={row}>
        <Button variant="solid">Solid action</Button>
        <Button variant="outline">Outline action</Button>
        <Button variant="ghost">Ghost action</Button>
        <Button variant="solid" disabled>
          Disabled action
        </Button>
      </div>
    </section>

    <section data-snap="input" className={section}>
      <Input
        value="haze@example.com"
        aria-label="Email"
        style={{ width: '260px' }}
      />
      <Input placeholder="Search docs" aria-label="Search" style={{ width: '260px' }} />
      <Input
        value="Read only value"
        disabled
        aria-label="Disabled email"
        style={{ width: '260px' }}
      />
    </section>

    <section data-snap="textarea" className={section}>
      <Textarea
        value={'Multi-line feedback: the panel is reachable by keyboard and the focus ring has 3px of contrast.'}
        rows={3}
        aria-label="Feedback"
        style={{ width: '360px' }}
      />
    </section>

    <section data-snap="select" className={section}>
      <Select value="banana" aria-label="Fruit" style={{ width: '200px' }}>
        <Option value="apple">Apple</Option>
        <Option value="banana">Banana</Option>
        <Option value="cherry">Cherry</Option>
      </Select>
    </section>

    <section data-snap="checkbox" className={section}>
      <div className={row}>
        <Checkbox checked label="Enable analytics" />
        <Checkbox label="Send newsletter" />
        <Checkbox checked disabled label="Locked in" />
      </div>
    </section>

    <section data-snap="radio" className={section}>
      <RadioGroup value="weekly">
        <Radio value="daily">Daily digest</Radio>
        <Radio value="weekly">Weekly digest</Radio>
        <Radio value="never">No email</Radio>
      </RadioGroup>
    </section>

    <section data-snap="switch" className={section}>
      <div className={row}>
        <Switch checked aria-label="Notifications on" />
        <Switch aria-label="Notifications off" />
      </div>
    </section>

    <section data-snap="badge" className={section}>
      <div className={row}>
        <Badge>Default</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>
    </section>

    <section data-snap="avatar" className={section}>
      <div className={row}>
        <Avatar alt="Haze" />
        <Avatar size="lg" fallback="ZL" />
      </div>
    </section>

    <section data-snap="tag" className={section}>
      <div className={row}>
        <Tag>design-tokens</Tag>
        <Tag variant="primary">oklch</Tag>
        <Tag variant="success">passing</Tag>
        <Tag variant="danger" closable>
          flaky
        </Tag>
      </div>
    </section>

    <section data-snap="tabs" className={section}>
      <div className={tabsWidth}>
        <Tabs value="preview">
          <TabList>
            <Tab value="write">Write</Tab>
            <Tab value="preview">Preview</Tab>
            <Tab value="diff">Diff</Tab>
          </TabList>
          <TabPanel value="write">Edit the markdown source.</TabPanel>
          <TabPanel value="preview">Rendered output of the source.</TabPanel>
          <TabPanel value="diff">Changes since the last release.</TabPanel>
        </Tabs>
      </div>
    </section>

    <section data-snap="accordion" className={section}>
      <Accordion>
        <AccordionItem title="What is a control prop?">
          A single prop accepting either the value or a [value, setValue]
          tuple, covering controlled and uncontrolled usage.
        </AccordionItem>
        <AccordionItem title="Does it work with forms?">
          FormItem binds react-f0rm fields directly to the control props.
        </AccordionItem>
      </Accordion>
    </section>

    <section data-snap="table" className={section}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell as="th">Token</TableCell>
            <TableCell as="th">Value</TableCell>
            <TableCell as="th">Usage</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>--haze-color-primary</TableCell>
            <TableCell>oklch(0.55 0.18 250)</TableCell>
            <TableCell>Solid accents</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>--haze-color-text</TableCell>
            <TableCell>oklch(0.22 0.01 250)</TableCell>
            <TableCell>Body copy</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>--haze-color-border</TableCell>
            <TableCell>oklch(0.87 0.01 250)</TableCell>
            <TableCell>Outlines</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <section data-snap="pagination" className={section}>
      <Pagination total={100} pageSize={10} page={3} />
    </section>

    <section data-snap="card" className={section}>
      <Card variant="elevated" className={cardWidth}>
        <h3 className={cardTitle}>Monthly usage</h3>
        <p>Requests are down 12% while latency improved across every region.</p>
      </Card>
    </section>

    <section data-snap="spinner" className={`${section} ${frozen}`}>
      <div className={row}>
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>
    </section>

    <section data-snap="progress" className={section}>
      <div className={row}>
        <Progress value={62} className={progressWidth} />
        <Progress variant="circle" value={62} />
      </div>
    </section>

    <section data-snap="skeleton" className={`${section} ${frozen}`}>
      <div className={row}>
        <Skeleton variant="text" width={220} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton variant="rectangular" width={280} height={72} />
    </section>

    <section data-snap="chatmessage" className={section}>
      <ChatMessage role="assistant" avatar="A" name="Haze" timestamp="12:01">
        How can I help you today?
      </ChatMessage>
      <ChatMessage role="user" avatar="Y" name="You" timestamp="12:02">
        Summarize the token migration so far.
      </ChatMessage>
    </section>

    <section data-snap="markdown" className={section}>
      <MarkdownRenderer content={MARKDOWN} />
    </section>

    <section data-snap="buttonmatrix" className={section}>
      <div className={matrix}>
        {(['sm', 'md', 'lg'] as const).flatMap((size) =>
          (['solid', 'outline', 'ghost'] as const).map((variant) => (
            <Button key={`${size}-${variant}`} size={size} variant={variant}>
              Action
            </Button>
          ))
        )}
        <Button variant="solid" disabled>
          Disabled
        </Button>
      </div>
    </section>

    <section data-snap="selectmultiple" className={section}>
      <div className={row}>
        <div className={selectMultiWidth}>
          <Select
            multiple
            value={['apple', 'cherry']}
            aria-label="Selected fruits"
          >
            <Option value="apple">Apple</Option>
            <Option value="banana">Banana</Option>
            <Option value="cherry">Cherry</Option>
            <Option value="durian">Durian</Option>
          </Select>
        </div>
        <div className={selectMultiWidth}>
          <Select
            multiple
            placeholder="Pick fruits"
            aria-label="Empty fruit selection"
          >
            <Option value="apple">Apple</Option>
            <Option value="banana">Banana</Option>
            <Option value="cherry">Cherry</Option>
            <Option value="durian">Durian</Option>
          </Select>
        </div>
      </div>
    </section>

    <section data-snap="slider" className={section}>
      <Slider value={62} aria-label="Volume" className={sliderWidth} />
      <Slider
        range
        value={[25, 65]}
        aria-label={['Minimum volume', 'Maximum volume']}
        className={sliderWidth}
      />
    </section>

    <section data-snap="datatable" className={section}>
      <div className={dataTableWidth}>
        <DataTable
          columns={PACKAGE_COLUMNS}
          data={PACKAGES}
          getRowId={(row) => String(row.id)}
        />
      </div>
    </section>

    <section data-snap="descriptions" className={section}>
      <Descriptions
        title="Package"
        columns={2}
        items={[
          { key: 'name', label: 'Name', children: 'haze-ui' },
          { key: 'version', label: 'Version', children: '1.14.0' },
          { key: 'license', label: 'License', children: 'MIT' },
          { key: 'desc', label: 'Description', children: 'Controlled-state React UI library', span: 2 },
        ]}
      />
      <Descriptions
        bordered
        columns={3}
        items={[
          { key: 'a', label: 'Style', children: 'Linaria' },
          { key: 'b', label: 'Tokens', children: 'OKLCH' },
          { key: 'c', label: 'React', children: '19' },
        ]}
      />
    </section>

    <section data-snap="jsonview" className={section}>
      <div className={jsonViewWidth}>
        <JsonView
          defaultExpandedDepth={1}
          data={{
            name: 'haze-ui',
            stars: 128,
            features: ['controlled', 'zero-runtime'],
            nested: { deep: { value: null, ok: true } },
          }}
        />
      </div>
    </section>

    <section data-snap="sources" className={section}>
      <div className={jsonViewWidth}>
        <Sources
          items={[
            { id: 's1', title: 'Design tokens spec', snippet: 'Tokens are plain CSS custom properties…' },
            { id: 's2', title: 'OKLCH primer', url: 'https://example.com/oklch' },
          ]}
        />
        <Sources
          compact
          items={[
            { id: 'c1', title: 'First source' },
            { id: 'c2', title: 'Second source' },
          ]}
        />
      </div>
    </section>

    <section data-snap="filepreview" className={section}>
      <div className={row}>
        <FilePreview file={{ name: 'report.pdf', size: 204800, type: 'application/pdf' }} />
        <FilePreview
          file={{ name: 'failed.png', size: 51200, type: 'image/png' }}
          status="error"
        />
        <FilePreview
          file={{ name: 'uploading.zip', size: 1048576, type: 'application/zip' }}
          status="uploading"
          progress={40}
        />
      </div>
    </section>

    <section data-snap="inlinecompletion" className={section}>
      <InlineCompletion
        value="The quick"
        suggestion=" brown fox jumps over the lazy dog"
        aria-label="Completion demo"
      />
    </section>

    <section data-snap="masonry" className={section}>
      <div className={masonryWidth}>
        <Masonry columns={3} gap={2}>
          <div className={masonryBlockTall}>1</div>
          <div className={masonryBlock}>2</div>
          <div className={masonryBlock}>3</div>
          <div className={masonryBlock}>4</div>
          <div className={masonryBlockTall}>5</div>
          <div className={masonryBlock}>6</div>
        </Masonry>
      </div>
    </section>

    <section data-snap="signature" className={section}>
      <Signature aria-label="Empty signature" />
    </section>

    <div className={`${darkPanel} ${darkTheme}`}>
      <section data-snap="darkfields" className={section}>
        <div className={row}>
          <Input
            value="haze@example.com"
            aria-label="Dark email"
            style={{ width: '220px' }}
          />
          <Select value="banana" aria-label="Dark fruit" style={{ width: '160px' }}>
            <Option value="apple">Apple</Option>
            <Option value="banana">Banana</Option>
            <Option value="cherry">Cherry</Option>
          </Select>
          <Switch checked aria-label="Dark notifications" />
          <Checkbox checked label="Locked in" />
        </div>
        <div className={row}>
          <Button variant="solid">Solid</Button>
          <Button variant="outline">Outline</Button>
          <Badge variant="success">Passing</Badge>
          <Badge variant="danger">Failing</Badge>
        </div>
      </section>
    </div>
  </>
);
