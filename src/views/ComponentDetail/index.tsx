import type { ReactNode } from 'react';

import { useEffect, useRef, useState } from 'react';

import { useMatched } from '@native-router/react';

import { css } from '@linaria/core';

import { Button } from '@/lib';

import FormDemo from '@/components/FormDemo';

import generatedProps from '@/generated/props.json';

import KbdDemo from './demos/KbdDemo';

import AvatarGroupDemo from './demos/AvatarGroupDemo';

import CalendarDemo from './demos/CalendarDemo';

import HoverCardDemo from './demos/HoverCardDemo';

import ToolbarDemo from './demos/ToolbarDemo';

import CascaderDemo from './demos/CascaderDemo';

import SidebarDemo from './demos/SidebarDemo';

import TourDemo from './demos/TourDemo';
import LocaleProviderDemo from './demos/LocaleProviderDemo';



import { page } from './styles';

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
  asyncsection: AsyncSectionDemo,
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
  mentions: MentionsDemo,
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
  kbd: KbdDemo,
  avatargroup: AvatarGroupDemo,
  calendar: CalendarDemo,
  hovercard: HoverCardDemo,
  toolbar: ToolbarDemo,
  cascader: CascaderDemo,
  sidebar: SidebarDemo,
  tour: TourDemo,
  localeprovider: LocaleProviderDemo,
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
          <DemoSource name={name} />
        </>
      ) : (
        <h1>Component not found: {name}</h1>
      )}
    </div>
  );
}
