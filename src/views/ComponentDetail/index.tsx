import type { ReactNode } from 'react';

import { useEffect, useRef, useState } from 'react';

import { commitReplace, resolveTo, toLocation } from '@native-router/core';
import { Link, useMatched, useRouter } from '@native-router/react';

import { css } from '@linaria/core';

import { Button } from '@/lib';

import FormDemo from '@/components/FormDemo';

import generatedProps from '@/generated/props.json';

import { COMPONENT_GROUPS } from '@/views/Layout/component-groups';
import { fill, useSiteLocale } from '@/views/i18n';

import { LEGACY_REDIRECTS, suggestComponents } from './legacy-routes';

import KbdDemo from './demos/KbdDemo';

import AvatarGroupDemo from './demos/AvatarGroupDemo';

import CalendarDemo from './demos/CalendarDemo';

import HoverCardDemo from './demos/HoverCardDemo';

import ToolbarDemo from './demos/ToolbarDemo';

import CascaderDemo from './demos/CascaderDemo';
import TreeSelectDemo from './demos/TreeSelectDemo';
import ResultDemo from './demos/ResultDemo';
import QRCodeDemo from './demos/QRCodeDemo';

import SidebarDemo from './demos/SidebarDemo';

import TourDemo from './demos/TourDemo';
import AnchorDemo from './demos/AnchorDemo';
import WatermarkDemo from './demos/WatermarkDemo';
import FullscreenDemo from './demos/FullscreenDemo';
import ConfigProviderDemo from './demos/ConfigProviderDemo';
import LocaleProviderDemo from './demos/LocaleProviderDemo';
import ToggleDemo from './demos/ToggleDemo';
import AppShellDemo from './demos/AppShellDemo';
import ChartDemo from './demos/ChartDemo';

import { page } from './styles';

import DemoPreview from './DemoPreview';
import DemoSource from './DemoSource';

import ButtonDemo from './demos/ButtonDemo';

import InputDemo from './demos/InputDemo';

import SelectDemo from './demos/SelectDemo';

import CheckboxDemo from './demos/CheckboxDemo';

import SwitchDemo from './demos/SwitchDemo';

import BadgeDemo from './demos/BadgeDemo';

import DialogDemo from './demos/DialogDemo';

import TooltipDemo from './demos/TooltipDemo';

import PopoverDemo from './demos/PopoverDemo';

import CardDemo from './demos/CardDemo';

import RadioDemo from './demos/RadioDemo';

import TextareaDemo from './demos/TextareaDemo';

import SliderDemo from './demos/SliderDemo';

import TabsDemo from './demos/TabsDemo';

import AccordionDemo from './demos/AccordionDemo';

import AlertDemo from './demos/AlertDemo';

import AvatarDemo from './demos/AvatarDemo';

import TagDemo from './demos/TagDemo';

import SkeletonDemo from './demos/SkeletonDemo';

import IconDemo from './demos/IconDemo';

import ImageDemo from './demos/ImageDemo';

import FlexDemo from './demos/FlexDemo';

import BreadcrumbDemo from './demos/BreadcrumbDemo';

import DisclosureDemo from './demos/DisclosureDemo';

import MenuDemo from './demos/MenuDemo';

import NumberInputDemo from './demos/NumberInputDemo';

import FileInputDemo from './demos/FileInputDemo';

import ToastDemo from './demos/ToastDemo';

import ListDemo from './demos/ListDemo';

import ComboboxDemo from './demos/ComboboxDemo';

import TableDemo from './demos/TableDemo';

import DataTableDemo from './demos/DataTableDemo';

import CarouselDemo from './demos/CarouselDemo';

import DatepickerDemo from './demos/DatepickerDemo';

import TreeDemo from './demos/TreeDemo';

import DividerDemo from './demos/DividerDemo';

import SpinnerDemo from './demos/SpinnerDemo';

import EmptyDemo from './demos/EmptyDemo';

