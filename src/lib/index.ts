// tokens
export { lightTheme, darkTheme } from './tokens/colors';
export { violetTheme, tealTheme, cyanTheme, orangeTheme, roseTheme } from './tokens/brands';
export type { BrandTheme } from './tokens/brands';
export { createBrandTheme, BRAND_FAMILIES, BRAND_SEEDS, buildBrandTheme } from './tokens/palette';
export type { CreateBrandThemeOptions, BrandThemeCss, BrandSeedOverrides, ScaleSeed } from './tokens/palette';
export { spacing } from './tokens/spacing';
export { compact } from './tokens/density';
export { typography } from './tokens/typography';
export { TOKEN_REGISTRY, COMPONENT_TOKENS } from './tokens/registry';
export type { TokenDef } from './tokens/registry';

// components
export { Button, ButtonLink, buttonVariants, buttonSizes } from './components/Button';
export type { ButtonProps, ButtonLinkProps } from './components/Button';
export { Input, InputCore } from './components/Input';
export type { InputProps, InputCoreProps } from './components/Input';
export { Select, Option, SelectCore, OptionGroup } from './components/Select';
export type { SelectProps, OptionProps, SelectCoreProps, OptionGroupProps } from './components/Select';
export { Checkbox, CheckboxCore } from './components/Checkbox';
export type { CheckboxProps, CheckboxCoreProps } from './components/Checkbox';
export { Switch, SwitchCore } from './components/Switch';
export type { SwitchProps, SwitchCoreProps } from './components/Switch';
export { Toggle, ToggleCore } from './components/Toggle';
export type { ToggleProps, ToggleCoreProps } from './components/Toggle';
export { Badge, badgeVariants, badgeSizes } from './components/Badge';
export type { BadgeProps } from './components/Badge';
export { Dialog } from './components/Dialog';
export type { DialogProps, DialogHandle, DialogClassNames } from './components/Dialog';
export { Tooltip } from './components/Tooltip';
export type { TooltipProps } from './components/Tooltip';
export { Popover } from './components/Popover';
export type { PopoverProps, PopoverHandle, PopoverClassNames } from './components/Popover';
export { Card } from './components/Card';
export type { CardProps } from './components/Card';
export { Radio, RadioGroup, RadioGroupCore } from './components/Radio';
export type { RadioProps, RadioGroupProps, RadioGroupCoreProps } from './components/Radio';
export { Textarea, TextareaCore } from './components/Textarea';
export type { TextareaProps, TextareaCoreProps } from './components/Textarea';
export { Slider, SliderCore } from './components/Slider';
export type { SliderProps, SliderCoreProps } from './components/Slider';
export { Tabs, TabList, Tab, TabPanel } from './components/Tabs';
export type {
  TabsProps,
  TabsClassNames,
  TabListProps,
  TabProps,
  TabPanelProps,
} from './components/Tabs';
export { Accordion, AccordionItem } from './components/Accordion';
export type {
  AccordionProps,
  AccordionItemProps,
} from './components/Accordion';
export { Alert } from './components/Alert';
export type { AlertProps } from './components/Alert';
export { Avatar } from './components/Avatar';
export type { AvatarProps } from './components/Avatar';
export { Tag } from './components/Tag';
export type { TagProps } from './components/Tag';
export { Skeleton } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';
export { Icon } from './components/Icon';
export type { IconProps } from './components/Icon';
export { Image } from './components/Image';
export type { ImageProps, ImagePreviewConfig } from './components/Image';
export { Flex } from './components/Flex';
export type { FlexProps } from './components/Flex';
export { Breadcrumb, BreadcrumbItem } from './components/Breadcrumb';
export type {
  BreadcrumbProps,
  BreadcrumbItemProps,
} from './components/Breadcrumb';
export { Disclosure } from './components/Disclosure';
export type { DisclosureProps } from './components/Disclosure';
export { Menu, MenuItem, MenuCheckboxItem, MenuRadioGroup, MenuRadioItem, MenuGroup, MenuDivider, MenuSub, MenuSubTrigger, MenuSubContent } from './components/Menu';
export type { MenuProps, MenuDataItem, MenuItemProps, MenuCheckboxItemProps, MenuRadioGroupProps, MenuRadioItemProps, MenuGroupProps, MenuSubProps, MenuSubTriggerProps, MenuSubContentProps } from './components/Menu';
export { NumberInput, NumberInputCore } from './components/NumberInput';
export type { NumberInputProps, NumberInputCoreProps } from './components/NumberInput';
export { FileInput } from './components/FileInput';
export type { FileInputProps } from './components/FileInput';
export { Toast, ToastContainer, useToast, toast } from './components/Toast';
export type { ToastProps, ToastContainerProps, ToastOptions, ToastVariant, ToastAction, ToastClassNames } from './components/Toast';
export { List, ListItem } from './components/List';
export type { ListProps, ListItemProps } from './components/List';
export { Combobox, ComboboxOption, ComboboxGroup } from './components/Combobox';
export type { ComboboxProps, ComboboxOptionProps, ComboboxGroupProps, ComboboxOptionData, ComboboxVirtualizedConfig } from './components/Combobox';
export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from './components/Table';
export type {
  TableProps,
  TableHeadProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
} from './components/Table';
export { Carousel, CarouselSlide } from './components/Carousel';
export type { CarouselProps, CarouselSlideProps } from './components/Carousel';
export { Datepicker, DatepickerCore } from './components/Datepicker';
export type { DatepickerProps, DatepickerCoreProps, DatepickerPreset } from './components/Datepicker';
export { Tree, SortableTree } from './components/Tree';
export type { TreeProps, TreeNodeData, SortableTreeProps, SortableTreeMoveInfo } from './components/Tree';
export { TreeSelect } from './components/TreeSelect';
export type { TreeSelectProps } from './components/TreeSelect';

