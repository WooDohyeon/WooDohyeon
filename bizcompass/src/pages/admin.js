import { BASE, showSession } from './common.js';
import { watchSession, listMembers, setMemberStatus, authMessage } from '../lib/auth.js';
import { MEMBER_TYPES } from '../data/membership.js';
import { esc } from '../render/util.js';

const $ = (id) => document.getElementById(id);
const gate = $('admin-gate');
const panel = $('admin-panel');
const list = $('admin-list');
const message = $('admin-message');

const STATUS_TABS = [
  { key: 'pending', label: '승인 대기' },
  { key: 'approved', label: '승인됨' },
  { key: '', label: '전체' },
];

const state = { members: [], status: 'pending', camp: '', type: '', query: '', busy: new Set() };

function showGate(title, text, action) {
  panel.hidden = true;
  $('admin-badge').hidden = true;
  gate.hidden = false;
  $('admin-gate-title').textContent = title;
  $('admin-gate-text').textContent = text;
  const button = $('admin-gate-action');
  button.hidden = !action;
  if (action) {
    button.textContent = action.label;
    button.href = action.href;
  }
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
  $('admin-summary').textContent = `회원 ${state.members.length}명 중 ${result.length}명 표시`;
}

async function load() {
  say('');
  try {
    const members = await listMembers();
    // 승인 대기를 먼저, 그 안에서는 최근 가입 순
    state.members = members.sort((a, b) => (statusOf(a) === statusOf(b) ? (b.createdAt || 0) - (a.createdAt || 0) : statusOf(a) === 'pending' ? -1 : 1));
    gate.hidden = true;
    panel.hidden = false;
    $('admin-badge').hidden = false;
    render();
  } catch (error) {
    if (error?.code === 'not-admin') showGate('운영진만 볼 수 있는 페이지예요', '이 계정에는 회원 관리 권한이 없습니다.', { label: '홈으로 가기', href: BASE });
    else if (panel.hidden) showGate('회원 목록을 불러오지 못했어요', authMessage(error), null);
    else say(authMessage(error));
  }
}

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

// 로그인 상태와 운영진 여부를 확인한 뒤 목록을 엽니다. (실제 접근 제한은 데이터베이스 규칙이 합니다.)
watchSession((session) => {
  showSession(session);
  if (!session) showGate('로그인이 필요해요', '운영진 계정으로 로그인해 주세요.', { label: '로그인', href: `${BASE}login/` });
  else if (!session.isAdmin) showGate('운영진만 볼 수 있는 페이지예요', '이 계정에는 회원 관리 권한이 없습니다.', { label: '홈으로 가기', href: BASE });
  else load();
});
