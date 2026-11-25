// HTML 안의 <!--@이름 속성="값"--> 자리표시자를 채우는 렌더러 모음 (vite.config.js 에서 사용)
import { head, header, footer, programsHero } from './layout.js';
import { roadmap } from './roadmap.js';
import { commonDocs, applicantDocs, docsPreview } from './documents.js';
import { referencePlaceholders, GUEST_REFERENCE_LIMIT } from './references.js';
import { referenceCount, referenceCategoryCount, referencePreview, referenceGridGuest } from './references.build.js';
import { formGridSeed, formCount } from './forms.js';
import { ROADMAP_PROGRAM_COUNT } from '../data/roadmap.js';
import { COMMON_DOCS } from '../data/documents.js';
import { FORM_CATALOG } from '../data/forms.catalog.js';
import { CAMPS, COHORTS } from '../data/membership.js';
import { esc, icon, brandMark } from './util.js';

function stats() {
  const items = [
    { value: ROADMAP_PROGRAM_COUNT, unit: '개', label: '단계별 지원사업' },
    { value: referenceCount(), unit: '곳', label: '실무 레퍼런스' },
    { value: COMMON_DOCS.length, unit: '종', label: '공통 준비서류' },
    { value: FORM_CATALOG.length, unit: '종', label: '계약 서식' },
  ];
  return `<dl class="stats">${items.map((item) => `<div><dt>${item.label}</dt><dd>${item.value}<small>${item.unit}</small></dd></div>`).join('')}</dl>`;
}

export const renderers = {
  head,
  header,
  footer,
  'programs-hero': programsHero,
  icon: ({ name, size }) => icon(name, Number(size) || 18),
  'brand-mark': ({ size }) => brandMark(Number(size) || 32),
  roadmap,
  'common-docs': commonDocs,
  'applicant-docs': applicantDocs,
  'docs-preview': docsPreview,
  'reference-grid-guest': referenceGridGuest,
  'reference-placeholders': () => referencePlaceholders(8),
  'reference-guest-limit': () => String(GUEST_REFERENCE_LIMIT),
  'reference-count': referenceCount,
  'reference-category-count': referenceCategoryCount,
  'reference-preview': referencePreview,
  'form-grid': formGridSeed,
  'form-count': formCount,
  'roadmap-count': () => String(ROADMAP_PROGRAM_COUNT),
  'camp-options': () => CAMPS.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join(''),
  'cohort-options': () => COHORTS.map((number) => `<option value="${number}">${number}기</option>`).join(''),
  stats,
};
