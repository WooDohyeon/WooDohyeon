// 창업 단계별 정부지원사업 로드맵.
// href 에 사업 안내 페이지 주소를 넣으면 카드가 링크로 바뀝니다. (null 이면 링크 없이 표시)
// detail 을 넣으면 카드가 버튼이 되어, 누르면 상세 모달(설명 · 신청 시기 · 규모 · 자격 조건 · 원문 링크)이 열립니다.
export const ROADMAP_STAGES = [
  {
    id: 'prepare',
    number: '01',
    title: '창업 준비',
    period: '예비창업 ~ 3년 이하',
    programs: [
      {
        id: 'modoo',
        title: '모두의 창업',
        eligibility: '예비창업 ~ 3년',
        href: null,
        // detail 을 넣으면 카드를 눌렀을 때 상세 모달이 열립니다.
        detail: {
          summary: '창의적인 아이디어를 가진 국민 누구나 도전할 수 있는 중소벤처기업부의 오디션형 창업 지원 프로젝트입니다. 라운드를 거치며 창업활동자금과 멘토링, 사업화 자금을 단계적으로 지원받습니다.',
          period: ['2026년 1차: 3월 공고 (마감)', '2026년 2차: 8월 20일 ~ 9월 17일 16시 (마감)'],
          scale: ['2차 기준 총 10,000명 선발 (일반 · 기술트랙 8,000명, 로컬트랙 2,000명)', '1라운드: 창업활동자금 200만 원 + 멘토링', '2라운드 진출 시: 시제품 제작 · 사업화 자금 지원'],
          conditions: ['공고일 기준 사업자등록이 없는 예비창업자', '업력 7년 이내 기창업자 중 기존 사업과 다른 업종으로 창업하려는 대표자 (이종창업)', '공동대표는 전원이 자격을 충족해야 함'],
          sourceUrl: 'https://www.modoo.or.kr/',
          sourceLabel: '모두의 창업 바로가기',
        },
      },
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
