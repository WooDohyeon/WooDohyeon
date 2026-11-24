// 정부지원사업 공고 — 공공데이터포털의 기업마당 · K-Startup API 를 불러와 한 가지 형태로 정리합니다.
// 서버(Vercel 함수, 로컬 개발 서버)에서만 실행됩니다. 인증키는 브라우저로 전달되지 않습니다.

const BIZINFO_URL = 'https://apis.data.go.kr/1421000/bizinfo/pblancBsnsService';
const KSTARTUP_URL = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '전남광주'];
const REGION_ALIASES = {
  서울특별시: '서울', 경기도: '경기', 인천광역시: '인천', 부산광역시: '부산', 대구광역시: '대구', 광주광역시: '광주',
  대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종', 강원특별자치도: '강원', 강원도: '강원',
  충청북도: '충북', 충청남도: '충남', 전북특별자치도: '전북', 전라북도: '전북', 전라남도: '전남',
  경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주', 전남광주통합특별시: '전남광주',
};
const DESCRIPTION_LIMIT = 320;

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", middot: '·', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', bull: '•', rarr: '→', times: '×' };

/** HTML 조각 → 한 줄짜리 일반 글 */
export function toPlainText(value) {
  return String(value ?? '')
    .replace(/<(br|\/p|\/div|\/li|\/tr)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}

function shorten(text, limit = DESCRIPTION_LIMIT) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, '')}…`;
}

/** '2026-11-23', '20261123', '2026.11.23' → '20261123' (날짜가 아니면 '') */
function toDateKey(value) {
  const match = String(value ?? '').match(/(\d{4})[-.\/]?(\d{2})[-.\/]?(\d{2})/);
  return match ? `${match[1]}${match[2]}${match[3]}` : '';
}

function safeUrl(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function normalizeRegion(name) {
  const key = String(name ?? '').trim();
  if (!key) return '';
  if (key === '전국') return '전국';
  return REGION_ALIASES[key] || (REGIONS.includes(key) ? key : key);
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

async function fetchJson(url, { retries = 2, timeoutMs = 30000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { accept: 'application/json' } });
      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      try {
        return JSON.parse(text);
      } catch {
        // 인증키 오류 등은 XML 로 내려옵니다.
        const reason = text.match(/<returnAuthMsg>([^<]*)</)?.[1] || text.match(/"returnAuthMsg"\s*:\s*"([^"]*)"/)?.[1];
        throw new Error(reason || 'JSON 이 아닌 응답');
      }
    } catch (error) {
      // 'fetch failed' 만으로는 원인을 알 수 없어 연결 오류 코드를 함께 남깁니다.
      const cause = error?.cause?.code || error?.cause?.message;
      lastError = cause ? new Error(`${error.message} (${cause})`) : error;
      if (attempt < retries) await new Promise((resolve) => { setTimeout(resolve, 600 * (attempt + 1)); });
    }
  }
  throw lastError;
}

// ── 기업마당 ───────────────────────────────────────────────────
function bizinfoRegions(item) {
  // 제목 앞의 [경기], [대구ㆍ경북] 표시가 가장 정확합니다.
  const prefix = String(item.pblancNm ?? '').match(/^\s*\[([^\]]+)\]/)?.[1];
  if (prefix) {
    const fromTitle = uniq(prefix.split(/[ㆍ·,\/\s]+/).map(normalizeRegion)).filter((name) => name === '전국' || REGIONS.includes(name));
    if (fromTitle.length) return fromTitle;
  }
  const tags = String(item.hashtags ?? '').split(',').map((tag) => tag.trim());
  const fromTags = uniq(tags.map(normalizeRegion)).filter((name) => REGIONS.includes(name));
  // 지역 표시가 없거나 대부분의 시·도가 나열된 공고는 전국 대상으로 봅니다.
  return fromTags.length === 0 || fromTags.length >= 8 ? ['전국'] : fromTags;
}

function normalizeBizinfo(item) {
  const title = toPlainText(item.pblancNm);
  const url = safeUrl(item.pblancUrl);
  if (!title || !url) return null;
  const periodRaw = toPlainText(item.reqstBeginEndDe);
  const range = periodRaw.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
  return {
    id: String(item.pblancId || url),
    sources: ['기업마당'],
    title,
    organization: uniq([toPlainText(item.jrsdInsttNm), toPlainText(item.excInsttNm)]).join(' · '),
    category: toPlainText(item.pldirSportRealmLclasCodeNm) || '기타',
    regions: bizinfoRegions(item),
    target: toPlainText(item.trgetNm),
    stage: '',
    startDate: range ? toDateKey(range[1]) : '',
    endDate: range ? toDateKey(range[2]) : '',
    periodText: range ? '' : periodRaw,
    postedDate: toDateKey(item.creatPnttm),
    description: shorten(toPlainText(item.bsnsSumryCn)),
    url,
  };
}

async function loadBizinfo(serviceKey) {
  const pageSize = 1000;
  const items = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `${BIZINFO_URL}?serviceKey=${encodeURIComponent(serviceKey)}&pageNo=${page}&numOfRows=${pageSize}&dataType=json`;
    const data = await fetchJson(url);
    const header = data?.response?.header;
    if (header && header.resultCode !== '00') throw new Error(header.resultMsg || `resultCode ${header.resultCode}`);
    const body = data?.response?.body;
    if (!body) throw new Error(data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnAuthMsg || '응답 형식이 올바르지 않습니다.');
    const rows = body.items?.item ?? [];
    items.push(...(Array.isArray(rows) ? rows : [rows]));
    if (items.length >= Number(body.totalCount || 0) || rows.length === 0) break;
  }
  return items.map(normalizeBizinfo).filter(Boolean);
}

// ── K-Startup ──────────────────────────────────────────────────
/** '대학생,일반인,일반기업,1인 창조기업' → '대학생, 일반인, 일반기업 외 1' */
function summarizeList(value, limit) {
  const parts = uniq(String(value ?? '').split(',').map((part) => part.trim()));
  if (parts.length <= limit) return parts.join(', ');
  return `${parts.slice(0, limit).join(', ')} 외 ${parts.length - limit}`;
}

/** '예비창업자,1년미만,…,10년미만' → '예비창업자 ~ 10년미만' */
function summarizeStage(value) {
  const parts = uniq(String(value ?? '').split(',').map((part) => part.trim()));
  if (parts.length <= 2) return parts.join(', ');
  return `${parts[0]} ~ ${parts[parts.length - 1]}`;
}

function normalizeKstartup(item) {
  const title = toPlainText(item.biz_pbanc_nm);
  const url = safeUrl(item.detl_pg_url) || safeUrl(item.biz_gdnc_url);
  if (!title || !url) return null;
  const regions = uniq(String(item.supt_regin ?? '').split(/[,ㆍ·\/]+/).map(normalizeRegion));
  const description = [toPlainText(item.pbanc_ctnt), toPlainText(item.aply_trgt_ctnt)].filter(Boolean).join(' ☞ ');
  return {
    id: `KS_${item.pbanc_sn ?? url}`,
    sources: ['K-Startup'],
    title,
    organization: uniq([toPlainText(item.pbanc_ntrp_nm), toPlainText(item.sprv_inst)]).join(' · '),
    category: toPlainText(item.supt_biz_clsfc) || '기타',
    regions: regions.length ? regions : ['전국'],
    target: summarizeList(item.aply_trgt, 3),
    stage: summarizeStage(item.biz_enyy),
    startDate: toDateKey(item.pbanc_rcpt_bgng_dt),
    endDate: toDateKey(item.pbanc_rcpt_end_dt),
    periodText: '',
    postedDate: toDateKey(item.pbanc_rcpt_bgng_dt),
    description: shorten(description),
    url,
  };
}

async function loadKstartup(serviceKey) {
  const perPage = 200;
  const items = [];
  for (let page = 1; page <= 10; page += 1) {
    // 모집 중인 공고만 가져옵니다.
    const url = `${KSTARTUP_URL}?serviceKey=${encodeURIComponent(serviceKey)}&page=${page}&perPage=${perPage}&returnType=json&${encodeURIComponent('cond[rcrt_prgs_yn::EQ]')}=Y`;
    const data = await fetchJson(url);
    if (!Array.isArray(data?.data)) throw new Error(data?.msg || data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnAuthMsg || '응답 형식이 올바르지 않습니다.');
    items.push(...data.data);
    if (items.length >= Number(data.matchCount || 0) || data.data.length === 0) break;
  }
  return items.map(normalizeKstartup).filter(Boolean);
}

// ── 합치기 ─────────────────────────────────────────────────────
const titleKey = (title) => title.replace(/^\s*\[[^\]]+\]\s*/, '').replace(/[^0-9a-zA-Z가-힣]/g, '').toLowerCase();

/** 같은 공고가 두 곳에 모두 올라온 경우 하나로 묶습니다. (같은 출처 안에서는 묶지 않습니다.) */
function merge(lists) {
  const merged = [];
  const byTitle = new Map();
  lists.flat().forEach((item) => {
    const key = titleKey(item.title);
    const existing = key ? byTitle.get(key) : null;
    if (!existing || existing.sources.includes(item.sources[0])) {
      merged.push(item);
      if (key && !existing) byTitle.set(key, item);
      return;
    }
    existing.sources = uniq([...existing.sources, ...item.sources]);
    existing.stage ||= item.stage;
    // 신청 기간이 한쪽에만 있으면 채워 넣습니다.
    if (!existing.endDate && item.endDate) Object.assign(existing, { startDate: item.startDate, endDate: item.endDate, periodText: '' });
  });
  // 접수 시작일(없으면 등록일) 최신순
  const sortKey = (item) => item.startDate || item.postedDate || '';
  return merged.sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || a.title.localeCompare(b.title, 'ko'));
}

/**
 * 기업마당 · K-Startup 공고를 불러옵니다.
 * 한쪽이 실패해도 다른 쪽 결과는 돌려주고, 실패 내용은 warnings 에 담습니다.
 */
export async function loadPrograms(serviceKey) {
  if (!serviceKey) throw new Error('DATA_GO_KR_SERVICE_KEY 환경변수가 설정되지 않았습니다.');
  const providers = [
    { name: '기업마당', agency: '중소벤처기업부', load: loadBizinfo },
    { name: 'K-Startup', agency: '창업진흥원', load: loadKstartup },
  ];
  const results = await Promise.allSettled(providers.map((provider) => provider.load(serviceKey)));
  const warnings = [];
  const lists = results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    warnings.push(`${providers[index].name}: ${String(result.reason?.message || result.reason).slice(0, 120)}`);
    return [];
  });
  if (lists.every((list) => list.length === 0)) throw new Error(warnings.join(' / ') || '공고를 불러오지 못했습니다.');

  const items = merge(lists);
  return {
    items,
    total: items.length,
    providers: providers.map((provider, index) => ({ name: provider.name, agency: provider.agency, count: lists[index].length, ok: results[index].status === 'fulfilled' })),
    warnings,
    syncedAt: new Date().toISOString(),
  };
}