import ProgressDemo from './demos/ProgressDemo';

import PaginationDemo from './demos/PaginationDemo';

import GridDemo from './demos/GridDemo';

import DrawerDemo from './demos/DrawerDemo';

import StepperDemo from './demos/StepperDemo';

import ChatMessageDemo from './demos/ChatMessageDemo';

import ChatContainerDemo from './demos/ChatContainerDemo';

import ChatInputDemo from './demos/ChatInputDemo';

import StreamingTextDemo from './demos/StreamingTextDemo';

import MarkdownRendererDemo from './demos/MarkdownRendererDemo';

import ToolCallCardDemo from './demos/ToolCallCardDemo';

import ThinkingIndicatorDemo from './demos/ThinkingIndicatorDemo';

import StepTimelineDemo from './demos/StepTimelineDemo';

import ApprovalCardDemo from './demos/ApprovalCardDemo';

import TokenCounterDemo from './demos/TokenCounterDemo';

import ModelPickerDemo from './demos/ModelPickerDemo';

import ConversationListDemo from './demos/ConversationListDemo';

import DiffViewerDemo from './demos/DiffViewerDemo';

import LogViewerDemo from './demos/LogViewerDemo';

import CommandDemo from './demos/CommandDemo';

import ResizableDemo from './demos/ResizableDemo';

import CollapsibleDemo from './demos/CollapsibleDemo';

import TransferDemo from './demos/TransferDemo';

import UploadDemo from './demos/UploadDemo';

import ColorPickerDemo from './demos/ColorPickerDemo';

import RatingDemo from './demos/RatingDemo';

import TimelineDemo from './demos/TimelineDemo';

import TypographyDemo from './demos/TypographyDemo';
import EllipsisDemo from './demos/EllipsisDemo';
import CountUpDemo from './demos/CountUpDemo';

import StatDemo from './demos/StatDemo';

import SegmentedDemo from './demos/SegmentedDemo';

import ChipDemo from './demos/ChipDemo';

import ScrollAreaDemo from './demos/ScrollAreaDemo';

import TimePickerDemo from './demos/TimePickerDemo';

import DateRangePickerDemo from './demos/DateRangePickerDemo';

import OTPInputDemo from './demos/OTPInputDemo';

import PasswordInputDemo from './demos/PasswordInputDemo';

import TagInputDemo from './demos/TagInputDemo';

import MentionsDemo from './demos/MentionsDemo';

import PromptInputDemo from './demos/PromptInputDemo';

import AsyncSectionDemo from './demos/AsyncSectionDemo';

import InlineEditDemo from './demos/InlineEditDemo';

import DropdownMenuDemo from './demos/DropdownMenuDemo';

import ContextMenuDemo from './demos/ContextMenuDemo';

import NavigationBarDemo from './demos/NavigationBarDemo';

import BackToTopDemo from './demos/BackToTopDemo';

import AffixDemo from './demos/AffixDemo';

import ContainerDemo from './demos/ContainerDemo';

import BannerDemo from './demos/BannerDemo';

import ConfirmDialogDemo from './demos/ConfirmDialogDemo';

import CodeBlockDemo from './demos/CodeBlockDemo';

import AspectRatioDemo from './demos/AspectRatioDemo';

import VirtualListDemo from './demos/VirtualListDemo';

import TagGroupDemo from './demos/TagGroupDemo';

import BottomSheetDemo from './demos/BottomSheetDemo';

import SwipeActionDemo from './demos/SwipeActionDemo';

import DescriptionsDemo from './demos/DescriptionsDemo';

import JsonViewDemo from './demos/JsonViewDemo';

import SourcesDemo from './demos/SourcesDemo';

import FilePreviewDemo from './demos/FilePreviewDemo';

import InlineCompletionDemo from './demos/InlineCompletionDemo';

import FloatButtonDemo from './demos/FloatButtonDemo';