export { Divider } from './components/Divider';
export type { DividerProps } from './components/Divider';
export { Spinner } from './components/Spinner';
export type { SpinnerProps } from './components/Spinner';
export { Empty } from './components/Empty';
export type { EmptyProps } from './components/Empty';
export { Result } from './components/Result';
export type { ResultProps, ResultStatus } from './components/Result';
export { Progress } from './components/Progress';
export type { ProgressProps } from './components/Progress';
export { Pagination } from './components/Pagination';
export type { PaginationProps } from './components/Pagination';
export { Grid, GridItem } from './components/Grid';
export type { GridProps, GridItemProps } from './components/Grid';
export { Drawer } from './components/Drawer';
export type { DrawerProps, DrawerHandle } from './components/Drawer';

export { Stepper, Step } from './components/Stepper';
export type { StepperProps, StepProps } from './components/Stepper';
export { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandDialog } from './components/Command';
export type { CommandProps, CommandInputProps, CommandListProps, CommandItemProps, CommandGroupProps, CommandDialogProps } from './components/Command';
export { ResizableGroup, ResizablePanel, ResizableHandle } from './components/Resizable';
export type { ResizableGroupProps, ResizablePanelProps, ResizableHandleProps } from './components/Resizable';
export {
  SplitterGroup,
  SplitterPanel,
  SplitterHandle,
} from './components/Resizable';
export type {
  ResizableGroupProps as SplitterGroupProps,
  ResizablePanelProps as SplitterPanelProps,
  ResizableHandleProps as SplitterHandleProps,
} from './components/Resizable';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './components/Collapsible';
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps, CollapsibleClassNames } from './components/Collapsible';
export { Transfer, TransferCore } from './components/Transfer';
export type { TransferProps, TransferItem, TransferCoreProps } from './components/Transfer';
export { Upload, UploadCore } from './components/Upload';
export type { UploadProps, UploadCoreProps, UploadHandle, UploadStatus, UploadFile, UploadValueItem, UploadFileStatus, UploadRequest, UploadRequestOptions, UploadListItemActions, UploadListItemRender } from './components/Upload';
export { ColorPicker, ColorPickerCore } from './components/ColorPicker';
export type { ColorPickerProps, ColorPickerCoreProps } from './components/ColorPicker';
export { Rating, RatingCore } from './components/Rating';
export type { RatingProps, RatingCoreProps } from './components/Rating';
export { Timeline, TimelineItem } from './components/Timeline';
export type { TimelineProps, TimelineItemProps } from './components/Timeline';

