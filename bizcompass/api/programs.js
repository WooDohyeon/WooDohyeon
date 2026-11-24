// GET /api/programs/ — 기업마당 · K-Startup 공고 목록 (Vercel 함수, 승인된 회원 전용)
// 공공데이터포털은 해외 리전에서 연결이 되지 않아, vercel.json 에서 서울 리전(icn1)으로 지정합니다.
// 인증키는 Vercel 환경변수 DATA_GO_KR_SERVICE_KEY 에서 읽습니다.
import { loadPrograms } from '../server/programs.js';
import { isApprovedMember } from '../server/member.js';

// 회원 전용 응답이라 CDN 에 보관하지 않고, 함수 안에서 30분 동안 기억해 둡니다.
const KEEP_MS = 30 * 60 * 1000;
let cached = null;

export async function GET(request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!(await isApprovedMember(request))) {
    return Response.json({ error: '승인된 회원만 볼 수 있습니다.' }, { status: 401, headers });
  }
  try {
    if (!cached || Date.now() - cached.at > KEEP_MS) {
      const data = await loadPrograms(process.env.DATA_GO_KR_SERVICE_KEY);
      // 한쪽 API 가 실패한 결과는 다음 요청에서 다시 받아 옵니다.
      if (data.warnings.length) return Response.json(data, { headers });
      cached = { at: Date.now(), data };
    }
    return Response.json(cached.data, { headers });
  } catch (error) {
    console.error('[programs]', error);
    if (cached) return Response.json(cached.data, { headers }); // 갱신에 실패하면 직전 결과라도 보여 줍니다.
    return Response.json({ error: '공고를 불러오지 못했습니다.' }, { status: 502, headers });
  }
}
