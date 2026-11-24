import { BASE, watchAccess, gateBox, openLoginModal } from './common.js';
import { loadForm } from '../lib/forms.js';
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
  document.title = `${form.title} | 비즈컴퍼스`;
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

function showDownloads(form) {
  downloads.innerHTML = form.formats.map((ext) => {
    const file = form.files[ext];
    const body = `${icon('download', 18)}<span><b>${esc(formatLabel(ext))}</b><small>${esc(formatHint(ext))}</small></span>`;
    // 비회원은 파일 주소를 받지 않고, 누르면 로그인 안내가 뜹니다.
    if (level !== 'member') return `<button type="button" class="download-btn" data-needs-login>${body}</button>`;
    return file.url
      ? `<a class="download-btn" href="${esc(file.url)}" target="_blank" rel="noopener noreferrer" download>${body}</a>`
      : `<span class="download-btn is-disabled" aria-disabled="true">${body}</span>`;
  }).join('');
}

downloads.addEventListener('click', (event) => {
  if (event.target.closest('[data-needs-login]')) openLoginModal(level, '서식 다운로드는 회원만 이용할 수 있습니다.');
});

function showViewer(form) {
  viewer.setAttribute('aria-busy', 'false');
  const pdf = form.files.pdf;
  if (!pdf || (level === 'member' && !pdf.url)) {
    const first = form.formats.map((ext) => form.files[ext]).find((file) => file.url);
    viewer.innerHTML = `<div class="viewer-state">
      <h2>미리보기는 PDF 파일만 지원해요</h2>
      <p>${level !== 'member' || first ? '위의 다운로드 버튼으로 원본 파일을 내려받아 확인해 주세요.' : '파일 주소를 받아오지 못했습니다. 잠시 후 다시 시도해 주세요.'}</p>
    </div>`;
    return;
  }
  // toolbar=0 · navpanes=0: 브라우저 PDF 뷰어의 도구 모음(확대·인쇄·저장 등)과 옆 패널을 숨깁니다.
  const frame = (src) => `<iframe class="viewer-frame" src="${esc(src)}#toolbar=0&navpanes=0&view=FitH" title="${esc(form.title)} 미리보기" loading="lazy"></iframe>`;
  if (level === 'member') {
    viewer.innerHTML = frame(pdf.url);
    return;
  }
  // 비회원: 서버에서 앞 2쪽만 잘라 온 미리보기 + 가려진 나머지
  const rest = form.pages ? Math.max(0, form.pages - PREVIEW_PAGES) : null;
  viewer.innerHTML = `${frame(`${BASE}api/form-preview/?path=${encodeURIComponent(pdf.path)}`)}
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
  // 카탈로그에 있는 서식은 Storage 응답을 기다리지 않고 제목부터 보여 줍니다.
  const known = FORM_CATALOG.find((form) => form.id === id);
  if (known) showInfo(known);

  if (!id) {
    title.textContent = '서식을 찾을 수 없어요';
    showState('주소를 다시 확인해 주세요', '서식 목록에서 원하는 문서를 선택해 주세요.');
    return;
  }

  const { form } = await loadForm(id, { withUrls: level === 'member' });
  if (run !== rendered) return; // 그 사이 로그인 상태가 바뀌었으면 새 결과에 맡깁니다.
  if (!form) {
    title.textContent = '서식을 찾을 수 없어요';
    showState('등록되지 않은 서식이에요', '삭제되었거나 주소가 바뀌었을 수 있습니다.');
    return;
  }

  showInfo(form);
  if (!form.available) {
    showState('서식 파일을 준비하고 있어요', '파일이 등록되면 이곳에서 미리 보고 내려받을 수 있습니다.');
    return;
  }
  showDownloads(form);
  showViewer(form);
}

watchAccess((access) => {
  level = access.level;
  init();
});
