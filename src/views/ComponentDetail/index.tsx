import type { ReactNode } from 'react';

import type { Table as TanStackTable } from '@tanstack/react-table';

import { useEffect, useRef, useState } from 'react';
import { useMatched } from '@native-router/react';
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { useControl } from 'react-use-control';

import { css } from '@linaria/core';

const noop = () => {
  /* demo placeholder */
};

import {
  Button,
  ButtonLink,
  Input,
  Select,
  Option,
  Checkbox,
  CheckboxCore,
  Switch,
  Badge,
  Dialog,
  Tooltip,
  Popover,
  Card,
  Radio,
  RadioGroup,
  Textarea,
  TextareaCore,
  Slider,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  Alert,
  Avatar,
  Tag,
  Skeleton,
  Icon,
  Image,
  Flex,
  Breadcrumb,
  BreadcrumbItem,
  Disclosure,
  Menu,
  MenuItem,
  MenuDivider,
  NumberInput,
  FileInput,
  ToastContainer,
  useToast,
  List,
  ListItem,
  Combobox,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Carousel,
  CarouselSlide,
  Datepicker,
  COMPONENT_TOKENS,
  Tree,
  type TreeNodeData,
  Divider,
  Spinner,
  Empty,
  Progress,
  Pagination,
  Grid,
  GridItem,
  Drawer,
  Stepper,
  Step,
  ChatMessage,
  ChatContainer,
  ChatInput,
  StreamingText,
  MarkdownRenderer,
  ToolCallCard,
  ThinkingIndicator,
  StepTimeline,
  StepTimelineItem,
  ApprovalCard,
  TokenCounter,
  ModelPicker,
  ConversationList,
  ConversationItem,
  DiffViewer,
  LogViewer,
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  ResizableGroup,
  ResizablePanel,
  ResizableHandle,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Transfer,
  Upload,
  UploadCore,
  ColorPicker,
  Rating,
  Timeline,
  TimelineItem,
  Title,
  Text,
  Paragraph,
  Stat,
  StatGroup,
  Segmented,
  Chip,
  ScrollArea,
  TimePicker,
  DateRangePicker,
  OTPInput,
  PasswordInput,
  TagInput,
  InlineEdit,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  NavigationBar,
  NavLink,
  BackToTop,
  Container,
  Banner,
  ConfirmDialog,
  CodeBlock,
  AspectRatio,
  VirtualList,
  TagGroup,
  TagGroupItem,
  BottomSheet,
  SwipeAction,
} from '@/lib';

import FormDemo from '@/components/FormDemo';

import generatedProps from '@/generated/props.json';

import PropsTable from './PropsTable';
import A11yNote from './A11yNote';
import TokensTable from './TokensTable';
import {
  page,
  intro,
  section,
  row,
  fieldRow,
  labelStyle,
  codeBlock,
} from './styles';

function CssVarsSection({ component }: { component: string }) {
  const tokens = COMPONENT_TOKENS[component];
  if (!tokens?.length) return null;
  return (
    <div className={section}>
      <h2>CSS Variables</h2>
      <TokensTable tokens={tokens} />
    </div>
  );
}

// ─── Shared SVG helpers ─────────────────────────────────────────

function StrokeSvg() {
  return (
    <svg viewBox='0 0 24 24'>
      <path
        d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      />
    </svg>
  );
}

function FillSvg() {
  return (
    <svg viewBox='0 0 24 24'>
      <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
    </svg>
  );
}

// ─── Button ────────────────────────────────────────────────────

function ButtonDemo() {
  return (
    <>
      <h1>Button</h1>
      <p className={intro}>Trigger actions with configurable style and size.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row}>
          <Button variant='solid'>Solid</Button>
          <Button variant='outline'>Outline</Button>
          <Button variant='ghost'>Ghost</Button>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Button size='sm'>Small</Button>
          <Button size='md'>Medium</Button>
          <Button size='lg'>Large</Button>
        </div>
      </div>

      <div className={section}>
        <h2>Square (Icon Button)</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Use <code>square</code> for icon-only buttons with equal padding on
          all sides.
        </p>
        <div className={row}>
          <Button size='sm' square variant='solid'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='md' square variant='solid'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='lg' square variant='solid'>
            <Icon size='md'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='sm' square variant='outline'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
          <Button size='sm' square variant='ghost'>
            <Icon size='sm'>
              <StrokeSvg />
            </Icon>
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={row}>
          <Button disabled>Disabled Solid</Button>
          <Button variant='outline' disabled>
            Disabled Outline
          </Button>
          <Button variant='ghost' disabled>
            Disabled Ghost
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>ButtonLink — a real anchor with the Button skin</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Navigation that must look like a button: <code>ButtonLink</code>{' '}
          renders a native <code>&lt;a&gt;</code> (href, ⌘/middle-click,
          crawlers) wearing the same variants/sizes. Anchors have no{' '}
          <code>disabled</code> attribute — report the state with{' '}
          <code>aria-disabled</code> plus <code>tabIndex=&#123;-1&#125;</code>.
        </p>
        <div className={row}>
          <ButtonLink href='#button'>Link Solid</ButtonLink>
          <ButtonLink href='#button' variant='outline'>
            Link Outline
          </ButtonLink>
          <ButtonLink href='#button' variant='ghost'>
            Link Ghost
          </ButtonLink>
          <ButtonLink href='#button' variant='outline' aria-disabled tabIndex={-1}>
            Link Disabled
          </ButtonLink>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ButtonProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;button&gt;</strong> with{' '}
              <strong>type=&quot;button&quot;</strong>
            </li>
            <li>
              Supports <strong>Tab</strong> focus and <strong>Enter</strong>/
              <strong>Space</strong> activation
            </li>
            <li>
              Disabled state uses <strong>disabled</strong> attribute, removing
              from tab order
            </li>
            <li>
              Focus ring via <strong>:focus-visible</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='button' />
    </>
  );
}

// ─── Input ─────────────────────────────────────────────────────

function InputDemo() {
  return (
    <>
      <h1>Input</h1>
      <p className={intro}>
        Single-line text input with controlled/uncontrolled support.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={fieldRow}>
          <Input size='sm' placeholder='Small' />
        </div>
        <div className={fieldRow}>
          <Input size='md' placeholder='Medium' />
        </div>
        <div className={fieldRow}>
          <Input size='lg' placeholder='Large' />
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Input disabled placeholder='Disabled' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='InputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;input&gt;</strong>
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong> for screen readers
            </li>
            <li>
              Focus ring via <strong>:focus</strong> pseudo-class
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='input' />
    </>
  );
}

// ─── Select ────────────────────────────────────────────────────

function SelectDemo() {
  return (
    <>
      <h1>Select</h1>
      <p className={intro}>
        Dropdown selection with native &lt;select&gt; semantics.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={fieldRow}>
          <Select size='sm'>
            <Option value=''>Small select</Option>
            <Option value='a'>Option A</Option>
            <Option value='b'>Option B</Option>
          </Select>
        </div>
        <div className={fieldRow}>
          <Select size='md'>
            <Option value=''>Medium select</Option>
            <Option value='a'>Option A</Option>
            <Option value='b'>Option B</Option>
          </Select>
        </div>
        <div className={fieldRow}>
          <Select size='lg'>
            <Option value=''>Large select</Option>
            <Option value='a'>Option A</Option>
            <Option value='b'>Option B</Option>
          </Select>
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Select disabled>
            <Option value=''>Disabled</Option>
          </Select>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SelectProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;select&gt;</strong> with full
              keyboard support
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate options,{' '}
              <strong>Enter</strong> selects
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='select' />
    </>
  );
}

// ─── Checkbox ──────────────────────────────────────────────────

function CheckboxDemo() {
  return (
    <>
      <h1>Checkbox</h1>
      <p className={intro}>Toggle a boolean value on or off.</p>

      <div className={section}>
        <h2>Default</h2>
        <div className={row}>
          <label className={labelStyle}>
            <Checkbox /> Unchecked
          </label>
          <label className={labelStyle}>
            <Checkbox checked /> Checked
          </label>
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={row}>
          <label className={labelStyle}>
            <Checkbox disabled /> Disabled
          </label>
          <label className={labelStyle}>
            <Checkbox checked disabled /> Checked Disabled
          </label>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CheckboxProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native{' '}
              <strong>&lt;input type=&quot;checkbox&quot;&gt;</strong>
            </li>
            <li>
              <strong>Space</strong> toggles the checked state
            </li>
            <li>
              Wrap with <strong>&lt;label&gt;</strong> for accessible labeling
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='checkbox' />
    </>
  );
}

// ─── Switch ────────────────────────────────────────────────────

function SwitchDemo() {
  return (
    <>
      <h1>Switch</h1>
      <p className={intro}>
        Toggle between on/off states with a sliding control.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Switch size='sm' />
          <Switch size='md' />
          <Switch size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={row}>
          <Switch disabled />
          <Switch checked disabled />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SwitchProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;switch&quot;</strong> with{' '}
              <strong>aria-checked</strong>
            </li>
            <li>
              <strong>Space</strong> toggles the state
            </li>
            <li>
              Provide <strong>aria-label</strong> when no visible label is
              present
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='switch' />
    </>
  );
}

// ─── Badge ─────────────────────────────────────────────────────

function BadgeDemo() {
  return (
    <>
      <h1>Badge</h1>
      <p className={intro}>
        Small status indicators for labeling and categorization.
      </p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row}>
          <Badge variant='default'>Default</Badge>
          <Badge variant='success'>Success</Badge>
          <Badge variant='warning'>Warning</Badge>
          <Badge variant='danger'>Danger</Badge>
          <Badge variant='info'>Info</Badge>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Badge size='sm'>Small</Badge>
          <Badge size='md'>Medium</Badge>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BadgeProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a <strong>&lt;span&gt;</strong> — purely decorative
            </li>
            <li>
              Add <strong>aria-label</strong> if the badge conveys meaning not
              present in surrounding text
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='badge' />
    </>
  );
}

// ─── Dialog ────────────────────────────────────────────────────

function DialogDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>Dialog</h1>
      <p className={intro}>
        Modal dialog using the native &lt;dialog&gt; element.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        </div>
        <Dialog open={openCtrl} onClose={() => setOpen(false)}>
          <h3 style={{ margin: '0 0 8px' }}>Dialog Title</h3>
          <p
            style={{
              margin: '0 0 16px',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            This is a modal dialog. Press ESC or click the backdrop to close.
          </p>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Dialog>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DialogProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;dialog&gt;</strong> with{' '}
              <strong>showModal()</strong> — automatic{' '}
              <strong>role=&quot;dialog&quot;</strong>
            </li>
            <li>
              <strong>ESC</strong> closes the dialog
            </li>
            <li>Focus is trapped within the dialog while open</li>
            <li>Backdrop click closes the dialog</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='dialog' />
    </>
  );
}

// ─── Tooltip ───────────────────────────────────────────────────

function TooltipDemo() {
  return (
    <>
      <h1>Tooltip</h1>
      <p className={intro}>
        Informational popup triggered by hover or focus, using pure CSS.
      </p>

      <div className={section}>
        <h2>Positions</h2>
        <div className={row}>
          <Tooltip content='Top tooltip' position='top'>
            <Button variant='outline'>Top</Button>
          </Tooltip>
          <Tooltip content='Bottom tooltip' position='bottom'>
            <Button variant='outline'>Bottom</Button>
          </Tooltip>
          <Tooltip content='Left tooltip' position='left'>
            <Button variant='outline'>Left</Button>
          </Tooltip>
          <Tooltip content='Right tooltip' position='right'>
            <Button variant='outline'>Right</Button>
          </Tooltip>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TooltipProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;tooltip&quot;</strong> with{' '}
              <strong>aria-describedby</strong>
            </li>
            <li>
              Visible on <strong>hover</strong> and{' '}
              <strong>focus-within</strong>
            </li>
            <li>Content is always in the DOM for screen readers</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tooltip' />
    </>
  );
}

// ─── Popover ───────────────────────────────────────────────────

function PopoverDemo() {
  return (
    <>
      <h1>Popover</h1>
      <p className={intro}>
        Click-triggered floating panel for additional content.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Popover content={<div>Popover content goes here.</div>}>
            <Button variant='outline'>Toggle Popover</Button>
          </Popover>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='PopoverProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Trigger has <strong>aria-expanded</strong> and{' '}
              <strong>aria-controls</strong>
            </li>
            <li>
              Panel is hidden with <strong>display: none</strong> when closed
            </li>
            <li>Click trigger to toggle open/close</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='popover' />
    </>
  );
}

// ─── Card ──────────────────────────────────────────────────────

