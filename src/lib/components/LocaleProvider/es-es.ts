import type { HazeStrings } from './locale';

/**
 * Spanish (es-ES) copy for every user-visible literal in the library.
 * Not auto-selected by `LocaleProvider`'s `locale` tag (only Chinese
 * and Japanese variants resolve automatically) — mount it explicitly:
 *
 *   <LocaleProvider locale="es-ES" strings={esES}>
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const esES: HazeStrings = {
  alert: {
    close: 'Cerrar',
  },
  approvalCard: {
    title: 'Aprobación requerida',
    approve: 'Aprobar',
    deny: 'Rechazar',
  },
  asyncSection: {
    loading: 'Cargando…',
    error: 'Algo ha salido mal',
    retry: 'Reintentar',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    today: 'Hoy',
    selectMonth: 'Seleccionar mes',
    selectQuarter: 'Seleccionar trimestre',
    selectYear: 'Seleccionar año',
    previousYear: 'Año anterior',
    nextYear: 'Año siguiente',
    previousDecade: 'Década anterior',
    nextDecade: 'Década siguiente',
    weekNumber: 'Sem.',
  },
  cascader: {
    expand: 'Desplegar',
  },
  combobox: {
    create: 'Crear «{query}»',
    noResults: 'Sin resultados',
  },
  command: {
    noResults: 'Sin resultados',
  },
  sidebar: {
    toggle: 'Mostrar u ocultar la barra lateral',
    expand: 'Expandir la barra lateral',
    collapse: 'Contraer la barra lateral',
  },
  tour: {
    next: 'Siguiente',
    back: 'Atrás',
    done: 'Hecho',
    skip: 'Omitir',
    stepOf: 'Paso {current} de {total}',
  },
  backToTop: {
    label: 'Volver arriba',
  },
  banner: {
    close: 'Cerrar',
  },
  breadcrumb: {
    label: 'Migas de pan',
  },
  carousel: {
    label: 'Carrusel',
    previousSlide: 'Diapositiva anterior',
    nextSlide: 'Diapositiva siguiente',
    goToSlide: 'Ir a la diapositiva {index}',
  },
  chat: {
    newMessages: 'Mensajes nuevos',
    stopGeneration: 'Detener la generación',
    copy: 'Copiar',
  },
  chatInput: {
    placeholder: 'Escribe un mensaje...',
    send: 'Enviar',
  },
  chatMessage: {
    sending: 'Enviando...',
    sent: 'Enviado',
    failedToSend: 'Error al enviar',
  },
  chip: {
    remove: 'Quitar',
  },
  colorPicker: {
    pickColor: 'Elegir color',
    hexColor: 'Color hexadecimal',
    saturationBrightness: 'Saturación y brillo',
    hue: 'Tono',
    alpha: 'Opacidad',
    presetsLabel: 'Colores predefinidos',
    recentColors: 'Colores recientes',
  },
  confirmDialog: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },
  dateRangePicker: {
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de fin',
    presetToday: 'Hoy',
    presetYesterday: 'Ayer',
    presetLast7Days: 'Últimos 7 días',
    presetLast30Days: 'Últimos 30 días',
    presetThisMonth: 'Este mes',
    presetLastMonth: 'Mes pasado',
  },
  datepicker: {
    time: 'Hora',
  },
  dataTable: {
    selectAll: 'Seleccionar todas las filas',
    filterPlaceholder: 'Filtrar',
  },
  diffViewer: {
    header: 'Diff',
  },
  empty: {
    description: 'Sin datos',
  },
  ellipsis: {
    expand: 'Mostrar más',
    collapse: 'Mostrar menos',
  },
  fileInput: {
    label: 'Elegir archivo',
  },
  filePreview: {
    remove: 'Quitar',
    retry: 'Reintentar',
    uploading: 'Subiendo',
    uploaded: 'Subido',
    error: 'Error al subir',
  },
  image: {
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    reset: 'Restablecer',
    rotate: 'Girar',
    close: 'Cerrar',
  },
  inlineEdit: {
    placeholder: 'Haz clic para editar',
  },
  inlineCompletion: {
    hint: 'Autocompletado disponible. Pulsa Tab para aceptar y Esc para descartar.',
  },
  jsonView: {
    copy: 'Copiar',
    more: '+{count} más',
  },
  logViewer: {
    all: 'Todos',
    noLogs: 'Sin registros',
  },
  mentions: {
    label: 'Sugerencias',
    noMatch: 'Sin coincidencias',
  },
  modelPicker: {
    label: 'Modelo',
  },
  numberInput: {
    decrease: 'Reducir',
    increase: 'Aumentar',
  },
  otpInput: {
    digitLabel: 'Dígito {index} de {total}',
  },
  pagination: {
    previous: 'Anterior',
    next: 'Siguiente',
    sizeLabel: 'Elementos por página',
    sizeOption: '{count} por página',
    jumperLabel: 'Ir a la página',
    jumperPrefix: 'Ir a',
    jumperSuffix: 'página',
    ellipsisBackward: 'Retroceder {count} páginas',
    ellipsisForward: 'Avanzar {count} páginas',
  },
  passwordInput: {
    label: 'Contraseña',
    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',
  },
  progress: {
    label: 'Progreso',
  },
  promptInput: {
    label: 'Indicación',
    removeTag: 'Quitar {tag}',
    noMatch: 'Sin coincidencias',
    loading: 'Cargando…',
  },
  rating: {
    star: '{count} estrella',
    stars: '{count} estrellas',
  },
  signature: {
    clear: 'Borrar',
    undo: 'Deshacer',
    unsupported: 'La firma no es compatible con este navegador.',
  },
  select: {
    placeholder: 'Seleccionar…',
    listboxLabel: 'Opciones',
    clear: 'Borrar',
    searchLabel: 'Buscar opciones',
    searchPlaceholder: 'Buscar…',
    noMatch: 'Sin coincidencias',
    loading: 'Cargando opciones…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'Cargando',
  },
  sources: {
    label: 'Fuentes',
    expand: 'Mostrar extracto',
    collapse: 'Ocultar extracto',
  },
  streamingText: {
    generating: 'Generando',
  },
  tag: {
    remove: 'Quitar',
  },
  tagGroup: {
    remove: 'Quitar',
  },
  tagInput: {
    placeholder: 'Añadir etiqueta',
    removeTag: 'Quitar {tag}',
    tagCount: '{count} etiquetas',
    tagCountSingular: '{count} etiqueta',
  },
  thinkingIndicator: {
    text: 'Pensando',
  },
  timePicker: {
    now: 'Ahora',
    hour: 'Hora',
    minute: 'Minuto',
    second: 'Segundo',
    period: 'AM/PM',
    am: 'a. m.',
    pm: 'p. m.',
  },
  toast: {
    loading: 'Cargando…',
    success: 'Correcto',
    error: 'Algo ha salido mal',
    close: 'Cerrar',
  },
  tokenCounter: {
    label: 'Tokens',
  },
  toolCallCard: {
    pending: 'Pendiente',
    running: 'Ejecutando...',
    done: 'Hecho',
    error: 'Error',
    inputLabel: 'Entrada',
    outputLabel: 'Salida',
  },
  transfer: {
    source: 'Origen ({count})',
    target: 'Destino ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'Desplegar',
    collapse: 'Contraer',
    loadError: 'Error al cargar',
    retry: 'Reintentar',
    noMatch: 'Sin coincidencias',
  },
  treeSelect: {
    placeholder: 'Seleccionar…',
    searchLabel: 'Buscar nodos',
    searchPlaceholder: 'Buscar…',
    clear: 'Borrar',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'Arrastra y suelta archivos aquí, o haz clic para subir',
    clickHint: 'Haz clic para explorar archivos',
    label: 'Subir archivos',
    retry: 'Reintentar la subida',
    cancel: 'Cancelar la subida',
    remove: 'Quitar archivo',
    uploading: 'Subiendo',
    success: 'Subido',
    error: 'Error al subir',
  },
};

export { esES };
