// 회원가입 · 로그인 — Firebase Authentication(이메일/비밀번호) + Realtime Database(회원 정보)
import { firebaseConfig } from './firebase-config.js';

const HINT_KEY = 'bizcompass.auth';
const USERS_URL = `${firebaseConfig.databaseURL}/users`;

// ── 로그인 상태 힌트 ────────────────────────────────────────────
// 로그인한 적이 없는 방문자에게는 인증 SDK 를 내려받지 않도록, 로그인 여부만 브라우저에 적어 둡니다.
export function readHint() {
  try {
    return JSON.parse(localStorage.getItem(HINT_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeHint(session) {
  try {
    if (session) localStorage.setItem(HINT_KEY, JSON.stringify({ name: session.name, status: session.status }));
    else localStorage.removeItem(HINT_KEY);
  } catch { /* 저장소를 쓸 수 없는 환경에서는 힌트 없이 동작합니다. */ }
}

// ── Firebase ───────────────────────────────────────────────────
async function sdk() {
  const [{ getFirebaseApp }, auth] = await Promise.all([import('./firebase.js'), import('firebase/auth')]);
  return { ...auth, auth: auth.getAuth(getFirebaseApp()) };
}

class AuthError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/**
 * 회원 정보 경로가 외부에 공개되어 있지 않은지 확인합니다.
 * 데이터베이스 규칙이 아직 열려 있으면 이메일·이름이 누구에게나 보일 수 있으므로 가입을 받지 않습니다.
 */
async function profilesArePrivate() {
  try {
    const response = await fetch(`${USERS_URL}.json?shallow=true`);
    return response.status === 401 || response.status === 403;
  } catch {
    return false;
  }
}

async function saveProfile(user, profile) {
  const token = await user.getIdToken();
  const response = await fetch(`${USERS_URL}/${user.uid}.json?auth=${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new AuthError('profile-write-failed');
}

async function loadProfile(user) {
  try {
    const token = await user.getIdToken();
    const response = await fetch(`${USERS_URL}/${user.uid}.json?auth=${encodeURIComponent(token)}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function toSession(user, profile) {
  return {
    uid: user.uid,
    email: user.email,
    name: profile?.name || user.displayName || user.email,
    memberType: profile?.memberType || '',
    camp: profile?.camp || '',
    cohort: profile?.cohort || null,
    status: profile?.status || 'pending',
    hasProfile: Boolean(profile),
  };
}

/** 회원가입: 계정을 만들고 가입 정보를 승인 대기 상태로 저장합니다. */
export async function signUp({ email, password, name, memberType, camp, cohort }) {
  if (!(await profilesArePrivate())) throw new AuthError('setup-required');
  const firebase = await sdk();
  const { user } = await firebase.createUserWithEmailAndPassword(firebase.auth, email, password);
  const profile = { email: user.email, name, memberType, camp, cohort, status: 'pending' };
  try {
    await firebase.updateProfile(user, { displayName: name });
    await saveProfile(user, { ...profile, createdAt: { '.sv': 'timestamp' } });
  } catch (error) {
    // 가입 정보를 남기지 못한 계정은 되돌립니다.
    await firebase.deleteUser(user).catch(() => {});
    throw error;
  }
  const session = toSession(user, profile);
  writeHint(session);
  return session;
}

export async function signIn(email, password) {
  const firebase = await sdk();
  const { user } = await firebase.signInWithEmailAndPassword(firebase.auth, email, password);
  const session = toSession(user, await loadProfile(user));
  writeHint(session);
  return session;
}

export async function signOutUser() {
  writeHint(null);
  const firebase = await sdk();
  await firebase.signOut(firebase.auth);
}

export async function sendPasswordReset(email) {
  const firebase = await sdk();
  await firebase.sendPasswordResetEmail(firebase.auth, email);
}

/**
 * 로그인 상태를 지켜봅니다. 로그인되어 있으면 회원 정보를 붙여 콜백을 부릅니다.
 * @param {(session: object | null) => void} callback
 */
export async function watchSession(callback) {
  try {
    const firebase = await sdk();
    return firebase.onAuthStateChanged(firebase.auth, async (user) => {
      const session = user ? toSession(user, await loadProfile(user)) : null;
      writeHint(session);
      callback(session);
    });
  } catch {
    callback(null);
    return () => {};
  }
}

const SETUP_MESSAGE = '회원 기능을 준비하고 있습니다. 잠시 후 다시 이용해 주세요.';
const MESSAGES = {
  'auth/email-already-in-use': '이미 가입된 이메일입니다. 로그인해 주세요.',
  'auth/invalid-email': '이메일 주소 형식을 확인해 주세요.',
  'auth/missing-email': '이메일을 입력해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상으로 입력해 주세요.',
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/user-not-found': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/user-disabled': '사용이 중지된 계정입니다. 운영진에게 문의해 주세요.',
  'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  'auth/operation-not-allowed': SETUP_MESSAGE,
  'auth/configuration-not-found': SETUP_MESSAGE,
  'setup-required': SETUP_MESSAGE,
  'profile-write-failed': '가입 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

/** 오류를 화면에 보여 줄 문구로 바꿉니다. */
export function authMessage(error) {
  if (error?.code && !MESSAGES[error.code]) console.error('[auth]', error.code);
  return MESSAGES[error?.code] || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
