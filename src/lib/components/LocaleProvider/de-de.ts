import type { HazeStrings } from './locale';

/**
 * German (de-DE) copy for every user-visible literal in the library.
 * Not auto-selected by `LocaleProvider`'s `locale` tag (only Chinese
 * and Japanese variants resolve automatically) — mount it explicitly:
 *
 *   <LocaleProvider locale="de-DE" strings={deDE}>
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const deDE: HazeStrings = {
  alert: {
    close: 'Schließen',
  },
  approvalCard: {
    title: 'Genehmigung erforderlich',
    approve: 'Genehmigen',
    deny: 'Ablehnen',
  },
  asyncSection: {
    loading: 'Wird geladen…',
    error: 'Etwas ist schiefgelaufen',
    retry: 'Erneut versuchen',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'Vorheriger Monat',
    nextMonth: 'Nächster Monat',
    today: 'Heute',
    selectMonth: 'Monat auswählen',
    selectQuarter: 'Quartal auswählen',
    selectYear: 'Jahr auswählen',
    previousYear: 'Vorheriges Jahr',
    nextYear: 'Nächstes Jahr',
    previousDecade: 'Vorheriges Jahrzehnt',
    nextDecade: 'Nächstes Jahrzehnt',
    weekNumber: 'KW',
  },
  cascader: {
    expand: 'Ausklappen',
  },
  combobox: {
    create: '„{query}“ erstellen',
    noResults: 'Keine Ergebnisse',
  },
  command: {
    noResults: 'Keine Ergebnisse',
  },
  sidebar: {
    toggle: 'Seitenleiste ein-/ausblenden',
    expand: 'Seitenleiste ausklappen',
    collapse: 'Seitenleiste einklappen',
  },
  tour: {
    next: 'Weiter',
    back: 'Zurück',
    done: 'Fertig',
    skip: 'Überspringen',
    stepOf: 'Schritt {current} von {total}',
  },
  backToTop: {
    label: 'Nach oben',
  },
  banner: {
    close: 'Schließen',
  },
  breadcrumb: {
    label: 'Brotkrumen',
  },
  carousel: {
    label: 'Karussell',
    previousSlide: 'Vorherige Folie',
    nextSlide: 'Nächste Folie',
    goToSlide: 'Zu Folie {index} wechseln',
  },
  chat: {
    newMessages: 'Neue Nachrichten',
    stopGeneration: 'Generierung stoppen',
    copy: 'Kopieren',
  },
  chatInput: {
    placeholder: 'Nachricht eingeben...',
    send: 'Senden',
  },
  chatMessage: {
    sending: 'Wird gesendet...',
    sent: 'Gesendet',
    failedToSend: 'Senden fehlgeschlagen',
  },
  chip: {
    remove: 'Entfernen',
  },
  colorPicker: {
    pickColor: 'Farbe wählen',
    hexColor: 'Hex-Farbwert',
    saturationBrightness: 'Sättigung und Helligkeit',
    hue: 'Farbton',
    alpha: 'Deckkraft',
    presetsLabel: 'Voreinstellungen',
    recentColors: 'Zuletzt verwendete Farben',
  },
  confirmDialog: {
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
  },
  dateRangePicker: {
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    presetToday: 'Heute',
    presetYesterday: 'Gestern',
    presetLast7Days: 'Letzte 7 Tage',
    presetLast30Days: 'Letzte 30 Tage',
    presetThisMonth: 'Dieser Monat',
    presetLastMonth: 'Letzter Monat',
  },
  datepicker: {
    time: 'Uhrzeit',
  },
  dataTable: {
    selectAll: 'Alle Zeilen auswählen',
    filterPlaceholder: 'Filtern',
  },
  diffViewer: {
    header: 'Diff',
  },
  empty: {
    description: 'Keine Daten',
  },
  ellipsis: {
    expand: 'Mehr anzeigen',
    collapse: 'Weniger anzeigen',
  },
  fileInput: {
    label: 'Datei auswählen',
  },
  filePreview: {
    remove: 'Entfernen',
    retry: 'Erneut versuchen',
    uploading: 'Wird hochgeladen',
    uploaded: 'Hochgeladen',
    error: 'Hochladen fehlgeschlagen',
  },
  image: {
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    reset: 'Zurücksetzen',
    rotate: 'Drehen',
    close: 'Schließen',
  },
  inlineEdit: {
    placeholder: 'Zum Bearbeiten klicken',
  },
  inlineCompletion: {
    hint: 'Vervollständigung verfügbar. Zum Übernehmen Tab drücken, zum Verwerfen Esc.',
  },
  jsonView: {
    copy: 'Kopieren',
    more: '+{count} weitere',
  },
  logViewer: {
    all: 'Alle',
    noLogs: 'Keine Protokolle',
  },
  mentions: {
    label: 'Vorschläge',
    noMatch: 'Keine Übereinstimmungen',
  },
  modelPicker: {
    label: 'Modell',
  },
  numberInput: {
    decrease: 'Verringern',
    increase: 'Erhöhen',
  },
  otpInput: {
    digitLabel: 'Ziffer {index} von {total}',
  },
  pagination: {
    previous: 'Zurück',
    next: 'Weiter',
    sizeLabel: 'Einträge pro Seite',
    sizeOption: '{count} pro Seite',
    jumperLabel: 'Zu Seite springen',
    jumperPrefix: 'Gehe zu',
    jumperSuffix: 'Seite',
    ellipsisBackward: '{count} Seiten zurückblättern',
    ellipsisForward: '{count} Seiten weiterblättern',
  },
  passwordInput: {
    label: 'Passwort',
    show: 'Passwort anzeigen',
    hide: 'Passwort verbergen',
  },
  progress: {
    label: 'Fortschritt',
  },
  promptInput: {
    label: 'Eingabeaufforderung',
    removeTag: '{tag} entfernen',
    noMatch: 'Keine Übereinstimmungen',
    loading: 'Wird geladen…',
  },
  rating: {
    star: '{count} Stern',
    stars: '{count} Sterne',
  },
  signature: {
    clear: 'Leeren',
    undo: 'Rückgängig',
    unsupported: 'Die Unterschrift wird in diesem Browser nicht unterstützt.',
  },
  select: {
    placeholder: 'Auswählen…',
    listboxLabel: 'Optionen',
    clear: 'Leeren',
    searchLabel: 'Optionen durchsuchen',
    searchPlaceholder: 'Suchen…',
    noMatch: 'Keine Übereinstimmungen',
    loading: 'Optionen werden geladen…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'Lädt',
  },
  sources: {
    label: 'Quellen',
    expand: 'Auszug anzeigen',
    collapse: 'Auszug ausblenden',
  },
  streamingText: {
    generating: 'Wird generiert',
  },
  tag: {
    remove: 'Entfernen',
  },
  tagGroup: {
    remove: 'Entfernen',
  },
  tagInput: {
    placeholder: 'Tag hinzufügen',
    removeTag: '{tag} entfernen',
    tagCount: '{count} Tags',
    tagCountSingular: '{count} Tag',
  },
  thinkingIndicator: {
    text: 'Denkt nach',
  },
  timePicker: {
    now: 'Jetzt',
    hour: 'Stunde',
    minute: 'Minute',
    second: 'Sekunde',
    period: 'AM/PM',
    am: 'AM',
    pm: 'PM',
  },
  toast: {
    loading: 'Wird geladen…',
    success: 'Erfolgreich',
    error: 'Etwas ist schiefgelaufen',
    close: 'Schließen',
  },
  tokenCounter: {
    label: 'Tokens',
  },
  toolCallCard: {
    pending: 'Ausstehend',
    running: 'Läuft...',
    done: 'Fertig',
    error: 'Fehler',
    inputLabel: 'Eingabe',
    outputLabel: 'Ausgabe',
  },
  transfer: {
    source: 'Quelle ({count})',
    target: 'Ziel ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'Ausklappen',
    collapse: 'Einklappen',
    loadError: 'Laden fehlgeschlagen',
    retry: 'Erneut versuchen',
    noMatch: 'Keine Übereinstimmungen',
  },
  treeSelect: {
    placeholder: 'Auswählen…',
    searchLabel: 'Knoten durchsuchen',
    searchPlaceholder: 'Suchen…',
    clear: 'Leeren',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'Dateien hierher ziehen oder klicken, um hochzuladen',
    clickHint: 'Klicken, um Dateien auszuwählen',
    label: 'Dateien hochladen',
    retry: 'Hochladen wiederholen',
    cancel: 'Hochladen abbrechen',
    remove: 'Datei entfernen',
    uploading: 'Wird hochgeladen',
    success: 'Hochgeladen',
    error: 'Hochladen fehlgeschlagen',
  },
};

export { deDE };