function CardDemo() {
  return (
    <>
      <h1>Card</h1>
      <p className={intro}>
        Container for grouping related content with visual separation.
      </p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row} style={{ alignItems: 'stretch' }}>
          <Card variant='elevated'>
            <h3 style={{ margin: '0 0 4px' }}>Elevated</h3>
            <p
              style={{
                margin: 0,
                color: 'var(--haze-color-text-secondary)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              Shadow-based elevation.
            </p>
          </Card>
          <Card variant='outlined'>
            <h3 style={{ margin: '0 0 4px' }}>Outlined</h3>
            <p
              style={{
                margin: 0,
                color: 'var(--haze-color-text-secondary)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              Border-based separation.
            </p>
          </Card>
          <Card variant='filled'>
            <h3 style={{ margin: '0 0 4px' }}>Filled</h3>
            <p
              style={{
                margin: 0,
                color: 'var(--haze-color-text-secondary)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              Background-based distinction.
            </p>
          </Card>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CardProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a <strong>&lt;div&gt;</strong> — add{' '}
              <strong>role</strong> and <strong>aria-label</strong> if the card
              represents a distinct landmark
            </li>
            <li>Purely presentational by default</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='card' />
    </>
  );
}

// ─── Radio ─────────────────────────────────────────────────────

function RadioDemo() {
  return (
    <>
      <h1>Radio</h1>
      <p className={intro}>
        Single selection from a group of options using RadioGroup context.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <RadioGroup>
          <Radio value='apple'>Apple</Radio>
          <Radio value='banana'>Banana</Radio>
          <Radio value='cherry'>Cherry</Radio>
        </RadioGroup>
      </div>

      <div className={section}>
        <h2>RadioGroup Props</h2>
        <PropsTable of='RadioGroupProps' />
      </div>

      <div className={section}>
        <h2>Radio Props</h2>
        <PropsTable of='RadioProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;input type=&quot;radio&quot;&gt;</strong>{' '}
              inside <strong>&lt;fieldset&gt;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate between options
            </li>
            <li>
              <strong>Space</strong> selects the focused option
            </li>
            <li>
              Add a <strong>&lt;legend&gt;</strong> inside RadioGroup for group
              labeling
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='radio' />
    </>
  );
}

// ─── Textarea ──────────────────────────────────────────────────

function TextareaDemo() {
  return (
    <>
      <h1>Textarea</h1>
      <p className={intro}>
        Multi-line text input, styled consistently with Input.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={fieldRow}>
          <Textarea size='sm' placeholder='Small' rows={3} />
        </div>
        <div className={fieldRow}>
          <Textarea size='md' placeholder='Medium' rows={3} />
        </div>
        <div className={fieldRow}>
          <Textarea size='lg' placeholder='Large' rows={3} />
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Textarea disabled placeholder='Disabled' rows={3} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TextareaProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native <strong>&lt;textarea&gt;</strong>
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong>
            </li>
            <li>
              Supports <strong>resize: vertical</strong> by default
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='textarea' />
    </>
  );
}

// ─── Slider ────────────────────────────────────────────────────

function SliderDemo() {
  const [, , valueCtrl] = useControl(undefined, 50);
  const [value] = useControl(valueCtrl);

  return (
    <>
      <h1>Slider</h1>
      <p className={intro}>
        Range input for selecting a numeric value within a range.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Slider value={valueCtrl} min={0} max={100} step={1} />
          <span
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Value: {value}
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div className={fieldRow}>
          <Slider disabled />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SliderProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as native{' '}
              <strong>&lt;input type=&quot;range&quot;&gt;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> adjust the value by step
            </li>
            <li>
              Use <strong>aria-label</strong> or a visible{' '}
              <strong>&lt;label&gt;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='slider' />
    </>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────

function TabsDemo() {
  const [, , tabCtrl] = useControl(undefined, 'tab1');

  return (
    <>
      <h1>Tabs</h1>
      <p className={intro}>
        Organize content into switchable panels with tabbed navigation.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <Tabs value={tabCtrl}>
          <TabList>
            <Tab value='tab1'>Tab One</Tab>
            <Tab value='tab2'>Tab Two</Tab>
            <Tab value='tab3'>Tab Three</Tab>
          </TabList>
          <TabPanel value='tab1'>Content for Tab One.</TabPanel>
          <TabPanel value='tab2'>Content for Tab Two.</TabPanel>
          <TabPanel value='tab3'>Content for Tab Three.</TabPanel>
        </Tabs>
      </div>

      <div className={section}>
        <h2>Tabs Props</h2>
        <PropsTable of='TabsProps' />
      </div>

      <div className={section}>
        <h2>Tab Props</h2>
        <PropsTable of='TabProps' />
      </div>

      <div className={section}>
        <h2>TabPanel Props</h2>
        <PropsTable of='TabPanelProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;tablist&quot;</strong>,{' '}
              <strong>role=&quot;tab&quot;</strong>,{' '}
              <strong>role=&quot;tabpanel&quot;</strong>
            </li>
            <li>
              Active tab has <strong>aria-selected=&quot;true&quot;</strong>
            </li>
            <li>
              Tabs linked to panels via <strong>aria-controls</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate between tabs
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tabs' />
    </>
  );
}

// ─── Accordion ─────────────────────────────────────────────────

function AccordionDemo() {
  return (
    <>
      <h1>Accordion</h1>
      <p className={intro}>
        Collapsible content sections using native
        &lt;details&gt;/&lt;summary&gt;.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <Accordion>
          <AccordionItem title='Section One'>
            Content for section one. This uses the native details/summary
            elements.
          </AccordionItem>
          <AccordionItem title='Section Two'>
            Content for section two. Click the header to expand or collapse.
          </AccordionItem>
          <AccordionItem title='Section Three'>
            Content for section three. The chevron rotates on open.
          </AccordionItem>
        </Accordion>
      </div>

      <div className={section}>
        <h2>Accordion Props</h2>
        <PropsTable of='AccordionProps' />
      </div>

      <div className={section}>
        <h2>AccordionItem Props</h2>
        <PropsTable of='AccordionItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;details&gt;</strong>/
              <strong>&lt;summary&gt;</strong> — built-in keyboard and screen
              reader support
            </li>
            <li>
              <strong>Enter</strong>/<strong>Space</strong> toggles open/close
            </li>
            <li>
              Exclusive mode uses the HTML <strong>name</strong> attribute for
              mutual exclusion
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='accordion' />
    </>
  );
}

// ─── Alert ─────────────────────────────────────────────────────

function AlertDemo() {
  const [key, setKey] = useState(0);

  return (
    <>
      <h1>Alert</h1>
      <p className={intro}>Contextual feedback messages for user actions.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
            maxWidth: 480,
          }}
        >
          <Alert variant='info'>This is an informational alert.</Alert>
          <Alert variant='success'>Operation completed successfully.</Alert>
          <Alert variant='warning'>Please review before proceeding.</Alert>
          <Alert variant='danger'>An error occurred. Please try again.</Alert>
        </div>
      </div>

      <div className={section}>
        <h2>Closable</h2>
        <div style={{ maxWidth: 480 }}>
          <Alert key={key} variant='info' closable>
            This alert can be dismissed. Click the × button.
          </Alert>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setKey((k) => k + 1)}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AlertProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;alert&quot;</strong> — announced by screen
              readers immediately
            </li>
            <li>
              Close button has <strong>aria-label=&quot;Close&quot;</strong>
            </li>
            <li>Focus management: close button is keyboard accessible</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='alert' />
    </>
  );
}

// ─── Avatar ────────────────────────────────────────────────────

function AvatarDemo() {
  return (
    <>
      <h1>Avatar</h1>
      <p className={intro}>Circular image container with fallback support.</p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Avatar size='sm' src='https://i.pravatar.cc/64?u=a' alt='Alice' />
          <Avatar size='md' src='https://i.pravatar.cc/80?u=b' alt='Bob' />
          <Avatar size='lg' src='https://i.pravatar.cc/112?u=c' alt='Carol' />
        </div>
      </div>

      <div className={section}>
        <h2>Fallback</h2>
        <div className={row}>
          <Avatar size='md' alt='Dave' />
          <Avatar size='md' fallback='🎨' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AvatarProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>&lt;img&gt;</strong> with <strong>alt</strong> text
              when image is available
            </li>
            <li>
              Fallback shows first letter of <strong>alt</strong> or custom
              content
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='avatar' />
    </>
  );
}

// ─── Tag ───────────────────────────────────────────────────────

function TagDemo() {
  const [tags, setTags] = useState(['React', 'TypeScript', 'Linaria']);

  return (
    <>
      <h1>Tag</h1>
      <p className={intro}>
        Interactive labels for categorization and filtering.
      </p>

      <div className={section}>
        <h2>Variants</h2>
        <div className={row}>
          <Tag variant='default'>Default</Tag>
          <Tag variant='primary'>Primary</Tag>
          <Tag variant='success'>Success</Tag>
          <Tag variant='warning'>Warning</Tag>
          <Tag variant='danger'>Danger</Tag>
        </div>
      </div>

      <div className={section}>
        <h2>Closable</h2>
        <div className={row}>
          {tags.map((t) => (
            <Tag
              key={t}
              closable
              onClose={() => setTags((prev) => prev.filter((x) => x !== t))}
            >
              {t}
            </Tag>
          ))}
          {tags.length === 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setTags(['React', 'TypeScript', 'Linaria'])}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TagProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Close button has <strong>aria-label=&quot;Remove&quot;</strong>
            </li>
            <li>
              Close button is keyboard accessible via <strong>Tab</strong> +{' '}
              <strong>Enter</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tag' />
    </>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────

function SkeletonDemo() {
  return (
    <>
      <h1>Skeleton</h1>
      <p className={intro}>Animated placeholder for loading states.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
            maxWidth: 320,
          }}
        >
          <Skeleton variant='text' width='80%' />
          <Skeleton variant='text' width='60%' />
          <Skeleton variant='rectangular' width={320} height={120} />
          <div className={row}>
            <Skeleton variant='circular' width={40} height={40} />
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--haze-space-1)',
              }}
            >
              <Skeleton variant='text' width='50%' />
              <Skeleton variant='text' width='80%' />
            </div>
          </div>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SkeletonProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely decorative — use{' '}
              <strong>aria-busy=&quot;true&quot;</strong> on the parent
              container during loading
            </li>
            <li>
              Shimmer animation is CSS-only, respects{' '}
              <strong>prefers-reduced-motion</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='skeleton' />
    </>
  );
}

// ─── Icon ──────────────────────────────────────────────────────

function IconDemo() {
  return (
    <>
      <h1>Icon</h1>
      <p className={intro}>
        Wrapper for SVG icons with consistent sizing and color inheritance.
        Works with both fill-based and stroke-based SVGs, and integrates
        seamlessly with community icon libraries like Lucide, React Icons, and
        Phosphor.
      </p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Icon size='sm'>
            <StrokeSvg />
          </Icon>
          <Icon size='md'>
            <StrokeSvg />
          </Icon>
          <Icon size='lg'>
            <StrokeSvg />
          </Icon>
        </div>
      </div>

      <div className={section}>
        <h2>Fill vs Stroke</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Icon auto-detects stroke-based SVGs (those with{' '}
          <code>fill=&quot;none&quot;</code> or <code>stroke</code> attributes)
          and adjusts rendering accordingly. Fill-based SVGs work out of the
          box.
        </p>
        <div className={row}>
          <Flex gap='var(--haze-space-4)' style={{ alignItems: 'center' }}>
            <Flex gap='var(--haze-space-2)' style={{ alignItems: 'center' }}>
              <Icon size='lg'>
                <StrokeSvg />
              </Icon>
              <span
                style={{
                  fontSize: 'var(--haze-text-xs)',
                  color: 'var(--haze-color-text-muted)',
                }}
              >
                Stroke
              </span>
            </Flex>
            <Flex gap='var(--haze-space-2)' style={{ alignItems: 'center' }}>
              <Icon size='lg'>
                <FillSvg />
              </Icon>
              <span
                style={{
                  fontSize: 'var(--haze-text-xs)',
                  color: 'var(--haze-color-text-muted)',
                }}
              >
                Fill
              </span>
            </Flex>
          </Flex>
        </div>
      </div>

      <div className={section}>
        <h2>
          Using the <code>icon</code> Prop
        </h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Pass a component directly via the <code>icon</code> prop instead of
          wrapping it in children. When using <code>icon</code>, stroke mode is
          enabled by default to work with most community icon libraries.
        </p>
        <div className={row}>
          <Icon icon={StrokeSvg} size='sm' />
          <Icon icon={StrokeSvg} size='md' />
          <Icon icon={StrokeSvg} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Community Icon Libraries</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          Haze UI Icon is designed as a thin wrapper — it does not bundle any
          icons. Instead, pair it with your preferred icon library:
        </p>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          Lucide React
        </h3>
        <pre
          className={codeBlock}
        >{`import { Search, ChevronDown } from 'lucide-react';
import { Icon } from 'haze-ui';

// Using icon prop (recommended)
<Icon icon={Search} size="md" />

// Using children
<Icon size="sm"><Search /></Icon>`}</pre>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          React Icons
        </h3>
        <pre
          className={codeBlock}
        >{`import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { Icon } from 'haze-ui';

<Icon size="md"><FiSearch /></Icon>`}</pre>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          Phosphor Icons
        </h3>
        <pre
          className={codeBlock}
        >{`import { MagnifyingGlass } from '@phosphor-icons/react';
import { Icon } from 'haze-ui';

<Icon icon={MagnifyingGlass} size="md" />`}</pre>

        <h3
          style={{
            fontSize: 'var(--haze-text-sm)',
            fontWeight: 600,
            margin: 'var(--haze-space-4) 0 var(--haze-space-2)',
          }}
        >
          Inline SVG
        </h3>
        <pre className={codeBlock}>{`import { Icon } from 'haze-ui';

<Icon size="lg">
  <svg viewBox="0 0 24 24">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
  </svg>
</Icon>`}</pre>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='IconProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Has <strong>aria-hidden=&quot;true&quot;</strong> by default —
              decorative only
            </li>
            <li>
              For meaningful icons, add <strong>aria-label</strong> to the
              parent element
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='icon' />
    </>
  );
}

// ─── Image ─────────────────────────────────────────────────────

function ImageDemo() {
  return (
    <>
      <h1>Image</h1>
      <p className={intro}>
        Enhanced image component with fallback and aspect ratio support.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320 }}>
          <Image
            src='https://picsum.photos/640/360'
            alt='Sample landscape'
            aspectRatio='16/9'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Fallback</h2>
        <div style={{ maxWidth: 320 }}>
          <Image
            src='https://invalid-url.example'
            alt='Broken image'
            aspectRatio='16/9'
            fallback='Image failed to load'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ImageProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;img&gt;</strong> with required{' '}
              <strong>alt</strong> text
            </li>
            <li>Fallback content is visible to screen readers</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='image' />
    </>
  );
}

// ─── Flex ──────────────────────────────────────────────────────

function FlexDemo() {
  return (
    <>
      <h1>Flex</h1>
      <p className={intro}>Shorthand layout component for flexbox patterns.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Flex gap='var(--haze-space-3)' align='center'>
          <Badge>Item 1</Badge>
          <Badge variant='success'>Item 2</Badge>
          <Badge variant='info'>Item 3</Badge>
        </Flex>
      </div>

      <div className={section}>
        <h2>Column</h2>
        <Flex direction='column' gap='var(--haze-space-2)'>
          <Badge>Row A</Badge>
          <Badge variant='warning'>Row B</Badge>
        </Flex>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='FlexProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a plain <strong>&lt;div&gt;</strong> — purely
              presentational
            </li>
            <li>
              No semantic meaning; add <strong>role</strong> if needed
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='flex' />
    </>
  );
}

// ─── Breadcrumb ────────────────────────────────────────────────

function BreadcrumbDemo() {
  return (
    <>
      <h1>Breadcrumb</h1>
      <p className={intro}>
        Navigation trail showing the current page location.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <Breadcrumb>
          <BreadcrumbItem href='#'>Home</BreadcrumbItem>
          <BreadcrumbItem href='#'>Components</BreadcrumbItem>
          <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className={section}>
        <h2>Custom Separator</h2>
        <Breadcrumb separator='›'>
          <BreadcrumbItem href='#'>Docs</BreadcrumbItem>
          <BreadcrumbItem href='#'>UI</BreadcrumbItem>
          <BreadcrumbItem>Current</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <div className={section}>
        <h2>Breadcrumb Props</h2>
        <PropsTable of='BreadcrumbProps' />
      </div>

      <div className={section}>
        <h2>BreadcrumbItem Props</h2>
        <PropsTable of='BreadcrumbItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses{' '}
              <strong>&lt;nav aria-label=&quot;Breadcrumb&quot;&gt;</strong>{' '}
              with <strong>&lt;ol&gt;</strong>
            </li>
            <li>
              Last item has <strong>aria-current=&quot;page&quot;</strong>
            </li>
            <li>
              Separators have <strong>aria-hidden=&quot;true&quot;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='breadcrumb' />
    </>
  );
}

// ─── Disclosure ────────────────────────────────────────────────

function DisclosureDemo() {
  return (
    <>
      <h1>Disclosure</h1>
      <p className={intro}>
        Single collapsible section using native details/summary.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 480 }}>
          <Disclosure summary='Click to expand'>
            This is the hidden content that appears when the disclosure is
            opened. It uses the native details/summary elements for built-in
            accessibility.
          </Disclosure>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DisclosureProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;details&gt;</strong>/
              <strong>&lt;summary&gt;</strong>
            </li>
            <li>
              <strong>Enter</strong>/<strong>Space</strong> toggles open/close
            </li>
            <li>Screen readers announce expanded/collapsed state</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='disclosure' />
    </>
  );
}

// ─── Menu ──────────────────────────────────────────────────────

function MenuDemo() {
  return (
    <>
      <h1>Menu</h1>
      <p className={intro}>Dropdown menu with keyboard navigation.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Menu trigger={<Button variant='outline'>Open Menu</Button>}>
            <MenuItem onSelect={noop}>Edit</MenuItem>
            <MenuItem onSelect={noop}>Duplicate</MenuItem>
            <MenuDivider />
            <MenuItem onSelect={noop}>Archive</MenuItem>
            <MenuItem disabled>Delete</MenuItem>
          </Menu>
        </div>
      </div>

      <div className={section}>
        <h2>Menu Props</h2>
        <PropsTable of='MenuProps' />
      </div>

      <div className={section}>
        <h2>MenuItem Props</h2>
        <PropsTable of='MenuItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;menu&quot;</strong> and{' '}
              <strong>role=&quot;menuitem&quot;</strong>
            </li>
            <li>Click outside closes the menu</li>
            <li>
              Disabled items have <strong>disabled</strong> attribute
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='menu' />
    </>
  );
}

// ─── NumberInput ───────────────────────────────────────────────

function NumberInputDemo() {
  const [, , valueCtrl] = useControl(undefined, 5);
  const [value] = useControl(valueCtrl);

  return (
    <>
      <h1>NumberInput</h1>
      <p className={intro}>Numeric input with increment/decrement buttons.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <NumberInput value={valueCtrl} min={0} max={100} step={1} />
          <span
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Value: {value}
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <NumberInput size='sm' min={0} max={10} />
          <NumberInput size='md' min={0} max={10} />
          <NumberInput size='lg' min={0} max={10} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='NumberInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>&lt;input type=&quot;number&quot;&gt;</strong>
            </li>
            <li>
              Stepper buttons have <strong>aria-label</strong>{' '}
              (&quot;Decrease&quot;/&quot;Increase&quot;)
            </li>
            <li>Buttons are disabled at min/max boundaries</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='numberinput' />
    </>
  );
}

// ─── FileInput ─────────────────────────────────────────────────

function FileInputDemo() {
  return (
    <>
      <h1>FileInput</h1>
      <p className={intro}>Styled file picker with hidden native input.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <FileInput accept='image/*' />
          <FileInput accept='.pdf,.doc'>Upload Document</FileInput>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='FileInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses a <strong>&lt;label&gt;</strong> wrapping a visually hidden{' '}
              <strong>&lt;input type=&quot;file&quot;&gt;</strong>
            </li>
            <li>
              Keyboard accessible — <strong>Tab</strong> focuses,{' '}
              <strong>Enter</strong>/<strong>Space</strong> opens file dialog
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='fileinput' />
    </>
  );
}

