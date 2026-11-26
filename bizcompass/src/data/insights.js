// 인사이트 — 카드뉴스와 아티클(글) 두 가지를 올립니다.
//
// ① 카드뉴스 (INSIGHTS)
// 카드뉴스 이미지는 public/insights/<id>/ 폴더에 넣고, 아래에 한 건씩 적습니다. (맨 위가 최신)
//   {
//     id: '2026-12-startup-checklist',      // 폴더 이름과 같게
//     title: '창업 전 꼭 확인할 체크리스트 7',
//     category: '창업 준비',
//     date: '2026.12.01',
//     summary: '목록에 보이는 한두 줄 소개',
//     slides: ['01.png', '02.png', '03.png'],   // 넘겨 보는 순서. 첫 장이 표지로 쓰입니다.
//   }
export const INSIGHTS = [];

// ② 아티클 (ARTICLES) — 블로그처럼 글로 올리는 콘텐츠. (맨 위가 최신)
//   {
//     id: '2026-12-business-plan',          // 주소에 쓰이는 이름 (/insights/post/?id=...)
//     title: '사업계획서, 심사위원은 여기부터 봅니다',
//     category: '지원사업',
//     date: '2026.12.01',
//     author: 'OZ BizLab',                  // 생략 가능
//     summary: '목록에 보이는 한두 줄 소개',
//     cover: 'cover.png',                   // 생략 가능. public/insights/<id>/ 폴더의 파일 이름
//     body: `
// 첫 문단입니다. 빈 줄로 문단을 나눕니다.
//
// ## 소제목
//
// - 목록 항목
// - **굵게** 와 [링크](https://example.com) 를 쓸 수 있습니다.
//
// > 인용문
//
// ![그림 설명](figure.png)
// `,
//   }
export const ARTICLES = [];
