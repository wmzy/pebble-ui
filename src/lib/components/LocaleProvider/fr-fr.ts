import type { HazeStrings } from './locale';

/**
 * French (fr-FR) copy for every user-visible literal in the library.
 * Not auto-selected by `LocaleProvider`'s `locale` tag (only Chinese
 * and Japanese variants resolve automatically) — mount it explicitly:
 *
 *   <LocaleProvider locale="fr-FR" strings={frFR}>
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const frFR: HazeStrings = {
  alert: {
    close: 'Fermer',
  },
  approvalCard: {
    title: 'Approbation requise',
    approve: 'Approuver',
    deny: 'Refuser',
  },
  asyncSection: {
    loading: 'Chargement…',
    error: 'Une erreur est survenue',
    retry: 'Réessayer',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    today: 'Aujourd’hui',
    selectMonth: 'Sélectionner le mois',
    selectQuarter: 'Sélectionner le trimestre',
    selectYear: 'Sélectionner l’année',
    previousYear: 'Année précédente',
    nextYear: 'Année suivante',
    previousDecade: 'Décennie précédente',
    nextDecade: 'Décennie suivante',
    weekNumber: 'Sem.',
  },
  cascader: {
    expand: 'Déplier',
  },
  combobox: {
    create: 'Créer « {query} »',
    noResults: 'Aucun résultat',
  },
  command: {
    noResults: 'Aucun résultat',
  },
  sidebar: {
    toggle: 'Afficher/masquer la barre latérale',
    expand: 'Développer la barre latérale',
    collapse: 'Réduire la barre latérale',
  },
  tour: {
    next: 'Suivant',
    back: 'Retour',
    done: 'Terminé',
    skip: 'Passer',
    stepOf: 'Étape {current} sur {total}',
  },
  backToTop: {
    label: 'Revenir en haut',
  },
  banner: {
    close: 'Fermer',
  },
  breadcrumb: {
    label: 'Fil d’Ariane',
  },
  carousel: {
    label: 'Carrousel',
    previousSlide: 'Diapositive précédente',
    nextSlide: 'Diapositive suivante',
    goToSlide: 'Aller à la diapositive {index}',
  },
  chat: {
    newMessages: 'Nouveaux messages',
    stopGeneration: 'Arrêter la génération',
    copy: 'Copier',
  },
  chatInput: {
    placeholder: 'Saisissez un message...',
    send: 'Envoyer',
  },
  chatMessage: {
    sending: 'Envoi...',
    sent: 'Envoyé',
    failedToSend: 'Échec de l’envoi',
  },
  chip: {
    remove: 'Retirer',
  },
  colorPicker: {
    pickColor: 'Choisir une couleur',
    hexColor: 'Couleur hexadécimale',
    saturationBrightness: 'Saturation et luminosité',
    hue: 'Teinte',
    alpha: 'Opacité',
    presetsLabel: 'Couleurs prédéfinies',
    recentColors: 'Couleurs récentes',
  },
  confirmDialog: {
    confirm: 'Confirmer',
    cancel: 'Annuler',
  },
  dateRangePicker: {
    startDate: 'Date de début',
    endDate: 'Date de fin',
    presetToday: 'Aujourd’hui',
    presetYesterday: 'Hier',
    presetLast7Days: '7 derniers jours',
    presetLast30Days: '30 derniers jours',
    presetThisMonth: 'Ce mois-ci',
    presetLastMonth: 'Mois dernier',
  },
  datepicker: {
    time: 'Heure',
  },
  dataTable: {
    selectAll: 'Sélectionner toutes les lignes',
    filterPlaceholder: 'Filtrer',
  },
  diffViewer: {
    header: 'Diff',
  },
  empty: {
    description: 'Aucune donnée',
  },
  ellipsis: {
    expand: 'Afficher plus',
    collapse: 'Afficher moins',
  },
  fileInput: {
    label: 'Choisir un fichier',
  },
  filePreview: {
    remove: 'Retirer',
    retry: 'Réessayer',
    uploading: 'Envoi en cours',
    uploaded: 'Envoyé',
    error: 'Échec de l’envoi',
  },
  image: {
    zoomIn: 'Zoomer',
    zoomOut: 'Dézoomer',
    reset: 'Réinitialiser',
    rotate: 'Pivoter',
    close: 'Fermer',
  },
  inlineEdit: {
    placeholder: 'Cliquer pour modifier',
  },
  inlineCompletion: {
    hint: 'Complétion disponible. Appuyez sur Tab pour accepter, sur Échap pour ignorer.',
  },
  jsonView: {
    copy: 'Copier',
    more: '+{count} de plus',
  },
  logViewer: {
    all: 'Tout',
    noLogs: 'Aucun journal',
  },
  mentions: {
    label: 'Suggestions',
    noMatch: 'Aucune correspondance',
  },
  modelPicker: {
    label: 'Modèle',
  },
  numberInput: {
    decrease: 'Diminuer',
    increase: 'Augmenter',
  },
  otpInput: {
    digitLabel: 'Chiffre {index} sur {total}',
  },
  pagination: {
    previous: 'Précédent',
    next: 'Suivant',
    sizeLabel: 'Éléments par page',
    sizeOption: '{count} par page',
    jumperLabel: 'Aller à la page',
    jumperPrefix: 'Aller à',
    jumperSuffix: 'page',
    ellipsisBackward: 'Reculer de {count} pages',
    ellipsisForward: 'Avancer de {count} pages',
  },
  passwordInput: {
    label: 'Mot de passe',
    show: 'Afficher le mot de passe',
    hide: 'Masquer le mot de passe',
  },
  progress: {
    label: 'Progression',
  },
  promptInput: {
    label: 'Invite',
    removeTag: 'Retirer {tag}',
    noMatch: 'Aucune correspondance',
    loading: 'Chargement…',
  },
  rating: {
    star: '{count} étoile',
    stars: '{count} étoiles',
  },
  signature: {
    clear: 'Effacer',
    undo: 'Annuler',
    unsupported: 'La signature n’est pas prise en charge par ce navigateur.',
  },
  select: {
    placeholder: 'Sélectionner…',
    listboxLabel: 'Options',
    clear: 'Effacer',
    searchLabel: 'Rechercher des options',
    searchPlaceholder: 'Rechercher…',
    noMatch: 'Aucune correspondance',
    loading: 'Chargement des options…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'Chargement',
  },
  sources: {
    label: 'Sources',
    expand: 'Afficher l’extrait',
    collapse: 'Masquer l’extrait',
  },
  streamingText: {
    generating: 'Génération en cours',
  },
  tag: {
    remove: 'Retirer',
  },
  tagGroup: {
    remove: 'Retirer',
  },
  tagInput: {
    placeholder: 'Ajouter un tag',
    removeTag: 'Retirer {tag}',
    tagCount: '{count} tags',
    tagCountSingular: '{count} tag',
  },
  thinkingIndicator: {
    text: 'Réflexion',
  },
  timePicker: {
    now: 'Maintenant',
    hour: 'Heure',
    minute: 'Minute',
    second: 'Seconde',
    period: 'AM/PM',
    am: 'AM',
    pm: 'PM',
  },
  toast: {
    loading: 'Chargement…',
    success: 'Succès',
    error: 'Une erreur est survenue',
    close: 'Fermer',
  },
  tokenCounter: {
    label: 'Jetons',
  },
  toolCallCard: {
    pending: 'En attente',
    running: 'En cours...',
    done: 'Terminé',
    error: 'Erreur',
    inputLabel: 'Entrée',
    outputLabel: 'Sortie',
  },
  transfer: {
    source: 'Source ({count})',
    target: 'Cible ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'Déplier',
    collapse: 'Replier',
    loadError: 'Échec du chargement',
    retry: 'Réessayer',
    noMatch: 'Aucune correspondance',
  },
  treeSelect: {
    placeholder: 'Sélectionner…',
    searchLabel: 'Rechercher des nœuds',
    searchPlaceholder: 'Rechercher…',
    clear: 'Effacer',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'Glissez-déposez des fichiers ici, ou cliquez pour téléverser',
    clickHint: 'Cliquez pour parcourir les fichiers',
    label: 'Téléverser des fichiers',
    retry: 'Réessayer le téléversement',
    cancel: 'Annuler le téléversement',
    remove: 'Retirer le fichier',
    uploading: 'Téléversement en cours',
    success: 'Téléversé',
    error: 'Échec du téléversement',
  },
};

export { frFR };
