// 서식 — Firebase Storage 연결
import { FORM_CATALOG, FORMAT_ORDER } from '../data/forms.catalog.js';
import { FORMS_FOLDER } from './firebase-config.js';

const catalogById = new Map(FORM_CATALOG.map((form) => [form.id, form]));

async function storageApi() {
  const [{ getFirebaseApp }, sdk] = await Promise.all([import('./firebase.js'), import('firebase/storage')]);
  return { storage: sdk.getStorage(getFirebaseApp()), ...sdk };
}

function splitName(fileName) {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return { base: fileName, ext: '' };
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot + 1).toLowerCase() };
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

function buildForm(id, files, folderCategory = '') {
  const known = catalogById.get(id);
  return {
    id,
    title: known?.title || id.replace(/[_-]+/g, ' '),
    category: known?.category || folderCategory || '기타',
    description: known?.description || '',
    updated: known?.updated || '',
    pages: known?.pages || null,
    files, // { pdf: { path }, docx: { path } }
    formats: sortFormats(files),
    available: Object.keys(files).length > 0,
  };
}

/**
 * Storage 의 forms/ 폴더를 읽어 서식 목록을 만듭니다.
 *  - forms/<이름>.<확장자>            : 같은 이름의 파일은 한 서식의 여러 형식으로 묶습니다.
 *  - forms/<분류>/<이름>.<확장자>     : 하위 폴더 이름을 분류로 씁니다.
 * @returns {Promise<{ forms: Array, source: 'storage' | 'catalog', error?: Error }>}
 *   source 가 'catalog' 이면 Storage 를 읽지 못해 카탈로그만 보여 주는 상태입니다.
 */
export async function loadForms() {
  let api;
  try {
    api = await storageApi();
    const { storage, ref, listAll, getMetadata } = api;
    const root = await listAll(ref(storage, FORMS_FOLDER));
    const folders = await Promise.all(root.prefixes.map(async (prefix) => ({
      category: prefix.name,
      items: (await listAll(prefix)).items,
    })));

    const groups = new Map();
    const collect = (item, category) => {
      const { base, ext } = splitName(item.name);
      if (!ext) return;
      if (!groups.has(base)) groups.set(base, { files: {}, category, refs: [] });
      const group = groups.get(base);
      group.files[ext] = { path: item.fullPath };
      group.refs.push(item);
    };
    root.items.forEach((item) => collect(item, ''));
    folders.forEach((folder) => folder.items.forEach((item) => collect(item, folder.category)));

    const forms = await Promise.all([...groups.entries()].map(async ([id, group]) => {
      const form = buildForm(id, group.files, group.category);
      if (!form.updated) {
        const metas = await Promise.all(group.refs.map((item) => getMetadata(item).catch(() => null)));
        const latest = metas.filter(Boolean).map((meta) => meta.updated).sort().pop();
        if (latest) form.updated = formatMonth(latest);
      }
      return form;
    }));

    // 카탈로그 순서를 우선하고, 나머지는 제목순
    const order = (form) => {
      const index = FORM_CATALOG.findIndex((item) => item.id === form.id);
      return index < 0 ? FORM_CATALOG.length : index;
    };
    forms.sort((a, b) => order(a) - order(b) || a.title.localeCompare(b.title, 'ko'));
    return { forms, source: 'storage' };
  } catch (error) {
    // 목록 권한이 없거나 연결에 실패한 경우: 카탈로그 서식의 파일이 있는지 하나씩 확인합니다.
    const forms = await Promise.all(FORM_CATALOG.map(async (item) => {
      const files = {};
      if (api) {
        await Promise.all(['pdf', 'docx'].map(async (ext) => {
          const path = `${FORMS_FOLDER}/${item.id}.${ext}`;
          try {
            const url = await api.getDownloadURL(api.ref(api.storage, path));
            files[ext] = { path, url };
          } catch { /* 파일 없음 또는 권한 없음 */ }
        }));
      }
      return buildForm(item.id, files);
    }));
    return { forms, source: 'catalog', error };
  }
}

/** 서식 한 건과 각 파일의 다운로드 주소를 가져옵니다. */
export async function loadForm(id) {
  const { forms, source, error } = await loadForms();
  const form = forms.find((item) => item.id === id) || null;
  if (!form) return { form: null, source, error };

  const api = await storageApi().catch(() => null);
  if (api) {
    await Promise.all(form.formats.map(async (ext) => {
      const file = form.files[ext];
      if (file.url) return;
      try {
        file.url = await api.getDownloadURL(api.ref(api.storage, file.path));
      } catch { /* 주소를 받지 못한 형식은 버튼을 비활성화합니다. */ }
    }));
  }
  return { form, source, error };
}

export function catalogForms() {
  return FORM_CATALOG.map((item) => buildForm(item.id, {}));
}
