// GET /api/programs/ — 기업마당 · K-Startup 공고 목록 (Vercel 함수)
// 공공데이터포털은 해외 리전에서 연결이 되지 않아, vercel.json 에서 서울 리전(icn1)으로 지정합니다.
// 인증키는 Vercel 환경변수 DATA_GO_KR_SERVICE_KEY 에서 읽습니다.
import { loadPrograms } from '../server/programs.js';

export async function GET() {
  try {
    const data = await loadPrograms(process.env.DATA_GO_KR_SERVICE_KEY);
    return Response.json(data, {
      headers: {
        // CDN 이 30분 동안 보관하고, 이후에는 이전 결과를 보여 주면서 뒤에서 새로 받아 옵니다.
        // 한쪽 API 가 실패한 결과는 1분만 보관합니다.
        'Cache-Control': data.warnings.length
          ? 'public, max-age=0, s-maxage=60'
          : 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[programs]', error);
    return Response.json(
      { error: '공고를 불러오지 못했습니다.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
