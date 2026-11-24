// 창업 단계별 정부지원사업 로드맵.
// href 에 사업 안내 페이지 주소를 넣으면 카드가 링크로 바뀝니다. (null 이면 링크 없이 표시)
export const ROADMAP_STAGES = [
  {
    id: 'prepare',
    number: '01',
    title: '창업 준비',
    period: '예비창업 ~ 3년 이하',
    programs: [
      { id: 'modoo', title: '모두의 창업', eligibility: '예비창업 ~ 3년', href: null },
      { id: 'pre-startup', title: '예비창업패키지', eligibility: '예비창업자', href: null },
      { id: 'startup-university', title: '창업중심대학', eligibility: '예비창업 ~ 7년', href: null },
    ],
  },
  {
    id: 'start',
    number: '02',
    title: '초기 · 재도전',
    period: '예비창업 ~ 3년 이하',
    programs: [
      { id: 'early-startup', title: '초기창업패키지', eligibility: '창업 후 3년 이내', href: null },
      { id: 'startup-success', title: '창업성공패키지', eligibility: '청년창업사관학교', href: null },
      { id: 'restart', title: '재도전성공패키지', eligibility: '예비 ~ 재창업 7년', href: null },
    ],
  },
  {
    id: 'grow',
    number: '03',
    title: '성장 · 도약',
    period: '창업 3 ~ 10년',
    programs: [
      { id: 'startup-leap', title: '창업도약패키지', eligibility: '창업 후 3 ~ 7년 이내', href: null },
      { id: 'lips', title: 'LIPS', eligibility: '비기술 소상공인', href: null },
    ],
  },
  {
    id: 'scale',
    number: '04',
    title: '확장 · 고도화',
    period: '창업 3 ~ 10년',
    programs: [
      { id: 'dips', title: 'DIPS', eligibility: '창업 후 10년 이내', href: null },
    ],
  },
];

export const TIPS_FLOW = [
  { id: 'pre-tips', title: 'Pre-TIPS', eligibility: '창업 후 3년 이내', href: null },
  { id: 'tips', title: 'TIPS', eligibility: '창업 후 7년 이내', href: null },
  { id: 'post-tips', title: 'Post-TIPS', eligibility: '창업 후 7년 이내', href: null },
];

export const ROADMAP_NOTE =
  '업력은 제공된 로드맵 기준이며, 실제 신청 자격과 지원 내용은 각 사업의 최신 공고를 확인해 주세요. 단계별 사업은 필수 순서가 아닙니다.';

export const ROADMAP_PROGRAM_COUNT =
  ROADMAP_STAGES.reduce((sum, stage) => sum + stage.programs.length, 0) + TIPS_FLOW.length;
