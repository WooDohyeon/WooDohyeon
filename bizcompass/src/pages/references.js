import { BASE, watchLogos, watchAccess, gateBox } from './common.js';
import { getIdToken } from '../lib/auth.js';
import { fetchReferences } from '../lib/references.js';
import { filterReferences, categoryCounts } from '../lib/references-model.js';
import { referenceCards, categoryTabs } from '../render/references.js';

const grid = document.getElementById('ref-grid');
const tabs = document.getElementById('ref-tabs');
const search = document.getElementById('ref-search');
const shown = document.getElementById('ref-shown');
const total = document.getElementById('ref-total');
const empty = document.getElementById('ref-empty');
const status = document.getElementById('ref-status');
const controls = document.getElementById('ref-controls');
const gate = document.getElementById('ref-gate');
const gateCta = document.getElementById('ref-gate-cta');

const params = new URLSearchParams(location.search);
// 페이지에는 상위 4곳과 전체 개수만 들어 있습니다. 전체 목록은 승인된 회원에게만 서버가 내려 줍니다.
const guestMarkup = grid.innerHTML;
const guestShown = shown.textContent;
const totalCount = Number(total.textContent) || 0;

const state = {
  list: null, // 회원이 받아 온 전체 목록
  category: params.get('category') || '',
  query: params.get('q') || '',
  member: false,
};

function syncUrl() {
  const url = new URL(location.href);
  state.category ? url.searchParams.set('category', state.category) : url.searchParams.delete('category');
  state.query ? url.searchParams.set('q', state.query) : url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

/** 회원: 전체 목록과 검색·카테고리 */
function render() {
  if (!state.member || !state.list) return;
  // 목록이 바뀌어 선택한 카테고리가 사라졌다면 전체로 되돌립니다.
  if (state.category && !categoryCounts(state.list).some((item) => item.name === state.category)) state.category = '';

  const result = filterReferences(state.list, state);
  tabs.innerHTML = categoryTabs(state.list, state.category);
  grid.innerHTML = referenceCards(result);
  grid.hidden = result.length === 0;
  empty.hidden = result.length !== 0;
  shown.textContent = String(result.length);
  total.textContent = String(state.list.length);
  watchLogos(grid);
}

/** 비회원 · 승인 대기: 상위 4곳만 보여 주고 나머지는 가립니다. */
function renderGuest(level) {
  state.list = null;
  controls.hidden = true;
  empty.hidden = true;
  status.hidden = true;
  grid.hidden = false;
  grid.removeAttribute('aria-busy');
  grid.innerHTML = guestMarkup;
  shown.textContent = guestShown;
  total.textContent = String(totalCount);
  gate.hidden = false;
  gateCta.innerHTML = gateBox(level, {
    title: `나머지 ${Math.max(0, totalCount - Number(guestShown))}곳은 로그인 후 볼 수 있어요`,
    text: '로그인하면 전체 레퍼런스를 카테고리별로 찾아보고 검색할 수 있습니다.',
  });
  watchLogos(grid);
}

tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  syncUrl();
  render();
});

search.addEventListener('input', () => {
  state.query = search.value;
  syncUrl();
  render();
});

document.getElementById('ref-reset').addEventListener('click', () => {
  state.category = '';
  state.query = '';
  search.value = '';
  syncUrl();
  render();
});

let run = 0;
async function load() {
  const current = ++run;
  grid.setAttribute('aria-busy', 'true');
  try {
    const data = await fetchReferences(BASE, await getIdToken());
    if (current !== run || !state.member) return; // 그 사이 로그아웃했으면 버립니다.
    state.list = data.items;
    status.textContent = '최신 목록 연결이 지연되고 있어 기본 목록을 보여 드립니다.';
    status.hidden = data.source !== 'seed';
    render();
  } catch (error) {
    console.error(error);
    if (current !== run || !state.member) return;
    status.textContent = '전체 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
    status.hidden = false;
  } finally {
    if (current === run) grid.removeAttribute('aria-busy');
  }
}

watchAccess(({ level }) => {
  const wasMember = state.member;
  state.member = level === 'member';
  if (!state.member) {
    run += 1;
    renderGuest(level);
    return;
  }
  gate.hidden = true;
  controls.hidden = false;
  search.value = state.query;
  if (!wasMember || !state.list) load();
});