import MasonryDemo from './demos/MasonryDemo';

import SignatureDemo from './demos/SignatureDemo';

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
  'number-input': NumberInputDemo,
  'file-input': FileInputDemo,
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
  result: ResultDemo,
  progress: ProgressDemo,
  pagination: PaginationDemo,
  grid: GridDemo,
  drawer: DrawerDemo,
  stepper: StepperDemo,
  'chat-message': ChatMessageDemo,
  'chat-container': ChatContainerDemo,
  'chat-input': ChatInputDemo,
  'streaming-text': StreamingTextDemo,
  'markdown-renderer': MarkdownRendererDemo,
  'tool-call-card': ToolCallCardDemo,
  'thinking-indicator': ThinkingIndicatorDemo,
  'step-timeline': StepTimelineDemo,
  'approval-card': ApprovalCardDemo,
  'token-counter': TokenCounterDemo,
  'model-picker': ModelPickerDemo,
  'conversation-list': ConversationListDemo,
  'diff-viewer': DiffViewerDemo,
  'log-viewer': LogViewerDemo,
  'async-section': AsyncSectionDemo,
  command: CommandDemo,
  resizable: ResizableDemo,
  collapsible: CollapsibleDemo,
  transfer: TransferDemo,
  upload: UploadDemo,
  'color-picker': ColorPickerDemo,
  rating: RatingDemo,
  timeline: TimelineDemo,
  typography: TypographyDemo,
  ellipsis: EllipsisDemo,
  'count-up': CountUpDemo,
  stat: StatDemo,
  segmented: SegmentedDemo,
  chip: ChipDemo,
  'scroll-area': ScrollAreaDemo,
  'time-picker': TimePickerDemo,
  'date-range-picker': DateRangePickerDemo,
  'otp-input': OTPInputDemo,
  'password-input': PasswordInputDemo,
  'tag-input': TagInputDemo,
  mentions: MentionsDemo,
  'prompt-input': PromptInputDemo,
  'inline-edit': InlineEditDemo,
  'dropdown-menu': DropdownMenuDemo,
  'context-menu': ContextMenuDemo,
  'navigation-bar': NavigationBarDemo,
  'back-to-top': BackToTopDemo,
  affix: AffixDemo,
  container: ContainerDemo,
  banner: BannerDemo,
  'confirm-dialog': ConfirmDialogDemo,
  'code-block': CodeBlockDemo,
  'aspect-ratio': AspectRatioDemo,
  'virtual-list': VirtualListDemo,
  'tag-group': TagGroupDemo,
  'bottom-sheet': BottomSheetDemo,
  'swipe-action': SwipeActionDemo,
  descriptions: DescriptionsDemo,
  'json-view': JsonViewDemo,
  'qr-code': QRCodeDemo,
  sources: SourcesDemo,
  'file-preview': FilePreviewDemo,
  'inline-completion': InlineCompletionDemo,
  'float-button': FloatButtonDemo,
  masonry: MasonryDemo,
  signature: SignatureDemo,
  kbd: KbdDemo,
  'avatar-group': AvatarGroupDemo,
  calendar: CalendarDemo,
  'hover-card': HoverCardDemo,
  toolbar: ToolbarDemo,
  cascader: CascaderDemo,
  'tree-select': TreeSelectDemo,
  sidebar: SidebarDemo,
  tour: TourDemo,
  anchor: AnchorDemo,
  watermark: WatermarkDemo,
  fullscreen: FullscreenDemo,
  'locale-provider': LocaleProviderDemo,
  'config-provider': ConfigProviderDemo,
  toggle: ToggleDemo,
  'app-shell': AppShellDemo,
  chart: ChartDemo,
  form: FormDemo,
};

// ─── Copy import ────────────────────────────────────────────────
const copyBar = css`
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--haze-space-3);
`;

