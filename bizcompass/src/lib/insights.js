// 인사이트 — 노션에 올린 내용(서버 함수)과 src/data/insights.js 에 적은 내용을 합쳐서 돌려줍니다.
import { INSIGHTS, ARTICLES } from '../data/insights.js';

/** 그림 주소: 서버가 준 주소(/api/…)나 바깥 주소는 그대로, 파일 이름이면 public/insights/<id>/ 에서 찾습니다. */
export function fileSrc(post, file, base = '/') {
  if (/^https?:\/\//.test(file)) return file;
  if (file.startsWith('/api/')) return `${base}${file.slice(1)}`;
  return `${base}insights/${encodeURIComponent(post.id)}/${encodeURIComponent(file)}`;
}

const byDate = (a, b) => String(b.date || '').localeCompare(String(a.date || ''));

/** @returns {Promise<{ cardnews: Array, articles: Array, failed: boolean }>} */
export async function loadInsights(base = '/') {
  let remote = { cardnews: [], articles: [] };
  let failed = false;
  try {
    const response = await fetch(`${base}api/insights/`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(String(response.status));
    remote = await response.json();
  } catch {
    failed = true;
  }
  return {
    cardnews: [...(remote.cardnews || []), ...INSIGHTS].filter((post) => post.slides?.length).sort(byDate),
    articles: [...(remote.articles || []), ...ARTICLES].sort(byDate),
    failed,
  };
}

/** 아티클 한 편. 파일에 적은 글이면 바로, 아니면 서버에서 받아 옵니다. 없으면 null */
export async function loadArticle(id, base = '/') {
  const local = ARTICLES.find((item) => item.id === id);
  if (local) return local;
  if (!/^[0-9a-f]{32}$/.test(id)) return null;
  const response = await fetch(`${base}api/insight/?id=${id}`, { headers: { accept: 'application/json' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`글을 불러오지 못했습니다. (${response.status})`);
  return response.json();
}