export { Title, Text, Paragraph } from './components/Typography';
export type { TitleProps, TextProps, ParagraphProps, TextEllipsis } from './components/Typography';
export { Stat, StatGroup } from './components/Stat';
export { Ellipsis } from './components/Ellipsis';
export type { EllipsisProps } from './components/Ellipsis';
export { CountUp } from './components/CountUp';
export type { CountUpProps } from './components/CountUp';
export type { StatProps, StatGroupProps } from './components/Stat';
export { Segmented, SegmentedCore } from './components/Segmented';
export type { SegmentedProps, SegmentedCoreProps } from './components/Segmented';
export { Chip } from './components/Chip';
export type { ChipProps } from './components/Chip';
export { ScrollArea } from './components/ScrollArea';
export type { ScrollAreaProps } from './components/ScrollArea';
export { TimePicker, TimePickerCore } from './components/TimePicker';
export type { TimePickerProps, TimePickerCoreProps, TimeParts, TimePickerFormat } from './components/TimePicker';
export { DateRangePicker, DateRangePickerCore } from './components/DateRangePicker';
export type { DateRangePickerProps, DateRangePickerCoreProps, DateRangePickerPreset, DateRangePickerPresets } from './components/DateRangePicker';
export { OTPInput, OTPInputCore } from './components/OTPInput';
export type { OTPInputProps, OTPInputCoreProps } from './components/OTPInput';
export { PasswordInput, PasswordInputCore } from './components/PasswordInput';
export type { PasswordInputProps, PasswordInputCoreProps } from './components/PasswordInput';
export { TagInput, TagInputCore, SortableTagInput, SortableTagInputCore } from './components/TagInput';
export type { TagInputProps, TagInputCoreProps, SortableTagInputProps, SortableTagInputCoreProps } from './components/TagInput';
export { Mentions, MentionsCore } from './components/Mentions';
export type { MentionsProps, MentionsCoreProps, MentionsOption } from './components/Mentions';
export { PromptInput } from './components/PromptInput';
export type { PromptInputProps } from './components/PromptInput';
export { InlineEdit } from './components/InlineEdit';
export type { InlineEditProps } from './components/InlineEdit';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './components/DropdownMenu';
export type { DropdownMenuProps, DropdownMenuDataItem, DropdownMenuTriggerProps, DropdownMenuContentProps, DropdownMenuItemProps, DropdownMenuCheckboxItemProps, DropdownMenuRadioGroupProps, DropdownMenuRadioItemProps, DropdownMenuGroupProps, DropdownMenuSeparatorProps, DropdownMenuSubProps, DropdownMenuSubTriggerProps, DropdownMenuSubContentProps, DropdownMenuHandle } from './components/DropdownMenu';
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from './components/ContextMenu';
export type { ContextMenuProps, ContextMenuTriggerProps, ContextMenuContentProps, ContextMenuItemProps, ContextMenuSeparatorProps } from './components/ContextMenu';
export { NavigationBar, NavLink } from './components/NavigationBar';
export type { NavigationBarProps, NavLinkProps } from './components/NavigationBar';
export { BackToTop } from './components/BackToTop';
export type { BackToTopProps } from './components/BackToTop';
export { Affix } from './components/Affix';
export type { AffixProps } from './components/Affix';
export { Container } from './components/Container';
export type { ContainerProps } from './components/Container';
export { Banner } from './components/Banner';
export type { BannerProps } from './components/Banner';
export { ConfirmDialog } from './components/ConfirmDialog';
export type { ConfirmDialogProps } from './components/ConfirmDialog';
export { CodeBlock } from './components/CodeBlock';
export type { CodeBlockProps, Highlighter } from './components/CodeBlock';
export { AspectRatio } from './components/AspectRatio';
export type { AspectRatioProps } from './components/AspectRatio';
export { VirtualList } from './components/VirtualList';
export type { VirtualListProps, VirtualListHandle, VirtualListGroup, VirtualListAlign, VirtualListOrientation } from './components/VirtualList';
export { TagGroup, TagGroupItem, SortableTagGroup } from './components/TagGroup';
export type { TagGroupProps, TagGroupItemProps, SortableTagGroupProps } from './components/TagGroup';
export { BottomSheet } from './components/BottomSheet';
export type { BottomSheetProps, BottomSheetHandle } from './components/BottomSheet';
export { SwipeAction } from './components/SwipeAction';
export type { SwipeActionProps } from './components/SwipeAction';