// ─── Toast ─────────────────────────────────────────────────────

function ToastDemoInner() {
  const toast = useToast();

  return (
    <>
      <h1>Toast</h1>
      <p className={intro}>
        Temporary notification messages via useToast() hook.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button variant='outline' onClick={() => toast('Info toast message')}>
            Info
          </Button>
          <Button
            variant='outline'
            onClick={() => toast('Success!', { variant: 'success' })}
          >
            Success
          </Button>
          <Button
            variant='outline'
            onClick={() => toast('Warning toast', { variant: 'warning' })}
          >
            Warning
          </Button>
          <Button
            variant='outline'
            onClick={() => toast('Error occurred', { variant: 'danger' })}
          >
            Danger
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>useToast API</h2>
        <PropsTable
          props={[
            {
              name: 'content',
              type: 'ReactNode',
              description: 'Toast message (first argument)',
            },
            {
              name: 'options.variant',
              type: "'info' | 'success' | 'warning' | 'danger'",
              default: "'info'",
              description: 'Color variant',
            },
            {
              name: 'options.duration',
              type: 'number',
              default: '3000',
              description: 'Auto-dismiss time in ms',
            },
          ]}
        />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Each toast has <strong>role=&quot;alert&quot;</strong>
            </li>
            <li>
              Close button has <strong>aria-label=&quot;Close&quot;</strong>
            </li>
            <li>Toasts auto-dismiss after the configured duration</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='toast' />
    </>
  );
}

function ToastDemo() {
  return (
    <ToastContainer>
      <ToastDemoInner />
    </ToastContainer>
  );
}

// ─── List ──────────────────────────────────────────────────────

function ListDemo() {
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

// ─── Combobox ──────────────────────────────────────────────────

function ComboboxDemo() {
  const fruits = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'grape', label: 'Grape' },
    { value: 'mango', label: 'Mango' },
    { value: 'orange', label: 'Orange' },
  ];

  return (
    <>
      <h1>Combobox</h1>
      <p className={intro}>
        Searchable dropdown combining text input with a filterable list.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Combobox options={fruits} placeholder='Search fruits...' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ComboboxProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;combobox&quot;</strong> with{' '}
              <strong>aria-expanded</strong> and{' '}
              <strong>aria-autocomplete=&quot;list&quot;</strong>
            </li>
            <li>
              Options use <strong>role=&quot;listbox&quot;</strong> and{' '}
              <strong>role=&quot;option&quot;</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate options,{' '}
              <strong>Enter</strong> selects, <strong>Escape</strong> closes
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='combobox' />
    </>
  );
}

// ─── Table ─────────────────────────────────────────────────────

function TableDemo() {
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

// ─── DataTable (recipe) ────────────────────────────────────────

type EmployeeStatus = 'active' | 'away' | 'offline';

type EmployeeRow = {
  id: number;
  name: string;
  role: string;
  status: EmployeeStatus;
  score: number;
  joined: string;
};

const DATA_TABLE_ROWS = 500;
const DATA_TABLE_PAGE_SIZE = 10;

const EMPLOYEE_FIRST_NAMES = [
  'Ada',
  'Grace',
  'Alan',
  'Edsger',
  'Barbara',
  'Donald',
  'Radia',
  'Vint',
  'Margaret',
  'Dennis',
  'Frances',
  'Ken',
  'Katherine',
  'John',
  'Hedy',
  'Linus',
];
const EMPLOYEE_LAST_NAMES = [
  'Lovelace',
  'Hopper',
  'Turing',
  'Dijkstra',
  'Liskov',
  'Knuth',
  'Perlman',
  'Cerf',
  'Hamilton',
  'Ritchie',
  'Allen',
  'Thompson',
  'Johnson',
  'Backus',
  'Lamarr',
  'Torvalds',
];
const EMPLOYEE_ROLES = [
  'Engineer',
  'Designer',
  'Manager',
  'Analyst',
  'Researcher',
  'Product Lead',
];
const EMPLOYEE_STATUSES: readonly EmployeeStatus[] = [
  'active',
  'away',
  'offline',
];

const STATUS_BADGE_VARIANT = {
  active: 'success',
  away: 'warning',
  offline: 'default',
} as const;

/** mulberry32 finalizer — a deterministic per-index hash so the demo dataset
 * is identical on every load (no Math.random). */
function seededHash(seed: number): number {
  const t0 = (seed + 0x6d2b79f5) | 0;
  const t1 = Math.imul(t0 ^ (t0 >>> 15), t0 | 1);
  const t2 = t1 ^ (t1 + Math.imul(t1 ^ (t1 >>> 7), t1 | 61));
  return (t2 ^ (t2 >>> 14)) >>> 0;
}

const dataTableData: EmployeeRow[] = Array.from(
  { length: DATA_TABLE_ROWS },
  (_, i) => {
    const a = seededHash(i);
    const b = seededHash(i + 0x9e37);
    const c = seededHash(i + 0x85eb);
    const d = seededHash(i + 0x27d4);
    return {
      id: i + 1,
      name: `${EMPLOYEE_FIRST_NAMES[a % EMPLOYEE_FIRST_NAMES.length]!} ${
        EMPLOYEE_LAST_NAMES[b % EMPLOYEE_LAST_NAMES.length]!
      }`,
      role: EMPLOYEE_ROLES[c % EMPLOYEE_ROLES.length]!,
      status: EMPLOYEE_STATUSES[d % EMPLOYEE_STATUSES.length]!,
      score: Math.round(450 + ((a >>> 8) % 551)) / 10,
      joined: new Date(Date.UTC(2018 + (b % 8), c % 12, 1 + (d % 28)))
        .toISOString()
        .slice(0, 10),
    };
  }
);

/** Register only the features the recipe uses — v9's tree-shaking contract.
 * Global filtering reuses the column-filtering pipeline, so both features and
 * the shared filtered row model slot are required. */
const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

const dataTableHelper = createColumnHelper<
  typeof dataTableFeatures,
  EmployeeRow
>();

const dataTableColumns = dataTableHelper.columns([
  dataTableHelper.display({
    id: 'select',
    // CheckboxCore (not Checkbox): cells are driven by table state every
    // render, and Checkbox's `checked` prop is uncontrolled-initial only —
    // CheckboxCore takes an honest controlled `checked` + `onChange(checked)`.
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => (
      <CheckboxCore
        checked={row.getIsSelected()}
        onChange={(checked) => row.toggleSelected(checked)}
        aria-label={`Select ${row.original.name}`}
      />
    ),
  }),
  dataTableHelper.accessor('id', { header: 'ID' }),
  dataTableHelper.accessor('name', { header: 'Name' }),
  dataTableHelper.accessor('role', { header: 'Role' }),
  dataTableHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge size='sm' variant={STATUS_BADGE_VARIANT[info.getValue()]}>
        {info.getValue()}
      </Badge>
    ),
  }),
  dataTableHelper.accessor('score', {
    header: 'Score',
    cell: (info) => info.getValue().toFixed(1),
  }),
  dataTableHelper.accessor('joined', { header: 'Joined' }),
]);

const dataTableToolbar = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  flex-wrap: wrap;
  margin-bottom: var(--haze-space-3);
`;

const dataTableFilterInput = css`
  max-width: 240px;
`;

const dataTableMeta = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

const dataTableSortBtn = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  cursor: pointer;

  &:hover {
    color: var(--haze-color-primary);
  }

  &:focus-visible {
    outline: none;
    border-radius: var(--haze-radius-sm);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const dataTableSortIcon = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
`;

const dataTableRowStyle = css`
  &:hover {
    background: var(--haze-color-bg-subtle);
  }
`;

const dataTableRowSelected = css`
  &,
  &:hover {
    background: var(--haze-color-primary-subtle);
  }
`;

const dataTableCheckCell = css`
  width: 1%;
  white-space: nowrap;
`;

const dataTableNumCell = css`
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const dataTableEmptyCell = css`
  padding: var(--haze-space-6) var(--haze-space-3);
  text-align: center;
  color: var(--haze-color-text-muted);
`;

const dataTableFooter = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--haze-space-3);
  flex-wrap: wrap;
  margin-top: var(--haze-space-3);
`;

const dataTableNote = css`
  max-width: 75ch;
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);

  code {
    font-family: var(--haze-font-mono);
    font-size: var(--haze-text-xs);
  }
`;

/**
 * Header select-all checkbox. React has no `indeterminate` prop (it strips
 * the attribute entirely), so the DOM property is set on the wrapped input
 * after every commit; CheckboxCore supplies the native input, controlled
 * checked state, and focus ring.
 */
function SelectAllCheckbox({
  table,
}: {
  table: TanStackTable<typeof dataTableFeatures, EmployeeRow>;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const allSelected = table.getIsAllRowsSelected();
  const someSelected = table.getIsSomeRowsSelected();

  useEffect(() => {
    const input = wrapRef.current?.querySelector('input');
    if (input) input.indeterminate = someSelected && !allSelected;
  });

  return (
    <span ref={wrapRef}>
      <CheckboxCore
        checked={allSelected}
        onChange={(checked) => table.toggleAllRowsSelected(checked)}
        aria-label='Select all rows'
      />
    </span>
  );
}

function DataTableDemo() {
  const [, , pageCtrl] = useControl(undefined, 1);
  const [page, setPage] = useControl(pageCtrl);
  const [, , filterCtrl] = useControl(undefined, '');
  const [globalFilter, setGlobalFilter] = useControl(filterCtrl);

  const table = useTable({
    features: dataTableFeatures,
    columns: dataTableColumns,
    data: dataTableData,
    getRowId: (row) => String(row.id),
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
      pagination: { pageIndex: page - 1, pageSize: DATA_TABLE_PAGE_SIZE },
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({
              pageIndex: page - 1,
              pageSize: DATA_TABLE_PAGE_SIZE,
            })
          : updater;
      setPage(Math.max(1, next.pageIndex + 1));
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getSelectedRowIds().length;
  const pageCount = Math.max(
    1,
    Math.ceil(filteredCount / DATA_TABLE_PAGE_SIZE)
  );

  return (
    <>
      <h1>DataTable</h1>
      <p className={intro}>
        A recipe, not a library component:{' '}
        <code>@tanstack/react-table</code> (headless) owns sorting, selection,
        filtering and pagination state, while haze-ui Table primitives render
        the semantic markup. This page shows the full composition — feature
        registration, column definitions, and controlled state slices wired
        to haze-ui&apos;s controllable-state controls.
      </p>

      <div className={section}>
        <h2>Sortable, Selectable, Filterable</h2>
        <div className={dataTableToolbar}>
          <Input
            className={dataTableFilterInput}
            value={filterCtrl}
            placeholder='Filter by name, role, status…'
            aria-label='Filter table rows'
          />
          <span className={dataTableMeta}>
            {filteredCount === DATA_TABLE_ROWS
              ? `${DATA_TABLE_ROWS} rows`
              : `${filteredCount} of ${DATA_TABLE_ROWS} rows match`}
            {selectedCount > 0 && ` · ${selectedCount} selected`}
          </span>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              {table.getHeaderGroups()[0]!.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableCell
                    as='th'
                    key={header.id}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type='button'
                        className={dataTableSortBtn}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        <span
                          className={dataTableSortIcon}
                          aria-hidden='true'
                        >
                          {sorted === 'asc'
                            ? '↑'
                            : sorted === 'desc'
                              ? '↓'
                              : '↕'}
                        </span>
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                x-class={[
                  dataTableRowStyle,
                  row.getIsSelected() && dataTableRowSelected,
                ]}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    x-class={[
                      cell.column.id === 'select' && dataTableCheckCell,
                      cell.column.id === 'score' && dataTableNumCell,
                    ]}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell
                  className={dataTableEmptyCell}
                  colSpan={dataTableColumns.length}
                >
                  No rows match “{globalFilter}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className={dataTableFooter}>
          <span className={dataTableMeta}>
            Page {page} of {pageCount}
          </span>
          <Pagination
            page={pageCtrl}
            total={filteredCount}
            pageSize={DATA_TABLE_PAGE_SIZE}
            size='sm'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Dataset Size & Virtualization</h2>
        <p className={dataTableNote}>
          This demo pins the dataset at {DATA_TABLE_ROWS} deterministic rows
          (a seeded hash regenerates identical data on every load) and keeps
          the DOM at one page — {DATA_TABLE_PAGE_SIZE} rows — regardless of
          dataset size, because the paginated row model slices before render.
          haze-ui&apos;s <code>VirtualList</code> is not a natural host for
          table rows: it stacks absolutely-positioned single-column rows, so
          semantic <code>&lt;tr&gt;</code> elements cannot live inside a{' '}
          <code>&lt;tbody&gt;</code>, and aligning columns across
          independently positioned rows would require fixed-width grid cells
          that abandon the Table primitives. For scroll-position
          virtualization of 10k+ rows, pair TanStack Table&apos;s row models
          with a grid-based virtual scroller (e.g.{' '}
          <code>@tanstack/react-virtual</code>) outside semantic table
          markup.
        </p>
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              The sorted column header carries{' '}
              <strong>aria-sort=&quot;ascending&quot;/&quot;descending&quot;</strong>;
              every sort toggle is a native <strong>&lt;button&gt;</strong>{' '}
              reachable by Tab and activated with Enter/Space
            </li>
            <li>
              Clicks cycle <strong>unsorted → ascending → descending →
              unsorted</strong> (Shift-click adds a multi-sort column)
            </li>
            <li>
              Row selection uses native checkboxes with per-row{' '}
              <strong>aria-label</strong>; the header checkbox reflects
              all/some/none via <strong>checked</strong> +{' '}
              <strong>indeterminate</strong> and selects across all pages
            </li>
            <li>
              Pagination reuses the library <strong>Pagination</strong> nav
              with <strong>aria-current=&quot;page&quot;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Carousel ──────────────────────────────────────────────────

function CarouselDemo() {
  return (
    <>
      <h1>Carousel</h1>
      <p className={intro}>
        Slide-based content viewer with navigation and indicators.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 480 }}>
          <Carousel>
            <CarouselSlide>
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--haze-color-bg-subtle)',
                  borderRadius: 'var(--haze-radius-md)',
                }}
              >
                Slide 1
              </div>
            </CarouselSlide>
            <CarouselSlide>
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--haze-color-bg-muted)',
                  borderRadius: 'var(--haze-radius-md)',
                }}
              >
                Slide 2
              </div>
            </CarouselSlide>
            <CarouselSlide>
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--haze-color-primary-subtle)',
                  borderRadius: 'var(--haze-radius-md)',
                }}
              >
                Slide 3
              </div>
            </CarouselSlide>
          </Carousel>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CarouselProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;region&quot;</strong> with{' '}
              <strong>aria-roledescription=&quot;carousel&quot;</strong>
            </li>
            <li>
              Slides have <strong>role=&quot;group&quot;</strong> with{' '}
              <strong>aria-roledescription=&quot;slide&quot;</strong>
            </li>
            <li>
              Navigation buttons have <strong>aria-label</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='carousel' />
    </>
  );
}

// ─── Datepicker ────────────────────────────────────────────────

