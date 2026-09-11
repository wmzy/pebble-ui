/*
 * Demo 侧边栏的组件分组，按 9 组组织全部组件（后续 llms.txt 复用同一份）。
 *
 * 数据契约：与 src/generated/props.json 对账——每个 component 的 routeKey
 * 必须恰好归入一组，不重不漏。assertGroupCoverage() 在模块加载时执行，
 * props.json 新增组件而分组未同步时，文档站启动即 throw，而不是静默漏掉
 * 导航入口。'form'（FormItem）有 demo 路由但无 props.json 条目，作为已知
 * 附加项不参与对账。
 */

import generatedProps from '@/generated/props.json';

export type ComponentItem = { name: string; route: string };
export type ComponentGroup = { group: string; items: ComponentItem[] };

export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    group: 'General',
    items: [
      { name: 'Avatar', route: 'avatar' },
      { name: 'AvatarGroup', route: 'avatar-group' },
      { name: 'Badge', route: 'badge' },
      { name: 'Button', route: 'button' },
      { name: 'Divider', route: 'divider' },
      { name: 'Icon', route: 'icon' },
      { name: 'Tag', route: 'tag' },
      { name: 'TagGroup', route: 'tag-group' },
      { name: 'Typography', route: 'typography' },
      { name: 'Ellipsis', route: 'ellipsis' },
      { name: 'CountUp', route: 'count-up' },
    ],
  },
  {
    group: 'Layout',
    items: [
      { name: 'AspectRatio', route: 'aspect-ratio' },
      { name: 'AppShell', route: 'app-shell' },
      { name: 'Container', route: 'container' },
      { name: 'Flex', route: 'flex' },
      { name: 'Grid', route: 'grid' },
      { name: 'Masonry', route: 'masonry' },
      { name: 'Resizable', route: 'resizable' },
      { name: 'ScrollArea', route: 'scroll-area' },
      { name: 'Sidebar', route: 'sidebar' },
    ],
  },
  {
    group: 'Forms',
    items: [
      { name: 'Cascader', route: 'cascader' },
      { name: 'Checkbox', route: 'checkbox' },
      { name: 'ColorPicker', route: 'color-picker' },
      { name: 'Combobox', route: 'combobox' },
      { name: 'Datepicker', route: 'datepicker' },
      { name: 'DateRangePicker', route: 'date-range-picker' },
      { name: 'FileInput', route: 'file-input' },
      { name: 'Form', route: 'form' },
      { name: 'InlineEdit', route: 'inline-edit' },
      { name: 'Input', route: 'input' },
      { name: 'Mentions', route: 'mentions' },
      { name: 'NumberInput', route: 'number-input' },
      { name: 'OTPInput', route: 'otp-input' },
      { name: 'PasswordInput', route: 'password-input' },
      { name: 'Radio', route: 'radio' },
      { name: 'Rating', route: 'rating' },
      { name: 'Segmented', route: 'segmented' },
      { name: 'Select', route: 'select' },
      { name: 'Signature', route: 'signature' },
      { name: 'Slider', route: 'slider' },
      { name: 'Switch', route: 'switch' },
      { name: 'TagInput', route: 'tag-input' },
      { name: 'Textarea', route: 'textarea' },
      { name: 'TimePicker', route: 'time-picker' },
      { name: 'Toggle', route: 'toggle' },
      { name: 'Transfer', route: 'transfer' },
      { name: 'TreeSelect', route: 'tree-select' },
      { name: 'Upload', route: 'upload' },
    ],
  },
  {
    group: 'Overlays',
    items: [
      { name: 'BottomSheet', route: 'bottom-sheet' },
      { name: 'ConfirmDialog', route: 'confirm-dialog' },
      { name: 'ContextMenu', route: 'context-menu' },
      { name: 'Dialog', route: 'dialog' },
      { name: 'Drawer', route: 'drawer' },
      { name: 'DropdownMenu', route: 'dropdown-menu' },
      { name: 'HoverCard', route: 'hover-card' },
      { name: 'Menu', route: 'menu' },
      { name: 'Popover', route: 'popover' },
      { name: 'Tooltip', route: 'tooltip' },
    ],
  },
  {
    group: 'Data Display',
    items: [
      { name: 'Accordion', route: 'accordion' },
      { name: 'Calendar', route: 'calendar' },
      { name: 'Card', route: 'card' },
      { name: 'Carousel', route: 'carousel' },
      { name: 'Chart', route: 'chart' },
      { name: 'Chip', route: 'chip' },
      { name: 'CodeBlock', route: 'code-block' },
      { name: 'DataTable', route: 'data-table' },
      { name: 'Descriptions', route: 'descriptions' },
      { name: 'Image', route: 'image' },
      { name: 'JsonView', route: 'json-view' },
      { name: 'Kbd', route: 'kbd' },
      { name: 'List', route: 'list' },
      { name: 'Progress', route: 'progress' },
      { name: 'QRCode', route: 'qr-code' },
      { name: 'Stat', route: 'stat' },
      { name: 'Table', route: 'table' },
      { name: 'Timeline', route: 'timeline' },
      { name: 'Tree', route: 'tree' },
      { name: 'VirtualList', route: 'virtual-list' },
      { name: 'Watermark', route: 'watermark' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { name: 'Affix', route: 'affix' },
      { name: 'Anchor', route: 'anchor' },
      { name: 'BackToTop', route: 'back-to-top' },
      { name: 'Breadcrumb', route: 'breadcrumb' },
      { name: 'Command', route: 'command' },
      { name: 'FloatButton', route: 'float-button' },
      { name: 'NavigationBar', route: 'navigation-bar' },
      { name: 'Pagination', route: 'pagination' },
      { name: 'Stepper', route: 'stepper' },
      { name: 'Tabs', route: 'tabs' },
      { name: 'Toolbar', route: 'toolbar' },
      { name: 'Tour', route: 'tour' },
    ],
  },
  {
    group: 'Feedback',
    items: [
      { name: 'Alert', route: 'alert' },
      { name: 'AsyncSection', route: 'async-section' },
      { name: 'Banner', route: 'banner' },
      { name: 'Empty', route: 'empty' },
      { name: 'Result', route: 'result' },
      { name: 'Skeleton', route: 'skeleton' },
      { name: 'Spinner', route: 'spinner' },
      { name: 'Toast', route: 'toast' },
    ],
  },
  {
    group: 'AI & Chat',
    items: [
      { name: 'ApprovalCard', route: 'approval-card' },
      { name: 'ChatContainer', route: 'chat-container' },
      { name: 'ChatInput', route: 'chat-input' },
      { name: 'ChatMessage', route: 'chat-message' },
      { name: 'ConversationList', route: 'conversation-list' },
      { name: 'DiffViewer', route: 'diff-viewer' },
      { name: 'FilePreview', route: 'file-preview' },
      { name: 'InlineCompletion', route: 'inline-completion' },
      { name: 'LogViewer', route: 'log-viewer' },
      { name: 'MarkdownRenderer', route: 'markdown-renderer' },
      { name: 'ModelPicker', route: 'model-picker' },
      { name: 'PromptInput', route: 'prompt-input' },
      { name: 'Sources', route: 'sources' },
      { name: 'StepTimeline', route: 'step-timeline' },
      { name: 'StreamingText', route: 'streaming-text' },
      { name: 'ThinkingIndicator', route: 'thinking-indicator' },
      { name: 'TokenCounter', route: 'token-counter' },
      { name: 'ToolCallCard', route: 'tool-call-card' },
    ],
  },
  {
    group: 'Utilities',
    items: [
      { name: 'Collapsible', route: 'collapsible' },
      { name: 'Disclosure', route: 'disclosure' },
      { name: 'Fullscreen', route: 'fullscreen' },
      { name: 'LocaleProvider', route: 'locale-provider' },
      { name: 'SwipeAction', route: 'swipe-action' },
    ],
  },
];

