import { esc, icon } from './util.js';
import { statusOf, periodLabel } from '../lib/programs.js';

const STATUS_TONE = { open: 'second', closing: 'accent', upcoming: 'plain', always: 'plain', closed: 'plain' };

/** 공고 카드 */
export function programCard(item, today) {
  const status = statusOf(item, today);
  const sources = item.sources.map((name) => `<span class="notice-source">${esc(name)}</span>`).join('');
  const facts = [
    ['신청 기간', periodLabel(item)],
    ['지원 대상', item.target || '공고문 확인'],
    item.stage ? ['업력', item.stage] : null,
    ['분야 · 지역', `${item.category} · ${item.regions.join(', ')}`],
  ].filter(Boolean);

  return `<li>
    <article class="notice-card">
      <div class="notice-top">
        <span class="tag tag--${STATUS_TONE[status.key]}">${esc(status.label)}</span>
        <span class="notice-due">${esc(status.note)}</span>
        <span class="notice-sources">${sources}</span>
      </div>
      <h3><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3>
      <p class="notice-org">${esc(item.organization)}</p>
      <dl class="notice-facts">${facts.map(([term, value]) => `<div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
      <div class="notice-foot">
        ${item.description ? `<details><summary>사업 내용 보기</summary><p>${esc(item.description)}</p></details>` : '<span></span>'}
        <a class="notice-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.title)} 원문 보기 (새 탭)">원문 보기 ${icon('external', 16)}</a>
      </div>
    </article>
  </li>`;
}

export function programCards(items, today) {
  return items.map((item) => programCard(item, today)).join('');
}

/** 불러오는 동안 보여 주는 자리 표시 */
export function programSkeleton(count = 4) {
  return Array.from({ length: count }, () => `<li><div class="notice-card is-skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span></div></li>`).join('');
}

/** 페이지 이동 버튼 */
export function pagination(page, pageCount) {
  if (pageCount <= 1) return '';
  const windowSize = 5;
  const start = Math.max(1, Math.min(page - Math.floor(windowSize / 2), pageCount - windowSize + 1));
  const pages = Array.from({ length: Math.min(windowSize, pageCount) }, (_, index) => start + index);
  const button = (target, label, { current = false, disabled = false, aria = '' } = {}) => `<button type="button" class="page-btn" data-page="${target}"${current ? ' aria-current="page"' : ''}${disabled ? ' disabled' : ''}${aria ? ` aria-label="${aria}"` : ''}>${label}</button>`;
  return [
    button(page - 1, '이전', { disabled: page === 1, aria: '이전 페이지' }),
    ...pages.map((number) => button(number, number, { current: number === page, aria: `${number}페이지` })),
    button(page + 1, '다음', { disabled: page === pageCount, aria: '다음 페이지' }),
  ].join('');
}

export function optionList(options, selected, allLabel) {
  return [`<option value="">${esc(allLabel)}</option>`, ...options.map((option) => `<option value="${esc(option.name)}"${option.name === selected ? ' selected' : ''}>${esc(option.name)} (${option.count})</option>`)].join('');
}
