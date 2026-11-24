import { esc, icon } from './util.js';
import { REFERENCE_SEED, categoryCounts, faviconUrl, hostOf } from '../lib/references-model.js';

export function referenceCard(item) {
  const badges = item.categories.map((name) => `<span class="tag">${esc(name)}</span>`).join('');
  const favicon = faviconUrl(item.url);
  return `<a class="ref-card" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.name)} 사이트 열기 (새 탭)">
    <div class="ref-card-top">
      <span class="ref-logo" data-initial="${esc([...item.name][0] || '')}">${favicon ? `<img src="${esc(favicon)}" alt="" width="32" height="32" loading="lazy" decoding="async" />` : ''}</span>
      <span class="ref-arrow">${icon('external', 18)}</span>
    </div>
    <h3>${esc(item.name)}</h3>
    <p class="ref-host">${esc(hostOf(item.url))}</p>
    ${item.description ? `<p class="ref-desc">${esc(item.description)}</p>` : ''}
    <div class="ref-tags">${badges}</div>
  </a>`;
}

export function referenceCards(list) {
  return list.map(referenceCard).join('');
}

/** 레퍼런스 페이지 카테고리 탭 (버튼) */
export function categoryTabs(list, active = '') {
  const tabs = [{ name: '', label: '전체', count: list.length }, ...categoryCounts(list).map((item) => ({ ...item, label: item.name }))];
  return tabs.map((tab) => `<button type="button" class="chip" data-category="${esc(tab.name)}" aria-pressed="${tab.name === active}">${esc(tab.label)} <span>${tab.count}</span></button>`).join('');
}

/** 메인 페이지 카테고리 바로가기 (링크) */
export function categoryLinks(list, base) {
  return categoryCounts(list).map((item) => `<a class="chip" href="${base}references/?category=${encodeURIComponent(item.name)}">${esc(item.name)} <span>${item.count}</span></a>`).join('');
}

// ── 빌드 시 미리 렌더링 (기본 목록 기준) ─────────────────────────
export function referenceGridSeed() {
  return referenceCards(REFERENCE_SEED);
}

export function referenceTabsSeed() {
  return categoryTabs(REFERENCE_SEED);
}

export function referenceCount() {
  return String(REFERENCE_SEED.length);
}

export function referencePreview({ base }) {
  return `<div class="chips" data-ref-categories>${categoryLinks(REFERENCE_SEED, base)}</div>
    <div class="ref-grid ref-grid--preview" data-ref-preview>${referenceCards(REFERENCE_SEED.slice(0, 8))}</div>`;
}