// i18n
export { default as LocaleProvider, useStrings } from './components/LocaleProvider';
export { defaultStrings, enUS, zhCN, jaJP, deDE, frFR, esES, itIT, ptBR, ruRU, koKR, arSA, createStrings } from './components/LocaleProvider';
export type { LocaleProviderProps, HazeStrings } from './components/LocaleProvider';
export type { DeepPartial } from './components/LocaleProvider';

// component default overrides (AntD-v6-ConfigProvider shape, defaults only)
export { default as ConfigProvider, useConfigDefaults } from './components/ConfigProvider';
export type { ConfigProviderProps, HazeConfig } from './components/ConfigProvider';

// direction (RTL): declared intent from the LocaleProvider chain and
// layout truth read off the DOM — see utils/direction.ts
export { useDirection, getDirection, localeDirection } from './utils/direction';
export type { Direction } from './utils/direction';

// data table (TanStack headless + haze styles)
export { DataTable, dataTableSum, dataTableAvg, dataTableCount, dataTableToCsv } from './components/DataTable';
export type {
  DataTableProps,
  DataTableColumnDef,
  DataTableColumnMeta,
  DataTableVirtualized,
  DataTableSummary,
  DataTableSummaryCell,
  DataTableCellEditorProps,
  DataTableCsvOptions,
} from './components/DataTable';

// chart (recharts dependency + haze tokens)
export { Chart } from './components/Chart';
export type { ChartProps, ChartSeries, ChartType, ChartTooltipPayload, ChartTooltipEntry } from './components/Chart';

// display & overlay additions
export { Kbd } from './components/Kbd';
export type { KbdProps } from './components/Kbd';
export { AvatarGroup } from './components/AvatarGroup';
export type { AvatarGroupProps } from './components/AvatarGroup';
export { Calendar } from './components/Calendar';
export type {
  CalendarProps,
  CalendarPickerMode,
  CalendarCellRender,
} from './components/Calendar';
export { HoverCard } from './components/HoverCard';
export type { HoverCardProps } from './components/HoverCard';
export { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarToggle } from './components/Toolbar';
export type { ToolbarProps, ToolbarButtonProps, ToolbarSeparatorProps, ToolbarToggleProps } from './components/Toolbar';
export { AppShell } from './components/AppShell';
export type { AppShellProps } from './components/AppShell';
export { Cascader } from './components/Cascader';
export type { CascaderProps, CascaderOption } from './components/Cascader';
export { Sidebar, SidebarGroup, SidebarItem, SidebarFooter, SidebarToggle } from './components/Sidebar';
export type {
  SidebarProps,
  SidebarGroupProps,
  SidebarItemProps,
  SidebarFooterProps,
  SidebarToggleProps,
} from './components/Sidebar';
export { Tour } from './components/Tour';
export type { TourProps, TourStep, TourCloseReason, TourPlacement } from './components/Tour';
export { Anchor } from './components/Anchor';
export type { AnchorProps, AnchorItem } from './components/Anchor';
export { Watermark } from './components/Watermark';
export type { WatermarkProps, WatermarkFont } from './components/Watermark';
export { Fullscreen } from './components/Fullscreen';
export type { FullscreenProps } from './components/Fullscreen';

