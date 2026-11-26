import { esc, icon } from './util.js';
import { ROADMAP_STAGES, TIPS_FLOW, ROADMAP_NOTE } from '../data/roadmap.js';

function safeHref(value) {
  if (!value) return null;
  const href = String(value).trim();
  if (href.startsWith('/') && !href.startsWith('//')) return { href, external: false };
  try {
    const url = new URL(href);
    return ['https:', 'http:'].includes(url.protocol) ? { href: url.href, external: true } : null;
  } catch {
    return null;
  }
}

function programCard(program) {
  const link = safeHref(program.href);
  const body = `<strong>${esc(program.title)}</strong><span>${esc(program.eligibility)}</span>`;
  // 상세 정보가 있는 사업은 눌러서 모달을 여는 버튼으로 그립니다.
  if (program.detail) {
    return `<button type="button" class="program is-detail" data-program="${esc(program.id)}" aria-haspopup="dialog" aria-label="${esc(program.title)} 상세 보기">${body}${icon('arrow', 16)}</button>`;
  }
  if (!link) return `<div class="program">${body}</div>`;
  const attrs = link.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a class="program is-linked" href="${esc(link.href)}"${attrs} aria-label="${esc(program.title)} 사업 알아보기${link.external ? ' (새 탭)' : ''}">${body}${icon('external', 16)}</a>`;
}

/** 창업 단계별 로드맵 (단계 4개 + TIPS 연계 흐름) */
export function roadmap() {
  const stages = ROADMAP_STAGES.map((stage) => `
    <li class="stage">
      <div class="stage-head">
        <span class="stage-number" aria-hidden="true">${stage.number}</span>
        <div>
          <h3>${esc(stage.title)}</h3>
          <p>${esc(stage.period)}</p>
        </div>
      </div>
      <ul class="stage-programs">${stage.programs.map((program) => `<li>${programCard(program)}</li>`).join('')}</ul>
    </li>`).join('');

  const tips = TIPS_FLOW.map((program) => `<li>${programCard(program)}</li>`).join('');

  return `<div class="roadmap">
    <ol class="roadmap-stages" aria-label="창업 성장 단계">${stages}</ol>
    <div class="tips">
      <div class="tips-head">
        <h3>TIPS 연계 흐름</h3>
        <p>Pre-TIPS부터 Post-TIPS까지</p>
      </div>
      <ol class="tips-flow" aria-label="Pre-TIPS에서 TIPS, Post-TIPS로 이어지는 흐름">${tips}</ol>
    </div>
    <p class="roadmap-note">${esc(ROADMAP_NOTE)}</p>
  </div>`;
}
