// GET /api/insights/ — 노션에 올린 인사이트 목록 (카드뉴스 · 아티클). 누구나 볼 수 있습니다.
import { listInsights } from '../server/notion.js';

export async function GET() {
  try {
    return Response.json(await listInsights(), {
      // 노션에서 고친 내용은 1분 안팎으로 반영됩니다.
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[insights]', error);
    return Response.json({ error: '인사이트를 불러오지 못했습니다.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
