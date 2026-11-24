import './common.js';

// 신청자 유형 탭
const tabs = [...document.querySelectorAll('.applicant-tab')];
const panels = [...document.querySelectorAll('.applicant-panel')];

function select(id, { focus = false } = {}) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.applicant === id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  panels.forEach((panel) => { panel.hidden = panel.id !== `applicant-panel-${id}`; });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    select(tab.dataset.applicant);
    const url = new URL(location.href);
    url.searchParams.set('type', tab.dataset.applicant);
    history.replaceState(null, '', url);
  });
  tab.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    select(next.dataset.applicant, { focus: true });
  });
});

// 메인 페이지에서 ?type=pre 처럼 유형을 지정해 들어온 경우
const requested = new URLSearchParams(location.search).get('type');
if (requested && tabs.some((tab) => tab.dataset.applicant === requested)) select(requested);
