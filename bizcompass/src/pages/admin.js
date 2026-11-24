// 관리자 페이지 — 사이트의 회원 로그인과 별개로, 관리자 계정으로 따로 로그인해야 열립니다.
import { watchAdmin, adminSignIn, adminSignOut, listMembers, setMemberStatus } from '../lib/admin.js';
import { authMessage } from '../lib/auth.js';
import { MEMBER_TYPES } from '../data/membership.js';
import { esc, icon } from '../render/util.js';

const $ = (id) => document.getElementById(id);
const views = { loading: $('admin-loading'), login: $('admin-login'), panel: $('admin-panel') };
const loginForm = $('admin-login-form');
const loginMessage = $('admin-login-message');
const loginSubmit = $('admin-login-submit');
const list = $('admin-list');
const message = $('admin-message');
const side = $('admin-side');
const backdrop = $('admin-backdrop');
const menuButton = $('admin-menu');

// 화면(탭)별 문구
const TABS = {
  pending: { title: '가입 대기', icon: 'clock', card: '가입 대기 처리', text: '회원가입이 끝난 계정을 확인하고 이용 권한을 부여합니다.', empty: '가입 대기 중인 계정이 없습니다.' },
  approved: { title: '승인된 회원', icon: 'userCheck', card: '승인된 회원', text: '이용 권한이 부여된 계정입니다. 필요하면 승인을 취소할 수 있습니다.', empty: '승인된 회원이 없습니다.' },
  all: { title: '전체 회원', icon: 'users', card: '전체 회원', text: '가입한 모든 계정을 한곳에서 확인합니다.', empty: '아직 가입한 회원이 없습니다.' },
};

const requestedTab = new URLSearchParams(location.search).get('tab');
const state = { members: [], tab: TABS[requestedTab] ? requestedTab : 'pending', camp: '', cohort: '', type: '', query: '', busy: new Set() };

function show(name) {
  Object.entries(views).forEach(([key, element]) => { element.hidden = key !== name; });
}

function loginError(text, field) {
  loginMessage.textContent = text;
  loginMessage.hidden = !text;
  field?.focus();
}

function say(text) {
  message.textContent = text;
  message.hidden = !text;
}

const statusOf = (member) => (member.status === 'approved' ? 'approved' : 'pending');
const formatDate = (value) => (typeof value === 'number'
  ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(value))
  : '–');

function filtered() {
  const keyword = state.query.trim().toLowerCase();
  return state.members.filter((member) => {
    if (state.tab !== 'all' && statusOf(member) !== state.tab) return false;
    if (state.camp && member.camp !== state.camp) return false;
    if (state.cohort && String(member.cohort) !== state.cohort) return false;
    if (state.type && member.memberType !== state.type) return false;
    return !keyword || `${member.name} ${member.email} ${member.camp}`.toLowerCase().includes(keyword);
  });
}

function memberRow(member) {
  const status = statusOf(member);
  const busy = state.busy.has(member.uid);
  const action = status === 'approved'
    ? `<button type="button" class="adm-btn" data-uid="${esc(member.uid)}" data-next="pending"${busy ? ' disabled' : ''}>승인 취소</button>`
    : `<button type="button" class="adm-btn adm-btn--primary" data-uid="${esc(member.uid)}" data-next="approved"${busy ? ' disabled' : ''}>승인</button>`;
  return `<tr>
    <td data-label="회원"><div class="adm-person"><strong>${esc(member.name || '(이름 없음)')}</strong><span>${esc(member.email || '')}</span></div></td>
    <td data-label="가입 유형">${esc(member.memberType || '–')}</td>
    <td data-label="캠프 / 기수"><div class="adm-person"><strong>${esc(member.camp || '–')}</strong><span>${member.cohort ? `${esc(member.cohort)}기` : ''}</span></div></td>
    <td data-label="가입일">${esc(formatDate(member.createdAt))}</td>
    <td data-label="상태"><span class="adm-pill adm-pill--${status}">${status === 'approved' ? '승인됨' : '승인 대기'}</span></td>
    <td class="adm-cell-action">${action}</td>
  </tr>`;
}

function options(select, allLabel, values, selected, format = (value) => value) {
  select.innerHTML = [`<option value="">${allLabel}</option>`, ...values.map((value) => `<option value="${esc(value)}"${String(value) === selected ? ' selected' : ''}>${esc(format(value))}</option>`)].join('');
}

