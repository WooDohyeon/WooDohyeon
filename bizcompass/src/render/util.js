// HTML 문자열 렌더링 도우미 (빌드 시 미리 렌더링 + 브라우저에서 다시 그릴 때 공용)

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

const ICON_PATHS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  external: '<path d="M7 17 17 7M8 7h9v9"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  file: '<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  spark: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
};

export function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

// 브랜드 마크 · 히어로에 쓰는 나침반
export function compassMark(size = 30) {
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18.25" fill="var(--second)" stroke="var(--ink)" stroke-width="2.5"/>
    <path d="M26.5 13.5 22.6 22.6 13.5 26.5 17.4 17.4z" fill="var(--ink)"/>
    <path d="M26.5 13.5 22.6 22.6 17.4 17.4z" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="20" cy="20" r="1.6" fill="var(--main)"/>
  </svg>`;
}