function DatepickerDemo() {
  const [, , valueCtrl] = useControl(undefined, '');
  const [value] = useControl(valueCtrl);

  return (
    <>
      <h1>Datepicker</h1>
      <p className={intro}>Date selection with a calendar dropdown panel.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <Datepicker value={valueCtrl} placeholder='Pick a date' />
        </div>
        {value && (
          <p
            style={{
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {value}
          </p>
        )}
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DatepickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Input has <strong>aria-haspopup=&quot;dialog&quot;</strong> and{' '}
              <strong>aria-expanded</strong>
            </li>
            <li>
              Calendar grid uses <strong>role=&quot;grid&quot;</strong> with{' '}
              <strong>aria-label</strong>
            </li>
            <li>
              Navigation buttons have <strong>aria-label</strong>
            </li>
            <li>Click outside closes the calendar</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='datepicker' />
    </>
  );
}

// ─── Tree ───────────────────────────────────────────────────────

function TreeDemo() {
  const treeData: TreeNodeData[] = [
    {
      key: 'root',
      title: 'Root',
      children: [
        {
          key: 'parent-1',
          title: 'Parent 1',
          children: [
            { key: 'child-1-1', title: 'Child 1-1' },
            { key: 'child-1-2', title: 'Child 1-2' },
          ],
        },
        {
          key: 'parent-2',
          title: 'Parent 2',
          children: [
            { key: 'child-2-1', title: 'Child 2-1' },
            { key: 'child-2-2', title: 'Child 2-2' },
          ],
        },
      ],
    },
  ];

  return (
    <>
      <h1>Tree</h1>
      <p className={intro}>
        Hierarchical data display with expandable nodes, selection, and checkbox
        support.
      </p>

      <div className={section}>
        <h2>Basic</h2>
        <div style={{ maxWidth: 320 }}>
          <Tree treeData={treeData} />
        </div>
      </div>

      <div className={section}>
        <h2>Checkable</h2>
        <div style={{ maxWidth: 320 }}>
          <Tree treeData={treeData} checkable />
        </div>
      </div>

      <div className={section}>
        <h2>With Icons and Lines</h2>
        <div style={{ maxWidth: 320 }}>
          <Tree treeData={treeData} showIcon showLine />
        </div>
      </div>

      <div className={section}>
        <h2>Tree Props</h2>
        <PropsTable of='TreeProps' />
      </div>

      <div className={section}>
        <h2>TreeNodeData</h2>
        <PropsTable of='TreeNodeData' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses nested <strong>&lt;ul&gt;</strong>/
              <strong>&lt;li&gt;</strong> with{' '}
              <strong>role=&quot;tree&quot;</strong>/
              <strong>role=&quot;treeitem&quot;</strong>
            </li>
            <li>
              Expanded/collapsed state via <strong>aria-expanded</strong>
            </li>
            <li>
              Selected state via <strong>aria-selected</strong>
            </li>
            <li>
              Checked state via <strong>aria-checked</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate between nodes,{' '}
              <strong>Enter</strong>/<strong>Space</strong> activates
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tree' />
    </>
  );
}

// ─── Divider ────────────────────────────────────────────────────

function DividerDemo() {
  return (
    <>
      <h1>Divider</h1>
      <p className={intro}>Visual separator between content sections.</p>

      <div className={section}>
        <h2>Horizontal</h2>
        <div style={{ maxWidth: 480 }}>
          <p style={{ margin: 0 }}>Content above</p>
          <Divider />
          <p style={{ margin: 0 }}>Content below</p>
        </div>
      </div>

      <div className={section}>
        <h2>Vertical</h2>
        <div className={row}>
          <span>Left</span>
          <Divider orientation='vertical' />
          <span>Right</span>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DividerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;separator&quot;</strong>
            </li>
            <li>
              Vertical dividers have <strong>aria-orientation=&quot;vertical&quot;</strong>
            </li>
            <li>
              Horizontal renders as native <strong>&lt;hr&gt;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='divider' />
    </>
  );
}

// ─── Spinner ───────────────────────────────────────────────────

function SpinnerDemo() {
  return (
    <>
      <h1>Spinner</h1>
      <p className={intro}>Animated loading indicator for async operations.</p>

      <div className={section}>
        <h2>Sizes</h2>
        <div className={row}>
          <Spinner size='sm' />
          <Spinner size='md' />
          <Spinner size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>With Text</h2>
        <div className={row}>
          <Spinner size='sm' />
          <span style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>Loading...</span>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SpinnerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;status&quot;</strong> with{' '}
              <strong>aria-label=&quot;Loading&quot;</strong>
            </li>
            <li>
              Screen readers announce the loading state
            </li>
            <li>
              Animation respects <strong>prefers-reduced-motion</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='spinner' />
    </>
  );
}

// ─── Empty ─────────────────────────────────────────────────────

function EmptyDemo() {
  return (
    <>
      <h1>Empty</h1>
      <p className={intro}>Placeholder state when no data is available.</p>

      <div className={section}>
        <h2>Default</h2>
        <Empty />
      </div>

      <div className={section}>
        <h2>Custom Description</h2>
        <Empty description='No search results found' />
      </div>

      <div className={section}>
        <h2>With Action</h2>
        <Empty description='No items yet'>
          <Button size='sm'>Create Item</Button>
        </Empty>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='EmptyProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely presentational — wrap with a container that has{' '}
              <strong>aria-label</strong> if needed
            </li>
            <li>
              Default image is decorative SVG
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='empty' />
    </>
  );
}

// ─── Progress ──────────────────────────────────────────────────

function ProgressDemo() {
  return (
    <>
      <h1>Progress</h1>
      <p className={intro}>Visual indicator of completion percentage.</p>

      <div className={section}>
        <h2>Bar Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)', maxWidth: 400 }}>
          <Progress value={25} />
          <Progress value={50} color='success' />
          <Progress value={75} color='warning' />
          <Progress value={90} color='danger' />
        </div>
      </div>

      <div className={section}>
        <h2>Bar Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)', maxWidth: 400 }}>
          <Progress value={60} size='sm' />
          <Progress value={60} size='md' />
          <Progress value={60} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Circle Variant</h2>
        <div className={row}>
          <Progress variant='circle' value={30} size='sm' />
          <Progress variant='circle' value={60} />
          <Progress variant='circle' value={90} size='lg' color='success' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ProgressProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;progressbar&quot;</strong> with{' '}
              <strong>aria-valuemin</strong>, <strong>aria-valuemax</strong>,{' '}
              <strong>aria-valuenow</strong>
            </li>
            <li>
              Screen readers announce current progress percentage
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='progress' />
    </>
  );
}

// ─── Pagination ────────────────────────────────────────────────

function PaginationDemo() {
  const [, , pageCtrl] = useControl(undefined, 1);

  return (
    <>
      <h1>Pagination</h1>
      <p className={intro}>Navigate through paginated content.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Pagination page={pageCtrl} total={100} pageSize={10} />
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)' }}>
          <Pagination total={50} pageSize={10} size='sm' />
          <Pagination total={50} pageSize={10} size='md' />
          <Pagination total={50} pageSize={10} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='PaginationProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as <strong>&lt;nav&gt;</strong> element
            </li>
            <li>
              Active page has <strong>aria-current=&quot;page&quot;</strong>
            </li>
            <li>
              Previous/Next buttons have <strong>aria-label</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='pagination' />
    </>
  );
}

// ─── Grid ──────────────────────────────────────────────────────

