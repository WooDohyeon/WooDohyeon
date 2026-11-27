// 인사이트 — 카드뉴스(목록 · 넘겨 보는 뷰어)와 아티클 목록
import { BASE } from './common.js';
import { loadInsights, fileSrc } from '../lib/insights.js';
import { readMinutes } from '../lib/articles.js';
import { esc, icon } from '../render/util.js';

const grid = document.getElementById('insight-grid');
const tabs = document.getElementById('insight-tabs');
const empty = document.getElementById('insight-empty');
const count = document.getElementById('insight-count');

const src = (post, file) => fileSrc(post, file, BASE);
const state = { category: '' };
// 노션에 올린 내용을 받아 오기 전까지는 빈 목록입니다.
let INSIGHTS = [];
let ARTICLES = [];

function card(post) {
  return `<button type="button" class="insight-card" data-insight="${esc(post.id)}" aria-haspopup="dialog" aria-label="${esc(post.title)} 카드뉴스 보기 (${post.slides.length}장)">
    <span class="insight-cover">
      <img src="${esc(src(post, post.slides[0]))}" alt="" loading="lazy" decoding="async" />
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
  grid.scrollLeft = 0;
  updateRow();
}

// 카드뉴스 목록 좌우 넘기기: 더 넘길 곳이 있을 때만 버튼을 보여 줍니다.
const prev = document.getElementById('insight-prev');
const next = document.getElementById('insight-next');
function updateRow() {
  const max = grid.scrollWidth - grid.clientWidth;
  prev.hidden = max <= 1 || grid.scrollLeft <= 1;
  next.hidden = max <= 1 || grid.scrollLeft >= max - 1;
}
const stepRow = (direction) => grid.scrollBy({ left: direction * grid.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
prev.addEventListener('click', () => stepRow(-1));
next.addEventListener('click', () => stepRow(1));
grid.addEventListener('scroll', updateRow, { passive: true });
addEventListener('resize', updateRow);

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
    dialog.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.hash));
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

// ── 아티클 목록 ─────────────────────────────────────────────
const articleList = document.getElementById('article-list');
const articleTabs = document.getElementById('article-tabs');
const articleEmpty = document.getElementById('article-empty');
const articleState = { category: '' };

function articleItem(post) {
  // 썸네일을 글 정보와 분리해 위쪽에 크게 보여 줍니다. 대표 이미지가 없으면 분류 이름을 넣은 빈 표지를 둡니다.
  const cover = post.cover
    ? `<img src="${esc(src(post, post.cover))}" alt="" loading="lazy" decoding="async" />`
    : `<span class="article-thumb-blank">${esc(post.category || 'OZ BizLab')}</span>`;
  return `<li><a class="article-item" href="${BASE}insights/post/?id=${encodeURIComponent(post.id)}">
    <span class="article-thumb">${cover}</span>
    <span class="article-item-body">
      <span class="insight-meta">${post.category ? `<span class="tag tag--second">${esc(post.category)}</span>` : ''}<small>${esc([post.date, post.body ? `읽는 시간 ${readMinutes(post.body)}분` : ''].filter(Boolean).join(' · '))}</small></span>
      <strong>${esc(post.title)}</strong>
      ${post.summary ? `<span class="insight-summary">${esc(post.summary)}</span>` : ''}
      <span class="article-read">읽어 보기 ${icon('arrow', 16)}</span>
    </span>
  </a></li>`;
}

function renderArticles() {
  const categories = [...new Set(ARTICLES.map((post) => post.category).filter(Boolean))];
  const shown = ARTICLES.filter((post) => !articleState.category || post.category === articleState.category);
  document.getElementById('article-count').textContent = String(ARTICLES.length);
  articleTabs.hidden = categories.length < 2;
  articleTabs.innerHTML = [['', '전체'], ...categories.map((name) => [name, name])]
    .map(([value, label]) => `<button type="button" class="chip" data-category="${esc(value)}" aria-pressed="${value === articleState.category}">${esc(label)}</button>`).join('');
  articleList.innerHTML = shown.map(articleItem).join('');
  articleList.hidden = shown.length === 0;
  articleEmpty.hidden = shown.length !== 0;
}

articleTabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  articleState.category = button.dataset.category;
  renderArticles();
});

// 목록을 받아 오는 동안에는 '준비 중' 안내 대신 불러오는 중임을 보여 줍니다.
grid.setAttribute('aria-busy', 'true');
articleList.setAttribute('aria-busy', 'true');
grid.innerHTML = '<p class="insight-loading">카드뉴스를 불러오고 있어요</p>';
articleList.innerHTML = '<li class="insight-loading">아티클을 불러오고 있어요</li>';

loadInsights(BASE).then((data) => {
  INSIGHTS = data.cardnews;
  ARTICLES = data.articles;
  grid.removeAttribute('aria-busy');
  articleList.removeAttribute('aria-busy');
  render();
  renderArticles();
  // 주소에 ?id= 가 있으면 그 카드뉴스를 바로 엽니다. (공유 링크)
  const linked = INSIGHTS.find((post) => post.id === new URLSearchParams(location.search).get('id'));
  if (linked) openViewer(linked);
});
