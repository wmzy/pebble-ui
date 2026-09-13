/**
 * Default (English) copy for every user-visible literal in the library.
 *
 * Each section maps 1:1 to a component and is consumed through
 * `useStrings(section)`. Messages that embed runtime values use
 * `{name}` placeholders expanded by `formatString`, so overrides stay
 * plain serializable strings:
 *
 *   carousel: { goToSlide: 'Aller à la diapositive {index}' }
 */

const defaultStrings = {
  alert: {
    close: 'Close',
  },
  approvalCard: {
    title: 'Approval Required',
    approve: 'Approve',
    deny: 'Deny',
  },
  asyncSection: {
    loading: 'Loading…',
    error: 'Something went wrong',
    retry: 'Retry',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
    selectMonth: 'Select month',
    selectQuarter: 'Select quarter',
    selectYear: 'Select year',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    previousDecade: 'Previous decade',
    nextDecade: 'Next decade',
    weekNumber: 'Wk',
  },
  cascader: {
    expand: 'Expand',
  },
  combobox: {
    create: 'Create "{query}"',
    noResults: 'No results',
  },
  command: {
    noResults: 'No results',
  },
  sidebar: {
    toggle: 'Toggle sidebar',
    expand: 'Expand sidebar',
    collapse: 'Collapse sidebar',
  },
  tour: {
    next: 'Next',
    back: 'Back',
    done: 'Done',
    skip: 'Skip',
    stepOf: 'Step {current} of {total}',
  },
  backToTop: {
    label: 'Back to top',
  },
  banner: {
    close: 'Close',
  },
  breadcrumb: {
    label: 'Breadcrumb',
  },
  carousel: {
    label: 'Carousel',
    previousSlide: 'Previous slide',
    nextSlide: 'Next slide',
    goToSlide: 'Go to slide {index}',
  },
  chat: {
    newMessages: 'New messages',
    stopGeneration: 'Stop generating',
    copy: 'Copy',
  },
  chatInput: {
    placeholder: 'Type a message...',
    send: 'Send',
  },
  chatMessage: {
    sending: 'Sending...',
    sent: 'Sent',
    failedToSend: 'Failed to send',
  },
  chip: {
    remove: 'Remove',
  },
  colorPicker: {
    pickColor: 'Pick color',
    hexColor: 'Hex color',
    saturationBrightness: 'Saturation and brightness',
    hue: 'Hue',
    alpha: 'Opacity',
    presetsLabel: 'Presets',
    recentColors: 'Recent colors',
  },
  confirmDialog: {
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  dateRangePicker: {
    startDate: 'Start date',
    endDate: 'End date',
    presetToday: 'Today',
    presetYesterday: 'Yesterday',
    presetLast7Days: 'Last 7 days',
    presetLast30Days: 'Last 30 days',
    presetThisMonth: 'This month',
    presetLastMonth: 'Last month',
  },
  datepicker: {
    time: 'Time',
  },
  dataTable: {
    selectAll: 'Select all rows',
    filterPlaceholder: 'Filter',
  },
  diffViewer: {
    header: 'Diff',
  },
  empty: {
    description: 'No data',
  },
  ellipsis: {
    expand: 'Expand',
    collapse: 'Collapse',
  },
  fileInput: {
    label: 'Choose file',
  },
  filePreview: {
    remove: 'Remove',
    retry: 'Retry',
    uploading: 'Uploading',
    uploaded: 'Uploaded',
    error: 'Upload failed',
  },
  image: {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset',
    rotate: 'Rotate',
    close: 'Close',
  },
  inlineEdit: {
    placeholder: 'Click to edit',
  },
  inlineCompletion: {
    hint: 'Completion available. Press Tab to accept, Escape to dismiss.',
  },
  jsonView: {
    copy: 'Copy',
    more: '+{count} more',
  },
  logViewer: {
    all: 'All',
    noLogs: 'No logs',
  },
  mentions: {
    label: 'Suggestions',
    noMatch: 'No matches',
  },
  modelPicker: {
    label: 'Model',
  },
  numberInput: {
    decrease: 'Decrease',
    increase: 'Increase',
  },
  otpInput: {
    digitLabel: 'Digit {index} of {total}',
  },
  pagination: {
    previous: 'Previous',
    next: 'Next',
    sizeLabel: 'Items per page',
    sizeOption: '{count} / page',
    jumperLabel: 'Jump to page',
    jumperPrefix: 'Go to',
    jumperSuffix: 'page',
    ellipsisBackward: 'Jump back {count} pages',
    ellipsisForward: 'Jump forward {count} pages',
  },
  passwordInput: {
    label: 'Password',
    show: 'Show password',
    hide: 'Hide password',
  },
  progress: {
    label: 'Progress',
  },
  promptInput: {
    label: 'Prompt',
    removeTag: 'Remove {tag}',
    noMatch: 'No matches',
    loading: 'Loading…',
  },
  rating: {
    star: '{count} star',
    stars: '{count} stars',
  },
  signature: {
    clear: 'Clear',
    undo: 'Undo',
    unsupported: 'Signature is not supported in this browser.',
  },
  select: {
    placeholder: 'Select…',
    listboxLabel: 'Options',
    clear: 'Clear',
    searchLabel: 'Search options',
    searchPlaceholder: 'Search…',
    noMatch: 'No matches',
    loading: 'Loading options…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'Loading',
  },
  sources: {
    label: 'Sources',
    expand: 'Show excerpt',
    collapse: 'Hide excerpt',
  },
  tag: {
    remove: 'Remove',
  },
  tagGroup: {
    remove: 'Remove',
  },
  tagInput: {
    placeholder: 'Add tag',
    removeTag: 'Remove {tag}',
    tagCount: '{count} tags',
    tagCountSingular: '{count} tag',
  },
  thinkingIndicator: {
    text: 'Thinking',
  },
  timePicker: {
    now: 'Now',
    hour: 'Hour',
    minute: 'Minute',
    second: 'Second',
    period: 'AM/PM',
    am: 'AM',
    pm: 'PM',
  },
  toast: {
    loading: 'Loading…',
    success: 'Success',
    error: 'Something went wrong',
    close: 'Close',
  },
  tokenCounter: {
    label: 'Tokens',
  },
  toolCallCard: {
    pending: 'Pending',
    running: 'Running...',
    done: 'Done',
    error: 'Error',
    inputLabel: 'Input',
    outputLabel: 'Output',
  },
  transfer: {
    source: 'Source ({count})',
    target: 'Target ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'Expand',
    collapse: 'Collapse',
    loadError: 'Load failed',
    retry: 'Retry',
    noMatch: 'No matches',
  },
  treeSelect: {
    placeholder: 'Select…',
    searchLabel: 'Search nodes',
    searchPlaceholder: 'Search…',
    clear: 'Clear',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'Drag & drop files here, or click to upload',
    clickHint: 'Click to browse files',
    label: 'Upload files',
    retry: 'Retry upload',
    cancel: 'Cancel upload',
    remove: 'Remove file',
    uploading: 'Uploading',
    success: 'Uploaded',
    error: 'Upload failed',
  },
};

export type HazeStrings = typeof defaultStrings;

/**
 * Expands `{name}` placeholders in a message template with the given
 * params. Unknown placeholders are left verbatim so a partial override
 * can never blank out a label.
 */
function formatString(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : match
  );
}

/** English copy — the default pack, aliased for symmetry with `zhCN`. */
const enUS: HazeStrings = defaultStrings;

export { defaultStrings, enUS, formatString };