function GridDemo() {
  return (
    <>
      <h1>Grid</h1>
      <p className={intro}>CSS Grid layout with configurable columns and gap.</p>

      <div className={section}>
        <h2>Basic</h2>
        <Grid columns={3} gap={3}>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>1</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>2</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>3</div>
          </GridItem>
        </Grid>
      </div>

      <div className={section}>
        <h2>Spanning Columns</h2>
        <Grid columns={4} gap={3}>
          <GridItem span={2}>
            <div style={{ background: 'var(--haze-color-primary-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>span 2</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>1</div>
          </GridItem>
          <GridItem span={1}>
            <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>1</div>
          </GridItem>
          <GridItem span={1} start={1}>
            <div style={{ background: 'var(--haze-color-bg-muted)', padding: 'var(--haze-space-4)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>start 1</div>
          </GridItem>
        </Grid>
      </div>

      <div className={section}>
        <h2>Grid Props</h2>
        <PropsTable of='GridProps' />
      </div>

      <div className={section}>
        <h2>GridItem Props</h2>
        <PropsTable of='GridItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely presentational — uses plain <strong>&lt;div&gt;</strong> elements
            </li>
            <li>
              No semantic meaning; add <strong>role</strong> if the grid conveys structure
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='grid' />
    </>
  );
}

// ─── Drawer ────────────────────────────────────────────────────

function DrawerDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>Drawer</h1>
      <p className={intro}>Slide-out panel anchored to a screen edge.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        </div>
        <Drawer open={openCtrl} onClose={() => setOpen(false)}>
          <div style={{ padding: 'var(--haze-space-4)' }}>
            <h3 style={{ margin: '0 0 var(--haze-space-3)' }}>Drawer Title</h3>
            <p style={{ color: 'var(--haze-color-text-secondary)' }}>
              Drawer content goes here. Click the backdrop or press ESC to close.
            </p>
            <Button onClick={() => setOpen(false)} size='sm' variant='outline'>
              Close
            </Button>
          </div>
        </Drawer>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DrawerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses native <strong>&lt;dialog&gt;</strong> with{' '}
              <strong>showModal()</strong>
            </li>
            <li>
              <strong>ESC</strong> closes the drawer
            </li>
            <li>Focus is trapped within the drawer while open</li>
            <li>Backdrop click closes the drawer</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='drawer' />
    </>
  );
}

// ─── Stepper ───────────────────────────────────────────────────

function StepperDemo() {
  const [active, setActive, activeCtrl] = useControl(undefined, 1);

  return (
    <>
      <h1>Stepper</h1>
      <p className={intro}>Step-by-step progress indicator for multi-step flows.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Stepper activeStep={activeCtrl}>
          <Step title='Account' description='Create account' />
          <Step title='Profile' description='Add details' />
          <Step title='Confirm' description='Review & submit' />
        </Stepper>
        <div className={row} style={{ marginTop: 'var(--haze-space-4)' }}>
          <Button size='sm' variant='outline' onClick={() => { setActive(Math.max(0, active - 1)); }} disabled={active <= 0}>
            Back
          </Button>
          <Button size='sm' onClick={() => { setActive(Math.min(2, active + 1)); }} disabled={active >= 2}>
            Next
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Stepper Props</h2>
        <PropsTable of='StepperProps' />
      </div>

      <div className={section}>
        <h2>Step Props</h2>
        <PropsTable of='StepProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Container uses <strong>role=&quot;list&quot;</strong>
            </li>
            <li>
              Each step uses <strong>role=&quot;listitem&quot;</strong>
            </li>
            <li>
              Visual state (active/completed/pending) is conveyed through color and icon
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='stepper' />
    </>
  );
}

// ─── ChatMessage — edit / resend / branch (recipe) ────────────

type BranchMessage = {
  id: number;
  role: 'user' | 'assistant';
  name: string;
  time: string;
  text: string;
  /** Canned deterministic rewrites — each resend cycles to the next one. */
  alts?: string[];
};

const INITIAL_CONVERSATION: BranchMessage[] = [
  {
    id: 1,
    role: 'user',
    name: 'You',
    time: '10:00',
    text: 'Should a design system ship its own virtualizer, or wrap a headless core?',
  },
  {
    id: 2,
    role: 'assistant',
    name: 'Assistant',
    time: '10:01',
    text: 'Wrap it. A design system owns tokens and markup, not scroll math — reuse a battle-tested core and spend your budget on theming and a11y.',
    alts: [
      'Ship a thin list. Most consumers need 10k rows, not exotic layouts — one small absolute-positioned renderer keeps the bundle honest.',
      'Both: a tiny built-in for chat-shaped lists, an escape hatch to the headless core for grids and variable heights.',
    ],
  },
  {
    id: 3,
    role: 'user',
    name: 'You',
    time: '10:02',
    text: 'What breaks first if we hand-roll it?',
  },
  {
    id: 4,
    role: 'assistant',
    name: 'Assistant',
    time: '10:03',
    text: 'Edge cases: momentum scrolling on iOS, resize observers, RTL coordinates. That is why this recipe composes instead of rewriting.',
    alts: [
      'Keyboard and screen-reader order. Absolutely-positioned rows leave DOM order alone, but focus management and live regions are on you.',
      'Measurement drift. One rounding error per row and the bottom of a 10k-item list is off by a full screen.',
    ],
  },
];

/** Deterministic continuations handed to new branches, cycled by branch
 * count — the same click sequence always grows the same tree. */
const BRANCH_CONTINUATIONS: Omit<BranchMessage, 'id'>[][] = [
  [
    {
      role: 'user',
      name: 'You',
      time: '10:04',
      text: 'Alright — show me the wrap in three lines.',
    },
    {
      role: 'assistant',
      name: 'Assistant',
      time: '10:05',
      text: 'Core list, themed row, scroll-synced pager. Everything else is product code.',
      alts: [
        'Core list, themed row, bottom-anchored log. Ship the boring version first.',
      ],
    },
  ],
  [
    {
      role: 'user',
      name: 'You',
      time: '10:04',
      text: 'And when the list is a grid instead?',
    },
    {
      role: 'assistant',
      name: 'Assistant',
      time: '10:05',
      text: 'Then the single-column stack stops fitting — keep the tokens, swap the renderer for a windowing core that understands columns.',
      alts: [
        'Then columns need a windowing core; keep the tokens, swap the renderer.',
      ],
    },
  ],
];

/** Fixed delay between reflow steps — deterministic, no network involved. */
const RESEND_STEP_MS = 500;

const branchToolbar = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  flex-wrap: wrap;
  margin-bottom: var(--haze-space-3);
`;

const branchTabs = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg-muted);
`;

const branchTab = css`
  padding: var(--haze-space-0) var(--haze-space-3);
  border: none;
  border-radius: var(--haze-radius-sm);
  background: transparent;
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  cursor: pointer;

  &:hover {
    color: var(--haze-color-text);
  }

  &[aria-pressed='true'] {
    background: var(--haze-color-bg);
    color: var(--haze-color-text);
    box-shadow: var(--haze-shadow-sm);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

const branchList = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  padding: 0 var(--haze-space-3);
  max-width: 640px;
`;

const msgActions = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-1);
  flex-shrink: 0;
  padding-top: var(--haze-space-6);
  opacity: 0;
  transition: opacity var(--haze-duration-fast) var(--haze-ease);
`;

const msgRow = css`
  display: flex;
  align-items: flex-start;
  gap: var(--haze-space-2);

  /* Reveal on hover AND focus-within — Tab reaches the transparent
     buttons, and the row lights up around whichever one is focused. */
  &:hover ${msgActions},
  &:focus-within ${msgActions} {
    opacity: 1;
  }
`;

const msgRowUser = css`
  flex-direction: row-reverse;
`;

const msgGrow = css`
  flex: 1;
  min-width: 0;
`;

const msgEditor = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
`;

const msgEditorButtons = css`
  display: flex;
  gap: var(--haze-space-2);
`;

const msgPending = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);

  i {
    width: 0.35em;
    height: 0.35em;
    border-radius: var(--haze-radius-full);
    background: currentColor;
    animation: msgWorkflowPulse var(--haze-duration-slow)
      var(--haze-ease-in-out) infinite;

    &:nth-child(2) {
      animation-delay: calc(var(--haze-duration-slow) / 3);
    }

    &:nth-child(3) {
      animation-delay: calc(var(--haze-duration-slow) / 1.5);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    i {
      animation: none;
      opacity: 0.4;
    }
  }

  @keyframes msgWorkflowPulse {
    0%,
    100% {
      opacity: 0.35;
    }

    50% {
      opacity: 1;
    }
  }
`;

/**
 * Edit / resend / branch over a plain `branches: BranchMessage[][]` tree —
 * each branch owns a full timeline, so switching branches is just an index
 * swap and edits stay branch-local. The active branch rides a
 * controllable-state control (same pattern as the DataTable recipe).
 */
function ChatMessageWorkflowDemo() {
  const [branches, setBranches] = useState<BranchMessage[][]>([
    INITIAL_CONVERSATION,
  ]);
  const [, , activeCtrl] = useControl(undefined, 0);
  const [active, setActive] = useControl(activeCtrl);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  /** Resend variant counter per assistant message id — cycles `alts`. */
  const [variantPick, setVariantPick] = useState<Record<number, number>>({});
  /** Rows in [from, done] are resolved; rows in (done, end) are pending. */
  const [reflow, setReflow] = useState<{ from: number; done: number } | null>(
    null
  );
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const cancelTransient = () => {
    clearTimers();
    setReflow(null);
    setEditingId(null);
    setDraft('');
  };

  const branch = branches[Math.min(active, branches.length - 1)]!;

  const switchBranch = (index: number) => {
    if (index === active) return;
    cancelTransient();
    setActive(index);
  };

  const startEdit = (m: BranchMessage) => {
    clearTimers();
    setReflow(null);
    setEditingId(m.id);
    // start from the text the reader sees (the current variant, if any)
    setDraft(textOf(m));
  };

  const saveEdit = () => {
    const text = draft.trim();
    if (!text || editingId == null) return;
    setBranches((prev) =>
      prev.map((b, i) =>
        i === active
          ? b.map((m) => (m.id === editingId ? { ...m, text } : m))
          : b
      )
    );
    // the edit supersedes any resend variant — show m.text again
    setVariantPick((picks) => ({ ...picks, [editingId]: 0 }));
    setEditingId(null);
    setDraft('');
  };

  const startResend = (from: number) => {
    clearTimers();
    setEditingId(null);
    setDraft('');
    setReflow({ from, done: from - 1 });
    for (let k = from; k < branch.length; k++) {
      timersRef.current.push(
        setTimeout(() => {
          // A newer resend may have restarted the chain — stale steps die.
          setReflow((r) => (r?.from === from ? { ...r, done: k } : r));
          const message = branch[k]!;
          if (message.role === 'assistant' && message.alts) {
            setVariantPick((picks) => ({
              ...picks,
              [message.id]: (picks[message.id] ?? 0) + 1,
            }));
          }
        }, RESEND_STEP_MS * (k - from + 1))
      );
    }
  };

  const branchFrom = (index: number) => {
    const head = branch.slice(0, index + 1);
    const continuation =
      BRANCH_CONTINUATIONS[branches.length % BRANCH_CONTINUATIONS.length]!;
    const idBase = 1000 + branches.length * 10;
    const tail = continuation.map((m, k) => ({ ...m, id: idBase + k }));
    cancelTransient();
    setBranches((prev) => [...prev, [...head, ...tail]]);
    setActive(branches.length);
  };

  const resetDemo = () => {
    cancelTransient();
    setVariantPick({});
    setBranches([INITIAL_CONVERSATION]);
    setActive(0);
  };

  /** pick 0 = original text; each resend after that cycles `alts`. */
  const textOf = (m: BranchMessage): string => {
    const pick = variantPick[m.id] ?? 0;
    if (pick === 0 || !m.alts?.length) return m.text;
    return m.alts[(pick - 1) % m.alts.length]!;
  };

  return (
    <>
      <div className={branchToolbar}>
        {branches.length > 1 ? (
          <span
            className={branchTabs}
            role='group'
            aria-label='Conversation branches'
          >
            {branches.map((b, i) => (
              <button
                key={i}
                type='button'
                className={branchTab}
                aria-pressed={i === active}
                aria-label={`Branch v${i + 1} (${b.length} messages)`}
                onClick={() => switchBranch(i)}
              >
                v{i + 1}
              </button>
            ))}
          </span>
        ) : (
          <span className={dataTableMeta}>
            Single branch — use ⑂ on a message to fork the timeline.
          </span>
        )}
        <Button size='sm' variant='ghost' onClick={resetDemo}>
          Reset demo
        </Button>
      </div>

      <div className={branchList}>
        {branch.map((m, index) => {
          const loading =
            reflow !== null && index >= reflow.from && index > reflow.done;
          const editing = editingId === m.id;
          return (
            <div key={m.id} x-class={[msgRow, m.role === 'user' && msgRowUser]}>
              <ChatMessage
                role={m.role}
                name={m.name}
                timestamp={m.time}
                className={msgGrow}
              >
                {editing ? (
                  <div className={msgEditor}>
                    <TextareaCore
                      value={draft}
                      onChange={setDraft}
                      rows={3}
                      aria-label={`Edit message ${index + 1}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          saveEdit();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelTransient();
                        }
                      }}
                    />
                    <div className={msgEditorButtons}>
                      <Button
                        size='sm'
                        onClick={saveEdit}
                        disabled={!draft.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={cancelTransient}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : loading ? (
                  <span
                    className={msgPending}
                    role={index === reflow.from ? 'status' : undefined}
                    aria-label={`Re-sending message ${index + 1}`}
                  >
                    <i aria-hidden='true' />
                    <i aria-hidden='true' />
                    <i aria-hidden='true' />
                  </span>
                ) : (
                  textOf(m)
                )}
              </ChatMessage>
              {!editing && !loading && (
                <div className={msgActions}>
                  <Button
                    size='sm'
                    variant='ghost'
                    aria-label={`Edit message ${index + 1}`}
                    onClick={() => startEdit(m)}
                  >
                    ✎
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    aria-label={`Resend message ${index + 1} and regenerate everything after it`}
                    onClick={() => startResend(index)}
                  >
                    ↻
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    aria-label={`Branch from message ${index + 1}`}
                    onClick={() => branchFrom(index)}
                  >
                    ⑂
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── ChatMessage ──────────────────────────────────────────────

function ChatMessageDemo() {
  return (
    <>
      <h1>ChatMessage</h1>
      <p className={intro}>
        Chat bubble component with role-based styling for user, assistant, and
        system messages.
      </p>

      <div className={section}>
        <h2>Roles</h2>
        <ChatMessage role='user' name='You' timestamp='10:00 AM'>
          Can you explain how React hooks work?
        </ChatMessage>
        <ChatMessage role='assistant' name='Assistant' timestamp='10:01 AM'>
          Sure! Hooks let you use state and other React features in function
          components. The most common ones are useState and useEffect.
        </ChatMessage>
        <ChatMessage role='system'>Conversation started</ChatMessage>
      </div>

      <div className={section}>
        <h2>With Status</h2>
        <ChatMessage role='user' name='You' status='sent'>
          Message sent successfully.
        </ChatMessage>
        <ChatMessage role='user' name='You' status='error'>
          This message failed to send.
        </ChatMessage>
      </div>

      <div className={section}>
        <h2>Edit / Resend / Branch (recipe)</h2>
        <ChatMessageWorkflowDemo />
        <p className={dataTableNote}>
          The message tree is a plain <code>branches: BranchMessage[][]</code>{' '}
          — every branch owns a full timeline, so branching forks the active
          one after the chosen message (deterministic continuations, cycled
          by branch count) and the switcher above restores each branch&apos;s
          own tail. Edits are branch-local. Resend replays deterministically:
          the target row and everything after it become pending placeholders,
          then resolve one per {RESEND_STEP_MS} ms via a{' '}
          <code>setTimeout</code> chain — user messages return verbatim,
          assistant answers cycle through canned <code>alts</code>. No{' '}
          <code>Math.random</code> anywhere: the same clicks always produce
          the same tree. Row actions stay transparent until the row is
          hovered <em>or</em> focused — <code>:focus-within</code> keeps them
          keyboard-reachable — and each button carries a descriptive{' '}
          <code>aria-label</code>.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChatMessageProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              User messages are visually reversed with{' '}
              <strong>flex-direction: row-reverse</strong>
            </li>
            <li>System messages are centered with muted styling</li>
            <li>Status text provides visual feedback for message delivery</li>
            <li>
              Recipe rows reveal their action bar on{' '}
              <strong>:focus-within</strong>, so Tab reaches every action
              button; each carries a descriptive <strong>aria-label</strong>,
              the pending row is a <strong>role=&quot;status&quot;</strong>{' '}
              live region, and the editor saves with{' '}
              <strong>Ctrl/Cmd+Enter</strong>, cancels with{' '}
              <strong>Escape</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='chatmessage' />
    </>
  );
}

// ─── ChatContainer × VirtualList — 10k-message feed (recipe) ──

type FeedMessage = {
  role: 'user' | 'assistant' | 'system';
  name: string;
  text: string;
  time: string;
  mono: boolean;
};

const FEED_SIZE = 10000;
const FEED_ROW_HEIGHT = 44;
const FEED_LIST_HEIGHT = 400;
const FEED_OVERSCAN = 8;
/** Distance from the bottom (px) that still counts as "parked at bottom". */
const FEED_BOTTOM_EPSILON = 32;
/** Visible window + both overscan shoulders + the straddling row. */
const FEED_MOUNTED_ROWS =
  Math.ceil(FEED_LIST_HEIGHT / FEED_ROW_HEIGHT) + FEED_OVERSCAN * 2 + 1;

const FEED_WORDS = [
  'virtualize',
  'deterministic',
  'seed',
  'render',
  'scroll',
  'bubble',
  'overscan',
  'token',
  'compose',
  'throttle',
  'pipeline',
  'measure',
  'memoize',
  'stream',
  'commit',
];

const FEED_CODE_LINE =
  'const rows = feed.slice(start, end).map(makeRow); // uniform height keeps the stack cheap';

/**
 * Pure index → message: even = user, odd = assistant, every 11th = system
 * notice. Word count walks a 4 + (index·7 mod 23) gradient, every 97th
 * message is a ~100-word wall, every 131st a long code line, and
 * timestamps advance one minute from 09:00. No Math.random anywhere —
 * every load generates a byte-identical feed.
 */
function makeFeedMessage(index: number): FeedMessage {
  const role: FeedMessage['role'] =
    index % 11 === 3
      ? 'system'
      : index % 2 === 0
        ? 'user'
        : 'assistant';
  const wall = index % 97 === 0;
  const code = index % 131 === 0 && role !== 'system';
  const wordCount = wall ? 104 : code ? 1 : 4 + ((index * 7) % 23);
  const text = code
    ? FEED_CODE_LINE
    : Array.from(
        { length: wordCount },
        (_, w) => FEED_WORDS[(index * 7 + w * 3) % FEED_WORDS.length]
      ).join(' ');
  const minutes = 9 * 60 + index;
  const time = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return {
    role,
    name: role === 'user' ? 'You' : role === 'assistant' ? 'Assistant' : '',
    text,
    time,
    mono: code,
  };
}

const feedToolbar = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  flex-wrap: wrap;
  margin-bottom: var(--haze-space-3);
`;

const feedMeta = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

const feedFrame = css`
  position: relative;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
`;

/** Marker class: identifies VirtualList's internal scrollport for the
 * bottom-tracking listener (VirtualList does not expose it via ref yet). */
const feedScroller = css`
  overscroll-behavior: contain;
`;

const feedJump = css`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: var(--haze-space-4);
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-1) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-md);
  color: var(--haze-color-primary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  cursor: pointer;

  &:hover {
    border-color: var(--haze-color-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

const feedRow = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  height: 100%;
  padding: 0 var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  white-space: nowrap;
  overflow: hidden;
`;

const feedRowUser = css`
  flex-direction: row-reverse;
`;

const feedRowSystem = css`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 var(--haze-space-3);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
`;

const feedAvatar = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--haze-space-6);
  height: var(--haze-space-6);
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-secondary);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
`;

const feedAvatarUser = css`
  background: var(--haze-color-primary);
  color: var(--haze-color-bg);
`;

const feedName = css`
  flex-shrink: 0;
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text);
`;

const feedTime = css`
  flex-shrink: 0;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  font-variant-numeric: tabular-nums;
`;

const feedText = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--haze-color-text-secondary);
`;

const feedTextMono = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
`;

/**
 * ChatContainer frames the conversation (padding, column rhythm) while
 * VirtualList owns the scrollport over 10k deterministic messages.
 * ChatContainer's autoScroll is OFF: its MutationObserver would fire on
 * every scroll-driven row swap, and always-follow is wrong once the
 * reader scrolls up. Stick-to-bottom is this recipe's job instead —
 * follow appends only while parked at the bottom, otherwise surface an
 * "N new messages below" pill.
 */
function ChatVirtualFeedDemo() {
  const [messages, setMessages] = useState<FeedMessage[]>(() =>
    Array.from({ length: FEED_SIZE }, (_, i) => makeFeedMessage(i))
  );
  const [newBelow, setNewBelow] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  /** VirtualList's internal scrollport — located by marker class. */
  const scrollerRef = useRef<HTMLElement | null>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const el = frameRef.current?.querySelector<HTMLElement>(
      `.${feedScroller}`
    );
    if (!el) return;
    scrollerRef.current = el;
    el.tabIndex = 0; // keyboard-scrollable (arrows/Page keys) — library gap
    const onScroll = () => {
      atBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight <
        FEED_BOTTOM_EPSILON;
      if (atBottomRef.current) setNewBelow(0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.scrollTop = el.scrollHeight; // land on the newest message
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Stick-to-bottom: follow appends only while parked at the bottom.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const appendNext = () => {
    setMessages((prev) => [...prev, makeFeedMessage(prev.length)]);
    if (!atBottomRef.current) setNewBelow((n) => n + 1);
  };

  const jumpToLatest = () => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setNewBelow(0);
  };

  const renderRow = (m: FeedMessage) =>
    m.role === 'system' ? (
      <div className={feedRowSystem} title={m.text}>
        ◇ {m.text}
      </div>
    ) : (
      <div x-class={[feedRow, m.role === 'user' && feedRowUser]} title={m.text}>
        <span
          x-class={[feedAvatar, m.role === 'user' && feedAvatarUser]}
          aria-hidden='true'
        >
          {m.role === 'user' ? 'U' : 'A'}
        </span>
        <span className={feedName}>{m.name}</span>
        <span className={feedTime}>{m.time}</span>
        <span x-class={[feedText, m.mono && feedTextMono]}>{m.text}</span>
      </div>
    );

  return (
    <>
      <div className={feedToolbar}>
        <Button size='sm' variant='outline' onClick={appendNext}>
          Append next message
        </Button>
        <Button size='sm' variant='ghost' onClick={jumpToLatest}>
          Jump to latest
        </Button>
        <span className={feedMeta}>
          {messages.length} messages · ~{FEED_MOUNTED_ROWS} rows mounted
        </span>
      </div>
      <div
        ref={frameRef}
        className={feedFrame}
        role='log'
        aria-label='Virtualized chat feed, newest messages at the bottom'
      >
        <ChatContainer autoScroll={false}>
          <VirtualList
            className={feedScroller}
            items={messages}
            height={FEED_LIST_HEIGHT}
            itemHeight={FEED_ROW_HEIGHT}
            overscan={FEED_OVERSCAN}
            renderItem={renderRow}
          />
        </ChatContainer>
        {newBelow > 0 && (
          <button type='button' className={feedJump} onClick={jumpToLatest}>
            {newBelow} new message{newBelow > 1 ? 's' : ''} below ↓
          </button>
        )}
      </div>
    </>
  );
}

// ─── ChatContainer ────────────────────────────────────────────

function ChatContainerDemo() {
  return (
    <>
      <h1>ChatContainer</h1>
      <p className={intro}>
        Auto-scrolling message container that follows new messages as they
        arrive.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            maxHeight: 200,
            border: '1px solid var(--haze-color-border)',
            borderRadius: 'var(--haze-radius-md)',
          }}
        >
          <ChatContainer>
            <ChatMessage role='assistant'>Welcome! How can I help?</ChatMessage>
            <ChatMessage role='user'>
              Tell me about this component.
            </ChatMessage>
            <ChatMessage role='assistant'>
              ChatContainer automatically scrolls to the bottom when new messages
              are added.
            </ChatMessage>
          </ChatContainer>
        </div>
      </div>

      <div className={section}>
        <h2>10,000 messages — ChatContainer × VirtualList (recipe)</h2>
        <ChatVirtualFeedDemo />
        <p className={dataTableNote}>
          <strong>Data.</strong> <code>makeFeedMessage(index)</code> is pure:
          roles alternate (even user / odd assistant, every 11th a system
          notice), word count follows a 4 + (index·7 mod 23) gradient, every
          97th message is a ~100-word wall and every 131st a long code line,
          and timestamps advance one minute from 09:00 — so the 10,000-message
          feed is identical on every load. <strong>VirtualList pairing.</strong>{' '}
          <code>itemHeight</code> (44) must equal the rendered row height
          exactly — that is why rows clamp to one line with ellipsis;
          variable-height messages would need a measured virtualizer, not
          this absolute-positioned stack. <code>height</code> (400) fixes the
          scrollport, <code>overscan</code> (8) hides the render window
          behind fast scrolls, and the whole feed is a single{' '}
          {FEED_ROW_HEIGHT * FEED_SIZE} px spacer with only ~
          {FEED_MOUNTED_ROWS} rows mounted. ChatContainer keeps the frame
          with <code>autoScroll={'{false}'}</code> — its MutationObserver
          would fire on every scroll-driven row swap, and always-follow is
          wrong once the reader scrolls up — so stick-to-bottom is the
          recipe&apos;s job: a passive scroll listener parks{' '}
          <code>atBottom</code> within {FEED_BOTTOM_EPSILON} px of the end,
          appends scroll only while parked, and otherwise surface the{' '}
          “N new messages below” pill.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChatContainerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>overflow-y: auto</strong> for scrollable content
            </li>
            <li>
              Auto-scroll uses <strong>MutationObserver</strong> for reliable
              detection
            </li>
            <li>
              The virtualized feed is a <strong>role=&quot;log&quot;</strong>{' '}
              (polite live region) — appends are announced without stealing
              focus. VirtualList does not expose its scrollport, so the
              recipe marks it with a class and sets{' '}
              <strong>tabIndex=&quot;0&quot;</strong> on it for arrow-key
              scrolling; ellipsis is purely visual, the full text stays in
              the DOM for assistive tech
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='chatcontainer' />
    </>
  );
}

// ─── ChatInput × Upload — attachment bridge (recipe) ──────────

/** Fixed epoch (2026-01-01 09:00 UTC) — deterministic lastModified. */
const SAMPLE_FILE_TS = Date.UTC(2026, 0, 1, 9, 0, 0);

const SAMPLE_FILE_SPECS = [
  {
    name: 'render-trace.log',
    type: 'text/plain',
    body: [
      '[09:00:00] mount <ChatInput/> 0.9ms',
      '[09:00:01] attach 3 files (bridge) 0.2ms',
      '[09:00:02] send message + attachments 1.1ms',
    ].join('\n'),
  },
  {
    name: 'bundle-report.json',
    type: 'application/json',
    body: '{"component":"ChatInput","cssBytes":1240,"jsBytes":3120,"runtime":"zero"}',
  },
  {
    name: 'focus-ring.svg',
    type: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  },
] as const;

/**
 * Deterministic File fabrication — fixed bodies and a fixed lastModified,
 * so every simulated pick yields byte-identical objects. This is the
 * in-memory stand-in for a real picker (DataTransfer/FileList); nothing
 * is uploaded anywhere.
 */
function makeSampleFiles(): File[] {
  return SAMPLE_FILE_SPECS.map(
    (spec, i) =>
      new File([spec.body], spec.name, {
        type: spec.type,
        lastModified: SAMPLE_FILE_TS + i * 1000,
      })
  );
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

type SentWithAttachments = { text: string; files: File[] };

const attachStack = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  max-width: 560px;
`;

const attachCards = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
`;

const attachCard = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-1) var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg-subtle);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

