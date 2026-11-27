// 인사이트 카드 그리기 (인사이트 페이지와 메인 페이지가 함께 씁니다)
import { fileSrc } from '../lib/insights.js';
import { readMinutes } from '../lib/articles.js';
import { esc, icon } from './util.js';

function cardInner(post, base) {
  return `<span class="insight-cover">
      <img src="${esc(fileSrc(post, post.slides[0], base))}" alt="" loading="lazy" decoding="async" />
    </span>
    <span class="insight-body">
      <span class="insight-meta">${post.category ? `<span class="tag tag--second">${esc(post.category)}</span>` : ''}${post.date ? `<small>${esc(post.date)}</small>` : ''}</span>
      <strong>${esc(post.title)}</strong>
      ${post.summary ? `<span class="insight-summary">${esc(post.summary)}</span>` : ''}
    </span>`;
}

/** 카드뉴스 카드. 인사이트 페이지에서는 누르면 뷰어가 열리는 버튼입니다. */
export function cardnewsButton(post, base) {
  return `<button type="button" class="insight-card" data-insight="${esc(post.id)}" aria-haspopup="dialog" aria-label="${esc(post.title)} 카드뉴스 보기 (${post.slides.length}장)">${cardInner(post, base)}</button>`;
}

/** 카드뉴스 카드. 다른 페이지에서는 인사이트 페이지로 가서 바로 열리는 링크입니다. */
export function cardnewsLink(post, base) {
  return `<a class="insight-card" href="${base}insights/?id=${encodeURIComponent(post.id)}" aria-label="${esc(post.title)} 카드뉴스 보기 (${post.slides.length}장)">${cardInner(post, base)}</a>`;
}

/** 아티클 가로 카드. 대표 이미지가 없으면 분류 이름을 넣은 빈 표지를 둡니다. */
export function articleItem(post, base) {
  const cover = post.cover
    ? `<img src="${esc(fileSrc(post, post.cover, base))}" alt="" loading="lazy" decoding="async" />`
    : `<span class="article-thumb-blank">${esc(post.category || 'OZ BizLab')}</span>`;
  return `<li><a class="article-item" href="${base}insights/post/?id=${encodeURIComponent(post.id)}">
    <span class="article-thumb">${cover}</span>
    <span class="article-item-body">
      <span class="insight-meta">${post.category ? `<span class="tag tag--second">${esc(post.category)}</span>` : ''}<small>${esc([post.date, post.body ? `읽는 시간 ${readMinutes(post.body)}분` : ''].filter(Boolean).join(' · '))}</small></span>
      <strong>${esc(post.title)}</strong>
      ${post.summary ? `<span class="insight-summary">${esc(post.summary)}</span>` : ''}
      <span class="article-read">읽어 보기 ${icon('arrow', 16)}</span>
    </span>
  </a></li>`;
}
