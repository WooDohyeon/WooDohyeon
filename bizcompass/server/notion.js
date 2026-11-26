// 노션 데이터베이스에서 인사이트(카드뉴스 · 아티클)를 읽어 옵니다. (서버 전용)
// 노션 통합(Integration) 키는 Vercel 환경변수 NOTION_TOKEN, 데이터베이스 주소의 ID 는 NOTION_DATABASE_ID 에 넣습니다.
// 환경변수가 없으면 빈 목록을 돌려주어, 사이트는 '준비 중' 상태로 보입니다.
//
// 데이터베이스 속성 (이름이 같아야 합니다)
//   제목(제목) · 구분(선택: 카드뉴스 / 아티클) · 분류(선택) · 날짜(날짜) · 소개(텍스트) · 공개(체크박스) · 대표 이미지(파일, 선택)
// NOTION_API_URL 은 테스트용 가짜 서버를 쓸 때만 넣습니다.
const API = process.env.NOTION_API_URL || 'https://api.notion.com/v1';
const VERSION = '2022-06-28';

export const notionReady = () => Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);
export const isNotionId = (value) => /^[0-9a-f]{32}$/.test(String(value || '').replace(/-/g, '').toLowerCase());
const compact = (id) => String(id || '').replace(/-/g, '').toLowerCase();
const databaseId = () => compact((process.env.NOTION_DATABASE_ID || '').split('?')[0].split('/').pop().slice(-32));

