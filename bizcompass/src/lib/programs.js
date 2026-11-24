// 정부지원사업 공고 — 목록 불러오기와 상태·필터 계산 (브라우저)

/** 서버 함수(/api/programs)에서 공고 목록을 받아 옵니다. */
export async function fetchPrograms(base = '/', token = '') {
  const response = await fetch(`${base}api/programs/`, { headers: { accept: 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) } });
  if (!response.ok) throw new Error(`공고를 불러오지 못했습니다. (${response.status})`);
  const data = await response.json();
  if (!Array.isArray(data?.items)) throw new Error('공고 응답 형식이 올바르지 않습니다.');
  return data;
}

/** 한국 시간 기준 오늘 날짜 'YYYYMMDD' */
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now).replaceAll('-', '');
}

const toUtc = (key) => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)));
const daysBetween = (from, to) => Math.round((toUtc(to) - toUtc(from)) / 86400000);

export const CLOSING_SOON_DAYS = 7;

/**
 * 공고 상태.
 *  open(접수중) · closing(마감임박, 7일 이내) · upcoming(접수예정) · always(상시·수시) · closed(마감)
 */
export function statusOf(item, today = todayKey()) {
  if (!item.endDate) return { key: 'always', label: '상시·수시', note: item.periodText || '일정은 공고 원문에서 확인' };
  if (item.endDate < today) return { key: 'closed', label: '마감', note: '신청 기간이 종료된 공고' };
  if (item.startDate && item.startDate > today) {
    const days = daysBetween(today, item.startDate);
    return { key: 'upcoming', label: '접수예정', note: days === 1 ? '내일 접수 시작' : `${days}일 뒤 접수 시작` };
  }
  const left = daysBetween(today, item.endDate);
  const note = left === 0 ? '오늘 마감' : `마감까지 ${left}일`;
  return left <= CLOSING_SOON_DAYS ? { key: 'closing', label: '마감임박', note } : { key: 'open', label: '접수중', note };
}

export const STATUS_FILTERS = [
  { key: '', label: '전체' },
  { key: 'open', label: '접수중' },
  { key: 'closing', label: '마감임박' },
  { key: 'upcoming', label: '접수예정' },
  { key: 'always', label: '상시·수시' },
];

/** 상태 필터: '접수중'에는 마감임박 공고도 포함합니다. */
function matchesStatus(statusKey, filter) {
  if (!filter) return statusKey !== 'closed';
  if (filter === 'open') return statusKey === 'open' || statusKey === 'closing';
  return statusKey === filter;
}

export function formatDate(key) {
  return key ? `${key.slice(0, 4)}.${key.slice(4, 6)}.${key.slice(6, 8)}` : '';
}

export function periodLabel(item) {
  if (item.endDate) return `${formatDate(item.startDate)} ~ ${formatDate(item.endDate)}`;
  return item.periodText || '공고문 확인';
}

/**
 * 조건에 맞는 공고를 고릅니다. skip 에 넣은 조건은 무시합니다. (필터별 건수 계산용)
 * @param {{ status?: string, category?: string, region?: string, source?: string, query?: string }} filters
 */
export function filterPrograms(items, filters, today = todayKey(), skip = '') {
  const keyword = (filters.query || '').trim().toLowerCase();
  return items.filter((item) => {
    const status = statusOf(item, today).key;
    if (skip !== 'status' ? !matchesStatus(status, filters.status) : status === 'closed') return false;
    if (skip !== 'category' && filters.category && item.category !== filters.category) return false;
    if (skip !== 'region' && filters.region && !item.regions.includes(filters.region)) return false;
    if (skip !== 'source' && filters.source && !item.sources.includes(filters.source)) return false;
    if (!keyword) return true;
    return [item.title, item.organization, item.description, item.category, item.target, item.regions.join(' ')]
      .join(' ').toLowerCase().includes(keyword);
  });
}

const REGION_ORDER = ['전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '전남광주', '경북', '경남', '제주'];

function tally(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return counts;
}

/** 선택 상자에 넣을 항목과 건수 */
export function facetCounts(items, filters, today = todayKey()) {
  const categories = tally(filterPrograms(items, filters, today, 'category').map((item) => item.category));
  const regions = tally(filterPrograms(items, filters, today, 'region').flatMap((item) => item.regions));
  const sources = tally(filterPrograms(items, filters, today, 'source').flatMap((item) => item.sources));
  const statusItems = filterPrograms(items, filters, today, 'status');
  const statusKeys = tally(statusItems.map((item) => statusOf(item, today).key));

  // 건수가 0 이어도 고를 수 있도록, 전체 목록에 있는 항목은 모두 보여 줍니다.
  const allCategories = [...tally(items.map((item) => item.category)).entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  const allRegions = [...new Set(items.flatMap((item) => item.regions))]
    .sort((a, b) => (REGION_ORDER.indexOf(a) + 1 || 99) - (REGION_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b, 'ko'));
  const allSources = [...new Set(items.flatMap((item) => item.sources))];

  return {
    categories: allCategories.map((name) => ({ name, count: categories.get(name) || 0 })),
    regions: allRegions.map((name) => ({ name, count: regions.get(name) || 0 })),
    sources: allSources.map((name) => ({ name, count: sources.get(name) || 0 })),
    statuses: STATUS_FILTERS.map((status) => ({
      ...status,
      count: status.key === ''
        ? statusItems.length
        : status.key === 'open'
          ? (statusKeys.get('open') || 0) + (statusKeys.get('closing') || 0)
          : statusKeys.get(status.key) || 0,
    })),
  };
}