const attachName = css`
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--haze-color-text);
`;

const attachSize = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  font-variant-numeric: tabular-nums;
`;

const attachRemoveBtn = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--haze-space-5);
  height: var(--haze-space-5);
  border: none;
  border-radius: var(--haze-radius-sm);
  background: transparent;
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: var(--haze-color-danger);
    background: var(--haze-color-danger-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--haze-color-focus-ring);
  }
`;

const attachComposer = css`
  display: flex;
  align-items: flex-end;
  gap: var(--haze-space-2);
`;

const attachInputGrow = css`
  flex: 1;
  min-width: 0;
`;

const attachSentChips = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  margin-top: var(--haze-space-2);
`;

const attachSentChip = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
  padding: var(--haze-space-0) var(--haze-space-2);
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
`;

/**
 * ChatInput has no attachment slot, so the recipe bridges one: the pending
 * file list lives in a controllable <code>Control&lt;File[]&gt;</code>, both
 * FileInput (label + hidden native input) and UploadCore (controlled
 * dropzone — value is the whole list, onChange emits the complete next
 * list) write through it, preview cards render above the composer, and
 * send moves text + files into a read-only ChatMessage preview.
 */
function ChatAttachmentBridgeDemo() {
  // The file list is the field value — controllable from outside, same
  // pattern as the DataTable recipe's page slice.
  const [, , filesCtrl] = useControl(undefined, [] as File[]);
  const [files, setFiles] = useControl(filesCtrl);
  const [sent, setSent] = useState<SentWithAttachments[]>([]);

  const addPicked = (picked: File[]) => {
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
  };

  return (
    <div className={attachStack}>
      <div className={feedToolbar}>
        <Button size='sm' variant='outline' onClick={() => addPicked(makeSampleFiles())}>
          Add sample attachments
        </Button>
        {files.length > 0 && (
          <Button
            size='sm'
            variant='ghost'
            onClick={() => setFiles([])}
            aria-label='Clear all pending attachments'
          >
            Clear
          </Button>
        )}
        <span className={feedMeta}>
          {files.length} pending · {sent.length} sent
        </span>
      </div>

      {files.length > 0 && (
        <div className={attachCards} role='group' aria-label='Pending attachments'>
          {files.map((file, i) => (
            <span
              className={attachCard}
              key={`${file.name}-${file.lastModified}-${i}`}
            >
              <span className={attachName}>{file.name}</span>
              <span className={attachSize}>{formatBytes(file.size)}</span>
              <button
                type='button'
                className={attachRemoveBtn}
                aria-label={`Remove attachment ${file.name}`}
                onClick={() =>
                  setFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className={attachComposer}>
        <FileInput
          multiple
          onChange={(e) => {
            addPicked(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        >
          📎 Attach
        </FileInput>
        <ChatInput
          className={attachInputGrow}
          placeholder='Type a message — attachments ride along…'
          onSend={(text) => {
            setSent((prev) => [...prev, { text, files }]);
            setFiles([]);
          }}
        />
      </div>

      <UploadCore value={files} onChange={setFiles} multiple>
        <span>
          …or drop files here to attach — in-memory only, nothing uploads
        </span>
      </UploadCore>

      {sent.length > 0 && (
        <div aria-label='Sent messages with attachments'>
          {sent.map((s, i) => (
            <ChatMessage key={i} role='user' name='You' timestamp='just now'>
              {s.text}
              {s.files.length > 0 && (
                <span className={attachSentChips}>
                  {s.files.map((f, j) => (
                    <span className={attachSentChip} key={j}>
                      📎 {f.name} · {formatBytes(f.size)}
                    </span>
                  ))}
                </span>
              )}
            </ChatMessage>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ChatInput ────────────────────────────────────────────────

function ChatInputDemo() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <>
      <h1>ChatInput</h1>
      <p className={intro}>
        Auto-resizing textarea with Enter-to-send and Shift+Enter for newlines.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 480 }}>
          <ChatInput
            onSend={(msg) => setMessages((prev) => [...prev, msg])}
            placeholder='Type a message...'
          />
          {messages.length > 0 && (
            <div
              style={{
                marginTop: 'var(--haze-space-3)',
                fontSize: 'var(--haze-text-sm)',
                color: 'var(--haze-color-text-secondary)',
              }}
            >
              Sent: {messages.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className={section}>
        <h2>Disabled</h2>
        <div style={{ maxWidth: 480 }}>
          <ChatInput disabled placeholder='Disabled input' />
        </div>
      </div>

      <div className={section}>
        <h2>Attachments bridge (recipe)</h2>
        <ChatAttachmentBridgeDemo />
        <p className={dataTableNote}>
          ChatInput has no attachment slot, so the recipe bridges one: the
          pending list lives in a controllable <code>Control&lt;File[]&gt;</code>{' '}
          — both <code>FileInput</code> (label + hidden native input; picks
          merge into the same list) and <code>UploadCore</code> (controlled
          dropzone: <code>value</code> is the whole list,{' '}
          <code>onChange</code> emits the complete next list) write through
          that one control, which makes the preview cards above the composer
          the single source of truth. <code>ChatInput</code> only fires{' '}
          <code>onSend</code> for non-empty text, so attachments always ride
          along with a message; sending moves text + files into the
          read-only preview below and clears the list. The{' '}
          <em>Add sample attachments</em> button fabricates{' '}
          <code>File</code> objects in memory (<code>new File</code> with
          fixed bodies and <code>lastModified</code>, the deterministic
          stand-in for <code>DataTransfer</code>-driven picks) — nothing is
          uploaded.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChatInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Send button has <strong>aria-label=&quot;Send&quot;</strong>
            </li>
            <li>
              <strong>Enter</strong> sends, <strong>Shift+Enter</strong> inserts
              newline
            </li>
            <li>
              Focus ring appears on <strong>:focus-within</strong>
            </li>
            <li>
              Recipe: every remove button carries an{' '}
              <strong>aria-label</strong> naming its file, the pending set
              is a labeled <strong>role=&quot;group&quot;</strong>, the
              dropzone is the library <strong>UploadCore</strong>{' '}
              (<strong>role=&quot;button&quot;</strong>, keyboard-operable),
              and sent attachment chips are plain text so they read together
              with the message
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='chatinput' />
    </>
  );
}

// ─── StreamingText ────────────────────────────────────────────

function StreamingTextDemo() {
  const [key, setKey] = useState(0);

  return (
    <>
      <h1>StreamingText</h1>
      <p className={intro}>
        Typewriter effect that reveals text character by character with an
        optional blinking cursor.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <StreamingText
          key={key}
          text='Hello! This text appears one character at a time, simulating a streaming response from an AI assistant.'
          speed={25}
        />
        <div className={row} style={{ marginTop: 'var(--haze-space-3)' }}>
          <Button size='sm' variant='outline' onClick={() => setKey((k) => k + 1)}>
            Replay
          </Button>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='StreamingTextProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Cursor animation uses <strong>animation: blink</strong> with
              step-end timing
            </li>
            <li>
              Respects <strong>prefers-reduced-motion</strong> via CSS
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='streamingtext' />
    </>
  );
}

// ─── MarkdownRenderer ─────────────────────────────────────────

function MarkdownRendererDemo() {
  const md = `## Hello World

This is **bold** and *italic* text.

- Item one
- Item two
- Item three

\`\`\`js
console.log("Hello from code block");
\`\`\`

> This is a blockquote.`;

  return (
    <>
      <h1>MarkdownRenderer</h1>
      <p className={intro}>
        Renders markdown content to styled HTML with headings, lists, code
        blocks, and more.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            maxWidth: 480,
            border: '1px solid var(--haze-color-border)',
            borderRadius: 'var(--haze-radius-md)',
            padding: 'var(--haze-space-4)',
          }}
        >
          <MarkdownRenderer content={md} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='MarkdownRendererProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders semantic HTML: <strong>&lt;h1&gt;</strong>-<strong>&lt;h6&gt;</strong>,{' '}
              <strong>&lt;ul&gt;</strong>, <strong>&lt;ol&gt;</strong>,{' '}
              <strong>&lt;blockquote&gt;</strong>
            </li>
            <li>
              Links open in new tab with <strong>rel=&quot;noopener&quot;</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='markdownrenderer' />
    </>
  );
}

// ─── ToolCallCard ─────────────────────────────────────────────

function ToolCallCardDemo() {
  return (
    <>
      <h1>ToolCallCard</h1>
      <p className={intro}>
        Displays tool/function call details with input, output, and status
        indicator.
      </p>

      <div className={section}>
        <h2>Statuses</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
            maxWidth: 400,
          }}
        >
          <ToolCallCard name='search_docs' status='pending' />
          <ToolCallCard name='fetch_data' input='url: /api/users' status='running' />
          <ToolCallCard
            name='calculate'
            input='expression: 2 + 2'
            output='4'
            status='done'
          />
          <ToolCallCard name='send_email' input='to: user@example.com' status='error' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ToolCallCardProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Status is indicated by a colored dot and text label</li>
            <li>Uses monospace font for input/output content</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='toolcallcard' />
    </>
  );
}

// ─── ThinkingIndicator ────────────────────────────────────────

function ThinkingIndicatorDemo() {
  return (
    <>
      <h1>ThinkingIndicator</h1>
      <p className={intro}>
        Animated bouncing dots with customizable text to indicate AI is
        processing.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--haze-space-3)',
          }}
        >
          <ThinkingIndicator />
          <ThinkingIndicator text='Processing' />
          <ThinkingIndicator text='Generating' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ThinkingIndicatorProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Purely decorative animation; consider{' '}
              <strong>aria-live=&quot;polite&quot;</strong> on a parent for screen
              readers
            </li>
            <li>
              Dot animation respects <strong>prefers-reduced-motion</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='thinkingindicator' />
    </>
  );
}

// ─── StepTimeline ─────────────────────────────────────────────

function StepTimelineDemo() {
  return (
    <>
      <h1>StepTimeline</h1>
      <p className={intro}>
        Vertical timeline showing steps with status markers (pending, active,
        done, error).
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 360 }}>
          <StepTimeline>
            <StepTimelineItem label='Connected' description='API linked' status='done' />
            <StepTimelineItem label='Processing' description='Analyzing data...' status='active' />
            <StepTimelineItem label='Review' status='pending' />
            <StepTimelineItem label='Deploy' status='pending' />
          </StepTimeline>
        </div>
      </div>

      <div className={section}>
        <h2>Error State</h2>
        <div style={{ maxWidth: 360 }}>
          <StepTimeline>
            <StepTimelineItem label='Upload' description='File sent' status='done' />
            <StepTimelineItem label='Validate' description='Schema mismatch' status='error' />
            <StepTimelineItem label='Complete' status='pending' />
          </StepTimeline>
        </div>
      </div>

      <div className={section}>
        <h2>StepTimeline Props</h2>
        <PropsTable of='StepTimelineProps' />
      </div>

      <div className={section}>
        <h2>StepTimelineItem Props</h2>
        <PropsTable of='StepTimelineItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Status is conveyed through color and icon (checkmark, exclamation)
            </li>
            <li>
              Connecting line uses CSS <strong>::before</strong> pseudo-element
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='steptimeline' />
    </>
  );
}

// ─── ApprovalCard ─────────────────────────────────────────────

function ApprovalCardDemo() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'denied'>('pending');

  return (
    <>
      <h1>ApprovalCard</h1>
      <p className={intro}>
        Card with approve/deny actions for human-in-the-loop workflows.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400 }}>
          {status === 'pending' ? (
            <ApprovalCard
              title='Deploy to Production'
              description='This will deploy version 2.1.0 to all regions.'
              onApprove={() => setStatus('approved')}
              onDeny={() => setStatus('denied')}
            >
              <div style={{ fontSize: 'var(--haze-text-sm)' }}>
                Changes: 12 files modified, 3 new features
              </div>
            </ApprovalCard>
          ) : (
            <div
              style={{
                padding: 'var(--haze-space-4)',
                border: '1px solid var(--haze-color-border)',
                borderRadius: 'var(--haze-radius-md)',
                fontSize: 'var(--haze-text-sm)',
              }}
            >
              {status === 'approved' ? 'Deployment approved!' : 'Deployment denied.'}
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setStatus('pending')}
                style={{ marginLeft: 'var(--haze-space-2)' }}
              >
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ApprovalCardProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Buttons render as native <strong>&lt;button&gt;</strong> elements
            </li>
            <li>Warning border provides visual emphasis for required action</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='approvalcard' />
    </>
  );
}

// ─── TokenCounter ─────────────────────────────────────────────

function TokenCounterDemo() {
  return (
    <>
      <h1>TokenCounter</h1>
      <p className={intro}>
        Progress bar showing token usage with color changes at warning and
        danger thresholds.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)' }}>
          <TokenCounter used={1500} max={8000} label='Context' />
          <TokenCounter used={6000} max={8000} label='Context' />
          <TokenCounter used={7500} max={8000} label='Context' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TokenCounterProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Color changes at 70% (warning) and 90% (danger) thresholds
            </li>
            <li>Uses tabular-nums for consistent number alignment</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tokencounter' />
    </>
  );
}

// ─── ModelPicker ──────────────────────────────────────────────

function ModelPickerDemo() {
  const [, , modelCtrl] = useControl(undefined, 'gpt-4');
  const [model] = useControl(modelCtrl);

  const models = [
    { value: 'gpt-4', label: 'GPT-4', contextLength: '128k' },
    { value: 'gpt-3.5', label: 'GPT-3.5 Turbo', contextLength: '16k' },
    { value: 'claude-3', label: 'Claude 3', contextLength: '200k' },
    { value: 'gemini', label: 'Gemini Pro', contextLength: '32k' },
  ];

  return (
    <>
      <h1>ModelPicker</h1>
      <p className={intro}>
        Dropdown for selecting an AI model with optional context length info.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320 }}>
          <ModelPicker value={modelCtrl} options={models} />
          <p
            style={{
              marginTop: 'var(--haze-space-2)',
              fontSize: 'var(--haze-text-sm)',
              color: 'var(--haze-color-text-secondary)',
            }}
          >
            Selected: {model}
          </p>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ModelPickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Renders as a native <strong>&lt;select&gt;</strong> element
            </li>
            <li>
              Full keyboard support via <strong>Arrow keys</strong> and{' '}
              <strong>Enter</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='modelpicker' />
    </>
  );
}

// ─── ConversationList ─────────────────────────────────────────

function ConversationListDemo() {
  const [active, setActive] = useState('chat-1');

  const conversations = [
    { id: 'chat-1', title: 'New Chat', subtitle: 'Start a conversation' },
    { id: 'chat-2', title: 'Project Planning', subtitle: 'Yesterday' },
    { id: 'chat-3', title: 'Code Review', subtitle: '3 days ago' },
    { id: 'chat-4', title: 'Bug Investigation', subtitle: 'Last week' },
  ];

  return (
    <>
      <h1>ConversationList</h1>
      <p className={intro}>
        Sidebar list of conversations with active state and subtitle support.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div
          style={{
            maxWidth: 280,
            border: '1px solid var(--haze-color-border)',
            borderRadius: 'var(--haze-radius-md)',
            overflow: 'hidden',
          }}
        >
          <ConversationList>
            {conversations.map((c) => (
              <ConversationItem
                key={c.id}
                title={c.title}
                subtitle={c.subtitle}
                active={active === c.id}
                onClick={() => setActive(c.id)}
              />
            ))}
          </ConversationList>
        </div>
      </div>

      <div className={section}>
        <h2>ConversationList Props</h2>
        <PropsTable of='ConversationListProps' />
      </div>

      <div className={section}>
        <h2>ConversationItem Props</h2>
        <PropsTable of='ConversationItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Active item has <strong>aria-current=&quot;true&quot;</strong>
            </li>
            <li>
              Items render as <strong>&lt;button&gt;</strong> for keyboard
              accessibility
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='conversationlist' />
    </>
  );
}

// ─── DiffViewer ───────────────────────────────────────────────

function DiffViewerDemo() {
  return (
    <>
      <h1>DiffViewer</h1>
      <p className={intro}>
        Line-by-line diff viewer with added/removed/unchanged highlighting and
        line numbers.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 560 }}>
          <DiffViewer
            oldValue={'const x = 1;\nconst y = 2;\nconsole.log(x + y);'}
            newValue={
              'const x = 10;\nconst y = 2;\nconst z = x + y;\nconsole.log(z);'
            }
          />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DiffViewerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Added lines highlighted in green, removed in red</li>
            <li>
              Line numbers use <strong>user-select: none</strong> to avoid
              accidental selection
            </li>
            <li>Monospace font for consistent alignment</li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='diffviewer' />
    </>
  );
}

