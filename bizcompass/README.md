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
| `/programs/notices/` | 지원사업 공고 | **공공데이터포털 API** (기업마당 · K-Startup) |
| `/programs/documents/` | 준비서류 | `src/data/documents.js` |
| `/references/` | 레퍼런스 | **Firebase Realtime Database** |
| `/forms/`, `/forms/view/?id=…` | 서식 | **Firebase Storage** |
| `/signup/`, `/login/` | 회원가입 · 로그인(내 계정) | **Firebase Authentication** + Realtime Database |

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

### 회원가입 · 로그인 — Authentication

이메일·비밀번호로 가입하고, 가입 정보(이름 · 가입 유형 · 캠프 · 기수)는 Realtime Database 의 `users/{uid}` 에 **승인 대기(`pending`)** 상태로 저장합니다.

처음 한 번 해야 하는 설정:

1. Firebase 콘솔 → Authentication → **시작하기** → 로그인 방법에서 **이메일/비밀번호** 사용 설정
2. Realtime Database → 규칙에 `firebase/database.rules.example.json` 의 `users` 부분을 반영
   - 맨 위에 `".read": true` 가 있으면 반드시 지우고, 공개할 경로(`sheetsData`)에만 읽기를 허용해야 합니다. 위쪽 규칙이 열려 있으면 회원 정보가 누구에게나 보입니다.
   - `sheetsData` 에 쓰기 규칙이 있었다면 그대로 두세요. (구글 시트 동기화가 그 규칙으로 쓰고 있을 수 있습니다.)

동작 방식:

- 회원 정보 경로가 외부에서 읽히는 상태면 가입을 받지 않고 "회원 기능을 준비하고 있습니다" 안내를 띄웁니다. (이메일·이름 노출 방지)
- 가입 직후 상태는 `pending` 입니다. **승인**: Realtime Database → `users` → 해당 회원 → `status` 값을 `approved` 로 바꿉니다.
- 회원은 자기 정보를 읽을 수만 있고 고칠 수 없습니다. (스스로 승인 상태를 바꾸지 못하게 하기 위함)
- 선택 항목(가입 유형 · 캠프 · 기수)은 `src/data/membership.js` 에서 바꿉니다. 캠프·기수 범위를 바꾸면 규칙의 검증 조건도 함께 맞춰 주세요.
- 현재는 로그인 여부로 막는 페이지가 없습니다. 모든 페이지는 로그인 없이 볼 수 있습니다.

### 정부지원사업 공고 — 예정

공공데이터포털의 두 API 를 서버에서 불러와 하나의 목록으로 합쳐 보여 줍니다.

| 출처 | API |
| --- | --- |
| 기업마당 (중소벤처기업부) | `apis.data.go.kr/1421000/bizinfo/pblancBsnsService` |
| K-Startup (창업진흥원) | `apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01` (모집 중인 공고만) |

- 인증키는 **브라우저에 전달되지 않습니다.** Vercel 함수 `api/programs.js` 가 환경변수 `DATA_GO_KR_SERVICE_KEY` 로 호출하고, 정리된 목록만 `/api/programs` 로 내려 줍니다.
- 인증키 설정: Vercel 프로젝트 → Settings → Environment Variables 에 `DATA_GO_KR_SERVICE_KEY` (Production · Preview). 바꾼 뒤에는 다시 배포해야 반영됩니다.
- 로컬에서 볼 때는 `.env.local` 에 `DATA_GO_KR_SERVICE_KEY=…` 를 넣고 `npm run dev` 를 실행합니다.
- 함수는 서울 리전(`icn1`)에서 실행합니다. 공공데이터포털이 해외 리전(기본값 `iad1`)에서의 연결을 받지 않기 때문입니다. (`vercel.json` 의 `regions`)
- 응답은 CDN 이 30분 동안 보관합니다. 한쪽 API 가 실패하면 나머지 공고만 보여 주고 안내 문구를 띄웁니다.
- 같은 공고가 두 곳에 모두 있으면 하나로 묶어 출처를 함께 표시합니다. 상태(접수중 · 마감임박 · 접수예정 · 상시·수시)는 신청 기간을 기준으로 브라우저에서 계산합니다.

## 구조

```
index.html, programs/, references/, forms/   페이지 (HTML)
src/data/      로드맵 · 준비서류 · 서식 카탈로그 · 레퍼런스 기본 목록
src/lib/       Firebase 연결 (Realtime Database, Storage, 회원), 공고 필터 계산
server/        공고 API 호출·정리 (서버 전용)
api/           Vercel 함수 (/api/programs)
src/render/    공통 머리글/바닥글과 카드 렌더링 (빌드 시 HTML 에 채워짐)
src/pages/     페이지별 동작
src/styles/    스타일
firebase/      Storage 규칙, 데이터베이스 규칙 예시, 업로드용 서식 파일
```

HTML 안의 `<!--@header-->` 같은 표시는 빌드할 때 `src/render/` 의 함수 결과로 바뀝니다. (`vite.config.js`)
