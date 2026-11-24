import { BASE } from './common.js';
import { loadForms, catalogForms } from '../lib/forms.js';
import { formCards } from '../render/forms.js';
import { esc } from '../render/util.js';

const grid = document.getElementById('form-grid');
const tabs = document.getElementById('form-tabs');
const search = document.getElementById('form-search');
const shown = document.getElementById('form-shown');
const empty = document.getElementById('form-empty');
const emptyTitle = document.getElementById('form-empty-title');
const emptyText = document.getElementById('form-empty-text');
const status = document.getElementById('form-status');

const state = { forms: catalogForms(), category: '', query: '', loaded: false };

function filtered() {
  const keyword = state.query.trim().toLowerCase();
  return state.forms.filter((form) => {
    if (state.category && form.category !== state.category) return false;
    if (!keyword) return true;
    return [form.title, form.description, form.category, form.formats.join(' ')].join(' ').toLowerCase().includes(keyword);
  });
}

function renderTabs() {
  const categories = [...new Set(state.forms.map((form) => form.category))];
  if (state.category && !categories.includes(state.category)) state.category = '';
  tabs.innerHTML = [['', '전체'], ...categories.map((name) => [name, name])]
    .map(([value, label]) => `<button type="button" class="chip" data-category="${esc(value)}" aria-pressed="${value === state.category}">${esc(label)}</button>`)
    .join('');
}

function render() {
  renderTabs();
  const result = filtered();
  // Storage 를 읽기 전에는 카탈로그를 상태 표시 없이 그대로 보여 줍니다.
  grid.innerHTML = formCards(state.loaded ? result : result.map(({ available, formats, ...form }) => form), BASE);
  grid.hidden = result.length === 0;
  empty.hidden = result.length !== 0;
  shown.textContent = String(result.length);
  if (!result.length) {
    const noForms = state.forms.length === 0;
    emptyTitle.textContent = noForms ? '아직 등록된 서식이 없어요' : '조건에 맞는 서식이 없어요';
    emptyText.textContent = noForms ? '서식이 등록되면 이곳에 표시됩니다.' : '검색어나 분류를 바꿔 다시 찾아보세요.';
  }
}

tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

search.addEventListener('input', () => {
  state.query = search.value;
  render();
});

// 서버에서 실제 파일 목록을 읽어 옵니다.
loadForms(BASE).then(({ forms, source }) => {
  state.forms = forms;
  state.loaded = true;
  grid.setAttribute('aria-busy', 'false');
  if (source === 'catalog' && forms.every((form) => !form.available)) {
    status.textContent = '서식 파일을 준비하고 있습니다. 잠시 후 다시 확인해 주세요.';
    status.hidden = false;
  }
  render();
});
