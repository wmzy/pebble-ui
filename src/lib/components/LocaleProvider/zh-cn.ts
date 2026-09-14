import type { HazeStrings } from './locale';

/**
 * Simplified Chinese (zh-CN) copy for every user-visible literal in
 * the library. `LocaleProvider` selects this pack automatically for
 * Chinese BCP 47 tags ('zh', 'zh-CN', 'zh_TW', …).
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const zhCN: HazeStrings = {
  alert: {
    close: '关闭',
  },
  approvalCard: {
    title: '需要审批',
    approve: '通过',
    deny: '拒绝',
  },
  asyncSection: {
    loading: '加载中…',
    error: '出错了',
    retry: '重试',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: '上个月',
    nextMonth: '下个月',
    today: '今天',
    selectMonth: '选择月份',
    selectQuarter: '选择季度',
    selectYear: '选择年份',
    previousYear: '上一年',
    nextYear: '下一年',
    previousDecade: '上一个十年',
    nextDecade: '下一个十年',
    weekNumber: '周',
  },
  cascader: {
    expand: '展开',
  },
  combobox: {
    create: '创建「{query}」',
    noResults: '无结果',
  },
  command: {
    noResults: '无结果',
  },
  sidebar: {
    toggle: '切换侧边栏',
    expand: '展开侧边栏',
    collapse: '折叠侧边栏',
  },
  tour: {
    next: '下一步',
    back: '上一步',
    done: '完成',
    skip: '跳过',
    stepOf: '第 {current} / {total} 步',
  },
  backToTop: {
    label: '回到顶部',
  },
  banner: {
    close: '关闭',
  },
  breadcrumb: {
    label: '面包屑',
  },
  carousel: {
    label: '轮播图',
    previousSlide: '上一张幻灯片',
    nextSlide: '下一张幻灯片',
    goToSlide: '跳转到第 {index} 张幻灯片',
  },
  chat: {
    newMessages: '新消息',
    stopGeneration: '停止生成',
    copy: '复制',
  },
  chatInput: {
    placeholder: '输入消息…',
    send: '发送',
  },
  chatMessage: {
    sending: '发送中…',
    sent: '已发送',
    failedToSend: '发送失败',
  },
  chip: {
    remove: '移除',
  },
  colorPicker: {
    pickColor: '选择颜色',
    hexColor: '十六进制颜色',
    saturationBrightness: '饱和度与明度',
    hue: '色相',
    alpha: '不透明度',
    presetsLabel: '预设颜色',
    recentColors: '最近使用',
  },
  confirmDialog: {
    confirm: '确认',
    cancel: '取消',
  },
  dateRangePicker: {
    startDate: '开始日期',
    endDate: '结束日期',
    presetToday: '今天',
    presetYesterday: '昨天',
    presetLast7Days: '近 7 天',
    presetLast30Days: '近 30 天',
    presetThisMonth: '本月',
    presetLastMonth: '上月',
  },
  datepicker: {
    time: '时间',
  },
  dataTable: {
    selectAll: '全选',
    filterPlaceholder: '筛选',
  },
  diffViewer: {
    header: '差异',
  },
  empty: {
    description: '暂无数据',
  },
  ellipsis: {
    expand: '展开',
    collapse: '收起',
  },
  fileInput: {
    label: '选择文件',
  },
  filePreview: {
    remove: '移除',
    retry: '重试',
    uploading: '上传中',
    uploaded: '已上传',
    error: '上传失败',
  },
  image: {
    zoomIn: '放大',
    zoomOut: '缩小',
    reset: '重置',
    rotate: '旋转',
    close: '关闭',
  },
  inlineEdit: {
    placeholder: '点击编辑',
  },
  inlineCompletion: {
    hint: '有可用的补全，按 Tab 接受，按 Esc 忽略。',
  },
  jsonView: {
    copy: '复制',
    more: '还有 {count} 项',
  },
  logViewer: {
    all: '全部',
    noLogs: '暂无日志',
  },
  mentions: {
    label: '提及建议',
    noMatch: '无匹配项',
  },
  modelPicker: {
    label: '模型',
  },
  numberInput: {
    decrease: '减少',
    increase: '增加',
  },
  otpInput: {
    digitLabel: '第 {index} 位，共 {total} 位',
  },
  pagination: {
    previous: '上一页',
    next: '下一页',
    sizeLabel: '每页条数',
    sizeOption: '{count} 条/页',
    jumperLabel: '跳至页码',
    jumperPrefix: '跳至',
    jumperSuffix: '页',
    ellipsisBackward: '向前跳 {count} 页',
    ellipsisForward: '向后跳 {count} 页',
  },
  passwordInput: {
    label: '密码',
    show: '显示密码',
    hide: '隐藏密码',
  },
  progress: {
    label: '进度',
  },
  promptInput: {
    label: '提示词输入框',
    removeTag: '移除 {tag}',
    noMatch: '无匹配项',
    loading: '加载中…',
  },
  rating: {
    star: '{count} 颗星',
    stars: '{count} 颗星',
  },
  signature: {
    clear: '清除',
    undo: '撤销',
    unsupported: '当前浏览器不支持签名板。',
  },
  select: {
    placeholder: '请选择',
    listboxLabel: '选项',
    clear: '清除',
    searchLabel: '搜索选项',
    searchPlaceholder: '搜索…',
    noMatch: '无匹配项',
    loading: '选项加载中…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: '加载中',
  },
  sources: {
    label: '引用来源',
    expand: '展开摘录',
    collapse: '收起摘录',
  },
  streamingText: {
    generating: '生成中',
  },
  tag: {
    remove: '移除',
  },
  tagGroup: {
    remove: '移除',
  },
  tagInput: {
    placeholder: '添加标签',
    removeTag: '移除 {tag}',
    tagCount: '{count} 个标签',
    tagCountSingular: '{count} 个标签',
  },
  thinkingIndicator: {
    text: '思考中',
  },
  timePicker: {
    now: '现在',
    hour: '小时',
    minute: '分钟',
    second: '秒',
    period: '上午/下午',
    am: '上午',
    pm: '下午',
  },
  toast: {
    loading: '加载中…',
    success: '成功',
    error: '出错了',
    close: '关闭',
  },
  tokenCounter: {
    label: 'Token 数',
  },
  toolCallCard: {
    pending: '等待中',
    running: '运行中…',
    done: '完成',
    error: '错误',
    inputLabel: '输入',
    outputLabel: '输出',
  },
  transfer: {
    source: '源列表（{count}）',
    target: '目标列表（{count}）',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: '展开',
    collapse: '折叠',
    loadError: '加载失败',
    retry: '重试',
    noMatch: '无匹配项',
  },
  treeSelect: {
    placeholder: '请选择',
    searchLabel: '搜索节点',
    searchPlaceholder: '搜索…',
    clear: '清除',
    moreTags: '+{count}',
  },
  upload: {
    hint: '将文件拖拽到此处，或点击上传',
    clickHint: '点击浏览文件',
    label: '上传文件',
    retry: '重试上传',
    cancel: '取消上传',
    remove: '移除文件',
    uploading: '上传中',
    success: '上传成功',
    error: '上传失败',
  },
};

export { zhCN };
