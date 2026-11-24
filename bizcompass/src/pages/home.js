import { BASE, watchLogos } from './common.js';
import { subscribeReferences } from '../lib/references.js';
import { categoryCounts } from '../lib/references-model.js';
import { referenceCards, categoryLinks, GUEST_REFERENCE_LIMIT } from '../render/references.js';

// 레퍼런스 미리보기를 Realtime Database 의 최신 목록으로 갱신합니다.
subscribeReferences((list) => {
  document.querySelectorAll('[data-ref-count]').forEach((node) => { node.textContent = String(list.length); });
  document.querySelectorAll('[data-ref-category-count]').forEach((node) => { node.textContent = String(categoryCounts(list).length); });

  const categories = document.querySelector('[data-ref-categories]');
  if (categories) categories.innerHTML = categoryLinks(list, BASE);

  const preview = document.querySelector('[data-ref-preview]');
  if (preview) {
    preview.innerHTML = referenceCards(list.slice(0, GUEST_REFERENCE_LIMIT));
    watchLogos(preview);
  }
});