// ─── LogViewer ────────────────────────────────────────────────

function LogViewerDemo() {
  const logs = [
    { level: 'debug' as const, message: 'Initializing parser', timestamp: '10:00:00' },
    { level: 'info' as const, message: 'Server started on port 3000', timestamp: '10:00:01' },
    { level: 'info' as const, message: 'Connected to database', timestamp: '10:00:02' },
    { level: 'debug' as const, message: 'Cache warmed up', timestamp: '10:00:03' },
    { level: 'warn' as const, message: 'Cache miss for key: user_123', timestamp: '10:00:05' },
    { level: 'info' as const, message: 'Request completed', timestamp: '10:00:08' },
    { level: 'error' as const, message: 'Failed to fetch external API', timestamp: '10:00:10' },
    { level: 'warn' as const, message: 'Retrying request (1/3)', timestamp: '10:00:11' },
    { level: 'info' as const, message: 'Retry successful', timestamp: '10:00:13' },
  ];

  return (
    <>
      <h1>LogViewer</h1>
      <p className={intro}>
        Structured log viewer with level-based filtering (debug, info, warn,
        error).
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 560 }}>
          <LogViewer logs={logs} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='LogViewerProps' />
      </div>

      <div className={section}>
        <h2>LogEntry Type</h2>
        <PropsTable of='LogEntry' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Filter buttons are native <strong>&lt;button&gt;</strong> elements
            </li>
            <li>Level badges use distinct colors for visual differentiation</li>
            <li>
              Scrollable body with <strong>max-height: 24rem</strong>
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='logviewer' />
    </>
  );
}

// ─── Command ────────────────────────────────────────────────────

