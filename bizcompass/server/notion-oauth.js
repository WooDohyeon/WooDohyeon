// 노션 OAuth 연결 — 처음 한 번만 쓰는 인증 절차입니다. (서버 전용)
// 워크스페이스에서 '내부 연결(API 토큰)'을 만들 권한이 없을 때, OAuth 연결로 토큰을 발급받기 위한 것입니다.
//   1) /api/notion-connect/ 로 들어가면 노션의 허용 화면으로 이동합니다.
//   2) 허용하면 /api/notion-callback/ 으로 돌아와 토큰이 화면에 한 번 표시됩니다.
//   3) 그 토큰을 Vercel 환경변수 NOTION_TOKEN 에 넣으면 끝입니다. (사이트에는 저장하지 않습니다)
// 필요한 환경변수: NOTION_OAUTH_CLIENT_ID, NOTION_OAUTH_CLIENT_SECRET (노션 연결 설정 화면에 있습니다)
const API = process.env.NOTION_API_URL || 'https://api.notion.com/v1';

export const oauthReady = () => Boolean(process.env.NOTION_OAUTH_CLIENT_ID && process.env.NOTION_OAUTH_CLIENT_SECRET);

/** 노션 연결 설정의 '리디렉션 URI' 에 넣는 주소와 같아야 합니다. */
export const redirectUri = (request) => `${new URL(request.url).origin}/api/notion-callback/`;

export function authorizeUrl(request, state) {
  const params = new URLSearchParams({ client_id: process.env.NOTION_OAUTH_CLIENT_ID, response_type: 'code', owner: 'user', redirect_uri: redirectUri(request), state });
  return `${API}/oauth/authorize?${params}`;
}

/** 허용 후 받은 코드를 토큰으로 바꿉니다. */
export async function exchangeCode(request, code) {
  const basic = Buffer.from(`${process.env.NOTION_OAUTH_CLIENT_ID}:${process.env.NOTION_OAUTH_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
    body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(request) }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(`Notion OAuth ${response.status} ${data.error || ''}`.trim());
  return data;
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** 안내 화면 (검색에 잡히지 않고, 어디에도 보관되지 않게 내려 줍니다) */
export function page(title, body, status = 200, extraHeaders = {}) {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex, nofollow" /><title>${esc(title)} | OZ BizLab</title>
  <style>body{margin:0;background:#ecebe6;color:#15171c;font:16px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:640px;margin:8vh auto;padding:32px;background:#f5f4f0;border:1.5px solid #15171c;border-radius:20px;box-shadow:8px 8px 0 #2a2d34}h1{margin:0 0 12px;font-size:1.6rem;letter-spacing:-.03em}code,textarea{font:14px/1.5 ui-monospace,Menlo,Consolas,monospace}textarea{width:100%;box-sizing:border-box;min-height:84px;padding:12px;border:1.5px solid #15171c;border-radius:10px;background:#fff;resize:vertical}button,a.btn{display:inline-block;margin-top:10px;padding:10px 18px;border:1.5px solid #15171c;border-radius:999px;background:#2f5bff;color:#fff;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}ol{padding-left:1.2em}li{margin:.3em 0}.note{color:#5a5d66;font-size:.9rem}</style></head>
  <body><main><h1>${esc(title)}</h1>${body}</main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', ...extraHeaders } });
}

export { esc };
