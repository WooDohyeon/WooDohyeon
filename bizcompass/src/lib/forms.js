// 서식 — 목록과 파일은 서버 함수(/api/forms, /api/form-file)를 거쳐 받습니다.
// 원본 파일이 있는 Firebase Storage 는 서버만 읽을 수 있어, 브라우저에서 직접 열 수 없습니다.
import { FORM_CATALOG } from '../data/forms.catalog.js';

/** 파일 상태를 아직 모르는 카탈로그 서식 */
export function catalogForms() {
  return FORM_CATALOG.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category || '기타',
    description: item.description || '',
    updated: item.updated || '',
    pages: item.pages || null,
    files: {},
    formats: [],
    available: false,
  }));
}

/**
 * 서식 목록.
 * @returns {Promise<{ forms: Array, source: 'storage' | 'catalog', error?: Error }>}
 *   source 가 'catalog' 이면 목록을 읽지 못해 카탈로그만 보여 주는 상태입니다.
 */
export async function loadForms(base = '/') {
  try {
    const response = await fetch(`${base}api/forms/`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`서식 목록을 불러오지 못했습니다. (${response.status})`);
    const data = await response.json();
    if (!Array.isArray(data?.forms)) throw new Error('서식 목록 응답 형식이 올바르지 않습니다.');
    // 카탈로그에는 있지만 파일이 아직 없는 서식도 '준비 중'으로 함께 보여 줍니다.
    const listed = new Set(data.forms.map((form) => form.id));
    return { forms: [...data.forms, ...catalogForms().filter((form) => !listed.has(form.id))], source: 'storage' };
  } catch (error) {
    return { forms: catalogForms(), source: 'catalog', error };
  }
}

export async function loadForm(id, base = '/') {
  const { forms, source, error } = await loadForms(base);
  return { form: forms.find((item) => item.id === id) || null, source, error };
}

/** 서식 원본 파일을 받아 옵니다. (승인된 회원의 로그인 토큰 필요) */
export async function fetchFormFile(path, token, base = '/') {
  const response = await fetch(`${base}api/form-file/?path=${encodeURIComponent(path)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`파일을 불러오지 못했습니다. (${response.status})`);
  return response.blob();
}
