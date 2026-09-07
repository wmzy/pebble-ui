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
 */
import { css } from '@linaria/core';

import { Accordion, AccordionItem } from '../../src/lib/components/Accordion';
import { Avatar } from '../../src/lib/components/Avatar';
import { Badge } from '../../src/lib/components/Badge';
import { Button } from '../../src/lib/components/Button';
import { Card } from '../../src/lib/components/Card';
import { ChatMessage } from '../../src/lib/components/ChatMessage';
import { Checkbox } from '../../src/lib/components/Checkbox';
import { Input } from '../../src/lib/components/Input';
import { MarkdownRenderer } from '../../src/lib/components/MarkdownRenderer';
import { Pagination } from '../../src/lib/components/Pagination';
import { Progress } from '../../src/lib/components/Progress';
import { Radio, RadioGroup } from '../../src/lib/components/Radio';
import { Option, Select } from '../../src/lib/components/Select';
import { Skeleton } from '../../src/lib/components/Skeleton';
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

const progressWidth = css`
  width: 220px;
`;

const tabsWidth = css`
  width: 360px;
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
  </>
);
