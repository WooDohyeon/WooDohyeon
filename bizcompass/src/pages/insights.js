// 인사이트 — 카드뉴스 목록과 넘겨 보는 뷰어
import { BASE } from './common.js';
import { INSIGHTS } from '../data/insights.js';
import { esc, icon } from '../render/util.js';

const grid = document.getElementById('insight-grid');
const tabs = document.getElementById('insight-tabs');
const empty = document.getElementById('insight-empty');
const count = document.getElementById('insight-count');

const src = (post, file) => (/^https?:\/\//.test(file) ? file : `${BASE}insights/${encodeURIComponent(post.id)}/${encodeURIComponent(file)}`);
const state = { category: '' };

function card(post) {
  return `<button type="button" class="insight-card" data-insight="${esc(post.id)}" aria-haspopup="dialog" aria-label="${esc(post.title)} 카드뉴스 보기 (${post.slides.length}장)">
    <span class="insight-cover">
      <img src="${esc(src(post, post.slides[0]))}" alt="" loading="lazy" decoding="async" />
      <span class="insight-pages">${icon('file', 14)} ${post.slides.length}장</span>
    </span>
    <span class="insight-body">
      <span class="insight-meta">${post.category ? `<span class="tag tag--second">${esc(post.category)}</span>` : ''}${post.date ? `<small>${esc(post.date)}</small>` : ''}</span>
      <strong>${esc(post.title)}</strong>
      ${post.summary ? `<span class="insight-summary">${esc(post.summary)}</span>` : ''}
    </span>
  </button>`;
}

function render() {
  const posts = INSIGHTS.filter((post) => post.slides?.length);
  const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))];
  const shown = posts.filter((post) => !state.category || post.category === state.category);
  count.textContent = String(posts.length);
  tabs.hidden = categories.length < 2;
  tabs.innerHTML = [['', '전체'], ...categories.map((name) => [name, name])]
    .map(([value, label]) => `<button type="button" class="chip" data-category="${esc(value)}" aria-pressed="${value === state.category}">${esc(label)}</button>`).join('');
  grid.innerHTML = shown.map(card).join('');
  grid.hidden = shown.length === 0;
  empty.hidden = shown.length !== 0;
}

tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

// ── 카드뉴스 뷰어: 옆으로 넘겨 봅니다. (버튼 · 방향키 · 터치 스와이프) ──
let dialog;
function openViewer(post) {
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'modal insight-viewer';
    dialog.setAttribute('aria-labelledby', 'insight-viewer-title');
    document.body.append(dialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-modal-close]')) dialog.close();
      const step = event.target.closest('[data-step]');
      if (step) move(Number(step.dataset.step));
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    });
    dialog.addEventListener('close', () => history.replaceState(null, '', location.pathname));
  }
  const total = post.slides.length;
  dialog.innerHTML = `<div class="insight-viewer-head">
      <div><span class="tag tag--second">${esc(post.category || '인사이트')}</span><h2 id="insight-viewer-title">${esc(post.title)}</h2></div>
      <button type="button" class="modal-close" data-modal-close aria-label="닫기">×</button>
    </div>
    <div class="insight-stage">
      <div class="insight-track" tabindex="0" aria-label="카드뉴스 ${total}장">${post.slides.map((file, index) => `<figure class="insight-slide"><img src="${esc(src(post, file))}" alt="${esc(post.title)} ${index + 1}번째 장" ${index ? 'loading="lazy"' : ''} /></figure>`).join('')}</div>
      <button type="button" class="insight-nav insight-nav--prev" data-step="-1" aria-label="이전 장">${icon('back', 20)}</button>
      <button type="button" class="insight-nav insight-nav--next" data-step="1" aria-label="다음 장">${icon('arrow', 20)}</button>
    </div>
    <p class="insight-counter" aria-live="polite"><b data-current>1</b> / ${total}</p>`;
  const track = dialog.querySelector('.insight-track');
  const update = () => {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    dialog.querySelector('[data-current]').textContent = String(index + 1);
    dialog.querySelector('.insight-nav--prev').disabled = index <= 0;
    dialog.querySelector('.insight-nav--next').disabled = index >= total - 1;
  };
  track.addEventListener('scroll', update, { passive: true });
  dialog.showModal();
  track.scrollLeft = 0;
  update();
  history.replaceState(null, '', `${location.pathname}?id=${encodeURIComponent(post.id)}`);
}

function move(step) {
  const track = dialog.querySelector('.insight-track');
  track.scrollBy({ left: step * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-insight]');
  const post = button && INSIGHTS.find((item) => item.id === button.dataset.insight);
  if (post) openViewer(post);
});

render();

// 주소에 ?id= 가 있으면 그 카드뉴스를 바로 엽니다. (공유 링크)
const linked = INSIGHTS.find((post) => post.id === new URLSearchParams(location.search).get('id'));
if (linked?.slides?.length) openViewer(linked);
