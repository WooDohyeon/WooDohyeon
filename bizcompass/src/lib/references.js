// 레퍼런스 — 전체 목록은 서버 함수(/api/references)가 승인된 회원에게만 내려 줍니다.

/** @returns {Promise<{ items: Array, source: 'database' | 'seed' }>} */
export async function fetchReferences(base = '/', token = '') {
  const response = await fetch(`${base}api/references/`, { headers: { accept: 'application/json', authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`레퍼런스를 불러오지 못했습니다. (${response.status})`);
  const data = await response.json();
  if (!Array.isArray(data?.items)) throw new Error('레퍼런스 응답 형식이 올바르지 않습니다.');
  return data;
}
