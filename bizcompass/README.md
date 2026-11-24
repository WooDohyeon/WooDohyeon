# 비즈컴퍼스 (BizCompass)

창업의 방향을 찾다 — 정부지원사업 로드맵, 준비서류, 실무 레퍼런스, 계약 서식을 모은 창업 정보 사이트입니다.

## 실행

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 만들어지며, 정적 호스팅(Vercel, Firebase Hosting 등) 어디에나 올릴 수 있습니다.
Vercel 프로젝트는 Root Directory 를 `bizcompass` 로 지정해 연결하며, 빌드 설정은 `vercel.json` 에 있습니다.
도메인 루트가 아닌 하위 경로에 올릴 때는 `BASE_PATH=/경로/ npm run build` 로 빌드합니다.

## 페이지

| 주소 | 내용 | 데이터 |
| --- | --- | --- |
| `/` | 메인 | 아래 페이지 내용을 요약 |
| `/programs/` | 정부지원사업 로드맵 | `src/data/roadmap.js` |
| `/programs/notices/` | 지원사업 공고 | **API 연동 예정** (현재 안내 화면) |
| `/programs/documents/` | 준비서류 | `src/data/documents.js` |
| `/references/` | 레퍼런스 | **Firebase Realtime Database** |
| `/forms/`, `/forms/view/?id=…` | 서식 | **Firebase Storage** |

## 디자인

- 색상 (60 · 30 · 10): 메인 `#ECEBE6`, 세컨드 `#2A2D34`, 어센트 `#2F5BFF` — `src/styles/main.css` 맨 위 `:root` 에서 바꿉니다.
- 폰트: Pretendard (npm 패키지로 함께 빌드)

## Firebase

설정값은 `src/lib/firebase-config.js` 에 있습니다. (프로젝트 `dohyeon-da2f1`)

### 레퍼런스 — Realtime Database

`sheetsData/sheetsData` 경로의 구글 시트 데이터를 실시간으로 읽습니다. 시트를 고치면 사이트에 바로 반영됩니다.

| 서비스 명 | 카테고리 | 링크 | 설명 (선택) |
| --- | --- | --- | --- |
| 혁신의숲 | 창업/스타트업, 투자 | https://www.innoforest.co.kr/ | 국내 스타트업의 … |

- 카테고리는 쉼표로 여러 개를 적을 수 있습니다. 시트의 `지원사업` 은 사이트에서 `정부지원사업` 으로 표시됩니다.
- `설명` 열을 추가하면 그 문구를 쓰고, 없으면 `src/data/references.seed.js` 에 있는 소개 문구를 씁니다.
- 연결이 안 될 때는 `src/data/references.seed.js` 의 기본 목록을 보여 줍니다.

### 서식 — Storage

Storage 의 `forms/` 폴더에 파일을 올리면 서식 페이지에 자동으로 나타납니다.

1. Firebase 콘솔 → Storage → `forms` 폴더를 만들고 `firebase/storage-seed/forms/` 안의 파일 6개를 올립니다.
2. Storage 규칙을 `firebase/storage.rules` 내용으로 바꿉니다. (콘솔의 규칙 탭에 붙여 넣거나 `firebase deploy --only storage`)

파일 이름 규칙:

- `forms/nda.pdf`, `forms/nda.docx` 처럼 **이름이 같은 파일은 한 서식의 여러 형식**으로 묶입니다. PDF 가 있으면 미리보기가 됩니다.
- `forms/투자/투자계약서.hwp` 처럼 하위 폴더에 넣으면 **폴더 이름이 분류**가 됩니다.
- 제목·소개 문구는 `src/data/forms.catalog.js` 에 파일 이름(확장자 제외)과 같은 `id` 로 적습니다. 적지 않으면 파일 이름이 제목이 됩니다.

### 정부지원사업 공고 — 예정

`programs/notices/index.html` 의 `#program-list` 자리에 공공데이터포털(기업마당 · K-Startup) API 연동 결과를 넣을 예정입니다.
API 키는 브라우저에 노출되지 않도록 서버(서버리스 함수 등)를 거쳐 호출해야 합니다.

## 구조

```
index.html, programs/, references/, forms/   페이지 (HTML)
src/data/      로드맵 · 준비서류 · 서식 카탈로그 · 레퍼런스 기본 목록
src/lib/       Firebase 연결 (Realtime Database, Storage)
src/render/    공통 머리글/바닥글과 카드 렌더링 (빌드 시 HTML 에 채워짐)
src/pages/     페이지별 동작
src/styles/    스타일
firebase/      Storage 규칙, 업로드용 서식 파일
```

HTML 안의 `<!--@header-->` 같은 표시는 빌드할 때 `src/render/` 의 함수 결과로 바뀝니다. (`vite.config.js`)
