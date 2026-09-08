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
  },
  cascader: {
    expand: 'Expand',
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
  },
  confirmDialog: {
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  dateRangePicker: {
    startDate: 'Start date',
    endDate: 'End date',
  },
  empty: {
    description: 'No data',
  },
  fileInput: {
    label: 'Choose file',
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
  },
  passwordInput: {
    label: 'Password',
    show: 'Show password',
    hide: 'Hide password',
  },
  progress: {
    label: 'Progress',
  },
  rating: {
    star: '{count} star',
    stars: '{count} stars',
  },
  select: {
    placeholder: 'Select…',
    listboxLabel: 'Options',
  },
  spinner: {
    loading: 'Loading',
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
  },
  upload: {
    hint: 'Drag & drop files here, or click to upload',
    clickHint: 'Click to browse files',
    label: 'Upload files',
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