/*
 * 搜索别名：route → 常见叫法。评分时与组件名同权参与四档匹配
 * （见 ./search-score.ts），让 "modal" 也能搜出 Dialog。
 */
export const ALIASES: Record<string, string[]> = {
  dialog: ['modal', 'popup'],
  popover: ['floating'],
  tooltip: ['hint'],
  combobox: ['autocomplete', 'search'],
  'data-table': ['tanstack'],
  drawer: ['panel'],
  'bottom-sheet': ['sheet', 'mobile'],
  tour: ['onboarding', 'guide'],
  toast: ['notification', 'snackbar'],
  banner: ['callout'],
  alert: ['message'],
  kbd: ['shortcut', 'hotkey'],
  'otp-input': ['pin', 'verification'],
  upload: ['drag', 'drop'],
  transfer: ['shuttle'],
  'virtual-list': ['virtual', 'windowing'],
  'json-view': ['json', 'tree'],
  masonry: ['columns', 'waterfall'],
  'float-button': ['fab'],
  signature: ['handwriting', 'pad'],
  sources: ['citations', 'rag'],
  anchor: ['toc', 'scrollspy'],
  watermark: ['copyright'],
  fullscreen: ['maximize', 'immersive'],
};

/*
 * routeKey 与 demo 路由同源：props.json 的 routeKey 由
 * scripts/generate-props.mjs 以 kebab(dirName) 生成，与本表的 route
 * （kebab(name)）天然一致，无需换算表——旧版「小写连写 vs kebab」分歧
 * （如 datatable vs data-table）已随 kebab 统一消除。
 */

/**
 * 运行时守卫：props.json 里每个 component 恰好归入一组（不重不漏）、
 * 所有 route 全局唯一且为 kebab-case、ALIASES 的键都能对上某个 route。
 * 违反即 throw。
 */
export function assertGroupCoverage(): void {
  const counts = new Map<string, number>();
  for (const group of COMPONENT_GROUPS) {
    for (const item of group.items) {
      counts.set(item.route, (counts.get(item.route) ?? 0) + 1);
    }
  }

  for (const [route, count] of counts) {
    if (count > 1) {
      throw new Error(
        `component-groups: route "${route}" appears ${count} times across groups`
      );
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(route)) {
      throw new Error(
        `component-groups: route "${route}" is not kebab-case`
      );
    }
  }

  for (const entry of Object.values(generatedProps.components)) {
    const count = counts.get(entry.routeKey) ?? 0;
    if (count !== 1) {
      throw new Error(
        `component-groups: props.json component "${entry.routeKey}" is covered ${count} times, expected exactly 1`
      );
    }
  }

  for (const route of Object.keys(ALIASES)) {
    if (!counts.has(route)) {
      throw new Error(
        `component-groups: alias key "${route}" matches no component route`
      );
    }
  }
}

assertGroupCoverage();
