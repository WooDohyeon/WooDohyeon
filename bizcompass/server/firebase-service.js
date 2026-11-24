// 서버 전용 Firebase 계정으로 Storage 를 읽습니다. (서버 전용)
// Storage 보안 규칙은 이 계정만 서식 파일을 읽도록 잠가 두고, 방문자는 서버 함수를 거쳐서만 파일을 받습니다.
// 계정 정보는 Vercel 환경변수 FIREBASE_SERVICE_EMAIL / FIREBASE_SERVICE_PASSWORD 에서 읽습니다.
// 환경변수가 없으면 로그인 없이 요청합니다. (Storage 규칙을 잠그기 전에만 동작)
import { firebaseConfig } from '../src/lib/firebase-config.js';

const KEEP_MS = 50 * 60 * 1000; // 로그인 토큰은 1시간짜리라 50분마다 새로 받습니다.
let session = null;
let pending = null;

async function signIn() {
  const email = process.env.FIREBASE_SERVICE_EMAIL;
  const password = process.env.FIREBASE_SERVICE_PASSWORD;
  if (!email || !password) return '';
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`서버 전용 계정 로그인 실패 (${response.status})`);
  const { idToken } = await response.json();
  session = { token: idToken, at: Date.now() };
  return idToken;
}

async function serviceToken({ fresh = false } = {}) {
  if (!fresh && session && Date.now() - session.at < KEEP_MS) return session.token;
  pending ??= signIn().finally(() => { pending = null; });
  return pending;
}

const STORAGE = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o`;

async function storageFetch(url, timeout) {
  const request = async (fresh) => {
    const token = await serviceToken({ fresh });
    return fetch(url, { headers: token ? { Authorization: `Firebase ${token}` } : {}, signal: AbortSignal.timeout(timeout) });
  };
  const response = await request(false);
  // 토큰이 만료된 경우 한 번만 새로 로그인해 다시 시도합니다.
  if ((response.status === 401 || response.status === 403) && session) return request(true);
  return response;
}

/** 폴더 안의 모든 파일 경로 (하위 폴더 포함) */
export async function listFiles(folder) {
  const names = [];
  let pageToken = '';
  do {
    const response = await storageFetch(`${STORAGE}?prefix=${encodeURIComponent(`${folder}/`)}&maxResults=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`, 15000);
    if (!response.ok) throw new Error(`Storage 목록을 읽지 못했습니다. (${response.status})`);
    const data = await response.json();
    (data.items || []).forEach((item) => names.push(item.name));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return names;
}

/** 파일 정보 (수정 시각 등). 읽지 못하면 null */
export async function fileMetadata(path) {
  const response = await storageFetch(`${STORAGE}/${encodeURIComponent(path)}`, 10000).catch(() => null);
  return response?.ok ? response.json() : null;
}

/** 파일 내용. 호출한 쪽에서 response.ok 를 확인합니다. */
export function fetchFile(path) {
  return storageFetch(`${STORAGE}/${encodeURIComponent(path)}?alt=media`, 20000);
}
