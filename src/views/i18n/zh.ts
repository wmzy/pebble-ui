/*
 * 简体中文词典：en.ts 的 DeepPartial 覆盖层。缺键在渲染时回退英文
 * （./index.tsx 的 mergeStrings），因此本文件只写已翻译的键——
 * 新增键必须先存在于 en.ts，奇偶校验见 i18n.test.tsx。
 */

import type { DeepPartial, SiteStrings } from './en';

export const zh: DeepPartial<SiteStrings> = {
  chrome: {
    openNavigation: '打开导航',
    light: '浅色',
    dark: '深色',
    auto: '自动',
    language: '切换语言',
    noCustomTheme: '无自定义主题',
    themeEditor: '主题编辑器',
    viewSourceAt: '查看 {version}（{commit}）的源码',
    viewSource: '在 GitHub 查看源码',
    starOnGitHub: 'GitHub 加星',
    search: '搜索',
    searchComponents: '搜索组件',
    searchPlaceholder: '搜索组件…',
    clearSearch: '清除搜索',
    noComponentsMatch: '没有匹配“{query}”的组件',
    noResultsMatch: '没有匹配“{query}”的结果',
    docs: '文档',
  },
  nav: {
    home: '首页',
    gettingStarted: '快速上手',
    recipes: '实战示例',
    guides: '指南',
    tokens: '设计令牌',
    components: '组件',
    overview: '总览',
    aiShowcase: 'AI 演示',
    themeEditor: '主题编辑器',
    changelog: '更新日志',
    help: '帮助',
    about: '关于',
  },
  guides: {
    darkMode: '深色模式',
    density: '密度（紧凑）',
    a11y: '无障碍',
    migration: '从 AntD / shadcn 迁移',
    streamingA11y: '流式无障碍',
    motion: '动效预设',
  },
  guideSummaries: {
    darkMode: '明暗两套 token 类、useDarkMode 钩子与运行时品牌主题。',
    density: '通过密度 token 在紧凑与宽松间距之间整体切换。',
    a11y: '键盘、读屏与 WCAG 实践内建于每个组件。',
    migration: '从 AntD / shadcn/ui 迁移到 haze-ui 的对照与步骤。',
    streamingA11y: '流式 AI 输出的无障碍：实时区域、播报与减少动效。',
    motion: '基于 data-state 的进出场动画预设，挂在动效 token 之上。',
  },
  componentGroups: {
    General: '通用',
    Layout: '布局',
    Forms: '表单',
    Overlays: '浮层',
    'Data Display': '数据展示',
    Navigation: '导航',
    Feedback: '反馈',
    'AI & Chat': 'AI 与聊天',
    Utilities: '工具',
  },
  components: {
    // General
    Avatar: '用户头像：支持图片、多种尺寸，以及图片缺失时的回退内容。',
    AvatarGroup:
      '头像堆叠：层叠排列，超出部分以 +N 溢出角标展示（max/total）。',
    Badge: '小型内联状态标签，支持变体与颜色。',
    Button: '操作按钮：variant/size/square 选项，底层为原生 <button>。',
    CountUp:
      '数字滚动动画：rAF + 缓动插值逼近目标值，prefers-reduced-motion 时瞬时落位。',
    Divider: '内容分隔线，可水平或垂直。',
    Ellipsis: '交互式文本截断：N 行钳制并检测溢出，可选提示与展开/收起。',
    Icon: '内联 SVG 图标封装，提供 sm/md/lg 令牌尺寸。',
    Tag: '紧凑状态标签：变体配色，可选关闭按钮。',
    TagGroup:
      'Tag 容器：自动换行、统一间距；sortable + onReorder 支持拖拽排序。',
    Typography: '文本原语：基于排版令牌的 Title、Text、Paragraph。',

    // Layout
    AspectRatio: '将子内容框定为固定宽高比。',
    AppShell:
      '应用外壳：吸顶页头、可折叠侧栏、内容与页脚插槽；768px 以下侧栏转为浮层。',
    Container: '居中的限宽页面容器，自带水平内边距。',
    Flex: 'Flexbox 布局原语，将 props 映射为 flex CSS。',
    Grid: 'CSS Grid 布局原语。',
    Masonry: '瀑布流布局：JS 贪心分配，先按顺序入列、再入最短列以保持平衡。',
    Resizable:
      '可拖拽分隔条的面板分组（ResizableGroup，支持水平/垂直）；另以 SplitterGroup/SplitterPanel/SplitterHandle 别名导出。',
    ScrollArea: '滚动区域：自定义细滚动条与 maxHeight。',
    Sidebar: '应用侧栏外壳，折叠状态可控（aside 与轨道宽度令牌）。',

    // Forms
    Cascader:
      '多级级联选择器：提交选项值路径；onSearch 远程筛选，loading 展示加载态。',
    Checkbox: '复选框，选中状态可控。',
    ColorPicker: '颜色选择器：取值可控，带预设色板。',
    Combobox: '自动补全输入框：可筛选的选项列表，onSearch 可将筛选交由宿主。',
    Datepicker:
      '日期输入：弹出日历（YYYY-MM-DD 取值），showTime 附加时刻选择。',
    DateRangePicker:
      '起止日期区间选择，内置或自定义快捷预设（今天、最近 7 天……）。',
    FileInput: '触发器元素，打开隐藏的原生文件输入。',
    Form: 'react-f0rm 字段包装：为受控内核补齐 label、错误与 aria 接线。',
    InlineEdit: '点击即原地编辑的文本值。',
    Input: '文本输入框：支持前后修饰，封装自 InputCore。',
    Mentions: '@提及输入：按触发字符从选项列表弹出建议。',
    NumberInput: '数字输入框，支持 min/max/step。',
    OTPInput: '一次性验证码输入：length 个分段字符格。',
    PasswordInput: '密码输入框，带明文切换。',
    Radio: '单选按钮与单选组，选中项可控。',
    Rating: '星级评分，支持半星。',
    Segmented: '分段控制器：在紧凑选项集中单选。',
    Select:
      '下拉选择：基于 SelectCore、以 <option> 为子元素；onSearch 启用服务端筛选。',
    Signature:
      '画板签名：每笔提交 PNG data URL，支持撤销与清空，无 canvas 时优雅降级提示。',
    Slider: '原生滑块，取值可控。',
    Switch: '开关（role="switch"），选中状态可控。',
    TagInput:
      '标签输入框：回车提交，基于 TagInputCore；sortable 开启拖拽排序（新顺序经 onChange 给出）。',
    Textarea: '多行文本输入。',
    TimePicker: '时刻输入框，取值可控。',
    Toggle:
      '两态按压按钮（aria-pressed）：多种尺寸与方形图标模式；ToolbarToggle 变体接入工具栏 roving focus。',
    Transfer: '双栏穿梭框：在源与目标列表间移动选项。',
    TreeSelect:
      '浮层面板中的树选择：行选中提交单键、级联复选提交 string[]；支持面板搜索、懒加载 loadData 与标签溢出。',
    Upload:
      '文件上传：File[] 累积取值，支持 accept/multiple、目录选择与 listType 呈现。',

    // Overlays
    BottomSheet: '移动端风格底部抽屉，自屏幕底缘滑入。',
    ConfirmDialog: '现成的确认对话框：确认/取消动作，带危险变体。',
    ContextMenu: '右键唤起的浮动菜单。',
    Dialog: '模态对话框，含焦点圈定。',
    Drawer: '贴边滑出面板（placement 左/右）。',
    DropdownMenu: '点击触发的浮动菜单。',
    HoverCard: '非模态悬浮预览（头像卡片、链接摘要），锚定于触发器。',
    Menu: '轻量切换菜单：触发器 + 静态定位面板（MenuItem、MenuDivider）。',
    Popover: '锚定于触发元素的浮动气泡。',
    Tooltip: '悬停/聚焦提示气泡。',

    // Data Display
    Accordion: '可折叠区块列表（AccordionItem 携 title）。',
    Calendar: '月历网格：min/max、locale 与 weekStartsOn 可配。',
    Card: '内容卡片：elevated/outlined/filled 变体。',
    Carousel: '轮播图：活动索引可控，支持自动播放。',
    Chart:
      '基于 recharts 的折线/面积/柱/饼图：配色与坐标轴走 haze 令牌，系列循环语义色板，renderTooltip 可定制提示。',
    Chip: '圆角状态芯片，可选图标与关闭按钮。',
    CodeBlock: '等宽代码容器：带语言徽标，highlight 可接入异步语法高亮器。',
    DataTable:
      '功能表格：基于 @tanstack/react-table（排序、行选择、本地或 manual 分页），dataTableToCsv 可导出行数据。',
    Descriptions:
      '描述列表组（CSS Grid 上的 dl/dt/dd）：items 键值对、columns、bordered、size。',
    Image: '图片：加载回退，aspectRatio/objectFit 可控。',
    JsonView:
      '可折叠 JSON 树：按类型着色、按深度默认展开、截断提示与可选复制按钮。',
    Kbd: '快捷键键帽样式。',
    List: '列表：ul/ol/无样式等多种变体。',
    Progress: '进度条/进度环，由百分比取值驱动。',
    QRCode:
      '二维码：以单条清晰 SVG 路径渲染，value/size/level/bordered 可配，模块与背景色走主题令牌。',
    Stat: '指标展示：标题、数值与趋势指示。',
    Table: '语义化表格（striped、bordered）。',
    Timeline: '垂直时间线容器，承载 TimelineItem 子项。',
    Tree: '层级树：展开/选中/勾选状态，异步 loadData 与 searchValue 过滤。',
    VirtualList: '虚拟列表：仅渲染可见行，支持固定或实测动态行高。',
    Watermark:
      '平铺画布水印层（可 fullscreen）：颜色随主题，无 canvas 2d 支持时优雅降级。',

    // Navigation
    Affix: '滚动越过阈值后将子内容固定到视口边缘。',
    Anchor:
      '滚动监听导航：items 列表高亮当前分区（IntersectionObserver，activeId 可控），点击带 offsetTop 滚动定位。',
    BackToTop: '回顶按钮：越过滚动阈值后浮现。',
    Breadcrumb: '面包屑导航，分隔符可配。',
    Command: '命令面板载体：CommandInput 加可筛选的 CommandItem。',
    FloatButton:
      '悬浮操作按钮；FloatButtonGroup 将动作收纳在展开触发器之后，内建回顶与帮助图标。',
    NavigationBar: '顶部导航栏：brand 与 end 插槽。',
    Pagination: '分页导航：page 可控，带省略号窗口。',
    Stepper: '步骤指示器，由 activeStep 驱动（Step 子项）。',
    Tabs: '选项卡面板切换，活动页签可控。',
    Toolbar:
      '工具栏按钮组：roving tabindex 无障碍（ToolbarButton、ToolbarSeparator）。',
    Tour: '引导漫游：聚光灯遮罩逐步讲解 steps，current 可控。',

    // Feedback
    Alert: '内联状态消息框。',
    AsyncSection: '声明式异步状态：loading / error / 内容三态。',
    Banner: '可关闭的顶部横幅：info/success/warning/danger 变体。',
    Empty: '空状态占位：插画与描述。',
    Result:
      '结果反馈页：状态插画（success/error/info/warning/403/404/500）、title、subTitle 与 extra 操作区；icon 可替换默认插画。',
    Skeleton: '闪烁加载占位（text/circular/rectangular）。',
    Spinner: '加载转圈。',
    Toast: '轻提示：useToast + ToastContainer（含命令式 toast() 辅助）。',

    // AI & Chat
    ApprovalCard: '审批卡：对代理发起的操作做出批准/拒绝。',
    ChatContainer: '聊天记录滚动容器：贴底自动滚动。',
    ChatInput: '消息输入器：取值可控，onSend 回调。',
    ChatMessage: '聊天气泡：按角色布局，含头像、名称、时间戳与投递状态。',
    ConversationList: '会话列表：聊天历史侧栏的可选中列表。',
    DiffViewer: '渲染新旧内容的行级差异，展示代理提议的编辑。',
    FilePreview: '附件卡片：图片缩略或扩展名徽标、上传进度与移除/重试。',
    InlineCompletion: '输入幽灵补全：Tab 采纳建议，Escape 关闭。',
    LogViewer: '可滚动日志流，按严重级别过滤。',
    MarkdownRenderer: '渲染 Markdown 内容（含代码块），用于助手回复。',
    ModelPicker: '模型选择下拉，取值可控。',
    PromptInput:
      'AI 提示词输入：自增高文本域、内联上下文标签、@ 触发建议与可配置提交键。',
    Sources:
      'RAG 引用列表：悬停/聚焦展开摘录（expanded 集合可控），compact 渲染内联 [1] [2] 徽标。',
    StepTimeline: '代理执行步骤的垂直时间线，逐步携带状态。',
    StreamingText: '打字机效果逐字呈现流式文本，可选光标。',
    ThinkingIndicator: '弹跳动点指示器，表示代理思考中。',
    TokenCounter: '上下文窗口 token 用量计数，含预算进度。',
    ToolCallCard: '工具调用卡片：名称、输入、输出与运行状态。',

    // Utilities
    Collapsible: '无样式开合容器，open 状态可控。',
    Disclosure: '摘要式折叠面板（details/summary 语义）。',
    Fullscreen:
      '包裹式全屏：绑定单个触发子元素，fullscreen 状态可控；另导出 useFullscreen() 钩子。',
    LocaleProvider:
      '语言包供应：内置英文、zh-CN 与 ja-JP；direction（显式或由 locale 推导）驱动 useDirection()；createStrings(base, overrides) 免复制地派生语言包。',
    ConfigProvider:
      '组件默认值覆写（Button 尺寸、Toast 时长/位置、Tooltip 延迟、HoverCard 开合延迟），经 useConfigDefaults() 读取；显式 props 恒胜，Provider 嵌套时按 section 浅合并。',
    SwipeAction: '滑动操作：左/右缘滑动露出动作，越过阈值提交。',
  },
  home: {
    hero: {
      title: '用 Haze UI，构建更快',
      subtitle:
        '轻量、无障碍的 React 组件库：零运行时 CSS-in-JS、设计令牌，以及 {count} 个生产可用组件。',
      getStarted: '快速上手',
      components: '组件',
      copyAria: '复制安装命令',
      copied: '已复制',
      copy: '复制',
    },
    stats: {
      components: '组件',
      cssLabelFull: 'CSS 完整包 · {raw} 原始',
      cssLabelFallback: 'CSS — 请先执行 pnpm build',
      runtimeJs: '样式运行时 JS',
      builtInThemes: '内置主题',
    },
    wall: {
      title: '真组件，非截图',
      subtitle: '下方每个控件都是活的——点击、拖拽、输入，直接体验真实组件库。',
    },
    features: {
      title: '为什么选择 Haze UI？',
      subtitle: '构建现代 React 界面所需的一切，一分不多。',
      zeroRuntime: {
        title: '零运行时开销',
        desc: '样式经 Linaria 在构建期提取，没有运行时 CSS-in-JS 成本。',
      },
      designTokens: {
        title: '设计令牌',
        desc: '以 CSS 自定义属性保持主题一致，内置明暗两套主题。',
      },
      components: {
        title: '{count}+ 组件',
        desc: '从按钮到日期选择器，全部遵循 Open UI 标准，保持一致。',
      },
      accessible: {
        title: '无障碍',
        desc: '基于 <dialog>、<details> 等原生元素，天然具备可访问性。',
      },
      treeShakeable: {
        title: '可摇树',
        desc: 'ESM 输出 + preserveModules，只引入你用到的部分。',
      },
      controlled: {
        title: '受控与非受控',
        desc: '表单组件经 react-use-control 同时支持两种模式。',
      },
      typescript: {
        title: 'TypeScript 优先',
        desc: '全库以 TypeScript 编写，每个组件都导出 props 类型。',
      },
      lightweight: {
        title: '轻量',
        descFull: '完整 CSS 包共 {raw}（gzip 后 {gzip}）。按组件引入还能更小。',
        descFallback: '极小的 CSS 体积，没有重型依赖，为性能而设计。',
      },
      customizable: {
        title: '高度可定制',
        desc: '用 CSS 变量覆写任意设计令牌；所有组件都透传 className。',
      },
    },
    compare: {
      title: '横向对比',
      subtitle: '零运行时样式、单 prop 状态控制，AI 组件内建。',
      dimension: '维度',
      rows: {
        stylingRuntime: '样式运行时',
        stateApi: '状态 API',
        formBinding: '表单绑定',
        aiComponents: 'AI 组件',
        perComponentCss: '按组件 CSS',
        shippedCss: 'CSS 体积',
      },
      shippedFull: '~{gzip} gzip',
      shippedFallback: '按组件 CSS',
    },
    size: {
      title: '包体积',
      subtitle:
        '按家族统计的 CSS，测量自本地库构建。tokens.css 只需引入一次，之后仅加载渲染到的组件。',
      summary:
        '{families} 个 CSS 家族 · 完整包（haze-ui.css）：{raw} / {gzip} gzip',
      sortAriaDesc: '按 gzip 体积排序组件家族，当前为降序',
      sortAriaAsc: '按 gzip 体积排序组件家族，当前为升序',
      sortLabel: '按 gzip 排序',
      family: '家族',
      css: 'CSS',
      cssGzip: 'CSS (gzip)',
      note: '由 scripts/generate-size-report.mjs 于 {date} 测量（gzip level 9）· 执行 pnpm build 重新生成。',
      hint: '未找到本地构建产物——执行 pnpm build 以重新生成该报告。',
    },
    code: {
      title: '设计从简',
      subtitle: '干净的 API 不挡路。它长这样：',
      quickSetup: '快速上手',
      description:
        '引入样式（完整包或按组件 CSS）、挂上主题类，然后直接使用组件。没有 Provider、没有 context 包裹、没有配置文件。',
    },
    footer: {
      license: 'MIT 许可证',
      builtWith: '基于 React 19 构建',
    },
  },
  gettingStarted: {
    title: '快速上手',
    intro: '只需几分钟，就能在你的 React 项目里跑起 Haze UI。',
    installation: {
      title: '安装',
      peers: [
        'Haze UI 要求 ',
        { code: 'react >= 19' },
        ' 与 ',
        { code: '@linaria/core >= 7' },
        ' 作为 peer 依赖。',
      ],
      orOtherManagers: '或使用其他包管理器：',
    },
    setup: {
      title: '初始化',
      steps: [
        {
          lead: [
            { strong: '引入样式表' },
            ' —— 加载完整包，或加载 tokens 加上你用到的组件样式。',
          ],
        },
        {
          lead: [
            { strong: '应用主题' },
            ' —— 用主题类包裹应用（或任意子树）以激活设计令牌。',
          ],
        },
        {
          lead: [{ strong: '使用组件' }, ' —— 直接导入并使用任意组件。'],
        },
      ],
    },
    theming: {
      title: '主题',
      tokensPara:
        'Haze UI 的所有视觉取值都来自 CSS 自定义属性（设计令牌）。内置两套主题：',
      overridePara: '在父元素上设置对应 CSS 变量即可覆写任意令牌：',
      prefixNote: [
        '所有令牌都以 ',
        { code: '--haze-' },
        ' 为前缀，避免与其他库冲突。完整令牌清单见源码。',
      ],
      dtfPara: [
        '所有令牌同时以 W3C Design Tokens Format（DTF）发布——每个令牌都会变成一个 ',
        { code: '$value' },
        ' / ',
        { code: '$type' },
        ' 分组条目，设计工具链无需了解 haze-ui 的 CSS 命名即可消费：',
      ],
      dtfNote:
        '这份 JSON 可直接放进 Style Dictionary 或 Tokens Studio，让 Figma 变量与各平台令牌产物和库保持同步。',
    },
    tailwind: {
      title: '与 Tailwind v4 搭配使用',
      intro: [
        'Haze UI 令牌就是普通的 CSS 自定义属性，Tailwind v4 可以通过 ',
        { code: '@theme' },
        ' 消费：把你需要的令牌别名为 Tailwind 颜色变量，再使用对应的工具类：',
      ],
      inlineNote: [
        '用 ',
        { code: '@theme inline' },
        '，而不是普通 ',
        { code: '@theme' },
        '。普通块会产出 ',
        { code: ':root { --color-primary: var(--haze-color-primary) }' },
        '，var() 在 ',
        { code: ':root' },
        ' 处只解析一次——而 Haze 令牌定义在主题类（:root 的后代）之下，所有别名在那里都会塌缩为空。使用 ',
        { code: 'inline' },
        ' 后，',
        { code: 'bg-primary' },
        ' 会编译为 ',
        { code: 'background-color: var(--haze-color-primary)' },
        '，在主题类生效的任何地方正确解析。',
      ],
      cascadePara: [
        { strong: '层叠与加载顺序。' },
        ' Haze UI 的 CSS 不进任何层，而 Tailwind v4 把主题、preflight 与工具类放进 ',
        { code: '@layer' },
        '。无层作者样式无论引入顺序与优先级如何都胜过任何层，所以当工具类与 Haze 组件设置同一属性（比如 Button 的背景）时组件获胜。需要工具类压过组件时，追加 Tailwind v4 的后缀 ',
        { code: '!' },
        '（如 ',
        { code: 'w-full!' },
        '）。组件未设置的属性上工具类照常生效。由于层的存在，Haze CSS 与 Tailwind 谁先加载并不重要——只需确保令牌在应用根节点加载一次。',
      ],
      preflightPara: [
        { strong: 'Preflight。' },
        ' Tailwind 的 reset 位于 ',
        { code: '@layer base' },
        '，只触碰元素默认值（边框、外边距、按钮背景）。Haze 组件用无层的令牌规则完整自定义样式，因此开启 preflight 后渲染完全一致——保持默认配置即可。',
      ],
    },
    controlled: {
      title: '受控组件',
      intro: [
        '表单组件通过 ',
        { code: 'react-use-control' },
        ' 同时支持受控与非受控两种模式：',
      ],
      outro: [
        '简单的非受控用法也可以直接传普通值——省略 ',
        { code: 'value' },
        ' prop，组件会自行管理状态。',
      ],
    },
    ssr: {
      title: '服务端渲染（Next.js）',
      enforcedPara: [
        '每个 Haze UI 组件都能在服务端渲染并无失配地注水——库内没有任何 ',
        { code: 'window' },
        ' 守卫。这一点由仓库内两套测试强制保障：',
        { code: 'src/lib/ssr-render.node.test.tsx' },
        '（23 个用例，在真实无 window 的 node 环境走 ',
        { code: 'renderToString' },
        '）与 ',
        { code: 'src/lib/ssr-hydration.test.tsx' },
        '（22 个用例，走 ',
        { code: 'hydrateRoot' },
        '，断言注水警告保持静默）——共 45 例，豁免清单为空。可运行的 App Router 工程见 ',
        { code: 'examples/nextjs' },
        '。',
      ],
      boundaryPara: [
        'Haze UI 不内置 ',
        { code: "'use client'" },
        ' 指令——客户端边界由你来画。组件拥有状态与副作用，请从客户端组件导入它们；这正是 SSR 测试套件覆盖的路径（先服务端渲染、后注水）。',
      ],
      loadPara: [
        '在根布局（全局 CSS 的归属地）加载一次样式表，并把主题类挂到 ',
        { code: '<body>' },
        ' 上：',
      ],
      note: [
        'Haze UI 要求 ',
        { code: 'react >= 19' },
        '（App Router 下即 Next.js 15 或更新）且只发 ESM——',
        { code: "type: 'module'" },
        '，没有 CommonJS 包。Next.js 与 Vite 开箱即用；CommonJS 服务端请改用 ',
        { code: 'import()' },
        '。“所有内容都进服务端 HTML”有一个刻意的例外：',
        { code: 'StreamingText' },
        ' 有意在服务端渲染空前缀加光标，把文本留到客户端流式补齐。',
      ],
    },
    typescript: {
      title: 'TypeScript',
      para: [
        'Haze UI 以 TypeScript 编写并随包发布类型声明。所有组件的 props 都以类型导出：',
      ],
    },
    browser: {
      title: '浏览器支持',
      para: [
        'Haze UI 面向支持 CSS 自定义属性与 ',
        { code: '<dialog>' },
        ' 元素的现代浏览器：',
      ],
    },
  },
  componentDetail: {
    notFoundTitle: '未找到组件：{name}',
    notFoundHintSuggestions: '该地址下没有组件。你是否想找：',
    notFoundHintPlain: '该地址下没有组件。',
    backToAllComponents: '返回全部组件',
    copyImport: '复制导入语句',
    copied: '已复制',
  },
};
