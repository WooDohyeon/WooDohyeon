// 회원가입 선택 항목
export const MEMBER_TYPES = ['수강생', '수료생'];

export const CAMPS = ['1인 창업가', '프로덕트 디자이너', 'BX 디자이너', 'AI 헬스케어', '게임개발', 'AI 리더', '테스트 캠프'];

// 1기 ~ 20기
export const COHORTS = Array.from({ length: 20 }, (_, index) => index + 1);

// 회원 상태: 가입 직후에는 pending, 운영진이 approved 로 바꾸면 이용할 수 있습니다.
export const MEMBER_STATUS = {
  pending: { label: '승인 대기', note: '운영진이 권한을 부여한 뒤 이용할 수 있습니다.' },
  approved: { label: '이용 가능', note: '권한이 부여된 계정입니다.' },
};
