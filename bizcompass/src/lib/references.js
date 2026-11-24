// 레퍼런스 — Firebase Realtime Database 연결
import { parseReferences } from './references-model.js';
import { REFERENCES_PATH } from './firebase-config.js';

/**
 * Realtime Database 의 레퍼런스 목록을 구독합니다. 시트가 바뀌면 콜백이 다시 호출됩니다.
 * @param {(list: Array) => void} onData   목록을 받았을 때 (비어 있으면 호출하지 않음)
 * @param {(error: Error) => void} onError 연결·권한 오류 또는 빈 데이터
 * @returns {Promise<() => void>} 구독 해제 함수
 */
export async function subscribeReferences(onData, onError = () => {}) {
  try {
    const [{ getFirebaseApp }, { getDatabase, ref, onValue }] = await Promise.all([
      import('./firebase.js'),
      import('firebase/database'),
    ]);
    const database = getDatabase(getFirebaseApp());
    return onValue(
      ref(database, REFERENCES_PATH),
      (snapshot) => {
        const list = parseReferences(snapshot.val());
        if (list.length) onData(list);
        else onError(new Error('레퍼런스 데이터가 비어 있습니다.'));
      },
      (error) => onError(error),
    );
  } catch (error) {
    onError(error);
    return () => {};
  }
}
