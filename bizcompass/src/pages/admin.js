// 관리자 페이지 — 사이트의 회원 로그인과 별개로, 관리자 계정으로 따로 로그인해야 열립니다.
import { watchAdmin, adminSignIn, adminSignOut, listMembers, setMemberStatus } from '../lib/admin.js';
import { authMessage } from '../lib/auth.js';
import { MEMBER_TYPES } from '../data/membership.js';
import { esc } from '../render/util.js';

const $ = (id) => document.getElementById(id);
const views = { loading: $('admin-loading'), login: $('admin-login'), panel: $('admin-panel') };
const loginForm = $('admin-login-form');
const loginMessage = $('admin-login-message');
const loginSubmit = $('admin-login-submit');
const list = $('admin-list');
const message = $('admin-message');

const STATUS_TABS = [
  { key: 'pending', label: '승인 대기' },
  { key: 'approved', label: '승인됨' },
  { key: '', label: '전체' },
];

const state = { members: [], status: 'pending', camp: '', type: '', query: '', busy: new Set() };

function show(name) {
  Object.entries(views).forEach(([key, element]) => { element.hidden = key !== name; });
  $('admin-session').hidden = name !== 'panel';
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
    if (state.status && statusOf(member) !== state.status) return false;
    if (state.camp && member.camp !== state.camp) return false;
    if (state.type && member.memberType !== state.type) return false;
    return !keyword || `${member.name} ${member.email}`.toLowerCase().includes(keyword);
  });
}

function memberCard(member) {
  const status = statusOf(member);
  const busy = state.busy.has(member.uid);
  const action = status === 'approved'
    ? `<button type="button" class="btn" data-uid="${esc(member.uid)}" data-next="pending"${busy ? ' disabled' : ''}>승인 취소</button>`
    : `<button type="button" class="btn btn--accent" data-uid="${esc(member.uid)}" data-next="approved"${busy ? ' disabled' : ''}>승인</button>`;
  return `<li>
    <article class="member-card">
      <div class="member-main">
        <div class="member-top">
          <span class="tag tag--${status === 'approved' ? 'second' : 'accent'}">${status === 'approved' ? '승인됨' : '승인 대기'}</span>
          <h3>${esc(member.name || '(이름 없음)')}</h3>
        </div>
        <p class="member-email">${esc(member.email || '')}</p>
      </div>
      <dl class="member-facts">
        <div><dt>가입 유형</dt><dd>${esc(member.memberType || '–')}</dd></div>
        <div><dt>캠프</dt><dd>${esc(member.camp || '–')}</dd></div>
        <div><dt>기수</dt><dd>${member.cohort ? `${esc(member.cohort)}기` : '–'}</dd></div>
        <div><dt>가입일</dt><dd>${esc(formatDate(member.createdAt))}</dd></div>
      </dl>
      <div class="member-action">${action}</div>
    </article>
  </li>`;
}

function render() {
  const counts = { pending: 0, approved: 0 };
  state.members.forEach((member) => { counts[statusOf(member)] += 1; });

  $('admin-pending').textContent = String(counts.pending);
  $('admin-status').innerHTML = STATUS_TABS
    .map((tab) => `<button type="button" class="chip" data-status="${tab.key}" aria-pressed="${tab.key === state.status}">${tab.label} <span>${tab.key ? counts[tab.key] : state.members.length}</span></button>`)
    .join('');

  const camps = [...new Set(state.members.map((member) => member.camp).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
  if (state.camp && !camps.includes(state.camp)) state.camp = '';
  $('admin-camp').innerHTML = ['<option value="">전체 캠프</option>', ...camps.map((name) => `<option value="${esc(name)}"${name === state.camp ? ' selected' : ''}>${esc(name)}</option>`)].join('');
  $('admin-type').innerHTML = ['<option value="">전체 유형</option>', ...MEMBER_TYPES.map((name) => `<option value="${esc(name)}"${name === state.type ? ' selected' : ''}>${esc(name)}</option>`)].join('');

  const result = filtered();
  list.innerHTML = result.map(memberCard).join('');
  list.hidden = result.length === 0;
  $('admin-empty').hidden = result.length !== 0;
  if (!result.length) {
    const none = state.members.length === 0;
    $('admin-empty-title').textContent = none ? '아직 가입한 회원이 없어요' : state.status === 'pending' && !state.query && !state.camp && !state.type ? '승인을 기다리는 회원이 없어요' : '조건에 맞는 회원이 없어요';
    $('admin-empty-text').textContent = none ? '가입 신청이 들어오면 이곳에 표시됩니다.' : '상태 탭이나 필터를 바꿔 다른 회원을 확인해 보세요.';
  }
  $('admin-summary').textContent = `회원 ${state.members.length}명 중 ${result.length}명 표시`;
}

/** 회원 목록을 불러옵니다. 관리자 계정이 아니면 로그아웃시키고 로그인 화면으로 돌려보냅니다. */
async function load() {
  say('');
  try {
    const members = await listMembers();
    // 승인 대기를 먼저, 그 안에서는 최근 가입 순
    state.members = members.sort((a, b) => (statusOf(a) === statusOf(b) ? (b.createdAt || 0) - (a.createdAt || 0) : statusOf(a) === 'pending' ? -1 : 1));
    show('panel');
    render();
    return true;
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
    return false;
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

$('admin-status').addEventListener('click', (event) => {
  const button = event.target.closest('[data-status]');
  if (!button) return;
  state.status = button.dataset.status;
  render();
});
$('admin-camp').addEventListener('change', (event) => { state.camp = event.target.value; render(); });
$('admin-type').addEventListener('change', (event) => { state.type = event.target.value; render(); });
$('admin-search').addEventListener('input', (event) => { state.query = event.target.value; render(); });
$('admin-refresh').addEventListener('click', load);

watchAdmin((admin) => {
  if (!admin) {
    show('login');
    return;
  }
  $('admin-who').textContent = admin.name;
  load();
}).catch(() => {
  show('login');
  loginError('로그인 기능을 불러오지 못했습니다. 새로고침해 주세요.');
});
