// GET /api/references/ — 레퍼런스 전체 목록 (승인된 회원 전용)
// Realtime Database 의 목록은 승인된 회원만 읽을 수 있게 잠겨 있어, 요청한 회원의 로그인 토큰으로 읽어 옵니다.
import { firebaseConfig, REFERENCES_PATH } from '../src/lib/firebase-config.js';
import { parseReferences, normalizeUrl } from '../src/lib/references-model.js';
import { REFERENCE_SEED } from '../server/references.seed.js';
import { isApprovedMember, bearerToken } from '../server/member.js';

// 시트에 소개 문구가 없는 사이트는 기본 목록의 문구로 채웁니다.
const descriptions = new Map(REFERENCE_SEED.map((item) => [normalizeUrl(item.url), item.description]));

const KEEP_MS = 60 * 1000;
let cached = null;

export async function GET(request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!(await isApprovedMember(request))) {
    return Response.json({ error: '승인된 회원만 볼 수 있습니다.' }, { status: 401, headers });
  }
  if (cached && Date.now() - cached.at < KEEP_MS) return Response.json({ items: cached.items, source: 'database' }, { headers });
  try {
    const response = await fetch(`${firebaseConfig.databaseURL}/${REFERENCES_PATH}.json?auth=${encodeURIComponent(bearerToken(request))}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Realtime Database ${response.status}`);
    const items = parseReferences(await response.json(), descriptions);
    if (!items.length) throw new Error('레퍼런스 데이터가 비어 있습니다.');
    cached = { at: Date.now(), items };
    return Response.json({ items, source: 'database' }, { headers });
  } catch (error) {
    console.error('[references]', error);
    // 연결에 실패하면 직전 결과나 기본 목록을 보여 줍니다.
    return Response.json({ items: cached?.items || REFERENCE_SEED, source: cached ? 'database' : 'seed' }, { headers });
  }
}
