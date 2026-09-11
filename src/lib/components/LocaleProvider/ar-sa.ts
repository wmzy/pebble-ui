import type { HazeStrings } from './locale';

/**
 * Modern Standard Arabic (ar-SA) copy for every user-visible literal
 * in the library. Not auto-selected by `LocaleProvider`'s `locale`
 * tag (only Chinese and Japanese variants resolve automatically) —
 * mount it explicitly:
 *
 *   <LocaleProvider locale="ar-SA" strings={arSA}>
 *
 * Arabic is RTL: the provider chain derives direction 'rtl' from the
 * tag (see utils/direction.ts), while the app keeps responsibility
 * for writing `dir="rtl"` on the document. Temporal labels such as
 * "previous"/"next" stay semantic — their visual mirroring is the
 * layout's job, not the copy's.
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const arSA: HazeStrings = {
  alert: {
    close: 'إغلاق',
  },
  approvalCard: {
    title: 'مطلوب موافقة',
    approve: 'موافقة',
    deny: 'رفض',
  },
  asyncSection: {
    loading: 'جارٍ التحميل…',
    error: 'حدث خطأ ما',
    retry: 'إعادة المحاولة',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    today: 'اليوم',
    selectMonth: 'اختيار الشهر',
    selectQuarter: 'اختيار الربع',
    selectYear: 'اختيار السنة',
    previousYear: 'السنة السابقة',
    nextYear: 'السنة التالية',
    previousDecade: 'العقد السابق',
    nextDecade: 'العقد التالي',
    weekNumber: 'أسبوع',
  },
  cascader: {
    expand: 'توسيع',
  },
  combobox: {
    create: 'إنشاء "{query}"',
    noResults: 'لا توجد نتائج',
  },
  command: {
    noResults: 'لا توجد نتائج',
  },
  sidebar: {
    toggle: 'تبديل الشريط الجانبي',
    expand: 'توسيع الشريط الجانبي',
    collapse: 'طي الشريط الجانبي',
  },
  tour: {
    next: 'التالي',
    back: 'السابق',
    done: 'تم',
    skip: 'تخطي',
    stepOf: 'الخطوة {current} من {total}',
  },
  backToTop: {
    label: 'العودة إلى الأعلى',
  },
  banner: {
    close: 'إغلاق',
  },
  breadcrumb: {
    label: 'مسار التنقل',
  },
  carousel: {
    label: 'العارض الدوّار',
    previousSlide: 'الشريحة السابقة',
    nextSlide: 'الشريحة التالية',
    goToSlide: 'الانتقال إلى الشريحة {index}',
  },
  chat: {
    newMessages: 'رسائل جديدة',
    stopGeneration: 'إيقاف التوليد',
    copy: 'نسخ',
  },
  chatInput: {
    placeholder: 'اكتب رسالة...',
    send: 'إرسال',
  },
  chatMessage: {
    sending: 'جارٍ الإرسال...',
    sent: 'تم الإرسال',
    failedToSend: 'تعذّر الإرسال',
  },
  chip: {
    remove: 'إزالة',
  },
  colorPicker: {
    pickColor: 'اختيار اللون',
    hexColor: 'رمز اللون HEX',
  },
  confirmDialog: {
    confirm: 'تأكيد',
    cancel: 'إلغاء',
  },
  dateRangePicker: {
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    presetToday: 'اليوم',
    presetYesterday: 'أمس',
    presetLast7Days: 'آخر 7 أيام',
    presetLast30Days: 'آخر 30 يومًا',
    presetThisMonth: 'هذا الشهر',
    presetLastMonth: 'الشهر الماضي',
  },
  datepicker: {
    time: 'الوقت',
  },
  dataTable: {
    selectAll: 'تحديد جميع الصفوف',
    filterPlaceholder: 'تصفية',
  },
  diffViewer: {
    header: 'الفروق',
  },
  empty: {
    description: 'لا توجد بيانات',
  },
  ellipsis: {
    expand: 'توسيع',
    collapse: 'طي',
  },
  fileInput: {
    label: 'اختيار ملف',
  },
  filePreview: {
    remove: 'إزالة',
    retry: 'إعادة المحاولة',
    uploading: 'جارٍ الرفع',
    uploaded: 'تم الرفع',
    error: 'فشل الرفع',
  },
  image: {
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    reset: 'إعادة تعيين',
    rotate: 'تدوير',
    close: 'إغلاق',
  },
  inlineEdit: {
    placeholder: 'انقر للتحرير',
  },
  inlineCompletion: {
    hint: 'هناك إكمال متاح. اضغط Tab للقبول وEsc للتجاهل.',
  },
  jsonView: {
    copy: 'نسخ',
    more: '+{count} أخرى',
  },
  logViewer: {
    all: 'الكل',
    noLogs: 'لا توجد سجلات',
  },
  mentions: {
    label: 'اقتراحات',
    noMatch: 'لا توجد مطابقات',
  },
  modelPicker: {
    label: 'النموذج',
  },
  numberInput: {
    decrease: 'إنقاص',
    increase: 'زيادة',
  },
  otpInput: {
    digitLabel: 'الرقم {index} من {total}',
  },
  pagination: {
    previous: 'السابق',
    next: 'التالي',
  },
  passwordInput: {
    label: 'كلمة المرور',
    show: 'إظهار كلمة المرور',
    hide: 'إخفاء كلمة المرور',
  },
  progress: {
    label: 'التقدم',
  },
  promptInput: {
    label: 'المطالبة',
    removeTag: 'إزالة {tag}',
    noMatch: 'لا توجد مطابقات',
    loading: 'جارٍ التحميل…',
  },
  rating: {
    star: '{count} نجمة',
    stars: '{count} نجوم',
  },
  signature: {
    clear: 'مسح',
    undo: 'تراجع',
    unsupported: 'لوحة التوقيع غير مدعومة في هذا المتصفح.',
  },
  select: {
    placeholder: 'تحديد…',
    listboxLabel: 'الخيارات',
    clear: 'مسح',
    searchLabel: 'البحث في الخيارات',
    searchPlaceholder: 'بحث…',
    noMatch: 'لا توجد مطابقات',
    loading: 'جارٍ تحميل الخيارات…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: 'جارٍ التحميل',
  },
  sources: {
    label: 'المصادر',
    expand: 'إظهار المقتطف',
    collapse: 'إخفاء المقتطف',
  },
  tag: {
    remove: 'إزالة',
  },
  tagGroup: {
    remove: 'إزالة',
  },
  tagInput: {
    placeholder: 'إضافة وسم',
    removeTag: 'إزالة {tag}',
    tagCount: '{count} وسوم',
    tagCountSingular: '{count} وسم',
  },
  thinkingIndicator: {
    text: 'جارٍ التفكير',
  },
  toast: {
    loading: 'جارٍ التحميل…',
    success: 'نجاح',
    error: 'حدث خطأ ما',
    close: 'إغلاق',
  },
  tokenCounter: {
    label: 'الرموز',
  },
  toolCallCard: {
    pending: 'قيد الانتظار',
    running: 'قيد التشغيل...',
    done: 'تم',
    error: 'خطأ',
    inputLabel: 'الإدخال',
    outputLabel: 'الإخراج',
  },
  transfer: {
    source: 'المصدر ({count})',
    target: 'الهدف ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: 'توسيع',
    collapse: 'طي',
    loadError: 'فشل التحميل',
    retry: 'إعادة المحاولة',
    noMatch: 'لا توجد مطابقات',
  },
  treeSelect: {
    placeholder: 'تحديد…',
    searchLabel: 'البحث في العقد',
    searchPlaceholder: 'بحث…',
    clear: 'مسح',
    moreTags: '+{count}',
  },
  upload: {
    hint: 'اسحب الملفات وأفلتها هنا، أو انقر للرفع',
    clickHint: 'انقر لاستعراض الملفات',
    label: 'رفع الملفات',
    retry: 'إعادة محاولة الرفع',
    cancel: 'إلغاء الرفع',
    remove: 'إزالة الملف',
    uploading: 'جارٍ الرفع',
    success: 'تم الرفع',
    error: 'فشل الرفع',
  },
};

export { arSA };
