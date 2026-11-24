import { esc, compassMark, icon } from './util.js';

export const SITE = {
  name: '비즈컴퍼스',
  tagline: '창업의 방향을 찾다',
  description: '정부지원사업, 창업 절차, 지역별 기관 정보를 한곳에서 확인하는 창업 정보 플랫폼',
  footer: '창업의 방향을 찾는 가장 쉬운 방법',
};

export const NAV = [
  { id: 'programs', label: '정부지원사업', path: 'programs/' },
  { id: 'references', label: '레퍼런스', path: 'references/' },
  { id: 'forms', label: '서식', path: 'forms/' },
];

export function head({ title = '', description = SITE.description, base }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | ${SITE.tagline}`;
  return `<meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(fullTitle)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#ECEBE6" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(SITE.name)}" />
    <meta property="og:title" content="${esc(fullTitle)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta name="twitter:card" content="summary" />
    <link rel="icon" type="image/svg+xml" href="${base}favicon.svg" />
    <link rel="stylesheet" href="/src/styles/main.css" />`;
}

export function header({ active = '', base }) {
  const links = NAV.map((item) => `<a href="${base}${item.path}"${item.id === active ? ' aria-current="page"' : ''}>${esc(item.label)}</a>`).join('');
  return `<a class="skip-link" href="#main">본문으로 건너뛰기</a>
  <header class="site-header">
    <div class="wrap site-header-inner">
      <a class="brand" href="${base}" aria-label="${SITE.name} 홈">${compassMark(32)}<span>${SITE.name}</span></a>
      <nav class="site-nav" aria-label="주요 메뉴">${links}</nav>
    </div>
  </header>`;
}

export function footer({ base }) {
  const links = NAV.map((item) => `<a href="${base}${item.path}">${esc(item.label)}</a>`).join('');
  return `<footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <a class="brand" href="${base}" aria-label="${SITE.name} 홈">${compassMark(36)}<span>${SITE.name}</span></a>
          <p>${SITE.footer}</p>
        </div>
        <nav class="footer-nav" aria-label="바닥글 메뉴">
          ${links}
          <a href="${base}programs/documents/">준비서류</a>
        </nav>
      </div>
      <div class="footer-bottom">
        <small>© 2026 BizCompass.</small>
        <small>지원사업 정보 출처:
          <a href="https://www.bizinfo.go.kr" target="_blank" rel="noopener noreferrer">기업마당</a> ·
          <a href="https://www.k-startup.go.kr" target="_blank" rel="noopener noreferrer">K-Startup</a>
        </small>
      </div>
    </div>
  </footer>`;
}

// 정부지원사업 하위 메뉴
const PROGRAM_TABS = [
  { id: 'roadmap', label: '로드맵', path: 'programs/' },
  { id: 'notices', label: '지원사업 공고', path: 'programs/notices/' },
  { id: 'documents', label: '준비서류', path: 'programs/documents/' },
];

export function programsHero({ active = 'roadmap', base }) {
  const tabs = PROGRAM_TABS.map((tab) => `<a href="${base}${tab.path}"${tab.id === active ? ' aria-current="page"' : ''}>${esc(tab.label)}</a>`).join('');
  return `<section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">정부지원사업</p>
      <h1>내 단계에 맞는 <span class="hl">지원사업</span>을 찾아보세요</h1>
      <p class="page-hero-lead">창업 단계별 로드맵과 최신 지원사업 공고, 신청 전에 챙길 준비서류를 한곳에 정리했습니다.</p>
      <nav class="subnav" aria-label="정부지원사업 하위 메뉴">${tabs}</nav>
    </div>
  </section>`;
}

export { icon };
