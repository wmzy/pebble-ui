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
      { name: 'AvatarGroup', route: 'avatargroup' },
      { name: 'Badge', route: 'badge' },
      { name: 'Button', route: 'button' },
      { name: 'Divider', route: 'divider' },
      { name: 'Icon', route: 'icon' },
      { name: 'Tag', route: 'tag' },
      { name: 'TagGroup', route: 'taggroup' },
      { name: 'Typography', route: 'typography' },
    ],
  },
  {
    group: 'Layout',
    items: [
      { name: 'AspectRatio', route: 'aspectratio' },
      { name: 'AppShell', route: 'appshell' },
      { name: 'Container', route: 'container' },
      { name: 'Flex', route: 'flex' },
      { name: 'Grid', route: 'grid' },
      { name: 'Resizable', route: 'resizable' },
      { name: 'ScrollArea', route: 'scrollarea' },
      { name: 'Sidebar', route: 'sidebar' },
    ],
  },
  {
    group: 'Forms',
    items: [
      { name: 'Cascader', route: 'cascader' },
      { name: 'Checkbox', route: 'checkbox' },
      { name: 'ColorPicker', route: 'colorpicker' },
      { name: 'Combobox', route: 'combobox' },
      { name: 'Datepicker', route: 'datepicker' },
      { name: 'DateRangePicker', route: 'daterangepicker' },
      { name: 'FileInput', route: 'fileinput' },
      { name: 'Form', route: 'form' },
      { name: 'InlineEdit', route: 'inlineedit' },
      { name: 'Input', route: 'input' },
      { name: 'Mentions', route: 'mentions' },
      { name: 'NumberInput', route: 'numberinput' },
      { name: 'OTPInput', route: 'otpinput' },
      { name: 'PasswordInput', route: 'passwordinput' },
      { name: 'Radio', route: 'radio' },
      { name: 'Rating', route: 'rating' },
      { name: 'Segmented', route: 'segmented' },
      { name: 'Select', route: 'select' },
      { name: 'Slider', route: 'slider' },
      { name: 'Switch', route: 'switch' },
      { name: 'TagInput', route: 'taginput' },
      { name: 'Textarea', route: 'textarea' },
      { name: 'TimePicker', route: 'timepicker' },
      { name: 'Toggle', route: 'toggle' },
      { name: 'Transfer', route: 'transfer' },
      { name: 'Upload', route: 'upload' },
    ],
  },
  {
    group: 'Overlays',
    items: [
      { name: 'BottomSheet', route: 'bottomsheet' },
      { name: 'ConfirmDialog', route: 'confirmdialog' },
      { name: 'ContextMenu', route: 'contextmenu' },
      { name: 'Dialog', route: 'dialog' },
      { name: 'Drawer', route: 'drawer' },
      { name: 'DropdownMenu', route: 'dropdownmenu' },
      { name: 'HoverCard', route: 'hovercard' },
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
      { name: 'CodeBlock', route: 'codeblock' },
      { name: 'DataTable', route: 'data-table' },
      { name: 'Image', route: 'image' },
      { name: 'Kbd', route: 'kbd' },
      { name: 'List', route: 'list' },
      { name: 'Progress', route: 'progress' },
      { name: 'Stat', route: 'stat' },
      { name: 'Table', route: 'table' },
      { name: 'Timeline', route: 'timeline' },
      { name: 'Tree', route: 'tree' },
      { name: 'VirtualList', route: 'virtuallist' },
      { name: 'Watermark', route: 'watermark' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { name: 'Affix', route: 'affix' },
      { name: 'Anchor', route: 'anchor' },
      { name: 'BackToTop', route: 'backtotop' },
      { name: 'Breadcrumb', route: 'breadcrumb' },
      { name: 'Command', route: 'command' },
      { name: 'NavigationBar', route: 'navigationbar' },
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
      { name: 'AsyncSection', route: 'asyncsection' },
      { name: 'Banner', route: 'banner' },
      { name: 'Empty', route: 'empty' },
      { name: 'Skeleton', route: 'skeleton' },
      { name: 'Spinner', route: 'spinner' },
      { name: 'Toast', route: 'toast' },
    ],
  },
  {
    group: 'AI & Chat',
    items: [
      { name: 'ApprovalCard', route: 'approvalcard' },
      { name: 'ChatContainer', route: 'chatcontainer' },
      { name: 'ChatInput', route: 'chatinput' },
      { name: 'ChatMessage', route: 'chatmessage' },
      { name: 'ConversationList', route: 'conversationlist' },
      { name: 'DiffViewer', route: 'diffviewer' },
      { name: 'LogViewer', route: 'logviewer' },
      { name: 'MarkdownRenderer', route: 'markdownrenderer' },
      { name: 'ModelPicker', route: 'modelpicker' },
      { name: 'PromptInput', route: 'promptinput' },
      { name: 'StepTimeline', route: 'steptimeline' },
      { name: 'StreamingText', route: 'streamingtext' },
      { name: 'ThinkingIndicator', route: 'thinkingindicator' },
      { name: 'TokenCounter', route: 'tokencounter' },
      { name: 'ToolCallCard', route: 'toolcallcard' },
    ],
  },
  {
    group: 'Utilities',
    items: [
      { name: 'Collapsible', route: 'collapsible' },
      { name: 'Disclosure', route: 'disclosure' },
      { name: 'Fullscreen', route: 'fullscreen' },
      { name: 'LocaleProvider', route: 'localeprovider' },
      { name: 'SwipeAction', route: 'swipeaction' },
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
  bottomsheet: ['sheet', 'mobile'],
  tour: ['onboarding', 'guide'],
  toast: ['notification', 'snackbar'],
  banner: ['callout'],
  alert: ['message'],
  kbd: ['shortcut', 'hotkey'],
  otpinput: ['pin', 'verification'],
  upload: ['drag', 'drop'],
  transfer: ['shuttle'],
  virtuallist: ['virtual', 'windowing'],
  anchor: ['toc', 'scrollspy'],
  watermark: ['copyright'],
  fullscreen: ['maximize', 'immersive'],
};

/*
 * props.json 的 routeKey 与 demo 路由的已知分歧：DataTable 的 routeKey 是
 * 'datatable'（小写连写），而 ComponentDetail 的 demos 注册表与侧边栏链接
 * 用 'data-table'（kebab）。对账时按此表换算。
 */
const ROUTE_FOR_ROUTE_KEY: Record<string, string> = {
  datatable: 'data-table',
};

/**
 * 运行时守卫：props.json 里每个 component 恰好归入一组（不重不漏）、
 * 所有 route 全局唯一、ALIASES 的键都能对上某个 route。违反即 throw。
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
  }

  for (const entry of Object.values(generatedProps.components)) {
    const route = ROUTE_FOR_ROUTE_KEY[entry.routeKey] ?? entry.routeKey;
    const count = counts.get(route) ?? 0;
    if (count !== 1) {
      throw new Error(
        `component-groups: props.json component "${entry.routeKey}" (route "${route}") is covered ${count} times, expected exactly 1`
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
