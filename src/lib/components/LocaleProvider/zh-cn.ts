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
  },
  cascader: {
    expand: '展开',
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
  },
  confirmDialog: {
    confirm: '确认',
    cancel: '取消',
  },
  dateRangePicker: {
    startDate: '开始日期',
    endDate: '结束日期',
  },
  empty: {
    description: '暂无数据',
  },
  fileInput: {
    label: '选择文件',
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
  },
  passwordInput: {
    label: '密码',
    show: '显示密码',
    hide: '隐藏密码',
  },
  progress: {
    label: '进度',
  },
  rating: {
    star: '{count} 颗星',
    stars: '{count} 颗星',
  },
  select: {
    placeholder: '请选择',
    listboxLabel: '选项',
  },
  spinner: {
    loading: '加载中',
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
  },
  upload: {
    hint: '将文件拖拽到此处，或点击上传',
    clickHint: '点击浏览文件',
    label: '上传文件',
  },
};

export { zhCN };
