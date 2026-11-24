// 관리자 전용 — 회원 사이트의 로그인과 분리된 별도 로그인 세션을 씁니다.
// 관리자 여부는 화면이 아니라 데이터베이스 규칙이 판단합니다. (규칙에 등록된 계정만 회원 목록을 읽고 상태를 바꿀 수 있습니다.)
import { firebaseConfig } from './firebase-config.js';

const USERS_URL = `${firebaseConfig.databaseURL}/users`;

class AdminError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

let ready = null;

/** 'admin' 이라는 이름의 별도 Firebase 앱. 탭을 닫으면 로그인이 풀립니다. */
function sdk() {
  ready ??= (async () => {
    const [{ initializeApp, getApps }, auth] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
    const app = getApps().find((item) => item.name === 'admin') || initializeApp(firebaseConfig, 'admin');
    return { ...auth, auth: auth.initializeAuth(app, { persistence: auth.browserSessionPersistence }) };
  })();
  return ready;
}

async function currentToken() {
  const firebase = await sdk();
  await firebase.auth.authStateReady();
  if (!firebase.auth.currentUser) throw new AdminError('not-admin');
  return firebase.auth.currentUser.getIdToken();
}

const denied = (response) => response.status === 401 || response.status === 403;

/** 전체 회원 목록. 관리자 계정이 아니면 'not-admin' 오류가 납니다. */
export async function listMembers() {
  const token = await currentToken();
  const response = await fetch(`${USERS_URL}.json?auth=${encodeURIComponent(token)}`);
  if (!response.ok) throw new AdminError(denied(response) ? 'not-admin' : 'members-load-failed');
  const data = (await response.json()) || {};
  return Object.entries(data).map(([uid, profile]) => ({ uid, ...profile }));
}

/** 회원 상태 변경: 'approved'(승인) 또는 'pending'(승인 대기) */
export async function setMemberStatus(uid, status) {
  const token = await currentToken();
  const response = await fetch(`${USERS_URL}/${encodeURIComponent(uid)}/status.json?auth=${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(status),
  });
  if (!response.ok) throw new AdminError(denied(response) ? 'not-admin' : 'status-save-failed');
}

export async function adminSignIn(email, password) {
  const firebase = await sdk();
  await firebase.signInWithEmailAndPassword(firebase.auth, email, password);
}

export async function adminSignOut() {
  const firebase = await sdk();
  await firebase.signOut(firebase.auth);
}

/** 관리자 로그인 상태를 지켜봅니다. 로그인되어 있으면 { email, name } 을, 아니면 null 을 넘깁니다. */
export async function watchAdmin(callback) {
  const firebase = await sdk();
  return firebase.onAuthStateChanged(firebase.auth, (user) => callback(user ? { email: user.email, name: user.displayName || user.email } : null));
}
