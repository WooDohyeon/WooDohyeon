import { showSession } from './common.js';
import { signIn, signOutUser, sendPasswordReset, watchSession, authMessage, readHint } from '../lib/auth.js';
import { MEMBER_STATUS } from '../data/membership.js';

const loginView = document.getElementById('login-view');
const accountView = document.getElementById('account-view');
const form = document.getElementById('login-form');
const message = document.getElementById('login-message');
const submit = document.getElementById('login-submit');

function say(text, { ok = false, field } = {}) {
  message.textContent = text;
  message.classList.toggle('is-ok', ok);
  message.hidden = false;
  field?.focus();
}

function showAccount(session) {
  const status = MEMBER_STATUS[session.status] || MEMBER_STATUS.pending;
  const text = (id, value) => { document.getElementById(id).textContent = value || '–'; };
  text('account-name', session.name);
  text('account-email', session.email);
  text('account-type', session.memberType);
  text('account-camp', session.camp);
  text('account-cohort', session.cohort ? `${session.cohort}기` : '');
  text('account-note', session.hasProfile === false ? '가입 정보를 찾을 수 없습니다. 운영진에게 문의해 주세요.' : status.note);
  const tag = document.getElementById('account-status');
  tag.textContent = status.label;
  tag.className = `tag ${session.status === 'approved' ? 'tag--second' : 'tag--accent'}`;
  document.getElementById('account-admin').hidden = !session.isAdmin;
  loginView.hidden = true;
  accountView.hidden = false;
}

function showLogin() {
  accountView.hidden = true;
  loginView.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (!email) return say('이메일을 입력해 주세요.', { field: form.elements.email });
  if (!password) return say('비밀번호를 입력해 주세요.', { field: form.elements.password });

  submit.disabled = true;
  submit.querySelector('span').textContent = '로그인 중…';
  try {
    const session = await signIn(email, password);
    showSession(session);
    showAccount(session);
  } catch (error) {
    say(authMessage(error));
  } finally {
    submit.disabled = false;
    submit.querySelector('span').textContent = '로그인';
  }
  return undefined;
});

document.getElementById('login-reset').addEventListener('click', async () => {
  const email = form.elements.email.value.trim();
  if (!email) return say('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.', { field: form.elements.email });
  try {
    await sendPasswordReset(email);
    say('가입된 이메일이라면 비밀번호 재설정 메일이 발송됩니다. 메일함을 확인해 주세요.', { ok: true });
  } catch (error) {
    say(authMessage(error));
  }
  return undefined;
});

document.getElementById('account-logout').addEventListener('click', async () => {
  await signOutUser();
  showSession(null);
  showLogin();
});

// 로그인한 적이 있으면 상태를 확인해 내 계정 화면을 보여 줍니다.
if (readHint()) {
  watchSession((session) => {
    showSession(session);
    if (session) showAccount(session);
    else showLogin();
  });
}
