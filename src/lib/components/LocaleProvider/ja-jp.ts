import type { HazeStrings } from './locale';

/**
 * Japanese (ja-JP) copy for every user-visible literal in the library.
 * `LocaleProvider` selects this pack automatically for Japanese BCP 47
 * tags ('ja', 'ja-JP', 'ja_JP', …).
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation fails
 * the build when either pack drifts out of sync. `{name}` placeholders
 * must survive translation verbatim; they are expanded by
 * `formatString` at runtime.
 */
const jaJP: HazeStrings = {
  alert: {
    close: '閉じる',
  },
  approvalCard: {
    title: '承認が必要',
    approve: '承認',
    deny: '拒否',
  },
  asyncSection: {
    loading: '読み込み中…',
    error: 'エラーが発生しました',
    retry: '再試行',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: '前の月',
    nextMonth: '次の月',
    today: '今日',
    selectMonth: '月を選択',
    selectQuarter: '四半期を選択',
    selectYear: '年を選択',
    previousYear: '前の年',
    nextYear: '次の年',
    previousDecade: '前の 10 年',
    nextDecade: '次の 10 年',
    weekNumber: '週',
  },
  cascader: {
    expand: '展開',
  },
  combobox: {
    create: '「{query}」を作成',
    noResults: '結果なし',
  },
  command: {
    noResults: '結果なし',
  },
  sidebar: {
    toggle: 'サイドバーを切り替える',
    expand: 'サイドバーを展開',
    collapse: 'サイドバーを折りたたむ',
  },
  tour: {
    next: '次へ',
    back: '戻る',
    done: '完了',
    skip: 'スキップ',
    stepOf: 'ステップ {current} / {total}',
  },
  backToTop: {
    label: 'トップへ戻る',
  },
  banner: {
    close: '閉じる',
  },
  breadcrumb: {
    label: 'パンくずリスト',
  },
  carousel: {
    label: 'カルーセル',
    previousSlide: '前のスライド',
    nextSlide: '次のスライド',
    goToSlide: 'スライド {index} へ移動',
  },
  chat: {
    newMessages: '新着メッセージ',
    stopGeneration: '生成を停止',
    copy: 'コピー',
  },
  chatInput: {
    placeholder: 'メッセージを入力…',
    send: '送信',
  },
  chatMessage: {
    sending: '送信中…',
    sent: '送信済み',
    failedToSend: '送信できませんでした',
  },
  chip: {
    remove: '削除',
  },
  colorPicker: {
    pickColor: '色を選択',
    hexColor: 'HEX カラー',
    saturationBrightness: '彩度と明度',
    hue: '色相',
    alpha: '不透明度',
    presetsLabel: 'プリセット',
    recentColors: '最近使用した色',
  },
  confirmDialog: {
    confirm: '確認',
    cancel: 'キャンセル',
  },
  dateRangePicker: {
    startDate: '開始日',
    endDate: '終了日',
    presetToday: '今日',
    presetYesterday: '昨日',
    presetLast7Days: '過去 7 日間',
    presetLast30Days: '過去 30 日間',
    presetThisMonth: '今月',
    presetLastMonth: '先月',
  },
  datepicker: {
    time: '時刻',
  },
  dataTable: {
    selectAll: 'すべて選択',
    filterPlaceholder: 'フィルター',
  },
  diffViewer: {
    header: '差分',
  },
  empty: {
    description: 'データがありません',
  },
  ellipsis: {
    expand: '展開',
    collapse: '折りたたむ',
  },
  fileInput: {
    label: 'ファイルを選択',
  },
  filePreview: {
    remove: '削除',
    retry: '再試行',
    uploading: 'アップロード中',
    uploaded: 'アップロード済み',
    error: 'アップロードに失敗しました',
  },
  image: {
    zoomIn: '拡大',
    zoomOut: '縮小',
    reset: 'リセット',
    rotate: '回転',
    close: '閉じる',
  },
  inlineEdit: {
    placeholder: 'クリックして編集',
  },
  inlineCompletion: {
    hint: '補完候補があります。Tab キーで確定、Esc キーでキャンセル。',
  },
  jsonView: {
    copy: 'コピー',
    more: '他 {count} 件',
  },
  logViewer: {
    all: 'すべて',
    noLogs: 'ログがありません',
  },
  mentions: {
    label: 'メンション候補',
    noMatch: '該当なし',
  },
  modelPicker: {
    label: 'モデル',
  },
  numberInput: {
    decrease: '減らす',
    increase: '増やす',
  },
  otpInput: {
    digitLabel: '検証コードの {index} 桁目（全 {total} 桁）',
  },
  pagination: {
    previous: '前へ',
    next: '次へ',
    sizeLabel: 'ページあたりの件数',
    sizeOption: '{count} 件/ページ',
    jumperLabel: 'ページを指定して移動',
    jumperPrefix: 'ページ',
    jumperSuffix: 'へ',
    ellipsisBackward: '{count} ページ戻る',
    ellipsisForward: '{count} ページ進む',
  },
  passwordInput: {
    label: 'パスワード',
    show: 'パスワードを表示',
    hide: 'パスワードを隠す',
  },
  progress: {
    label: '進捗',
  },
  promptInput: {
    label: 'プロンプト',
    removeTag: '{tag} を削除',
    noMatch: '該当なし',
    loading: '読み込み中…',
  },
  rating: {
    star: '{count} つ星',
    stars: '{count} つ星',
  },
  signature: {
    clear: 'クリア',
    undo: '元に戻す',
    unsupported: 'このブラウザでは署名を利用できません。',
  },
  select: {
    placeholder: '選択してください',
    listboxLabel: 'オプション',
    clear: 'クリア',
    searchLabel: 'オプションを検索',
    searchPlaceholder: '検索…',
    noMatch: '該当なし',
    loading: 'オプションを読み込み中…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: '読み込み中',
  },
  sources: {
    label: '引用元',
    expand: '抜粋を表示',
    collapse: '抜粋を非表示',
  },
  tag: {
    remove: '削除',
  },
  tagGroup: {
    remove: '削除',
  },
  tagInput: {
    placeholder: 'タグを追加',
    removeTag: '{tag} を削除',
    tagCount: '{count} 個のタグ',
    tagCountSingular: '{count} 個のタグ',
  },
  thinkingIndicator: {
    text: '思考中',
  },
  timePicker: {
    now: '現在',
    hour: '時',
    minute: '分',
    second: '秒',
    period: '午前/午後',
    am: '午前',
    pm: '午後',
  },
  toast: {
    loading: '読み込み中…',
    success: '成功',
    error: 'エラーが発生しました',
    close: '閉じる',
  },
  tokenCounter: {
    label: 'トークン数',
  },
  toolCallCard: {
    pending: '待機中',
    running: '実行中…',
    done: '完了',
    error: 'エラー',
    inputLabel: '入力',
    outputLabel: '出力',
  },
  transfer: {
    source: '移動元（{count}）',
    target: '移動先（{count}）',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: '展開',
    collapse: '折りたたむ',
    loadError: '読み込みに失敗しました',
    retry: '再試行',
    noMatch: '該当なし',
  },
  treeSelect: {
    placeholder: '選択してください',
    searchLabel: 'ノードを検索',
    searchPlaceholder: '検索…',
    clear: 'クリア',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'ここにファイルをドラッグ＆ドロップ、またはクリックしてアップロード',
    clickHint: 'クリックしてファイルを選択',
    label: 'ファイルをアップロード',
    retry: 'アップロードを再試行',
    cancel: 'アップロードをキャンセル',
    remove: 'ファイルを削除',
    uploading: 'アップロード中',
    success: 'アップロード済み',
    error: 'アップロードに失敗しました',
  },
};

export { jaJP };
