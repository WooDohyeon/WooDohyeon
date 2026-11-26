// GET /api/insight-image/?block=<블록 ID> 또는 ?page=<페이지 ID>(대표 이미지)
// 노션의 그림 주소는 1시간 뒤 만료되어, 요청이 올 때 새 주소를 받아 그쪽으로 넘겨 줍니다.
import { imageUrl } from '../server/notion.js';

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  try {
    const url = await imageUrl({ block: params.get('block'), page: params.get('page') });
    if (!url) return new Response('그림을 찾을 수 없습니다.', { status: 404, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30' } });
    // 받은 주소는 1시간 동안 유효하므로 그보다 짧게만 기억합니다.
    return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'public, max-age=600, s-maxage=1800' } });
  } catch (error) {
    console.error('[insight-image]', error);
    return new Response('그림을 불러오지 못했습니다.', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
