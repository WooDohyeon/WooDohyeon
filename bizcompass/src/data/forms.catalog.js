// 서식 카탈로그.
// 파일 자체는 Firebase Storage 의 forms/ 폴더에 둡니다. (예: forms/nda.pdf, forms/nda.docx)
// 여기에는 파일 이름(확장자 제외)과 같은 id 로 제목·분류·소개 문구를 적습니다.
// 카탈로그에 없는 파일을 Storage 에 올리면 파일 이름이 그대로 제목으로 표시됩니다.
export const FORM_CATALOG = [
  {
    id: 'standard-service-contractor',
    title: '표준 용역 계약서',
    category: '계약',
    updated: '2026.09',
    pages: 5,
    description: '용역의 업무 범위, 수행 기간, 대금 지급과 결과물 권리 기준을 명확히 정리하는 계약서입니다.',
  },
  {
    id: 'partnership-agreement',
    title: '동업 계약서',
    category: '계약',
    updated: '2026.08',
    pages: 5,
    description: '공동 창업자의 역할, 지분, 의사결정과 이익 배분 기준을 사전에 합의하는 계약서입니다.',
  },
  {
    id: 'nda',
    title: '비밀유지계약서 NDA',
    category: '계약',
    updated: '2026.08',
    pages: 4,
    description: '사업 정보와 기술 자료를 공유하기 전 비밀유지 범위를 합의하는 기본 서식입니다.',
  },
];

// 파일 형식별 안내 문구
export const FORMAT_INFO = {
  pdf: { label: 'PDF', hint: '문서 보기용' },
  docx: { label: 'DOCX', hint: '내용 편집용' },
  doc: { label: 'DOC', hint: '내용 편집용' },
  hwp: { label: 'HWP', hint: '한글 편집용' },
  hwpx: { label: 'HWPX', hint: '한글 편집용' },
  xlsx: { label: 'XLSX', hint: '표 편집용' },
  pptx: { label: 'PPTX', hint: '발표자료 편집용' },
};

export const FORMAT_ORDER = ['pdf', 'docx', 'doc', 'hwp', 'hwpx', 'xlsx', 'pptx'];
