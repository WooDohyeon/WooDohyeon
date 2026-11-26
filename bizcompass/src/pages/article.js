// 인사이트 아티클 한 편
import { BASE } from './common.js';
import { loadArticle, loadInsights, fileSrc } from '../lib/insights.js';
import { renderArticle, readMinutes } from '../lib/articles.js';
import { esc, icon } from '../render/util.js';

const id = new URLSearchParams(location.search).get('id') || '';
const $ = (name) => document.getElementById(name);
const backLink = `<p><a class="btn" href="${BASE}insights/#articles">${icon('back', 18)} 아티클 목록으로</a></p>`;

function show(post) {
  document.title = `${post.title} | OZ BizLab`;
  $('article-meta').innerHTML = `${post.category ? `<span class="tag tag--second">${esc(post.category)}</span>` : ''}<span>${[post.date, post.author, `읽는 시간 ${readMinutes(post.body)}분`].filter(Boolean).map(esc).join(' · ')}</span>`;
  $('article-title').textContent = post.title;
  $('article-summary').textContent = post.summary || '';
  if (post.cover) {
    $('article-cover').innerHTML = `<img src="${esc(fileSrc(post, post.cover, BASE))}" alt="" />`;
    $('article-cover').hidden = false;
  }
  $('article-body').innerHTML = renderArticle(post.body, (file) => fileSrc(post, file, BASE));
}

async function showOthers() {
  const { articles } = await loadInsights(BASE);
  const others = articles.filter((item) => item.id !== id).slice(0, 2);
  if (!others.length) return;
  $('article-more').innerHTML = `<h2>다른 아티클</h2>${others.map((item) => `<a href="${BASE}insights/post/?id=${encodeURIComponent(item.id)}"><small>${esc([item.category, item.date].filter(Boolean).join(' · '))}</small><strong>${esc(item.title)}</strong></a>`).join('')}`;
  $('article-more').hidden = false;
}

loadArticle(id, BASE).then((post) => {
  if (!post) {
    $('article-title').textContent = '글을 찾을 수 없어요';
    $('article-summary').textContent = '삭제되었거나 주소가 바뀌었을 수 있습니다.';
    $('article-body').innerHTML = backLink;
    return;
  }
  show(post);
  showOthers();
}).catch((error) => {
  console.error(error);
  $('article-title').textContent = '글을 불러오지 못했어요';
  $('article-summary').textContent = '잠시 후 새로고침해 주세요.';
  $('article-body').innerHTML = backLink;
});
