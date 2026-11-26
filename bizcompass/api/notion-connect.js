// GET /api/notion-connect/ — 노션의 허용 화면으로 보냅니다. (처음 연결할 때 한 번)
import { randomBytes } from 'node:crypto';
import { oauthReady, authorizeUrl, redirectUri, page, esc } from '../server/notion-oauth.js';

export async function GET(request) {
  if (!oauthReady()) {
    return page('노션 연결 준비가 필요합니다', `<p>Vercel 환경변수에 <code>NOTION_OAUTH_CLIENT_ID</code>, <code>NOTION_OAUTH_CLIENT_SECRET</code> 를 넣고 다시 배포한 뒤 이 주소를 열어 주세요.</p>
      <p class="note">노션 연결 설정의 리디렉션 URI 에는 아래 주소를 넣습니다.<br /><code>${esc(redirectUri(request))}</code></p>`, 503);
  }
  // 돌아왔을 때 같은 브라우저에서 시작한 요청인지 확인하기 위한 값입니다.
  const state = randomBytes(24).toString('hex');
  return new Response(null, {
    status: 302,
    headers: { Location: authorizeUrl(request, state), 'Set-Cookie': `notion_oauth_state=${state}; Path=/api/notion-callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`, 'Cache-Control': 'private, no-store' },
  });
}