function render() {
  const tab = TABS[state.tab];
  const counts = { pending: 0, approved: 0 };
  const types = Object.fromEntries(MEMBER_TYPES.map((name) => [name, 0]));
  state.members.forEach((member) => {
    counts[statusOf(member)] += 1;
    if (member.memberType in types) types[member.memberType] += 1;
  });

  // 제목 · 메뉴 · 주소
  $('admin-title').textContent = tab.title;
  $('admin-heading').textContent = tab.title;
  $('admin-heading-icon').innerHTML = icon(tab.icon, 18);
  $('admin-card-title').textContent = tab.card;
  $('admin-card-text').textContent = tab.text;
  document.querySelectorAll('.adm-nav-item[data-tab]').forEach((item) => {
    if (item.dataset.tab === state.tab) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  const badge = $('admin-nav-pending');
  badge.textContent = String(counts.pending);
  badge.hidden = counts.pending === 0;
  const url = new URL(location.href);
  url.searchParams.set('tab', state.tab);
  history.replaceState(null, '', url);

  // 현황 띠
  const stats = [
    { tab: 'pending', value: counts.pending, label: '가입 대기' },
    { tab: 'approved', value: counts.approved, label: '승인됨' },
    { tab: 'all', value: state.members.length, label: '전체' },
    ...MEMBER_TYPES.map((name) => ({ value: types[name], label: name })),
  ];
  $('admin-stats').innerHTML = stats.map((stat) => (stat.tab
    ? `<button type="button" class="adm-stat" data-tab="${stat.tab}" aria-pressed="${stat.tab === state.tab}"><strong>${stat.value}</strong><span>${stat.label}</span></button>`
    : `<span class="adm-stat"><strong>${stat.value}</strong><span>${esc(stat.label)}</span></span>`)).join('');

  // 필터
  const camps = [...new Set(state.members.map((member) => member.camp).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
  const cohorts = [...new Set(state.members.map((member) => member.cohort).filter(Boolean))].sort((a, b) => a - b);
  if (state.camp && !camps.includes(state.camp)) state.camp = '';
  if (state.cohort && !cohorts.map(String).includes(state.cohort)) state.cohort = '';
  options($('admin-camp'), '전체 캠프', camps, state.camp);
  options($('admin-cohort'), '전체 기수', cohorts, state.cohort, (value) => `${value}기`);
  options($('admin-type'), '전체 유형', MEMBER_TYPES, state.type);

  // 목록
  const result = filtered();
  list.innerHTML = result.map(memberRow).join('');
  $('admin-table-wrap').hidden = result.length === 0;
  const empty = $('admin-empty');
  empty.hidden = result.length !== 0;
  const hasFilter = state.query || state.camp || state.cohort || state.type;
  empty.textContent = hasFilter ? '조건에 맞는 회원이 없습니다.' : tab.empty;
  $('admin-summary').textContent = `${result.length}명`;
}

function setTab(tab) {
  if (!TABS[tab]) return;
  state.tab = tab;
  closeMenu();
  render();
}

// ── 좁은 화면의 메뉴 서랍 ──
function openMenu() {
  side.classList.add('is-open');
  backdrop.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  side.classList.remove('is-open');
  backdrop.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}

menuButton.addEventListener('click', openMenu);
$('admin-side-close').addEventListener('click', closeMenu);
backdrop.addEventListener('click', closeMenu);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

/** 회원 목록을 불러옵니다. 관리자 계정이 아니면 로그아웃시키고 로그인 화면으로 돌려보냅니다. */
async function load() {
  say('');
  const refresh = $('admin-refresh');
  refresh.disabled = true;
  try {
    const members = await listMembers();
    // 승인 대기를 먼저, 그 안에서는 최근 가입 순
    state.members = members.sort((a, b) => (statusOf(a) === statusOf(b) ? (b.createdAt || 0) - (a.createdAt || 0) : statusOf(a) === 'pending' ? -1 : 1));
    show('panel');
    render();
  } catch (error) {
    if (error?.code === 'not-admin') {
      await adminSignOut().catch(() => {});
      show('login');
      loginError(authMessage(error));
    } else if (views.panel.hidden) {
      show('login');
      loginError(authMessage(error));
    } else {
      say(authMessage(error));
    }
  } finally {
    refresh.disabled = false;
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError('');
  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;
  if (!email) return loginError('이메일을 입력해 주세요.', loginForm.elements.email);
  if (!password) return loginError('비밀번호를 입력해 주세요.', loginForm.elements.password);

  loginSubmit.disabled = true;
  loginSubmit.querySelector('span').textContent = '로그인 중…';
  try {
    await adminSignIn(email, password); // 로그인되면 watchAdmin 이 목록을 엽니다.
    loginForm.reset();
  } catch (error) {
    loginError(authMessage(error));
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.querySelector('span').textContent = '로그인';
  }
  return undefined;
});

$('admin-logout').addEventListener('click', async () => {
  closeMenu();
  await adminSignOut();
  state.members = [];
  list.innerHTML = '';
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-uid]');
  if (!button || button.disabled) return;
  const { uid, next } = button.dataset;
  const member = state.members.find((item) => item.uid === uid);
  if (!member) return;

  say('');
  state.busy.add(uid);
  render();
  try {
    await setMemberStatus(uid, next);
    member.status = next;
  } catch (error) {
    say(`${member.name || member.email}: ${authMessage(error)}`);
  } finally {
    state.busy.delete(uid);
    render();
  }
});

document.querySelector('.adm-nav').addEventListener('click', (event) => {
  const item = event.target.closest('[data-tab]');
  if (item) setTab(item.dataset.tab);
});
$('admin-stats').addEventListener('click', (event) => {
  const item = event.target.closest('[data-tab]');
  if (item) setTab(item.dataset.tab);
});
$('admin-camp').addEventListener('change', (event) => { state.camp = event.target.value; render(); });
$('admin-cohort').addEventListener('change', (event) => { state.cohort = event.target.value; render(); });
$('admin-type').addEventListener('change', (event) => { state.type = event.target.value; render(); });
$('admin-search').addEventListener('input', (event) => { state.query = event.target.value; render(); });
$('admin-refresh').addEventListener('click', load);

watchAdmin((admin) => {
  if (!admin) {
    show('login');
    return;
  }
  $('admin-who').textContent = admin.name;
  $('admin-who-email').textContent = admin.email;
  load();
}).catch(() => {
  show('login');
  loginError('로그인 기능을 불러오지 못했습니다. 새로고침해 주세요.');
});
