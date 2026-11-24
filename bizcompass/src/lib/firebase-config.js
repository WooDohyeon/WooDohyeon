// Firebase 웹 앱 설정.
// 웹용 설정값은 브라우저에 공개되는 식별자이며, 실제 접근 제어는 Firebase 보안 규칙이 담당합니다.
// 다른 프로젝트에 연결하려면 .env.local 에 VITE_FIREBASE_* 값을 넣으면 아래 기본값을 덮어씁니다.
const env = import.meta.env ?? {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAQ0YRTWP00iV4MShJB8JHQkv5jTKbpgUg',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'dohyeon-da2f1.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'dohyeon-da2f1',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 'https://dohyeon-da2f1-default-rtdb.firebaseio.com',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'dohyeon-da2f1.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '290480629777',
  appId: env.VITE_FIREBASE_APP_ID || '1:290480629777:web:afcd73ec7d916809be29b0',
};

// 레퍼런스: Realtime Database 경로 (구글 시트 동기화 데이터)
export const REFERENCES_PATH = env.VITE_REFERENCES_PATH || 'sheetsData/sheetsData';

// 서식: Storage 폴더
export const FORMS_FOLDER = env.VITE_FORMS_FOLDER || 'forms';
