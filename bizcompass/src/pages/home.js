// 메인 페이지에도 로드맵이 있어, 사업 카드를 누르면 같은 상세 모달이 열립니다.
import './roadmap.js';
import { BASE } from './common.js';
import { loadInsights } from '../lib/insights.js';
import { cardnewsLink, articleItem } from '../render/insights.js';

// 인사이트: 최신 카드뉴스 3편과 아티클 1편을 보여 줍니다.
const section = document.getElementById('home-insights');
if (section) {
  loadInsights(BASE).then(({ cardnews, articles }) => {
    if (!cardnews.length && !articles.length) return; // 올라온 글이 없으면 섹션을 숨긴 채 둡니다.
    const cards = document.getElementById('home-cardnews');
    const list = document.getElementById('home-articles');
    cards.innerHTML = cardnews.slice(0, 3).map((post) => cardnewsLink(post, BASE)).join('');
    cards.hidden = cardnews.length === 0;
    list.innerHTML = articles.slice(0, 1).map((post) => articleItem(post, BASE)).join('');
    list.hidden = articles.length === 0;
    section.hidden = false;
  });
}
