// 레퍼런스 데이터 가공 (브라우저·서버·빌드에서 함께 쓰는 순수 함수)
// 목록 자체는 여기에 두지 않습니다. 전체 목록은 승인된 회원에게만 서버가 내려 줍니다.

// 탭에 보이는 카테고리 순서. 목록에 없는 새 카테고리는 뒤에 자동으로 붙습니다.
export const CATEGORY_ORDER = [
  '창업/스타트업', '시장/고객', '마케팅', 'UX/UI', '트렌드', '투자', '정부지원사업', '행사', 'MVP',
];

// 시트에 적힌 이름 → 사이트에 보이는 이름
const CATEGORY_ALIASES = { 지원사업: '정부지원사업' };

const HEADER_ALIASES = {
  name: ['서비스 명', '서비스명', '이름', '사이트', '사이트명', 'name', 'title'],
  categories: ['카테고리', '분류', 'category', 'categories'],
  url: ['링크', '주소', 'url', 'link', 'href'],
  description: ['설명', '소개', 'description'],
};

export function normalizeUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '').toLowerCase();
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function splitCategories(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(/[,，、]/);
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean).map((name) => CATEGORY_ALIASES[name] || name))];
}

function toReference({ name, categories, url, description }, descriptions) {
  const href = safeUrl(url);
  const title = String(name || '').trim();
  if (!href || !title) return null;
  return {
    name: title,
    categories: splitCategories(categories),
    url: href,
    description: String(description || '').trim() || descriptions.get(normalizeUrl(href)) || '',
  };
}

/**
 * Realtime Database 값 → 레퍼런스 목록.
 * - 구글 시트 형태(2차원 배열, 첫 줄이 머리글)와
 * - 객체 목록 형태({ name, categories, url, description }) 를 모두 받습니다.
 * descriptions: 시트에 소개 문구가 비어 있을 때 채워 넣을 문구 (주소 → 문구)
 */
export function parseReferences(value, descriptions = new Map()) {
  if (!value) return [];
  const rows = Array.isArray(value) ? value.filter(Boolean) : Object.values(value);
  if (!rows.length) return [];

  if (rows.every((row) => Array.isArray(row))) {
    const header = rows[0].map((cell) => String(cell || '').trim().toLowerCase());
    const indexOf = (key) => header.findIndex((cell) => HEADER_ALIASES[key].includes(cell));
    const hasHeader = indexOf('name') >= 0 || indexOf('url') >= 0;
    const col = {
      name: hasHeader ? indexOf('name') : 0,
      categories: hasHeader ? indexOf('categories') : 1,
      url: hasHeader ? indexOf('url') : 2,
      description: hasHeader ? indexOf('description') : 3,
    };
    return (hasHeader ? rows.slice(1) : rows)
      .map((row) => toReference({
        name: row[col.name],
        categories: col.categories >= 0 ? row[col.categories] : '',
        url: row[col.url],
        description: col.description >= 0 ? row[col.description] : '',
      }, descriptions))
      .filter(Boolean);
  }

  return rows
    .map((row) => (row && typeof row === 'object'
      ? toReference({
        name: row.name ?? row.title,
        categories: row.categories ?? row.category,
        url: row.url ?? row.href ?? row.link,
        description: row.description,
      }, descriptions)
      : null))
    .filter(Boolean);
}

/** [{ name, count }] — 정해 둔 순서 우선, 나머지는 가나다순 */
export function categoryCounts(list) {
  const counts = new Map();
  list.forEach((item) => item.categories.forEach((name) => counts.set(name, (counts.get(name) || 0) + 1)));
  const known = CATEGORY_ORDER.filter((name) => counts.has(name));
  const extra = [...counts.keys()].filter((name) => !CATEGORY_ORDER.includes(name)).sort((a, b) => a.localeCompare(b, 'ko'));
  return [...known, ...extra].map((name) => ({ name, count: counts.get(name) }));
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function faviconUrl(url) {
  try {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=64`;
  } catch {
    return '';
  }
}

export function filterReferences(list, { category = '', query = '' } = {}) {
  const keyword = query.trim().toLowerCase();
  return list.filter((item) => {
    if (category && !item.categories.includes(category)) return false;
    if (!keyword) return true;
    return [item.name, item.description, item.url, item.categories.join(' ')].join(' ').toLowerCase().includes(keyword);
  });
}
