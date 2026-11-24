import { esc, icon } from './util.js';
import { FORM_CATALOG, FORMAT_INFO } from '../data/forms.catalog.js';

const formatLabel = (ext) => FORMAT_INFO[ext]?.label || ext.toUpperCase();

/**
 * 서식 카드.
 * form.available === false 이면 Storage 에 파일이 아직 없는 상태로 표시합니다.
 * form.formats 가 없으면(빌드 시 미리 렌더링) 상태 표시 없이 그립니다.
 */
export function formCard(form, base) {
  const formats = form.formats?.length ? form.formats.map(formatLabel) : ['PDF'];
  const pending = form.available === false;
  return `<a class="form-card${pending ? ' is-pending' : ''}" href="${base}forms/view/?id=${encodeURIComponent(form.id)}">
    <div class="form-preview" aria-hidden="true">
      <div class="form-sheet">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <span class="form-file">${esc(formats[0])}</span>
    </div>
    <div class="form-body">
      <div class="form-meta">
        <span class="tag tag--second">${esc(form.category)}</span>
        ${form.updated ? `<small>업데이트 ${esc(form.updated)}</small>` : ''}
      </div>
      <h3>${esc(form.title)}</h3>
      ${form.description ? `<p>${esc(form.description)}</p>` : ''}
      <div class="form-foot">
        <span>${pending ? '파일 준비 중' : formats.map(esc).join(' · ')}</span>
        <b>${pending ? '안내 보기' : '서식 보기'} ${icon('arrow', 16)}</b>
      </div>
    </div>
  </a>`;
}

export function formCards(forms, base) {
  return forms.map((form) => formCard(form, base)).join('');
}

// ── 빌드 시 미리 렌더링 (카탈로그 기준) ───────────────────────────
export function formGridSeed({ base }) {
  return formCards(FORM_CATALOG, base);
}

export function formCount() {
  return String(FORM_CATALOG.length);
}