/** route param (`:name`, e.g. 'number-input') → generated component entry. */
const propsByRoute = new Map(
  Object.values(generatedProps.components).map((entry) => [
    entry.routeKey,
    entry,
  ])
);

/* route → display name, for the locale-aware one-line lede overlay. */
const NAME_BY_ROUTE = new Map(
  COMPONENT_GROUPS.flatMap((group) =>
    group.items.map((item) => [item.route, item.name] as const)
  )
);

/* zh lede sits above the demo's own English h1/intro (component doc bodies
 * stay untranslated this round); en renders nothing extra. */
const lede = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text-secondary);
  line-height: var(--haze-leading-normal);
  margin: 0 0 var(--haze-space-4);
`;

/** Locale overlay for the per-component one-line description. */
function ComponentLede({ route }: { route: string }) {
  const { locale, t } = useSiteLocale();
  if (locale !== 'zh') return null;
  const blurb = t.components[NAME_BY_ROUTE.get(route) ?? ''];
  if (blurb === undefined || blurb === '') return null;
  return <p className={lede}>{blurb}</p>;
}

const notFound = css`
  h1 {
    margin-bottom: var(--haze-space-2);
  }
`;

const notFoundHint = css`
  margin: 0 0 var(--haze-space-3);
  color: var(--haze-color-text-secondary);
`;

const suggestionList = css`
  margin: 0 0 var(--haze-space-4);
  padding: 0;
  list-style: none;
`;

const suggestionItem = css`
  & + & {
    margin-top: var(--haze-space-1);
  }
`;

const suggestionLink = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-primary);

  &:hover {
    text-decoration: underline;
  }
`;

/** 404 兜底：标题 + 最近匹配建议（≤3 条）+ 返回组件列表。 */
function NotFound({ name }: { name: string }) {
  const { t } = useSiteLocale();
  const suggestions = suggestComponents(name);
  return (
    <section className={notFound}>
      <h1>{fill(t.componentDetail.notFoundTitle, { name })}</h1>
      <p className={notFoundHint}>
        {suggestions.length > 0
          ? t.componentDetail.notFoundHintSuggestions
          : t.componentDetail.notFoundHintPlain}
      </p>
      {suggestions.length > 0 && (
        <ul className={suggestionList}>
          {suggestions.map((s) => (
            <li key={s.route} className={suggestionItem}>
              <Link className={suggestionLink} to={`/components/${s.route}`}>
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to='/components'>{t.componentDetail.backToAllComponents}</Link>
    </section>
  );
}

/**
 * Small wrapper-level action: copies the `import { … } from 'haze-ui'` lines
 * (plus the tokens.css / per-component css imports) for the current route.
 * Rendered once next to the demo, not inside each demo. Hidden when the
 * route has no component entry in the generated props index (e.g. 'form').
 */
function CopyImportButton({ name }: { name: string }) {
  const { t } = useSiteLocale();
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
        {copied ? t.componentDetail.copied : t.componentDetail.copyImport}
      </Button>
    </div>
  );
}

export default function ComponentDetail() {
  const { params } = useMatched();
  const router = useRouter();
  const name = params.name ?? '';
  const Demo = demos[name];
  const redirectTo = LEGACY_REDIRECTS[name];

  // 旧 slug 命中：replace 改写当前历史条目（后退键不落回旧地址），
  // 跳转解析期间不渲染 404，避免闪现。
  useEffect(() => {
    if (!redirectTo) return;
    const to = `/components/${redirectTo}`;
    void commitReplace(router, resolveTo(router, to), toLocation(router, to));
  }, [redirectTo, router]);

  return (
    <div className={page}>
      {redirectTo ? null : Demo ? (
        <>
          <ComponentLede route={name} />
          <CopyImportButton name={name} />
          <DemoPreview>
            <Demo />
          </DemoPreview>
          <DemoSource name={name} />
        </>
      ) : (
        <NotFound name={name} />
      )}
    </div>
  );
}