function CommandDemo() {
  return (
    <>
      <h1>Command</h1>
      <p className={intro}>Command palette with filterable list of items.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Command>
          <CommandInput placeholder='Type a command...' />
          <CommandList>
            <CommandItem>New File</CommandItem>
            <CommandItem>Open File</CommandItem>
            <CommandItem>Save</CommandItem>
            <CommandItem>Settings</CommandItem>
          </CommandList>
        </Command>
      </div>

      <div className={section}>
        <h2>Command Props</h2>
        <PropsTable of='CommandProps' />
      </div>

      <div className={section}>
        <h2>CommandInput Props</h2>
        <PropsTable of='CommandInputProps' />
      </div>

      <div className={section}>
        <h2>CommandItem Props</h2>
        <PropsTable of='CommandItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;combobox&quot;</strong> on the container</li>
            <li>Items use <strong>role=&quot;option&quot;</strong></li>
            <li>Typing in the input filters items by text content</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Resizable ──────────────────────────────────────────────────

function ResizableDemo() {
  return (
    <>
      <h1>Resizable</h1>
      <p className={intro}>Resizable panels with draggable handles.</p>

      <div className={section}>
        <h2>Horizontal</h2>
        <div style={{ height: 200, border: '1px solid var(--haze-color-border)', borderRadius: 'var(--haze-radius-md)' }}>
          <ResizableGroup>
            <ResizablePanel defaultSize={50}>
              <div style={{ padding: 'var(--haze-space-3)', height: '100%' }}>Left Panel</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50}>
              <div style={{ padding: 'var(--haze-space-3)', height: '100%' }}>Right Panel</div>
            </ResizablePanel>
          </ResizableGroup>
        </div>
      </div>

      <div className={section}>
        <h2>ResizableGroup Props</h2>
        <PropsTable of='ResizableGroupProps' />
      </div>

      <div className={section}>
        <h2>ResizablePanel Props</h2>
        <PropsTable of='ResizablePanelProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Handle uses <strong>role=&quot;separator&quot;</strong> with <strong>aria-orientation</strong></li>
            <li>Cursor changes to col-resize or row-resize based on direction</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Collapsible ────────────────────────────────────────────────

function CollapsibleDemo() {
  return (
    <>
      <h1>Collapsible</h1>
      <p className={intro}>Controlled collapsible section with trigger and content.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Collapsible>
          <CollapsibleTrigger>
            <Button variant='outline' size='sm'>Toggle Content</Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p style={{ padding: 'var(--haze-space-3) 0', margin: 0 }}>This content is shown when expanded.</p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className={section}>
        <h2>Collapsible Props</h2>
        <PropsTable of='CollapsibleProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Trigger is a native <strong>&lt;button&gt;</strong></li>
            <li>Content toggles visibility on trigger click</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Transfer ───────────────────────────────────────────────────

function TransferDemo() {
  const [targetKeys, setTargetKeys] = useState<string[]>(['b']);

  return (
    <>
      <h1>Transfer</h1>
      <p className={intro}>Transfer list for moving items between source and target.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Transfer
          dataSource={[
            { key: 'a', title: 'Item A' },
            { key: 'b', title: 'Item B' },
            { key: 'c', title: 'Item C' },
            { key: 'd', title: 'Item D' },
          ]}
          targetKeys={targetKeys}
          onChange={(keys) => setTargetKeys(keys)}
        />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TransferProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Items use <strong>&lt;label&gt;</strong> with checkboxes</li>
            <li>Action buttons have <strong>aria-label</strong></li>
            <li>Disabled items cannot be selected</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Upload ─────────────────────────────────────────────────────

function UploadDemo() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <>
      <h1>Upload</h1>
      <p className={intro}>File upload with drag and drop support.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400 }}>
          <Upload accept='image/*' onChange={(f) => setFiles(f)} />
        </div>
        {files.length > 0 && (
          <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)', marginTop: 'var(--haze-space-2)' }}>
            Selected: {files.map((f) => f.name).join(', ')}
          </p>
        )}
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='UploadProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;button&quot;</strong> with <strong>tabIndex</strong></li>
            <li>Click or drag-and-drop to select files</li>
            <li>Hidden native <strong>&lt;input type=&quot;file&quot;&gt;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── ColorPicker ────────────────────────────────────────────────

function ColorPickerDemo() {
  return (
    <>
      <h1>ColorPicker</h1>
      <p className={intro}>Color selection with native picker, text input, and presets.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 320 }}>
          <ColorPicker presets={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']} />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ColorPickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Native <strong>&lt;input type=&quot;color&quot;&gt;</strong> for visual picking</li>
            <li>Text input for manual hex entry</li>
            <li>Preset buttons have <strong>aria-label</strong> with the color value</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Rating ─────────────────────────────────────────────────────

function RatingDemo() {
  const [, , valueCtrl] = useControl(undefined, 3);
  const [value] = useControl(valueCtrl);

  return (
    <>
      <h1>Rating</h1>
      <p className={intro}>Star rating with half-star support.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Rating value={valueCtrl} />
          <span style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>{value} stars</span>
        </div>
      </div>

      <div className={section}>
        <h2>Half Stars</h2>
        <div className={row}>
          <Rating allowHalf />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='RatingProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;radiogroup&quot;</strong> with individual <strong>role=&quot;radio&quot;</strong> stars</li>
            <li>Each star has <strong>aria-checked</strong> and <strong>aria-label</strong></li>
            <li>Click to select, hover to preview</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Timeline ───────────────────────────────────────────────────

function TimelineDemo() {
  return (
    <>
      <h1>Timeline</h1>
      <p className={intro}>Vertical timeline for displaying events in chronological order.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Timeline>
          <TimelineItem title='Order placed' description='Your order has been placed successfully.' time='2 minutes ago' color='primary' />
          <TimelineItem title='Payment confirmed' description='Payment processed.' time='1 minute ago' color='success' />
          <TimelineItem title='Shipped' description='Package is on its way.' color='warning' />
          <TimelineItem title='Delivered' />
        </Timeline>
      </div>

      <div className={section}>
        <h2>TimelineItem Props</h2>
        <PropsTable of='TimelineItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Container uses <strong>role=&quot;list&quot;</strong></li>
            <li>Each item uses <strong>role=&quot;listitem&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Typography ─────────────────────────────────────────────────

function TypographyDemo() {
  return (
    <>
      <h1>Typography</h1>
      <p className={intro}>Title, Text, and Paragraph components for consistent typography.</p>

      <div className={section}>
        <h2>Title</h2>
        <Title level={1}>Heading Level 1</Title>
        <Title level={2}>Heading Level 2</Title>
        <Title level={3}>Heading Level 3</Title>
        <Title level={4}>Heading Level 4</Title>
        <Title level={5}>Heading Level 5</Title>
      </div>

      <div className={section}>
        <h2>Text</h2>
        <div className={row}>
          <Text>Default text</Text>
          <Text type='secondary'>Secondary text</Text>
          <Text type='muted'>Muted text</Text>
          <Text strong>Bold text</Text>
          <Text code>inline code</Text>
          <Text mark>Highlighted</Text>
        </div>
      </div>

      <div className={section}>
        <h2>Paragraph</h2>
        <Paragraph>This is a paragraph component with relaxed line height and bottom margin.</Paragraph>
        <Paragraph>Another paragraph follows naturally.</Paragraph>
      </div>

      <div className={section}>
        <h2>Title Props</h2>
        <PropsTable of='TitleProps' />
      </div>

      <div className={section}>
        <h2>Text Props</h2>
        <PropsTable of='TextProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Title renders semantic <strong>&lt;h1&gt;</strong> through <strong>&lt;h5&gt;</strong></li>
            <li>Text renders as <strong>&lt;span&gt;</strong>, <strong>&lt;strong&gt;</strong>, or <strong>&lt;code&gt;</strong></li>
            <li>Paragraph renders as <strong>&lt;p&gt;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Stat ───────────────────────────────────────────────────────

function StatDemo() {
  return (
    <>
      <h1>Stat</h1>
      <p className={intro}>Statistics display with trend indicators.</p>

      <div className={section}>
        <h2>Demo</h2>
        <StatGroup>
          <Stat title='Total Users' value='12,345' trend='up' trendValue='12%' description='vs last month' />
          <Stat title='Revenue' value='$45,678' trend='down' trendValue='3%' description='vs last month' />
          <Stat title='Active Now' value='89%' trend='neutral' trendValue='0%' />
        </StatGroup>
      </div>

      <div className={section}>
        <h2>Stat Props</h2>
        <PropsTable of='StatProps' />
      </div>

      <div className={section}>
        <h2>StatGroup Props</h2>
        <PropsTable of='StatGroupProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Purely presentational components</li>
            <li>Trend uses color and arrow symbols for visual indication</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Segmented ──────────────────────────────────────────────────

function SegmentedDemo() {
  return (
    <>
      <h1>Segmented</h1>
      <p className={intro}>Segmented control for switching between options.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Segmented options={['Map', 'Transit', 'Satellite']} />
        </div>
      </div>

      <div className={section}>
        <h2>Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-3)' }}>
          <Segmented options={['Small', 'Medium', 'Large']} size='sm' />
          <Segmented options={['Small', 'Medium', 'Large']} size='md' />
          <Segmented options={['Small', 'Medium', 'Large']} size='lg' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SegmentedProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;group&quot;</strong> on the container</li>
            <li>Each segment is a native <strong>&lt;button&gt;</strong></li>
            <li>Active segment has visual highlight with shadow</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Chip ───────────────────────────────────────────────────────

function ChipDemo() {
  return (
    <>
      <h1>Chip</h1>
      <p className={intro}>Compact element for tags, labels, and filters.</p>

      <div className={section}>
        <h2>Solid Variants</h2>
        <div className={row}>
          <Chip>Default</Chip>
          <Chip color='primary'>Primary</Chip>
          <Chip color='success'>Success</Chip>
          <Chip color='warning'>Warning</Chip>
          <Chip color='danger'>Danger</Chip>
        </div>
      </div>

      <div className={section}>
        <h2>Outline Variants</h2>
        <div className={row}>
          <Chip variant='outline'>Default</Chip>
          <Chip variant='outline' color='primary'>Primary</Chip>
          <Chip variant='outline' color='success'>Success</Chip>
          <Chip variant='outline' color='danger'>Danger</Chip>
        </div>
      </div>

      <div className={section}>
        <h2>With Close</h2>
        <div className={row}>
          <Chip onClose={noop}>Removable</Chip>
          <Chip color='primary' onClose={noop}>Primary</Chip>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ChipProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as a <strong>&lt;span&gt;</strong></li>
            <li>Close button has <strong>aria-label=&quot;Remove&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── ScrollArea ─────────────────────────────────────────────────

function ScrollAreaDemo() {
  return (
    <>
      <h1>ScrollArea</h1>
      <p className={intro}>Container with custom styled scrollbar.</p>

      <div className={section}>
        <h2>Demo</h2>
        <ScrollArea maxHeight={200}>
          <div style={{ padding: 'var(--haze-space-2)' }}>
            {Array.from({ length: 30 }, (_, i) => (
              <p key={i} style={{ margin: '0 0 var(--haze-space-2)' }}>Scrollable item {i + 1}</p>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ScrollAreaProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses native overflow with custom scrollbar styling</li>
            <li>Scrollbar is thin and styled via CSS custom properties</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── TimePicker ─────────────────────────────────────────────────

function TimePickerDemo() {
  return (
    <>
      <h1>TimePicker</h1>
      <p className={intro}>Time input using native time picker with controlled state.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <TimePicker placeholder='Select time' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TimePickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as native <strong>&lt;input type=&quot;time&quot;&gt;</strong></li>
            <li>Full keyboard support via browser native picker</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── DateRangePicker ────────────────────────────────────────────

function DateRangePickerDemo() {
  return (
    <>
      <h1>DateRangePicker</h1>
      <p className={intro}>Date range selection with start and end date inputs.</p>

      <div className={section}>
        <h2>Demo</h2>
        <DateRangePicker />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='DateRangePickerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses native <strong>&lt;input type=&quot;date&quot;&gt;</strong> elements</li>
            <li>Full keyboard and screen reader support</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── OTPInput ───────────────────────────────────────────────────

function OTPInputDemo() {
  return (
    <>
      <h1>OTPInput</h1>
      <p className={intro}>One-time password input with individual character cells.</p>

      <div className={section}>
        <h2>Demo</h2>
        <OTPInput length={6} />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='OTPInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Each cell is an <strong>&lt;input&gt;</strong> with <strong>inputMode=&quot;numeric&quot;</strong></li>
            <li>Auto-advances focus on input</li>
            <li>Backspace moves focus to previous cell</li>
            <li>Paste support fills all cells</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── PasswordInput ──────────────────────────────────────────────

function PasswordInputDemo() {
  return (
    <>
      <h1>PasswordInput</h1>
      <p className={intro}>Password field with show/hide toggle.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <PasswordInput placeholder='Enter password' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='PasswordInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Toggle button has <strong>aria-label</strong> (&quot;Show password&quot; / &quot;Hide password&quot;)</li>
            <li>Toggle button uses <strong>tabIndex={'{'}-1{'}'}</strong> to skip tab order</li>
            <li>Type switches between &quot;password&quot; and &quot;text&quot;</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── TagInput ───────────────────────────────────────────────────

function TagInputDemo() {
  return (
    <>
      <h1>TagInput</h1>
      <p className={intro}>Input field for adding and removing tags.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={fieldRow}>
          <TagInput placeholder='Type and press Enter' />
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TagInputProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Enter or comma adds a tag</li>
            <li>Backspace on empty input removes last tag</li>
            <li>Remove buttons are keyboard accessible</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── InlineEdit ─────────────────────────────────────────────────

function InlineEditDemo() {
  return (
    <>
      <h1>InlineEdit</h1>
      <p className={intro}>Click-to-edit text with inline input.</p>

      <div className={section}>
        <h2>Demo</h2>
        <InlineEdit placeholder='Click to edit this text' />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='InlineEditProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Display mode uses <strong>role=&quot;button&quot;</strong> with <strong>tabIndex</strong></li>
            <li>Enter starts editing, Enter commits, Escape cancels</li>
            <li>Blur commits the value</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── DropdownMenu ───────────────────────────────────────────────

function DropdownMenuDemo() {
  return (
    <>
      <h1>DropdownMenu</h1>
      <p className={intro}>Dropdown menu with trigger, content, items, and separators.</p>

      <div className={section}>
        <h2>Demo</h2>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant='outline'>Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={section}>
        <h2>DropdownMenu Props</h2>
        <PropsTable of='DropdownMenuProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuContent Props</h2>
        <PropsTable of='DropdownMenuContentProps' />
      </div>

      <div className={section}>
        <h2>DropdownMenuItem Props</h2>
        <PropsTable of='DropdownMenuItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Trigger is a native <strong>&lt;button&gt;</strong></li>
            <li>Click outside closes the menu</li>
            <li>Disabled items have <strong>disabled</strong> attribute</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── ContextMenu ────────────────────────────────────────────────

function ContextMenuDemo() {
  return (
    <>
      <h1>ContextMenu</h1>
      <p className={intro}>Right-click context menu positioned at cursor.</p>

      <div className={section}>
        <h2>Demo</h2>
        <ContextMenu>
          <ContextMenuTrigger>
            <div style={{ padding: 'var(--haze-space-6)', border: '1px dashed var(--haze-color-border)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>
              Right-click here to open context menu
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Copy</ContextMenuItem>
            <ContextMenuItem>Paste</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Select All</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <div className={section}>
        <h2>ContextMenu Props</h2>
        <PropsTable of='ContextMenuProps' />
      </div>

      <div className={section}>
        <h2>ContextMenuItem Props</h2>
        <PropsTable of='ContextMenuItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Opens on right-click (contextmenu event)</li>
            <li>Content is positioned at cursor coordinates</li>
            <li>Click outside closes the menu</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── NavigationBar ──────────────────────────────────────────────

function NavigationBarDemo() {
  return (
    <>
      <h1>NavigationBar</h1>
      <p className={intro}>Top navigation bar with brand, links, and end slot.</p>

      <div className={section}>
        <h2>Demo</h2>
        <NavigationBar
          brand={<span>MyApp</span>}
          end={<Button size='sm' variant='outline'>Login</Button>}
        >
          <NavLink active>Home</NavLink>
          <NavLink>Docs</NavLink>
          <NavLink>About</NavLink>
        </NavigationBar>
      </div>

      <div className={section}>
        <h2>NavigationBar Props</h2>
        <PropsTable of='NavigationBarProps' />
      </div>

      <div className={section}>
        <h2>NavLink Props</h2>
        <PropsTable of='NavLinkProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as <strong>&lt;nav&gt;</strong></li>
            <li>Active link has <strong>aria-current=&quot;page&quot;</strong></li>
            <li>Links are standard <strong>&lt;a&gt;</strong> elements</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── BackToTop ──────────────────────────────────────────────────

function BackToTopDemo() {
  return (
    <>
      <h1>BackToTop</h1>
      <p className={intro}>Fixed scroll-to-top button that appears after scrolling.</p>

      <div className={section}>
        <h2>Demo</h2>
        <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>
          Scroll down to see the button appear at the bottom-right corner.
        </p>
        <BackToTop threshold={100} />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BackToTopProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>aria-label=&quot;Back to top&quot;</strong></li>
            <li>Smooth scroll animation</li>
            <li>Hidden with opacity and pointer-events when below threshold</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Affix ──────────────────────────────────────────────────────

function AffixDemo() {
  return (
    <>
      <h1>Affix</h1>
      <p className={intro}>Fixed position element relative to the viewport.</p>

      <div className={section}>
        <h2>Demo</h2>
        <p style={{ fontSize: 'var(--haze-text-sm)', color: 'var(--haze-color-text-secondary)' }}>
          Affix positions children fixed to the viewport. Use <code>position</code> to set top or bottom, and <code>offset</code> for pixel offset.
        </p>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AffixProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses CSS <strong>position: fixed</strong> with <strong>z-index: 100</strong></li>
            <li>Purely presentational wrapper</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Container ──────────────────────────────────────────────────

function ContainerDemo() {
  return (
    <>
      <h1>Container</h1>
      <p className={intro}>Centered content container with max-width breakpoints.</p>

      <div className={section}>
        <h2>Sizes</h2>
        {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
          <div key={size} style={{ marginBottom: 'var(--haze-space-3)' }}>
            <Container size={size}>
              <div style={{ background: 'var(--haze-color-bg-subtle)', padding: 'var(--haze-space-3)', borderRadius: 'var(--haze-radius-md)', textAlign: 'center' }}>
                Size: {size}
              </div>
            </Container>
          </div>
        ))}
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ContainerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as a plain <strong>&lt;div&gt;</strong></li>
            <li>Purely presentational layout component</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Banner ─────────────────────────────────────────────────────

function BannerDemo() {
  return (
    <>
      <h1>Banner</h1>
      <p className={intro}>Dismissible alert banner with variant colors.</p>

      <div className={section}>
        <h2>Variants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--haze-space-2)' }}>
          <Banner variant='info'>This is an informational banner.</Banner>
          <Banner variant='success'>Operation completed successfully.</Banner>
          <Banner variant='warning'>Please review your settings.</Banner>
          <Banner variant='danger' onClose={noop}>Something went wrong.</Banner>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BannerProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses <strong>role=&quot;alert&quot;</strong></li>
            <li>Close button has <strong>aria-label=&quot;Close&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── ConfirmDialog ──────────────────────────────────────────────

function ConfirmDialogDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>ConfirmDialog</h1>
      <p className={intro}>Confirmation dialog with confirm/cancel actions.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Confirm Dialog</Button>
        </div>
        <ConfirmDialog
          open={openCtrl}
          title='Delete Item'
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          variant='danger'
        >
          Are you sure you want to delete this item? This action cannot be undone.
        </ConfirmDialog>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='ConfirmDialogProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Overlay click closes the dialog</li>
            <li>Confirm and cancel buttons are keyboard accessible</li>
            <li>Danger variant uses red confirm button</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── CodeBlock ──────────────────────────────────────────────────

function CodeBlockDemo() {
  return (
    <>
      <h1>CodeBlock</h1>
      <p className={intro}>Code display with language label and monospace styling.</p>

      <div className={section}>
        <h2>Demo</h2>
        <CodeBlock language='tsx'>
{`const greeting = "Hello, world!";
console.log(greeting);`}
        </CodeBlock>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CodeBlockProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Renders as <strong>&lt;pre&gt;&lt;code&gt;</strong></li>
            <li>Language label is decorative (user-select: none)</li>
            <li>Horizontal scroll for long lines</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── AspectRatio ────────────────────────────────────────────────

function AspectRatioDemo() {
  return (
    <>
      <h1>AspectRatio</h1>
      <p className={intro}>Container that maintains a fixed aspect ratio.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400 }}>
          <AspectRatio ratio={16 / 9}>
            <div style={{ width: '100%', height: '100%', background: 'var(--haze-color-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              16:9
            </div>
          </AspectRatio>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='AspectRatioProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses CSS <strong>padding-bottom</strong> technique for ratio</li>
            <li>Content is absolutely positioned inside</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── VirtualList ────────────────────────────────────────────────

function VirtualListDemo() {
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

  return (
    <>
      <h1>VirtualList</h1>
      <p className={intro}>Virtualized list for rendering large datasets efficiently.</p>

      <div className={section}>
        <h2>Demo</h2>
        <VirtualList
          items={items}
          height={300}
          itemHeight={32}
          renderItem={(item) => (
            <div style={{ padding: '0 var(--haze-space-3)', lineHeight: '32px', borderBottom: '1px solid var(--haze-color-border)' }}>
              {item}
            </div>
          )}
        />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='VirtualListProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Only visible items are rendered in the DOM</li>
            <li>Uses absolute positioning for item placement</li>
            <li>Native scroll behavior is preserved</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── TagGroup ───────────────────────────────────────────────────

function TagGroupDemo() {
  return (
    <>
      <h1>TagGroup</h1>
      <p className={intro}>Group of tags with optional close buttons.</p>

      <div className={section}>
        <h2>Demo</h2>
        <TagGroup>
          <TagGroupItem>React</TagGroupItem>
          <TagGroupItem>TypeScript</TagGroupItem>
          <TagGroupItem onClose={noop}>Removable</TagGroupItem>
        </TagGroup>
      </div>

      <div className={section}>
        <h2>TagGroup Props</h2>
        <PropsTable of='TagGroupProps' />
      </div>

      <div className={section}>
        <h2>TagGroupItem Props</h2>
        <PropsTable of='TagGroupItemProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Group uses <strong>role=&quot;group&quot;</strong></li>
            <li>Close button has <strong>aria-label=&quot;Remove&quot;</strong></li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── BottomSheet ────────────────────────────────────────────────

function BottomSheetDemo() {
  const [, , openCtrl] = useControl(undefined, false);
  const [, setOpen] = useControl(openCtrl);

  return (
    <>
      <h1>BottomSheet</h1>
      <p className={intro}>Bottom sheet overlay panel for mobile-friendly interactions.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div className={row}>
          <Button onClick={() => setOpen(true)}>Open Bottom Sheet</Button>
        </div>
        <BottomSheet open={openCtrl} onClose={() => setOpen(false)}>
          <p style={{ margin: 0 }}>Bottom sheet content. Click the backdrop to close.</p>
          <Button onClick={() => setOpen(false)} size='sm' variant='outline' style={{ marginTop: 'var(--haze-space-3)' }}>
            Close
          </Button>
        </BottomSheet>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='BottomSheetProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Overlay click closes the sheet</li>
            <li>Sheet has a drag handle indicator</li>
            <li>Safe area insets are respected for mobile</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── SwipeAction ────────────────────────────────────────────────

function SwipeActionDemo() {
  return (
    <>
      <h1>SwipeAction</h1>
      <p className={intro}>Swipe-to-reveal actions for touch and pointer interactions.</p>

      <div className={section}>
        <h2>Demo</h2>
        <div style={{ maxWidth: 400, border: '1px solid var(--haze-color-border)', borderRadius: 'var(--haze-radius-md)' }}>
          <SwipeAction
            left={<div style={{ padding: 'var(--haze-space-3)', color: 'var(--haze-color-success)' }}>Archive</div>}
            right={<div style={{ padding: 'var(--haze-space-3)', color: 'var(--haze-color-danger)' }}>Delete</div>}
          >
            <div style={{ padding: 'var(--haze-space-4)', background: 'var(--haze-color-bg)' }}>Swipe left or right</div>
          </SwipeAction>
        </div>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='SwipeActionProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Uses pointer events for cross-device support</li>
            <li>Content slides with CSS transform</li>
            <li>Resets position on pointer release</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}

// ─── Demo registry ─────────────────────────────────────────────

const demos: Record<string, () => ReactNode> = {
  button: ButtonDemo,
  input: InputDemo,
  select: SelectDemo,
  checkbox: CheckboxDemo,
  switch: SwitchDemo,
  badge: BadgeDemo,
  dialog: DialogDemo,
  tooltip: TooltipDemo,
  popover: PopoverDemo,
  card: CardDemo,
  radio: RadioDemo,
  textarea: TextareaDemo,
  slider: SliderDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
  alert: AlertDemo,
  avatar: AvatarDemo,
  tag: TagDemo,
  skeleton: SkeletonDemo,
  icon: IconDemo,
  image: ImageDemo,
  flex: FlexDemo,
  breadcrumb: BreadcrumbDemo,
  disclosure: DisclosureDemo,
  menu: MenuDemo,
  numberinput: NumberInputDemo,
  fileinput: FileInputDemo,
  toast: ToastDemo,
  list: ListDemo,
  combobox: ComboboxDemo,
  table: TableDemo,
  'data-table': DataTableDemo,
  carousel: CarouselDemo,
  datepicker: DatepickerDemo,
  tree: TreeDemo,
  divider: DividerDemo,
  spinner: SpinnerDemo,
  empty: EmptyDemo,
  progress: ProgressDemo,
  pagination: PaginationDemo,
  grid: GridDemo,
  drawer: DrawerDemo,
  stepper: StepperDemo,
  chatmessage: ChatMessageDemo,
  chatcontainer: ChatContainerDemo,
  chatinput: ChatInputDemo,
  streamingtext: StreamingTextDemo,
  markdownrenderer: MarkdownRendererDemo,
  toolcallcard: ToolCallCardDemo,
  thinkingindicator: ThinkingIndicatorDemo,
  steptimeline: StepTimelineDemo,
  approvalcard: ApprovalCardDemo,
  tokencounter: TokenCounterDemo,
  modelpicker: ModelPickerDemo,
  conversationlist: ConversationListDemo,
  diffviewer: DiffViewerDemo,
  logviewer: LogViewerDemo,
  command: CommandDemo,
  resizable: ResizableDemo,
  collapsible: CollapsibleDemo,
  transfer: TransferDemo,
  upload: UploadDemo,
  colorpicker: ColorPickerDemo,
  rating: RatingDemo,
  timeline: TimelineDemo,
  typography: TypographyDemo,
  stat: StatDemo,
  segmented: SegmentedDemo,
  chip: ChipDemo,
  scrollarea: ScrollAreaDemo,
  timepicker: TimePickerDemo,
  daterangepicker: DateRangePickerDemo,
  otpinput: OTPInputDemo,
  passwordinput: PasswordInputDemo,
  taginput: TagInputDemo,
  inlineedit: InlineEditDemo,
  dropdownmenu: DropdownMenuDemo,
  contextmenu: ContextMenuDemo,
  navigationbar: NavigationBarDemo,
  backtotop: BackToTopDemo,
  affix: AffixDemo,
  container: ContainerDemo,
  banner: BannerDemo,
  confirmdialog: ConfirmDialogDemo,
  codeblock: CodeBlockDemo,
  aspectratio: AspectRatioDemo,
  virtuallist: VirtualListDemo,
  taggroup: TagGroupDemo,
  bottomsheet: BottomSheetDemo,
  swipeaction: SwipeActionDemo,
  form: FormDemo,
};

// ─── Copy import ────────────────────────────────────────────────

const copyBar = css`
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--haze-space-3);
`;

/** route param (`:name`, e.g. 'numberinput') → generated component entry. */
const propsByRoute = new Map(
  Object.values(generatedProps.components).map((entry) => [
    entry.routeKey,
    entry,
  ])
);

/**
 * Small wrapper-level action: copies the `import { … } from 'haze-ui'` lines
 * (plus the tokens.css / per-component css imports) for the current route.
 * Rendered once next to the demo, not inside each demo. Hidden when the
 * route has no component entry in the generated props index (e.g. 'form').
 */
function CopyImportButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const entry = propsByRoute.get(name);
  if (!entry) return null;

  const importText = [
    `import { ${entry.imports.join(', ')} } from 'haze-ui';`,
    `import 'haze-ui/css/tokens.css';`,
    `import 'haze-ui/css/${entry.cssFamily}.css';`,
  ].join('\n');

  return (
    <div className={copyBar}>
      <Button
        size='sm'
        variant='outline'
        onClick={() => {
          void navigator.clipboard.writeText(importText);
          setCopied(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? 'Copied' : 'Copy import'}
      </Button>
    </div>
  );
}

export default function ComponentDetail() {
  const { params } = useMatched();
  const name = params.name ?? '';
  const Demo = demos[name];

  return (
    <div className={page}>
      {Demo ? (
        <>
          <CopyImportButton name={name} />
          <Demo />
        </>
      ) : (
        <h1>Component not found: {name}</h1>
      )}
    </div>
  );
}
