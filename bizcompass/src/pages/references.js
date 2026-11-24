import { watchLogos } from './common.js';
import { subscribeReferences } from '../lib/references.js';
import { REFERENCE_SEED, filterReferences, categoryCounts } from '../lib/references-model.js';
import { referenceCards, categoryTabs } from '../render/references.js';

const grid = document.getElementById('ref-grid');
const tabs = document.getElementById('ref-tabs');
const search = document.getElementById('ref-search');
const shown = document.getElementById('ref-shown');
const total = document.getElementById('ref-total');
const empty = document.getElementById('ref-empty');
const status = document.getElementById('ref-status');

const params = new URLSearchParams(location.search);
const state = {
  list: REFERENCE_SEED,
  category: params.get('category') || '',
  query: params.get('q') || '',
};

function syncUrl() {
  const url = new URL(location.href);
  state.category ? url.searchParams.set('category', state.category) : url.searchParams.delete('category');
  state.query ? url.searchParams.set('q', state.query) : url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

function render() {
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

search.value = state.query;
if (state.category || state.query) render();

// Realtime Database 연결: 시트가 바뀌면 목록이 바로 갱신됩니다.
subscribeReferences(
  (list) => {
    state.list = list;
    status.hidden = true;
    render();
  },
  () => {
    status.textContent = '최신 목록 연결이 지연되고 있어 기본 목록을 보여 드립니다.';
    status.hidden = false;
  },
);
