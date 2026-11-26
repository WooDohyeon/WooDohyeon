// GET /api/notion-callback/ — 노션에서 허용한 뒤 돌아오는 주소. 발급된 토큰을 화면에 한 번 보여 줍니다.
import { oauthReady, exchangeCode, page, esc } from '../server/notion-oauth.js';

const clearCookie = { 'Set-Cookie': 'notion_oauth_state=; Path=/api/notion-callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax' };

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const retry = '<p><a class="btn" href="/api/notion-connect/">다시 시도</a></p>';
  if (!oauthReady()) return page('노션 연결 준비가 필요합니다', '<p>Vercel 환경변수가 아직 설정되지 않았습니다.</p>', 503);
  if (params.get('error')) return page('노션 연결이 취소되었습니다', `<p>노션에서 허용하지 않았거나 권한이 없어 연결되지 않았습니다. (${esc(params.get('error'))})</p>${retry}`, 400, clearCookie);

  const state = /(?:^|;\s*)notion_oauth_state=([0-9a-f]+)/.exec(request.headers.get('cookie') || '')?.[1];
  const code = params.get('code') || '';
  if (!code || !state || state !== params.get('state')) return page('요청을 확인할 수 없습니다', `<p>시작한 브라우저와 다르거나 시간이 지나 만료되었습니다.</p>${retry}`, 400, clearCookie);

  try {
    const token = await exchangeCode(request, code);
    const refresh = token.refresh_token ? `<p class="note">이 연결은 갱신용 토큰도 함께 발급했습니다. 토큰이 만료되는 연결일 수 있으니, 아래 값도 함께 알려 주세요.<br /><textarea readonly>${esc(token.refresh_token)}</textarea></p>` : '';
    return page('노션 연결이 완료되었습니다', `<p><strong>${esc(token.workspace_name || '워크스페이스')}</strong> 에 연결되었습니다. 아래 토큰을 Vercel 환경변수 <code>NOTION_TOKEN</code> 에 넣어 주세요.</p>
      <textarea id="token" readonly>${esc(token.access_token)}</textarea>
      <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('token').value).then(()=>{this.textContent='복사했습니다'})">토큰 복사</button>
      <ol>
        <li>Vercel 프로젝트 → Settings → Environment Variables 에 <code>NOTION_TOKEN</code> 으로 저장합니다.</li>
        <li>인사이트 데이터베이스 주소의 32자리 ID 를 <code>NOTION_DATABASE_ID</code> 로 저장합니다.</li>
        <li>다시 배포하면 노션의 글이 사이트에 올라갑니다.</li>
      </ol>
      ${refresh}
      <p class="note">이 토큰은 이 화면에만 한 번 표시되며 사이트에는 저장되지 않습니다. 채팅이나 메신저에 붙여 넣지 마세요. 창을 닫으면 다시 볼 수 없고, 필요하면 처음부터 다시 연결하면 됩니다.</p>`, 200, clearCookie);
  } catch (error) {
    console.error('[notion-callback]', error.message);
    return page('토큰을 받지 못했습니다', `<p>노션에서 토큰을 발급받지 못했습니다. 리디렉션 URI 와 클라이언트 시크릿이 맞는지 확인해 주세요.</p>${retry}`, 502, clearCookie);
  }
}