// agent components
export { ChatMessage } from './components/ChatMessage';
export type { ChatMessageProps, ChatMessageRole } from './components/ChatMessage';
export { ChatContainer } from './components/ChatContainer';
export type { ChatContainerProps } from './components/ChatContainer';
export { ChatInput } from './components/ChatInput';
export type { ChatInputProps } from './components/ChatInput';
export { StreamingText } from './components/StreamingText';
export type { StreamingTextProps } from './components/StreamingText';
export { MarkdownRenderer } from './components/MarkdownRenderer';
export type { MarkdownRendererProps } from './components/MarkdownRenderer';
export { ToolCallCard } from './components/ToolCallCard';
export type { ToolCallCardProps, ToolCallStatus } from './components/ToolCallCard';
export { ThinkingIndicator } from './components/ThinkingIndicator';
export type { ThinkingIndicatorProps } from './components/ThinkingIndicator';
export { StepTimeline, StepTimelineItem } from './components/StepTimeline';
export type { StepTimelineProps, StepTimelineItemProps, StepStatus } from './components/StepTimeline';
export { ApprovalCard } from './components/ApprovalCard';
export type { ApprovalCardProps } from './components/ApprovalCard';
export { TokenCounter } from './components/TokenCounter';
export type { TokenCounterProps } from './components/TokenCounter';
export { ModelPicker } from './components/ModelPicker';
export type { ModelPickerProps, ModelOption } from './components/ModelPicker';
export { ConversationList, ConversationItem } from './components/ConversationList';
export type { ConversationListProps, ConversationItemProps } from './components/ConversationList';
export { DiffViewer } from './components/DiffViewer';
export type { DiffViewerProps, DiffLine } from './components/DiffViewer';
export { LogViewer } from './components/LogViewer';
export type { LogViewerProps, LogEntry, LogLevel } from './components/LogViewer';
export { AsyncSection } from './components/AsyncSection';
export type { AsyncSectionProps } from './components/AsyncSection';

// data display & ai/chat additions (wave 5)
export { Descriptions } from './components/Descriptions';
export type { DescriptionsProps, DescriptionsItem } from './components/Descriptions';
export { JsonView } from './components/JsonView';
export type { JsonViewProps, MoreLabelFn } from './components/JsonView';
export { QRCode } from './components/QRCode';
export type { QRCodeProps, QRCodeLevel } from './components/QRCode';
export { Sources } from './components/Sources';
export type { SourcesProps, SourceItem } from './components/Sources';
export { FilePreview } from './components/FilePreview';
export type { FilePreviewProps, FilePreviewFile, FilePreviewStatus } from './components/FilePreview';
export { InlineCompletion } from './components/InlineCompletion';
export type { InlineCompletionProps } from './components/InlineCompletion';

// layout, navigation & forms additions (wave 5)
export { FloatButton, FloatButtonGroup } from './components/FloatButton';
export type { FloatButtonProps, FloatButtonGroupProps } from './components/FloatButton';
export { Masonry } from './components/Masonry';
export type { MasonryProps } from './components/Masonry';
export { Signature } from './components/Signature';
export type { SignatureProps } from './components/Signature';

// hooks
export {
  useTitle,
  useMediaQuery,
  usePrefersReducedMotion,
  useDebouncedValue,
  useDebouncedCallback,
  useDarkMode,
  useClipboard,
  useFullscreen,
} from './hooks';
export type { UseClipboardResult } from './hooks';
export type { FullscreenTarget, UseFullscreenHandle } from './hooks';
export type { ColorMode, UseDarkModeOptions, UseDarkModeResult } from './hooks';
export { useHotkeys, hotkey, useInView, useLocalStorage, useSessionStorage } from './hooks';
export type { HotkeyHandler, UseHotkeysOptions, UseInViewOptions } from './hooks';
export { useClickOutside } from './hooks';
export type { UseClickOutsideOptions } from './hooks';
export { usePrevious } from './hooks';

// form integration (react-f0rm, a regular dependency)
export {
  FormItem,
  FormList,
  // context layer + imperative form APIs re-exported so consumers of
  // `haze-ui` never need to import react-f0rm directly
  FormProvider,
  useFormContext,
  useFieldArray,
  useFieldArrayItem,
  useWatch,
  trigger,
  setFocus,
  setServerErrors,
  setValue,
  getValue,
  getValues,
  reset,
  // schema resolvers (react-f0rm subpath re-exports)
  hasStandardProps,
  standardSchemaFormValidator,
  standardSchemaResolver,
  zodResolver,
} from './form';
export type {
  FieldValidator,
  FormItemAsProps,
  FormItemBinding,
  FormItemOwnProps,
  FormItemProps,
  FormItemRawElement,
  FormItemRawElementBinding,
  FormInstance,
  FormListProps,
  FormListBinding,
  FormListField,
  PathValueOf,
  StandardSchemaV1,
} from './form';

// re-export ecosystem utilities
export { useControl } from 'react-use-control';
export type { Control, ControlOrValue } from 'react-use-control';
