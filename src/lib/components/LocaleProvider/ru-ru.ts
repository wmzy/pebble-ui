import type { HazeStrings } from './locale';

/**
 * Russian (ru-RU) copy for every user-visible literal in the library.
 * Not auto-selected by `LocaleProvider`'s `locale` tag (only Chinese
 * and Japanese variants resolve automatically) — mount it explicitly:
 *
 *   <LocaleProvider locale="ru-RU" strings={ruRU}>
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const ruRU: HazeStrings = {
  alert: {
    close: 'Закрыть',
  },
  approvalCard: {
    title: 'Требуется согласование',
    approve: 'Согласовать',
    deny: 'Отклонить',
  },
  asyncSection: {
    loading: 'Загрузка…',
    error: 'Что-то пошло не так',
    retry: 'Повторить',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    today: 'Сегодня',
    selectMonth: 'Выбрать месяц',
    selectQuarter: 'Выбрать квартал',
    selectYear: 'Выбрать год',
    previousYear: 'Предыдущий год',
    nextYear: 'Следующий год',
    previousDecade: 'Предыдущее десятилетие',
    nextDecade: 'Следующее десятилетие',
    weekNumber: 'Нед.',
  },
  cascader: {
    expand: 'Развернуть',
  },
  combobox: {
    create: 'Создать «{query}»',
    noResults: 'Ничего не найдено',
  },
  command: {
    noResults: 'Ничего не найдено',
  },
  sidebar: {
    toggle: 'Показать или скрыть боковую панель',
    expand: 'Развернуть боковую панель',
    collapse: 'Свернуть боковую панель',
  },
  tour: {
    next: 'Далее',
    back: 'Назад',
    done: 'Готово',
    skip: 'Пропустить',
    stepOf: 'Шаг {current} из {total}',
  },
  backToTop: {
    label: 'Наверх',
  },
  banner: {
    close: 'Закрыть',
  },
  breadcrumb: {
    label: 'Навигационная цепочка',
  },
  carousel: {
    label: 'Карусель',
    previousSlide: 'Предыдущий слайд',
    nextSlide: 'Следующий слайд',
    goToSlide: 'Перейти к слайду {index}',
  },
  chat: {
    newMessages: 'Новые сообщения',
    stopGeneration: 'Остановить генерацию',
    copy: 'Копировать',
  },
  chatInput: {
    placeholder: 'Введите сообщение...',
    send: 'Отправить',
  },
  chatMessage: {
    sending: 'Отправка...',
    sent: 'Отправлено',
    failedToSend: 'Не удалось отправить',
  },
  chip: {
    remove: 'Удалить',
  },
  colorPicker: {
    pickColor: 'Выбрать цвет',
    hexColor: 'Цвет в формате HEX',
  },
  confirmDialog: {
    confirm: 'Подтвердить',
    cancel: 'Отмена',
  },
  dateRangePicker: {
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    presetToday: 'Сегодня',
    presetYesterday: 'Вчера',
    presetLast7Days: 'Последние 7 дней',
    presetLast30Days: 'Последние 30 дней',
    presetThisMonth: 'Этот месяц',
    presetLastMonth: 'Прошлый месяц',
  },
  datepicker: {
    time: 'Время',
  },
  dataTable: {
    selectAll: 'Выбрать все строки',
    filterPlaceholder: 'Фильтр',
  },
  diffViewer: {
    header: 'Diff',
  },
  empty: {
    description: 'Нет данных',
  },
  ellipsis: {
    expand: 'Показать ещё',
    collapse: 'Свернуть',
  },
  fileInput: {
    label: 'Выбрать файл',
  },
  filePreview: {
    remove: 'Удалить',
    retry: 'Повторить',
    uploading: 'Загрузка',
    uploaded: 'Загружено',
    error: 'Не удалось загрузить',
  },
  image: {
    zoomIn: 'Увеличить',
    zoomOut: 'Уменьшить',
    reset: 'Сбросить',
    rotate: 'Повернуть',
    close: 'Закрыть',
  },
  inlineEdit: {
    placeholder: 'Нажмите, чтобы изменить',
  },
  inlineCompletion: {
    hint: 'Доступно автодополнение. Нажмите Tab, чтобы принять, и Esc, чтобы отклонить.',
  },
  jsonView: {
    copy: 'Копировать',
    more: 'Ещё {count}',
  },
  logViewer: {
    all: 'Все',
    noLogs: 'Нет записей',
  },
  mentions: {
    label: 'Предложения',
    noMatch: 'Совпадений нет',
  },
  modelPicker: {
    label: 'Модель',
  },
  numberInput: {
    decrease: 'Уменьшить',
    increase: 'Увеличить',
  },
  otpInput: {
    digitLabel: 'Цифра {index} из {total}',
  },
  pagination: {
    previous: 'Предыдущая',
    next: 'Следующая',
  },
  passwordInput: {
    label: 'Пароль',
    show: 'Показать пароль',
    hide: 'Скрыть пароль',
  },
  progress: {
    label: 'Прогресс',
  },
  promptInput: {
    label: 'Запрос',
    removeTag: 'Удалить {tag}',
    noMatch: 'Совпадений нет',
    loading: 'Загрузка…',
  },
  rating: {
    star: '{count} звезда',
    stars: '{count} звёзд',
  },
  signature: {
    clear: 'Очистить',
    undo: 'Отменить',
    unsupported: 'Подпись не поддерживается в этом браузере.',
  },
  select: {
    placeholder: 'Выберите…',
    listboxLabel: 'Варианты',
    clear: 'Очистить',
    searchLabel: 'Поиск по вариантам',
    searchPlaceholder: 'Поиск…',
    noMatch: 'Совпадений нет',
    loading: 'Загрузка вариантов…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'Загрузка',
  },
  sources: {
    label: 'Источники',
    expand: 'Показать отрывок',
    collapse: 'Скрыть отрывок',
  },
  tag: {
    remove: 'Удалить',
  },
  tagGroup: {
    remove: 'Удалить',
  },
  tagInput: {
    placeholder: 'Добавить тег',
    removeTag: 'Удалить {tag}',
    tagCount: '{count} тегов',
    tagCountSingular: '{count} тег',
  },
  thinkingIndicator: {
    text: 'Размышление',
  },
  toast: {
    loading: 'Загрузка…',
    success: 'Успешно',
    error: 'Что-то пошло не так',
    close: 'Закрыть',
  },
  tokenCounter: {
    label: 'Токены',
  },
  toolCallCard: {
    pending: 'Ожидание',
    running: 'Выполнение...',
    done: 'Готово',
    error: 'Ошибка',
    inputLabel: 'Входные данные',
    outputLabel: 'Выходные данные',
  },
  transfer: {
    source: 'Источник ({count})',
    target: 'Цель ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'Развернуть',
    collapse: 'Свернуть',
    loadError: 'Не удалось загрузить',
    retry: 'Повторить',
    noMatch: 'Совпадений нет',
  },
  treeSelect: {
    placeholder: 'Выберите…',
    searchLabel: 'Поиск по узлам',
    searchPlaceholder: 'Поиск…',
    clear: 'Очистить',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'Перетащите файлы сюда или нажмите для загрузки',
    clickHint: 'Нажмите, чтобы выбрать файлы',
    label: 'Загрузить файлы',
    retry: 'Повторить загрузку',
    cancel: 'Отменить загрузку',
    remove: 'Удалить файл',
    uploading: 'Загрузка',
    success: 'Загружено',
    error: 'Не удалось загрузить',
  },
};

export { ruRU };
