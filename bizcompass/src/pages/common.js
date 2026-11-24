// 모든 페이지 공통 동작
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

setupReveal();
watchLogos();
