import { esc, icon } from './util.js';
import { COMMON_DOCS, APPLICANT_TYPES, classifyDoc } from '../data/documents.js';

const pad = (index) => String(index + 1).padStart(2, '0');

/** 공통 필수 준비서류 10종 — 상세 카드 */
export function commonDocs() {
  return `<div class="doc-grid">${COMMON_DOCS.map((doc, index) => `
    <article class="doc-card">
      <header>
        <span class="doc-index" aria-hidden="true">${pad(index)}</span>
        <h3>${esc(doc.name)}</h3>
      </header>
      <p>${esc(doc.what)}</p>
      <dl>
        <dt>미리 준비하면</dt>
        <dd>${esc(doc.benefit)}</dd>
      </dl>
      <details>
        <summary>준비·갱신 요령</summary>
        <p>${esc(doc.tip)}</p>
      </details>
    </article>`).join('')}</div>`;
}

/** 신청자 유형별 기본 준비서류 — 유형 선택 + 목록 */
export function applicantDocs() {
  const defaultIndex = APPLICANT_TYPES.length - 1;
  const picker = APPLICANT_TYPES.map((type, index) => `
    <button type="button" class="applicant-tab" role="tab" id="applicant-tab-${type.id}" data-applicant="${type.id}"
      aria-selected="${index === defaultIndex}" aria-controls="applicant-panel-${type.id}"${index === defaultIndex ? '' : ' tabindex="-1"'}>
      ${esc(type.name)} <span>${type.items.length}종</span>
    </button>`).join('');

  const panels = APPLICANT_TYPES.map((type, index) => `
    <div class="applicant-panel" role="tabpanel" id="applicant-panel-${type.id}" aria-labelledby="applicant-tab-${type.id}"${index === defaultIndex ? '' : ' hidden'}>
      <div class="applicant-panel-head">
        <h3>${esc(type.name)}</h3>
        <p>${esc(type.description)}</p>
      </div>
      <ol class="doc-list">${type.items.map(([name, purpose, howTo], itemIndex) => {
        const kind = classifyDoc(name);
        return `<li>
          <details>
            <summary>
              <span class="doc-index" aria-hidden="true">${pad(itemIndex)}</span>
              <strong>${esc(name)}</strong>
              <span class="tag tag--${kind.tone}">${kind.label}</span>
            </summary>
            <dl>
              <dt>용도</dt><dd>${esc(purpose)}</dd>
              <dt>준비할 때</dt><dd>${esc(howTo)}</dd>
            </dl>
          </details>
        </li>`;
      }).join('')}</ol>
    </div>`).join('');

  return `<div class="applicant">
    <div class="applicant-picker" role="tablist" aria-label="신청자 유형">${picker}</div>
    ${panels}
  </div>`;
}

/** 메인 페이지용 요약: 서류 10종 이름 + 신청자 유형 바로가기 */
export function docsPreview({ base }) {
  const names = COMMON_DOCS.map((doc, index) => `<li><span class="doc-index" aria-hidden="true">${pad(index)}</span>${esc(doc.name)}</li>`).join('');
  const types = APPLICANT_TYPES.map((type) => `
    <a class="type-tile" href="${base}programs/documents/?type=${type.id}#applicant">
      <span class="type-count">${type.items.length}<small>종</small></span>
      <strong>${esc(type.name)}</strong>
      <span class="type-desc">${esc(type.description)}</span>
      ${icon('arrow', 18)}
    </a>`).join('');
  return `<div class="docs-preview">
    <ol class="docs-names">${names}</ol>
    <div class="type-tiles">${types}</div>
  </div>`;
}
