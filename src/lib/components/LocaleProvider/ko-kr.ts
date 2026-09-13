import type { HazeStrings } from './locale';

/**
 * Korean (ko-KR) copy for every user-visible literal in the library.
 * Not auto-selected by `LocaleProvider`'s `locale` tag (only Chinese
 * and Japanese variants resolve automatically) — mount it explicitly:
 *
 *   <LocaleProvider locale="ko-KR" strings={koKR}>
 *
 * Keys mirror `defaultStrings` 1:1 — the `HazeStrings` annotation
 * fails the build when either pack drifts out of sync. `{name}`
 * placeholders must survive translation verbatim; they are expanded
 * by `formatString` at runtime.
 */
const koKR: HazeStrings = {
  alert: {
    close: '닫기',
  },
  approvalCard: {
    title: '승인 필요',
    approve: '승인',
    deny: '거부',
  },
  asyncSection: {
    loading: '불러오는 중…',
    error: '문제가 발생했습니다',
    retry: '다시 시도',
  },
  avatarGroup: {
    more: '+{count}',
  },
  calendar: {
    previousMonth: '이전 달',
    nextMonth: '다음 달',
    today: '오늘',
    selectMonth: '월 선택',
    selectQuarter: '분기 선택',
    selectYear: '연도 선택',
    previousYear: '이전 해',
    nextYear: '다음 해',
    previousDecade: '이전 10년',
    nextDecade: '다음 10년',
    weekNumber: '주',
  },
  cascader: {
    expand: '펼치기',
  },
  combobox: {
    create: '"{query}" 만들기',
    noResults: '결과 없음',
  },
  command: {
    noResults: '결과 없음',
  },
  sidebar: {
    toggle: '사이드바 전환',
    expand: '사이드바 펼치기',
    collapse: '사이드바 접기',
  },
  tour: {
    next: '다음',
    back: '이전',
    done: '완료',
    skip: '건너뛰기',
    stepOf: '{current} / {total} 단계',
  },
  backToTop: {
    label: '맨 위로',
  },
  banner: {
    close: '닫기',
  },
  breadcrumb: {
    label: '이동 경로',
  },
  carousel: {
    label: '캐러셀',
    previousSlide: '이전 슬라이드',
    nextSlide: '다음 슬라이드',
    goToSlide: '슬라이드 {index}로 이동',
  },
  chat: {
    newMessages: '새 메시지',
    stopGeneration: '생성 중지',
    copy: '복사',
  },
  chatInput: {
    placeholder: '메시지 입력...',
    send: '보내기',
  },
  chatMessage: {
    sending: '보내는 중...',
    sent: '전송됨',
    failedToSend: '전송 실패',
  },
  chip: {
    remove: '제거',
  },
  colorPicker: {
    pickColor: '색상 선택',
    hexColor: 'HEX 색상 코드',
    saturationBrightness: '채도와 명도',
    hue: '색조',
    alpha: '불투명도',
    presetsLabel: '사전 설정 색상',
    recentColors: '최근 사용한 색상',
  },
  confirmDialog: {
    confirm: '확인',
    cancel: '취소',
  },
  dateRangePicker: {
    startDate: '시작 날짜',
    endDate: '종료 날짜',
    presetToday: '오늘',
    presetYesterday: '어제',
    presetLast7Days: '최근 7일',
    presetLast30Days: '최근 30일',
    presetThisMonth: '이번 달',
    presetLastMonth: '지난달',
  },
  datepicker: {
    time: '시간',
  },
  dataTable: {
    selectAll: '모든 행 선택',
    filterPlaceholder: '필터',
  },
  diffViewer: {
    header: '차이',
  },
  empty: {
    description: '데이터 없음',
  },
  ellipsis: {
    expand: '더 보기',
    collapse: '접기',
  },
  fileInput: {
    label: '파일 선택',
  },
  filePreview: {
    remove: '제거',
    retry: '다시 시도',
    uploading: '업로드 중',
    uploaded: '업로드됨',
    error: '업로드 실패',
  },
  image: {
    zoomIn: '확대',
    zoomOut: '축소',
    reset: '초기화',
    rotate: '회전',
    close: '닫기',
  },
  inlineEdit: {
    placeholder: '클릭하여 편집',
  },
  inlineCompletion: {
    hint: '자동 완성을 사용할 수 있습니다. Tab 키로 적용하고 Esc 키로 무시하세요.',
  },
  jsonView: {
    copy: '복사',
    more: '+{count}개 더',
  },
  logViewer: {
    all: '전체',
    noLogs: '로그 없음',
  },
  mentions: {
    label: '추천',
    noMatch: '일치 항목 없음',
  },
  modelPicker: {
    label: '모델',
  },
  numberInput: {
    decrease: '감소',
    increase: '증가',
  },
  otpInput: {
    digitLabel: '{total}자 중 {index}번째',
  },
  pagination: {
    previous: '이전',
    next: '다음',
    sizeLabel: '페이지당 항목 수',
    sizeOption: '페이지당 {count}개',
    jumperLabel: '페이지로 이동',
    jumperPrefix: '페이지',
    jumperSuffix: '로 이동',
    ellipsisBackward: '{count}페이지 뒤로 이동',
    ellipsisForward: '{count}페이지 앞으로 이동',
  },
  passwordInput: {
    label: '비밀번호',
    show: '비밀번호 표시',
    hide: '비밀번호 숨기기',
  },
  progress: {
    label: '진행률',
  },
  promptInput: {
    label: '프롬프트',
    removeTag: '{tag} 제거',
    noMatch: '일치 항목 없음',
    loading: '불러오는 중…',
  },
  rating: {
    star: '별 {count}개',
    stars: '별 {count}개',
  },
  signature: {
    clear: '지우기',
    undo: '실행 취소',
    unsupported: '이 브라우저에서는 서명이 지원되지 않습니다.',
  },
  select: {
    placeholder: '선택…',
    listboxLabel: '옵션',
    clear: '지우기',
    searchLabel: '옵션 검색',
    searchPlaceholder: '검색…',
    noMatch: '일치 항목 없음',
    loading: '옵션을 불러오는 중…',
    moreTags: '+{count}',
  },
  spinner: {
    loading: '불러오는 중',
  },
  sources: {
    label: '출처',
    expand: '발췌 보기',
    collapse: '발췌 접기',
  },
  tag: {
    remove: '제거',
  },
  tagGroup: {
    remove: '제거',
  },
  tagInput: {
    placeholder: '태그 추가',
    removeTag: '{tag} 제거',
    tagCount: '태그 {count}개',
    tagCountSingular: '태그 {count}개',
  },
  thinkingIndicator: {
    text: '생각 중',
  },
  timePicker: {
    now: '지금',
    hour: '시',
    minute: '분',
    second: '초',
    period: '오전/오후',
    am: '오전',
    pm: '오후',
  },
  toast: {
    loading: '불러오는 중…',
    success: '성공',
    error: '문제가 발생했습니다',
    close: '닫기',
  },
  tokenCounter: {
    label: '토큰',
  },
  toolCallCard: {
    pending: '대기 중',
    running: '실행 중...',
    done: '완료',
    error: '오류',
    inputLabel: '입력',
    outputLabel: '출력',
  },
  transfer: {
    source: '원본 ({count})',
    target: '대상 ({count})',
    moveToTarget: '>',
    moveToSource: '<',
  },
  tree: {
    expand: '펼치기',
    collapse: '접기',
    loadError: '불러오기 실패',
    retry: '다시 시도',
    noMatch: '일치 항목 없음',
  },
  treeSelect: {
    placeholder: '선택…',
    searchLabel: '노드 검색',
    searchPlaceholder: '검색…',
    clear: '지우기',
    moreTags: '+{count}',
  },
  upload: {
    hint: '파일을 여기로 끌어다 놓거나 클릭하여 업로드',
    clickHint: '클릭하여 파일 찾아보기',
    label: '파일 업로드',
    retry: '업로드 다시 시도',
    cancel: '업로드 취소',
    remove: '파일 제거',
    uploading: '업로드 중',
    success: '업로드됨',
    error: '업로드 실패',
  },
};

export { koKR };
