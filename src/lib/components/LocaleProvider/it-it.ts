import type { HazeStrings } from './locale';

/**
 * Italian (it-IT) copy for every user-visible literal in the library.
 * Not auto-selected by `LocaleProvider`'s `locale` tag (only Chinese
 * and Japanese variants resolve automatically) — mount it explicitly:
 *
 *   <LocaleProvider locale="it-IT" strings={itIT}>
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const itIT: HazeStrings = {
  alert: {
    close: 'Chiudi',
  },
  approvalCard: {
    title: 'Approvazione richiesta',
    approve: 'Approva',
    deny: 'Nega',
  },
  asyncSection: {
    loading: 'Caricamento…',
    error: 'Si è verificato un errore',
    retry: 'Riprova',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'Mese precedente',
    nextMonth: 'Mese successivo',
    today: 'Oggi',
    selectMonth: 'Seleziona mese',
    selectQuarter: 'Seleziona trimestre',
    selectYear: 'Seleziona anno',
    previousYear: 'Anno precedente',
    nextYear: 'Anno successivo',
    previousDecade: 'Decennio precedente',
    nextDecade: 'Decennio successivo',
    weekNumber: 'Sett.',
  },
  cascader: {
    expand: 'Espandi',
  },
  combobox: {
    create: 'Crea "{query}"',
    noResults: 'Nessun risultato',
  },
  command: {
    noResults: 'Nessun risultato',
  },
  sidebar: {
    toggle: 'Mostra/nascondi barra laterale',
    expand: 'Espandi barra laterale',
    collapse: 'Comprimi barra laterale',
  },
  tour: {
    next: 'Avanti',
    back: 'Indietro',
    done: 'Fine',
    skip: 'Salta',
    stepOf: 'Passaggio {current} di {total}',
  },
  backToTop: {
    label: 'Torna su',
  },
  banner: {
    close: 'Chiudi',
  },
  breadcrumb: {
    label: 'Briciole di pane',
  },
  carousel: {
    label: 'Carosello',
    previousSlide: 'Diapositiva precedente',
    nextSlide: 'Diapositiva successiva',
    goToSlide: 'Vai alla diapositiva {index}',
  },
  chat: {
    newMessages: 'Nuovi messaggi',
    stopGeneration: 'Interrompi generazione',
    copy: 'Copia',
  },
  chatInput: {
    placeholder: 'Scrivi un messaggio...',
    send: 'Invia',
  },
  chatMessage: {
    sending: 'Invio...',
    sent: 'Inviato',
    failedToSend: 'Invio non riuscito',
  },
  chip: {
    remove: 'Rimuovi',
  },
  colorPicker: {
    pickColor: 'Scegli colore',
    hexColor: 'Colore esadecimale',
  },
  confirmDialog: {
    confirm: 'Conferma',
    cancel: 'Annulla',
  },
  dateRangePicker: {
    startDate: 'Data di inizio',
    endDate: 'Data di fine',
    presetToday: 'Oggi',
    presetYesterday: 'Ieri',
    presetLast7Days: 'Ultimi 7 giorni',
    presetLast30Days: 'Ultimi 30 giorni',
    presetThisMonth: 'Questo mese',
    presetLastMonth: 'Mese scorso',
  },
  datepicker: {
    time: 'Ora',
  },
  dataTable: {
    selectAll: 'Seleziona tutte le righe',
    filterPlaceholder: 'Filtra',
  },
  diffViewer: {
    header: 'Diff',
  },
  empty: {
    description: 'Nessun dato',
  },
  ellipsis: {
    expand: 'Mostra tutto',
    collapse: 'Mostra meno',
  },
  fileInput: {
    label: 'Scegli file',
  },
  filePreview: {
    remove: 'Rimuovi',
    retry: 'Riprova',
    uploading: 'Caricamento in corso',
    uploaded: 'Caricato',
    error: 'Caricamento non riuscito',
  },
  image: {
    zoomIn: 'Ingrandisci',
    zoomOut: 'Riduci',
    reset: 'Reimposta',
    rotate: 'Ruota',
    close: 'Chiudi',
  },
  inlineEdit: {
    placeholder: 'Fai clic per modificare',
  },
  inlineCompletion: {
    hint: 'Completamento disponibile. Premi Tab per accettare ed Esc per ignorare.',
  },
  jsonView: {
    copy: 'Copia',
    more: '+{count} altri',
  },
  logViewer: {
    all: 'Tutti',
    noLogs: 'Nessun registro',
  },
  mentions: {
    label: 'Suggerimenti',
    noMatch: 'Nessuna corrispondenza',
  },
  modelPicker: {
    label: 'Modello',
  },
  numberInput: {
    decrease: 'Diminuisci',
    increase: 'Aumenta',
  },
  otpInput: {
    digitLabel: 'Cifra {index} di {total}',
  },
  pagination: {
    previous: 'Precedente',
    next: 'Successivo',
  },
  passwordInput: {
    label: 'Password',
    show: 'Mostra password',
    hide: 'Nascondi password',
  },
  progress: {
    label: 'Avanzamento',
  },
  promptInput: {
    label: 'Prompt',
    removeTag: 'Rimuovi {tag}',
    noMatch: 'Nessuna corrispondenza',
    loading: 'Caricamento…',
  },
  rating: {
    star: '{count} stella',
    stars: '{count} stelle',
  },
  signature: {
    clear: 'Cancella',
    undo: 'Annulla',
    unsupported: 'La firma non è supportata in questo browser.',
  },
  select: {
    placeholder: 'Seleziona…',
    listboxLabel: 'Opzioni',
    clear: 'Cancella',
    searchLabel: 'Cerca opzioni',
    searchPlaceholder: 'Cerca…',
    noMatch: 'Nessuna corrispondenza',
    loading: 'Caricamento opzioni…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'Caricamento',
  },
  sources: {
    label: 'Fonti',
    expand: 'Mostra stralcio',
    collapse: 'Nascondi stralcio',
  },
  tag: {
    remove: 'Rimuovi',
  },
  tagGroup: {
    remove: 'Rimuovi',
  },
  tagInput: {
    placeholder: 'Aggiungi tag',
    removeTag: 'Rimuovi {tag}',
    tagCount: '{count} tag',
    tagCountSingular: '{count} tag',
  },
  thinkingIndicator: {
    text: 'Sto pensando',
  },
  toast: {
    loading: 'Caricamento…',
    success: 'Operazione riuscita',
    error: 'Si è verificato un errore',
    close: 'Chiudi',
  },
  tokenCounter: {
    label: 'Token',
  },
  toolCallCard: {
    pending: 'In attesa',
    running: 'In esecuzione...',
    done: 'Completato',
    error: 'Errore',
    inputLabel: 'Input',
    outputLabel: 'Output',
  },
  transfer: {
    source: 'Origine ({count})',
    target: 'Destinazione ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'Espandi',
    collapse: 'Comprimi',
    loadError: 'Caricamento non riuscito',
    retry: 'Riprova',
    noMatch: 'Nessuna corrispondenza',
  },
  treeSelect: {
    placeholder: 'Seleziona…',
    searchLabel: 'Cerca nodi',
    searchPlaceholder: 'Cerca…',
    clear: 'Cancella',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'Trascina e rilascia i file qui, oppure fai clic per caricare',
    clickHint: 'Fai clic per sfogliare i file',
    label: 'Carica file',
    retry: 'Riprova caricamento',
    cancel: 'Annulla caricamento',
    remove: 'Rimuovi file',
    uploading: 'Caricamento in corso',
    success: 'Caricato',
    error: 'Caricamento non riuscito',
  },
};

export { itIT };
