import { BASE, watchAccess, gateBox } from './common.js';
import { getIdToken } from '../lib/auth.js';
import { fetchPrograms, filterPrograms, facetCounts, todayKey } from '../lib/programs.js';
import { programCards, programSkeleton, pagination, optionList } from '../render/programs.js';
import { esc } from '../render/util.js';

const PAGE_SIZE = 20;

const $ = (id) => document.getElementById(id);
const list = $('notice-list');
const pager = $('notice-pager');
const statusTabs = $('notice-status');
const search = $('notice-search');
const selects = { source: $('notice-source'), category: $('notice-category'), region: $('notice-region') };
const summary = $('notice-summary');
const total = $('notice-total');
const synced = $('notice-synced');
const empty = $('notice-empty');
const failed = $('notice-error');
const warning = $('notice-warning');
const controls = $('notice-controls');

const params = new URLSearchParams(location.search);
const state = {
  items: [],
  today: todayKey(),
  filters: {
    status: params.get('status') || '',
    category: params.get('category') || '',
    region: params.get('region') || '',
    source: params.get('source') || '',
    query: params.get('q') || '',
  },
  page: Math.max(1, Number(params.get('page')) || 1),
};

function syncUrl() {
  const url = new URL(location.href);
  const entries = { status: state.filters.status, category: state.filters.category, region: state.filters.region, source: state.filters.source, q: state.filters.query, page: state.page > 1 ? String(state.page) : '' };
  Object.entries(entries).forEach(([key, value]) => (value ? url.searchParams.set(key, value) : url.searchParams.delete(key)));
  history.replaceState(null, '', url);
}

function render({ scroll = false } = {}) {
  const facets = facetCounts(state.items, state.filters, state.today);
  // 목록에서 사라진 분류·지역이 선택되어 있으면 풀어 줍니다.
  ['category', 'region', 'source'].forEach((key) => {
    const names = (key === 'category' ? facets.categories : key === 'region' ? facets.regions : facets.sources).map((option) => option.name);
    if (state.filters[key] && !names.includes(state.filters[key])) state.filters[key] = '';
  });

  const result = filterPrograms(state.items, state.filters, state.today);
  const pageCount = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  state.page = Math.min(state.page, pageCount);
  const pageItems = result.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

  statusTabs.innerHTML = facets.statuses
    .map((status) => `<button type="button" class="chip" data-status="${status.key}" aria-pressed="${status.key === state.filters.status}">${esc(status.label)} <span>${status.count}</span></button>`)
    .join('');
  selects.source.innerHTML = optionList(facets.sources, state.filters.source, '전체 출처');
  selects.category.innerHTML = optionList(facets.categories, state.filters.category, '전체 분야');
  selects.region.innerHTML = optionList(facets.regions, state.filters.region, '전체 지역');

  list.innerHTML = programCards(pageItems, state.today);
  list.hidden = result.length === 0;
  empty.hidden = result.length !== 0;
  pager.innerHTML = pagination(state.page, pageCount);
  pager.hidden = pageCount <= 1;

  const first = (state.page - 1) * PAGE_SIZE + 1;
  summary.textContent = result.length
    ? `조건에 맞는 공고 ${result.length.toLocaleString('ko-KR')}건 중 ${first}–${first + pageItems.length - 1}번째`
    : '조건에 맞는 공고 0건';
  syncUrl();
  if (scroll) controls.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function update(changes) {
  Object.assign(state.filters, changes);
  state.page = 1;
  render();
}

statusTabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-status]');
  if (button) update({ status: button.dataset.status });
});

Object.entries(selects).forEach(([key, select]) => select.addEventListener('change', () => update({ [key]: select.value })));

let typing;
search.addEventListener('input', () => {
  clearTimeout(typing);
  typing = setTimeout(() => update({ query: search.value }), 180);
});

pager.addEventListener('click', (event) => {
  const button = event.target.closest('[data-page]');
  if (!button || button.disabled) return;
  state.page = Number(button.dataset.page);
  render({ scroll: true });
});

document.querySelectorAll('[data-notice-reset]').forEach((button) => button.addEventListener('click', () => {
  search.value = '';
  update({ status: '', category: '', region: '', source: '', query: '' });
}));

async function load() {
  failed.hidden = true;
  empty.hidden = true;
  list.hidden = false;
  list.setAttribute('aria-busy', 'true');
  list.innerHTML = programSkeleton();
  summary.textContent = '지원사업 공고를 불러오고 있어요';

  try {
    const data = await fetchPrograms(BASE, await getIdToken());
    state.items = data.items;
    state.today = todayKey();
    total.textContent = data.items.length.toLocaleString('ko-KR');
    if (data.syncedAt) {
      synced.textContent = `조회 기준 ${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(data.syncedAt))}`;
    }
    const down = (data.providers || []).filter((provider) => !provider.ok).map((provider) => provider.name);
    warning.textContent = down.length ? `${down.join(', ')} 공고를 일시적으로 불러오지 못해 나머지 공고만 보여 드립니다.` : '';
    warning.hidden = down.length === 0;
    controls.hidden = false;
    search.value = state.filters.query;
    render();
  } catch (error) {
    console.error(error);
    list.hidden = true;
    pager.hidden = true;
    controls.hidden = true;
    failed.hidden = false;
    summary.textContent = '';
    total.textContent = '–';
  } finally {
    list.setAttribute('aria-busy', 'false');
  }
}

$('notice-retry').addEventListener('click', load);

const gate = $('notice-gate');
const summaryRow = $('notice-summary-row');

// 공고 목록은 승인된 회원에게만 보여 줍니다. 비회원은 목록을 불러오지도 않습니다.
let loaded = false;
watchAccess(({ level }) => {
  if (level === 'member') {
    gate.hidden = true;
    summaryRow.hidden = false;
    if (!loaded) {
      loaded = true;
      load();
    }
    return;
  }
  loaded = false;
  state.items = [];
  list.innerHTML = '';
  list.hidden = true;
  pager.hidden = true;
  controls.hidden = true;
  empty.hidden = true;
  failed.hidden = true;
  summaryRow.hidden = true;
  total.textContent = '–';
  gate.hidden = false;
  gate.innerHTML = gateBox(level, {
    title: '공고 목록은 로그인 후 볼 수 있어요',
    text: '로그인하면 기업마당과 K-Startup 공고를 상태 · 분야 · 지역별로 찾아볼 수 있습니다.',
  });
});
