// 정부지원사업 로드맵 — 사업 카드를 누르면 상세 모달을 엽니다.
import './common.js';
import { ROADMAP_STAGES, TIPS_FLOW } from '../data/roadmap.js';
import { esc, icon } from '../render/util.js';

const programs = new Map([...ROADMAP_STAGES.flatMap((stage) => stage.programs.map((program) => ({ ...program, stage: stage.title }))), ...TIPS_FLOW.map((program) => ({ ...program, stage: 'TIPS 연계' }))].map((program) => [program.id, program]));

const list = (items) => `<ul>${[].concat(items || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

let dialog;
function open(program) {
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'modal modal--program';
    dialog.setAttribute('aria-labelledby', 'program-modal-title');
    document.body.append(dialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-modal-close]')) dialog.close();
    });
  }
  const { detail } = program;
  // 원문 링크가 여러 개면 버튼을 각각 만듭니다. 첫 번째 버튼만 강조합니다.
  const links = (detail.links || []).map((link) => ({ label: link.label || '원문 보기', url: safeUrl(link.url) })).filter((link) => link.url);
  const buttons = links.map((link, index) => `<a class="btn${index === 0 ? ' btn--accent' : ''}" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)} ${icon('external', 18)}</a>`).join('');
  dialog.innerHTML = `<div class="modal-body">
    <button type="button" class="modal-close" data-modal-close aria-label="닫기">×</button>
    <span class="tag tag--second">${esc(program.stage)}</span>
    <h2 id="program-modal-title">${esc(program.title)}</h2>
    <p class="program-summary">${esc(detail.summary)}</p>
    <dl class="program-facts">
      <div><dt>${icon('clock', 18)} 신청 시기</dt><dd>${list(detail.period)}</dd></div>
      <div><dt>${icon('spark', 18)} 규모</dt><dd>${list(detail.scale)}</dd></div>
      <div><dt>${icon('check', 18)} 자격 조건</dt><dd>${list(detail.conditions)}</dd></div>
    </dl>
    <p class="program-note">일정과 지원 내용은 회차마다 달라질 수 있습니다. 신청 전 원문 공고를 꼭 확인해 주세요.</p>
    <div class="gate-actions">
      ${buttons}
      <button type="button" class="btn" data-modal-close>닫기</button>
    </div>
  </div>`;
  dialog.showModal();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-program]');
  const program = button && programs.get(button.dataset.program);
  if (program?.detail) open(program);
});
