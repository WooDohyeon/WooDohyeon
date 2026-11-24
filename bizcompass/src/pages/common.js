// 모든 페이지 공통 동작
import { readHint, watchSession, signOutUser } from '../lib/auth.js';

export const BASE = import.meta.env.BASE_URL;

// 스크롤 시 섹션이 살짝 올라오며 나타나는 효과 (JS·모션 허용 시에만)
function setupReveal() {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll('.section-head, .dest-card, .stage, .tips, .doc-card, .type-tile, .next-card, .cta-band, .notice-panel');
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((target) => {
    // 이미 화면 안에 있는 요소는 숨기지 않습니다.
    if (target.getBoundingClientRect().top < innerHeight * 0.92) return;
    target.classList.add('reveal');
    observer.observe(target);
  });
}

/** 파비콘을 불러오지 못한 레퍼런스 카드는 이름 첫 글자를 대신 보여 줍니다. */
export function watchLogos(root = document) {
  const fallback = (img) => {
    const box = img.closest('.ref-logo');
    if (!box) return;
    box.classList.add('is-fallback');
    img.remove();
  };
  root.querySelectorAll('.ref-logo img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) fallback(img);
    else img.addEventListener('error', () => fallback(img), { once: true });
  });
}

// ── 상단 메뉴의 로그인 상태 ─────────────────────────────────────
const authBox = document.querySelector('[data-auth]');
const loggedOutMarkup = authBox?.innerHTML ?? '';
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** 상단 메뉴를 로그인 상태에 맞게 바꿉니다. session 이 없으면 로그인 · 회원가입 버튼으로 되돌립니다. */
export function showSession(session) {
  if (!authBox) return;
  if (!session) {
    authBox.innerHTML = loggedOutMarkup;
    return;
  }
  const name = session.name || '회원';
  authBox.innerHTML = `<a class="auth-user" href="${BASE}login/" aria-label="내 계정 (${escapeHtml(name)})">
      <span class="auth-avatar" aria-hidden="true">${escapeHtml([...name][0])}</span>
      <span class="auth-name">${escapeHtml(name)}님</span>
    </a>
    <button type="button" class="auth-link auth-logout" data-auth-logout><span>로그아웃</span></button>`;
}

// ── 접근 등급 ───────────────────────────────────────────────────
// member: 관리자가 승인한 회원 · pending: 로그인했지만 승인 대기 · guest: 로그인하지 않음
let access = null;
const accessListeners = [];

function setAccess(session) {
  access = { level: !session ? 'guest' : session.status === 'approved' ? 'member' : 'pending', session: session || null };
  accessListeners.forEach((listener) => listener(access));
}

/** 접근 등급이 정해지거나 바뀔 때마다 콜백을 부릅니다. */
export function watchAccess(listener) {
  accessListeners.push(listener);
  if (access) listener(access);
}

const loginUrl = () => `${BASE}login/?next=${encodeURIComponent(location.pathname + location.search)}`;

/** 회원 전용 영역에 놓는 안내 상자 (비회원: 로그인 버튼 · 승인 대기: 대기 안내) */
export function gateBox(level, { title, text }) {
  if (level === 'pending') {
    return `<div class="gate-box">
      <span class="tag tag--accent">승인 대기</span>
      <h3>운영진 승인 후 이용할 수 있어요</h3>
      <p>가입 신청이 접수되었습니다. 권한이 부여되면 바로 이용하실 수 있습니다.</p>
      <div class="gate-actions"><a class="btn" href="${BASE}login/">내 계정 보기</a></div>
    </div>`;
  }
  return `<div class="gate-box">
    <span class="tag tag--second">회원 전용</span>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(text)}</p>
    <div class="gate-actions">
      <a class="btn btn--accent" href="${loginUrl()}">로그인</a>
      <a class="btn" href="${BASE}signup/">회원가입</a>
    </div>
  </div>`;
}

/** 로그인 안내 모달 */
export function openLoginModal(level, text = '이 기능은 회원만 이용할 수 있습니다.') {
  let dialog = document.getElementById('login-modal');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'login-modal';
    dialog.className = 'modal';
    dialog.setAttribute('aria-labelledby', 'login-modal-title');
    document.body.append(dialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-modal-close]')) dialog.close();
    });
  }
  const pending = level === 'pending';
  dialog.innerHTML = `<div class="modal-body">
    <button type="button" class="modal-close" data-modal-close aria-label="닫기">×</button>
    <span class="tag ${pending ? 'tag--accent' : 'tag--second'}">${pending ? '승인 대기' : '회원 전용'}</span>
    <h2 id="login-modal-title">${pending ? '운영진 승인 후 이용할 수 있어요' : '로그인이 필요합니다'}</h2>
    <p>${pending ? '가입 신청이 접수되었습니다. 권한이 부여되면 바로 이용하실 수 있습니다.' : escapeHtml(text)}</p>
    <div class="gate-actions">
      ${pending
        ? `<a class="btn btn--accent" href="${BASE}login/">내 계정 보기</a>`
        : `<a class="btn btn--accent" href="${loginUrl()}">로그인</a><a class="btn" href="${BASE}signup/">회원가입</a>`}
      <button type="button" class="btn" data-modal-close>닫기</button>
    </div>
  </div>`;
  dialog.showModal();
}

authBox?.addEventListener('click', async (event) => {
  if (!event.target.closest('[data-auth-logout]')) return;
  await signOutUser();
  showSession(null);
  setAccess(null);
  if (document.body.dataset.page === 'login') location.reload();
});

// 로그인한 적이 있는 브라우저에서만 인증 모듈을 불러 상태를 확인합니다.
const hint = readHint();
if (!hint) {
  setAccess(null);
} else {
  showSession(hint);
  if (document.body.dataset.page !== 'login') {
    watchSession((session) => {
      showSession(session);
      setAccess(session);
    });
  }
}

setupReveal();
watchLogos();
