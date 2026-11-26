// GET /api/insight/?id=<노션 페이지 ID> — 아티클 한 편 (본문 포함)
import { getArticle, isNotionId } from '../server/notion.js';

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!isNotionId(id)) return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  try {
    const article = await getArticle(id);
    if (!article) return Response.json({ error: '글을 찾을 수 없습니다.' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30' } });
    return Response.json(article, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' } });
  } catch (error) {
    console.error('[insight]', error);
    return Response.json({ error: '글을 불러오지 못했습니다.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
