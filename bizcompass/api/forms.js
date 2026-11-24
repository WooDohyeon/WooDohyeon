// GET /api/forms/ — 서식 목록 (누구나). 제목 · 분류 · 형식만 담고, 파일 자체는 주지 않습니다.
import { loadForms } from '../server/forms.js';

export async function GET() {
  try {
    return Response.json({ forms: await loadForms() }, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('[forms]', error);
    return Response.json({ error: '서식 목록을 불러오지 못했습니다.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
