import type { HazeStrings } from './locale';

/**
 * Brazilian Portuguese (pt-BR) copy for every user-visible literal in
 * the library. Not auto-selected by `LocaleProvider`'s `locale` tag
 * (only Chinese and Japanese variants resolve automatically) — mount
 * it explicitly:
 *
 *   <LocaleProvider locale="pt-BR" strings={ptBR}>
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const ptBR: HazeStrings = {
  alert: {
    close: 'Fechar',
  },
  approvalCard: {
    title: 'Aprovação necessária',
    approve: 'Aprovar',
    deny: 'Rejeitar',
  },
  asyncSection: {
    loading: 'Carregando…',
    error: 'Algo deu errado',
    retry: 'Tentar novamente',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    today: 'Hoje',
    selectMonth: 'Selecionar mês',
    selectQuarter: 'Selecionar trimestre',
    selectYear: 'Selecionar ano',
    previousYear: 'Ano anterior',
    nextYear: 'Próximo ano',
    previousDecade: 'Década anterior',
    nextDecade: 'Próxima década',
    weekNumber: 'Sem.',
  },
  cascader: {
    expand: 'Expandir',
  },
  combobox: {
    create: 'Criar "{query}"',
    noResults: 'Nenhum resultado',
  },
  command: {
    noResults: 'Nenhum resultado',
  },
  sidebar: {
    toggle: 'Mostrar/ocultar barra lateral',
    expand: 'Expandir barra lateral',
    collapse: 'Recolher barra lateral',
  },
  tour: {
    next: 'Avançar',
    back: 'Voltar',
    done: 'Concluir',
    skip: 'Pular',
    stepOf: 'Etapa {current} de {total}',
  },
  backToTop: {
    label: 'Voltar ao topo',
  },
  banner: {
    close: 'Fechar',
  },
  breadcrumb: {
    label: 'Trilha de navegação',
  },
  carousel: {
    label: 'Carrossel',
    previousSlide: 'Slide anterior',
    nextSlide: 'Próximo slide',
    goToSlide: 'Ir para o slide {index}',
  },
  chat: {
    newMessages: 'Novas mensagens',
    stopGeneration: 'Parar geração',
    copy: 'Copiar',
  },
  chatInput: {
    placeholder: 'Digite uma mensagem...',
    send: 'Enviar',
  },
  chatMessage: {
    sending: 'Enviando...',
    sent: 'Enviado',
    failedToSend: 'Falha ao enviar',
  },
  chip: {
    remove: 'Remover',
  },
  colorPicker: {
    pickColor: 'Escolher cor',
    hexColor: 'Cor hexadecimal',
    saturationBrightness: 'Saturação e brilho',
    hue: 'Matiz',
    alpha: 'Opacidade',
    presetsLabel: 'Cores predefinidas',
    recentColors: 'Cores recentes',
  },
  confirmDialog: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
  },
  dateRangePicker: {
    startDate: 'Data inicial',
    endDate: 'Data final',
    presetToday: 'Hoje',
    presetYesterday: 'Ontem',
    presetLast7Days: 'Últimos 7 dias',
    presetLast30Days: 'Últimos 30 dias',
    presetThisMonth: 'Este mês',
    presetLastMonth: 'Mês passado',
  },
  datepicker: {
    time: 'Hora',
  },
  dataTable: {
    selectAll: 'Selecionar todas as linhas',
    filterPlaceholder: 'Filtrar',
  },
  diffViewer: {
    header: 'Diff',
  },
  empty: {
    description: 'Nenhum dado',
  },
  ellipsis: {
    expand: 'Mostrar mais',
    collapse: 'Mostrar menos',
  },
  fileInput: {
    label: 'Escolher arquivo',
  },
  filePreview: {
    remove: 'Remover',
    retry: 'Tentar novamente',
    uploading: 'Enviando',
    uploaded: 'Enviado',
    error: 'Falha no envio',
  },
  image: {
    zoomIn: 'Ampliar',
    zoomOut: 'Reduzir',
    reset: 'Redefinir',
    rotate: 'Girar',
    close: 'Fechar',
  },
  inlineEdit: {
    placeholder: 'Clique para editar',
  },
  inlineCompletion: {
    hint: 'Conclusão disponível. Pressione Tab para aceitar e Esc para descartar.',
  },
  jsonView: {
    copy: 'Copiar',
    more: '+{count} mais',
  },
  logViewer: {
    all: 'Tudo',
    noLogs: 'Nenhum registro',
  },
  mentions: {
    label: 'Sugestões',
    noMatch: 'Nenhuma correspondência',
  },
  modelPicker: {
    label: 'Modelo',
  },
  numberInput: {
    decrease: 'Diminuir',
    increase: 'Aumentar',
  },
  otpInput: {
    digitLabel: 'Dígito {index} de {total}',
  },
  pagination: {
    previous: 'Anterior',
    next: 'Próxima',
    sizeLabel: 'Itens por página',
    sizeOption: '{count} por página',
    jumperLabel: 'Ir para a página',
    jumperPrefix: 'Ir para a',
    jumperSuffix: 'página',
    ellipsisBackward: 'Voltar {count} páginas',
    ellipsisForward: 'Avançar {count} páginas',
  },
  passwordInput: {
    label: 'Senha',
    show: 'Mostrar senha',
    hide: 'Ocultar senha',
  },
  progress: {
    label: 'Progresso',
  },
  promptInput: {
    label: 'Prompt',
    removeTag: 'Remover {tag}',
    noMatch: 'Nenhuma correspondência',
    loading: 'Carregando…',
  },
  rating: {
    star: '{count} estrela',
    stars: '{count} estrelas',
  },
  signature: {
    clear: 'Limpar',
    undo: 'Desfazer',
    unsupported: 'A assinatura não é suportada neste navegador.',
  },
  select: {
    placeholder: 'Selecionar…',
    listboxLabel: 'Opções',
    clear: 'Limpar',
    searchLabel: 'Pesquisar opções',
    searchPlaceholder: 'Pesquisar…',
    noMatch: 'Nenhuma correspondência',
    loading: 'Carregando opções…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'Carregando',
  },
  sources: {
    label: 'Fontes',
    expand: 'Mostrar trecho',
    collapse: 'Ocultar trecho',
  },
  streamingText: {
    generating: 'Gerando',
  },
  tag: {
    remove: 'Remover',
  },
  tagGroup: {
    remove: 'Remover',
  },
  tagInput: {
    placeholder: 'Adicionar tag',
    removeTag: 'Remover {tag}',
    tagCount: '{count} tags',
    tagCountSingular: '{count} tag',
  },
  thinkingIndicator: {
    text: 'Pensando',
  },
  timePicker: {
    now: 'Agora',
    hour: 'Hora',
    minute: 'Minuto',
    second: 'Segundo',
    period: 'AM/PM',
    am: 'AM',
    pm: 'PM',
  },
  toast: {
    loading: 'Carregando…',
    success: 'Sucesso',
    error: 'Algo deu errado',
    close: 'Fechar',
  },
  tokenCounter: {
    label: 'Tokens',
  },
  toolCallCard: {
    pending: 'Pendente',
    running: 'Executando...',
    done: 'Concluído',
    error: 'Erro',
    inputLabel: 'Entrada',
    outputLabel: 'Saída',
  },
  transfer: {
    source: 'Origem ({count})',
    target: 'Destino ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'Expandir',
    collapse: 'Recolher',
    loadError: 'Falha ao carregar',
    retry: 'Tentar novamente',
    noMatch: 'Nenhuma correspondência',
  },
  treeSelect: {
    placeholder: 'Selecionar…',
    searchLabel: 'Pesquisar nós',
    searchPlaceholder: 'Pesquisar…',
    clear: 'Limpar',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'Arraste e solte arquivos aqui, ou clique para enviar',
    clickHint: 'Clique para procurar arquivos',
    label: 'Enviar arquivos',
    retry: 'Tentar envio novamente',
    cancel: 'Cancelar envio',
    remove: 'Remover arquivo',
    uploading: 'Enviando',
    success: 'Enviado',
    error: 'Falha no envio',
  },
};

export { ptBR };
