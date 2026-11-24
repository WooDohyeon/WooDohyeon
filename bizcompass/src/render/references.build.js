// 빌드할 때만 쓰는 레퍼런스 렌더러 (vite.config.js → render/index.js).
// 전체 목록을 읽으므로 브라우저로 가는 코드에서 import 하지 않습니다.
// 페이지에는 상위 4곳과 개수 · 카테고리 이름만 남습니다.
import { REFERENCE_SEED } from '../../server/references.seed.js';
import { categoryCounts } from '../lib/references-model.js';
import { referenceCards, categoryLinks, GUEST_REFERENCE_LIMIT } from './references.js';

export const referenceCount = () => String(REFERENCE_SEED.length);
export const referenceCategoryCount = () => String(categoryCounts(REFERENCE_SEED).length);
export const referenceGridGuest = () => referenceCards(REFERENCE_SEED.slice(0, GUEST_REFERENCE_LIMIT));

export function referencePreview({ base }) {
  return `<div class="chips">${categoryLinks(REFERENCE_SEED, base)}</div>
    <div class="ref-grid ref-grid--preview">${referenceCards(REFERENCE_SEED.slice(0, GUEST_REFERENCE_LIMIT))}</div>`;
}
