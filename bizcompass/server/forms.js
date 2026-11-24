// 서식 목록 만들기 (서버 전용) — Firebase Storage 의 forms/ 폴더를 읽습니다.
import { FORM_CATALOG, FORMAT_ORDER } from '../src/data/forms.catalog.js';
import { FORMS_FOLDER } from '../src/lib/firebase-config.js';
import { listFiles, fileMetadata } from './firebase-service.js';

const catalogById = new Map(FORM_CATALOG.map((form) => [form.id, form]));

/** 서식 폴더 안의 파일 경로만 허용합니다. */
export function isFormPath(path) {
  return typeof path === 'string' && path.startsWith(`${FORMS_FOLDER}/`) && path.length <= 200 && !path.includes('..') && !/[\u0000-\u001f\\]/.test(path) && !path.endsWith('/');
}

function formatMonth(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function sortFormats(files) {
  return Object.keys(files).sort((a, b) => {
    const ia = FORMAT_ORDER.indexOf(a);
    const ib = FORMAT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}

/**
 * Storage 의 forms/ 폴더를 읽어 서식 목록을 만듭니다.
 *  - forms/<이름>.<확장자>            : 같은 이름의 파일은 한 서식의 여러 형식으로 묶습니다.
 *  - forms/<분류>/<이름>.<확장자>     : 하위 폴더 이름을 분류로 씁니다.
 * 파일 주소는 넣지 않고 경로만 담습니다. 파일은 /api/form-file, /api/form-preview 로만 받을 수 있습니다.
 */
export async function loadForms() {
  const groups = new Map();
  (await listFiles(FORMS_FOLDER)).forEach((path) => {
    const parts = path.slice(FORMS_FOLDER.length + 1).split('/');
    const fileName = parts.pop();
    const dot = fileName.lastIndexOf('.');
    if (dot <= 0 || !isFormPath(path)) return;
    const id = fileName.slice(0, dot);
    if (!groups.has(id)) groups.set(id, { files: {}, category: parts[0] || '' });
    groups.get(id).files[fileName.slice(dot + 1).toLowerCase()] = { path };
  });

  const forms = await Promise.all([...groups.entries()].map(async ([id, group]) => {
    const known = catalogById.get(id);
    let updated = known?.updated || '';
    if (!updated) {
      const metas = await Promise.all(Object.values(group.files).map((file) => fileMetadata(file.path)));
      const latest = metas.filter(Boolean).map((meta) => meta.updated).sort().pop();
      if (latest) updated = formatMonth(latest);
    }
    return {
      id,
      title: known?.title || id.replace(/[_-]+/g, ' '),
      category: known?.category || group.category || '기타',
      description: known?.description || '',
      updated,
      pages: known?.pages || null,
      files: group.files, // { pdf: { path }, docx: { path } }
      formats: sortFormats(group.files),
      available: true,
    };
  }));

  // 카탈로그 순서를 우선하고, 나머지는 제목순
  const order = (form) => {
    const index = FORM_CATALOG.findIndex((item) => item.id === form.id);
    return index < 0 ? FORM_CATALOG.length : index;
  };
  return forms.sort((a, b) => order(a) - order(b) || a.title.localeCompare(b.title, 'ko'));
}
