// 아티클 본문을 화면에 그릴 HTML 로 바꿉니다. (간단한 서식만 지원)
//   빈 줄 = 문단 나눔 · "## 소제목" · "- 목록" · "> 인용" · **굵게** · [링크](https://…) · ![설명](파일)
// 모든 글자는 먼저 안전하게 바꾼 뒤 서식만 다시 입히므로, 본문에 HTML 을 적어도 그대로 글자로 보입니다.
import { esc } from '../render/util.js';

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, href) => {
      const url = safeUrl(href.replace(/&amp;/g, '&'));
      return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
}

/** @param {string} body 본문  @param {(file: string) => string} fileUrl 그림 파일 이름 → 주소 */
export function renderArticle(body, fileUrl) {
  return String(body || '').replace(/\r/g, '').trim().split(/\n{2,}/).map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(lines.join(' '));
    if (image) return `<figure><img src="${esc(fileUrl(image[2]))}" alt="${esc(image[1])}" loading="lazy" />${image[1] ? `<figcaption>${esc(image[1])}</figcaption>` : ''}</figure>`;
    if (lines[0].startsWith('### ')) return `<h3>${inline(lines[0].slice(4))}</h3>`;
    if (lines[0].startsWith('## ')) return `<h2>${inline(lines[0].slice(3))}</h2>`;
    if (lines.every((line) => /^[-*] /.test(line))) return `<ul>${lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
    if (lines.every((line) => /^\d+\. /.test(line))) return `<ol>${lines.map((line) => `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    if (lines.every((line) => line.startsWith('>'))) return `<blockquote>${lines.map((line) => inline(line.replace(/^>\s?/, ''))).join('<br />')}</blockquote>`;
    return `<p>${lines.map(inline).join('<br />')}</p>`;
  }).join('\n');
}

/** 읽는 데 걸리는 시간(분). 한글 기준 1분에 약 500자 */
export function readMinutes(body) {
  return Math.max(1, Math.round(String(body || '').replace(/\s+/g, '').length / 500));
}
