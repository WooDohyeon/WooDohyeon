// 요청을 보낸 사람이 승인된 회원인지 확인합니다. (서버 전용)
// 브라우저가 보낸 Firebase 로그인 토큰으로 그 사람의 회원 정보를 읽어 봅니다.
// 토큰이 가짜이거나 남의 것이면 Realtime Database 가 읽기를 거부하므로, 별도의 관리자 키가 필요 없습니다.
import { firebaseConfig } from '../src/lib/firebase-config.js';

export async function isApprovedMember(request) {
  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '')?.[1];
  if (!token) return false;
  let uid = '';
  try {
    uid = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).user_id;
  } catch {
    return false;
  }
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid || '')) return false;
  try {
    const response = await fetch(`${firebaseConfig.databaseURL}/users/${uid}/status.json?auth=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(10000) });
    return response.ok && (await response.json()) === 'approved';
  } catch {
    return false;
  }
}
