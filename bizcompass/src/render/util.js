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
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  userPlus: '<circle cx="10" cy="8" r="4"/><path d="M2.5 20.5a7.5 7.5 0 0 1 15 0M19 8v6M16 11h6"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16.5 6.5l3 3M14 9l2 2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 19.5a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18 13.6a6.5 6.5 0 0 1 3.5 5.9"/>',
  userCheck: '<circle cx="10" cy="8" r="4"/><path d="M2.5 20.5a7.5 7.5 0 0 1 15 0M16 11l2 2 4-4"/>',
  refresh: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18.5 3.5v4h-4M5.5 20.5v-4h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4M14 12H4"/>',
};

export function icon(name, size = 18) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

// 브랜드 마크: 실험실(Lab)을 뜻하는 삼각 플라스크
export function brandMark(size = 30) {
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18.25" fill="var(--second)" stroke="var(--ink)" stroke-width="2.5"/>
    <path d="M16.6 9.6h6.8M17.6 9.6v7.2L11.6 27a2.2 2.2 0 0 0 1.9 3.3h13a2.2 2.2 0 0 0 1.9-3.3l-6-10.2V9.6" fill="none" stroke="var(--main)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.9 23.2h10.2l2.2 3.8a1.3 1.3 0 0 1-1.1 2H13.8a1.3 1.3 0 0 1-1.1-2z" fill="var(--accent-soft)"/>
    <circle cx="21.6" cy="19.6" r="1.2" fill="var(--accent-soft)"/>
  </svg>`;
}
