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
    ${session.isAdmin ? `<a class="auth-link auth-admin" href="${BASE}admin/"><span>회원 관리</span></a>` : ''}
    <button type="button" class="auth-link auth-logout" data-auth-logout><span>로그아웃</span></button>`;
}

authBox?.addEventListener('click', async (event) => {
  if (!event.target.closest('[data-auth-logout]')) return;
  await signOutUser();
  showSession(null);
  if (document.body.dataset.page === 'login') location.reload();
});

// 로그인한 적이 있는 브라우저에서만 인증 모듈을 불러 상태를 확인합니다.
const hint = readHint();
if (hint) {
  showSession(hint);
  if (document.body.dataset.page !== 'login') watchSession(showSession);
}

setupReveal();
watchLogos();
