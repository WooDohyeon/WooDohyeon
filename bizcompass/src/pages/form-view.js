import { BASE, watchAccess, gateBox, openLoginModal } from './common.js';
import { loadForm, fetchFormFile } from '../lib/forms.js';
import { getIdToken } from '../lib/auth.js';
import { FORM_CATALOG, FORMAT_INFO } from '../data/forms.catalog.js';
import { esc, icon } from '../render/util.js';

const id = new URLSearchParams(location.search).get('id') || '';
const title = document.getElementById('form-title');
const meta = document.getElementById('form-meta');
const desc = document.getElementById('form-desc');
const downloads = document.getElementById('form-downloads');
const viewer = document.getElementById('form-viewer');

const formatLabel = (ext) => FORMAT_INFO[ext]?.label || ext.toUpperCase();
const formatHint = (ext) => FORMAT_INFO[ext]?.hint || '원본 파일';

function showInfo(form) {
  title.textContent = form.title;
  desc.textContent = form.description || '';
  meta.textContent = [form.category, form.updated && `업데이트 ${form.updated}`, form.pages && `${form.pages}페이지`].filter(Boolean).join(' · ');
  document.title = `${form.title} | OZ BizLab`;
}

function showState(heading, text) {
  viewer.setAttribute('aria-busy', 'false');
  viewer.innerHTML = `<div class="viewer-state">
    <h2>${esc(heading)}</h2>
    <p>${esc(text)}</p>
    <a class="btn" href="${BASE}forms/">${icon('back', 18)} 서식 목록으로</a>
  </div>`;
}

const PREVIEW_PAGES = 2;
let level = 'guest';

let current = null; // 지금 보고 있는 서식
let previewUrl = '';

function showDownloads(form) {
  downloads.innerHTML = form.formats.map((ext) => {
    const body = `${icon('download', 18)}<span><b>${esc(formatLabel(ext))}</b><small>${esc(formatHint(ext))}</small></span>`;
    // 비회원은 누르면 로그인 안내가 뜨고, 회원은 서버에서 파일을 받아 저장합니다.
    return level === 'member'
      ? `<button type="button" class="download-btn" data-download="${esc(ext)}">${body}</button>`
      : `<button type="button" class="download-btn" data-needs-login>${body}</button>`;
  }).join('');
}

/** 받아 온 파일을 브라우저의 다운로드로 넘깁니다. */
function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

downloads.addEventListener('click', async (event) => {
  if (event.target.closest('[data-needs-login]')) {
    openLoginModal(level, '서식 다운로드는 회원만 이용할 수 있습니다.');
    return;
  }
  const button = event.target.closest('[data-download]');
  if (!button || button.disabled || !current) return;
  const ext = button.dataset.download;
  const small = button.querySelector('small');
  button.disabled = true;
  small.textContent = '내려받는 중…';
  try {
    const { path } = current.files[ext];
    saveBlob(await fetchFormFile(path, await getIdToken(), BASE), path.split('/').pop());
    small.textContent = formatHint(ext);
  } catch (error) {
    console.error(error);
    small.textContent = '받지 못했어요. 다시 눌러 주세요';
  } finally {
    button.disabled = false;
  }
});

// toolbar=0 · navpanes=0: 브라우저 PDF 뷰어의 도구 모음(확대·인쇄·저장 등)과 옆 패널을 숨깁니다.
const frame = (src, name) => `<iframe class="viewer-frame" src="${esc(src)}#toolbar=0&navpanes=0&view=FitH" title="${esc(name)} 미리보기"></iframe>`;

async function showViewer(form, run) {
  const pdf = form.files.pdf;
  if (!pdf) {
    viewer.setAttribute('aria-busy', 'false');
    viewer.innerHTML = `<div class="viewer-state">
      <h2>미리보기는 PDF 파일만 지원해요</h2>
      <p>위의 다운로드 버튼으로 원본 파일을 내려받아 확인해 주세요.</p>
    </div>`;
    return;
  }
  if (level === 'member') {
    // 회원: 로그인 토큰으로 전체 PDF 를 받아 보여 줍니다.
    try {
      const blob = await fetchFormFile(pdf.path, await getIdToken(), BASE);
      if (run !== rendered) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      viewer.innerHTML = frame(previewUrl, form.title);
    } catch (error) {
      console.error(error);
      if (run !== rendered) return;
      viewer.innerHTML = `<div class="viewer-state">
        <h2>미리보기를 불러오지 못했어요</h2>
        <p>잠시 후 새로고침해 주세요.</p>
      </div>`;
    }
    viewer.setAttribute('aria-busy', 'false');
    return;
  }
  viewer.setAttribute('aria-busy', 'false');
  // 비회원: 서버에서 앞 2쪽만 잘라 온 미리보기 + 가려진 나머지
  const rest = form.pages ? Math.max(0, form.pages - PREVIEW_PAGES) : null;
  viewer.innerHTML = `${frame(`${BASE}api/form-preview/?path=${encodeURIComponent(pdf.path)}`, form.title)}
    <div class="gate-fade gate-fade--page">
      <div class="gate-fade-content" aria-hidden="true"><div class="page-blank"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div></div>
      <div class="gate-fade-cta">${gateBox(level, {
        title: rest ? `나머지 ${rest}페이지는 로그인 후 볼 수 있어요` : `${PREVIEW_PAGES}페이지 이후는 로그인 후 볼 수 있어요`,
        text: '로그인하면 전체 내용을 보고 PDF · DOCX 파일을 내려받을 수 있습니다.',
      })}</div>
    </div>`;
}

let rendered = 0;
async function init() {
  const run = ++rendered;
  // 카탈로그에 있는 서식은 목록 응답을 기다리지 않고 제목부터 보여 줍니다.
  const known = FORM_CATALOG.find((form) => form.id === id);
  if (known) showInfo(known);

  if (!id) {
    title.textContent = '서식을 찾을 수 없어요';
    showState('주소를 다시 확인해 주세요', '서식 목록에서 원하는 문서를 선택해 주세요.');
    return;
  }

  const { form } = await loadForm(id, BASE);
  if (run !== rendered) return; // 그 사이 로그인 상태가 바뀌었으면 새 결과에 맡깁니다.
  if (!form) {
    title.textContent = '서식을 찾을 수 없어요';
    showState('등록되지 않은 서식이에요', '삭제되었거나 주소가 바뀌었을 수 있습니다.');
    return;
  }

  showInfo(form);
  current = form;
  if (!form.available) {
    showState('서식 파일을 준비하고 있어요', '파일이 등록되면 이곳에서 미리 보고 내려받을 수 있습니다.');
    return;
  }
  showDownloads(form);
  showViewer(form, run);
}

watchAccess((access) => {
  level = access.level;
  init();
});