async function notion(path, body) {
  const response = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': VERSION, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const error = new Error(`Notion ${response.status} ${path.split('?')[0]}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// ── 속성 읽기 ───────────────────────────────────────────────────
const NAMES = {
  title: ['제목', '이름', 'Name', 'Title'],
  kind: ['구분', '유형', '형태', 'Type'],
  category: ['분류', '카테고리', 'Category'],
  date: ['날짜', '게시일', 'Date'],
  summary: ['소개', '요약', '설명', 'Summary'],
  published: ['공개', '게시', 'Published'],
  cover: ['대표 이미지', '대표이미지', '표지', '썸네일', 'Cover'],
  author: ['작성자', '글쓴이', 'Author'],
};

const plain = (rich) => (rich || []).map((item) => item.plain_text || '').join('').trim();

function prop(page, key, type) {
  const props = page.properties || {};
  const name = NAMES[key].find((candidate) => props[candidate] && (!type || props[candidate].type === type));
  if (name) return props[name];
  // 제목 속성은 이름이 달라도 하나뿐이므로 종류로 찾습니다.
  return key === 'title' ? Object.values(props).find((value) => value.type === 'title') : undefined;
}

const fileUrl = (file) => (file?.type === 'external' ? file.external?.url : file?.file?.url) || '';

function toPost(page) {
  const date = prop(page, 'date', 'date')?.date?.start || '';
  const kind = prop(page, 'kind')?.select?.name || prop(page, 'kind')?.status?.name || '';
  const author = prop(page, 'author');
  return {
    id: compact(page.id),
    title: plain(prop(page, 'title')?.title) || '제목 없음',
    kind: /카드/.test(kind) ? 'cardnews' : 'article',
    category: prop(page, 'category')?.select?.name || prop(page, 'category')?.multi_select?.[0]?.name || '',
    date: date ? date.slice(0, 10).replaceAll('-', '.') : '',
    summary: plain(prop(page, 'summary')?.rich_text),
    author: author?.type === 'rich_text' ? plain(author.rich_text) : author?.people?.[0]?.name || '',
    published: prop(page, 'published', 'checkbox')?.checkbox === true,
    hasCover: Boolean(fileUrl(prop(page, 'cover', 'files')?.files?.[0])),
  };
}

/** 이 페이지가 인사이트 데이터베이스에 있고 공개 상태인지 */
function isPublic(page) {
  return page?.object === 'page' && !page.archived && !page.in_trash
    && compact(page.parent?.database_id) === databaseId() && toPost(page).published;
}

// ── 본문 블록 ───────────────────────────────────────────────────
async function blocksOf(blockId) {
  const blocks = [];
  let cursor = '';
  do {
    const data = await notion(`/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : '';
  } while (cursor);
  return blocks;
}

/** 서식이 있는 글자 → 아티클 서식(**굵게**, [링크](주소)) */
function marked(rich) {
  return (rich || []).map((item) => {
    let text = (item.plain_text || '').replace(/\n/g, ' ');
    if (!text.trim()) return text;
    if (item.annotations?.bold) text = `**${text.trim()}**${text.endsWith(' ') ? ' ' : ''}`;
    const href = item.href && /^https?:\/\//.test(item.href) ? item.href.replace(/[()\s]/g, encodeURIComponent) : '';
    return href ? `[${text.replace(/[[\]]/g, '')}](${href})` : text;
  }).join('').trim();
}

const imagePath = (blockId) => `/api/insight-image/?block=${compact(blockId)}`;

/** 노션 블록 목록 → 아티클 본문 (src/lib/articles.js 가 읽는 간단한 서식) */
function toBody(blocks) {
  const out = [];
  let list = null; // 이어지는 목록 항목은 한 덩어리로 묶습니다.
  const flush = () => { if (list) { out.push(list.lines.join('\n')); list = null; } };
  blocks.forEach((block) => {
    const data = block[block.type] || {};
    const text = marked(data.rich_text);
    if (block.type === 'bulleted_list_item' || block.type === 'to_do' || block.type === 'numbered_list_item') {
      const type = block.type === 'numbered_list_item' ? 'ol' : 'ul';
      if (list?.type !== type) { flush(); list = { type, lines: [] }; }
      if (text) list.lines.push(type === 'ol' ? `${list.lines.length + 1}. ${text}` : `- ${text}`);
      return;
    }
    flush();
    if (block.type === 'image') out.push(`![${plain(data.caption).replace(/[[\]]/g, '')}](${imagePath(block.id)})`);
    else if (block.type === 'heading_1' || block.type === 'heading_2') { if (text) out.push(`## ${text}`); }
    else if (block.type === 'heading_3') { if (text) out.push(`### ${text}`); }
    else if (block.type === 'quote' || block.type === 'callout') { if (text) out.push(`> ${text}`); }
    else if (text) out.push(text); // 문단과 그 밖의 글자 블록
  });
  flush();
  return out.join('\n\n');
}

// ── 바깥에서 쓰는 함수 ─────────────────────────────────────────
/** 공개된 인사이트 목록. 카드뉴스에는 넘겨 볼 그림 목록이 함께 들어갑니다. */
export async function listInsights() {
  if (!notionReady()) return { cardnews: [], articles: [] };
  const pages = [];
  let cursor;
  do {
    const data = await notion(`/databases/${databaseId()}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  const posts = pages.filter(isPublic).map(toPost).sort((a, b) => b.date.localeCompare(a.date));
  const view = ({ published, hasCover, kind, ...post }) => ({ ...post, ...(hasCover ? { cover: `/api/insight-image/?page=${post.id}` } : {}) });

  const cardnews = [];
  for (const post of posts.filter((item) => item.kind === 'cardnews')) {
    // 노션 API 는 1초에 3번 정도만 받으므로 한 편씩 차례로 읽습니다.
    const slides = (await blocksOf(post.id)).filter((block) => block.type === 'image').map((block) => imagePath(block.id));
    if (slides.length) cardnews.push({ ...view(post), slides });
  }
  return { cardnews, articles: posts.filter((item) => item.kind === 'article').map(view) };
}

/** 아티클 한 편 (본문 포함). 공개되지 않았거나 없으면 null */
export async function getArticle(id) {
  if (!notionReady() || !isNotionId(id)) return null;
  const page = await notion(`/pages/${compact(id)}`).catch((error) => { if (error.status === 404 || error.status === 400) return null; throw error; });
  if (!isPublic(page)) return null;
  const { published, hasCover, kind, ...post } = toPost(page);
  return { ...post, ...(hasCover ? { cover: `/api/insight-image/?page=${post.id}` } : {}), body: toBody(await blocksOf(post.id)) };
}

/**
 * 그림의 실제 주소. 노션의 그림 주소는 1시간 뒤 만료되므로, 볼 때마다 새 주소를 받아 넘겨 줍니다.
 * 공개된 인사이트에 들어 있는 그림만 내어 줍니다.
 */
export async function imageUrl({ block, page }) {
  if (!notionReady()) return '';
  const missing = (error) => { if (error.status === 404 || error.status === 400) return null; throw error; };
  if (isNotionId(page)) {
    const data = await notion(`/pages/${compact(page)}`).catch(missing);
    return isPublic(data) ? fileUrl(prop(data, 'cover', 'files')?.files?.[0]) : '';
  }
  if (!isNotionId(block)) return '';
  const data = await notion(`/blocks/${compact(block)}`).catch(missing);
  if (data?.type !== 'image' || data.parent?.type !== 'page_id') return '';
  const parent = await notion(`/pages/${compact(data.parent.page_id)}`).catch(missing);
  return isPublic(parent) ? fileUrl(data.image) : '';
}
