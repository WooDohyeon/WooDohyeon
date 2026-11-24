import { BASE, showSession } from './common.js';
import { signUp, authMessage, readHint } from '../lib/auth.js';
import { CAMPS, COHORTS, MEMBER_TYPES } from '../data/membership.js';

const form = document.getElementById('signup-form');
const message = document.getElementById('signup-message');
const submit = document.getElementById('signup-submit');
const done = document.getElementById('signup-done');

// 이미 로그인한 상태라면 내 계정으로 보냅니다.
if (readHint()) location.replace(`${BASE}login/`);

function fail(text, field) {
  message.textContent = text;
  message.hidden = false;
  field?.focus();
}

function readForm() {
  const data = new FormData(form);
  return {
    email: String(data.get('email') || '').trim(),
    password: String(data.get('password') || ''),
    memberType: String(data.get('memberType') || ''),
    camp: String(data.get('camp') || ''),
    cohort: Number(data.get('cohort')),
    name: String(data.get('name') || '').trim(),
  };
}

/** 입력값을 확인하고, 문제가 있으면 [안내 문구, 입력란] 을 돌려줍니다. */
function validate(values) {
  if (!values.email) return ['이메일을 입력해 주세요.', form.elements.email];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return ['이메일 주소 형식을 확인해 주세요.', form.elements.email];
  if (values.password.length < 6) return ['비밀번호는 6자 이상으로 입력해 주세요.', form.elements.password];
  if (!MEMBER_TYPES.includes(values.memberType)) return ['가입 유형을 선택해 주세요.', form.elements.memberType[0]];
  if (!CAMPS.includes(values.camp)) return ['캠프를 선택해 주세요.', form.elements.camp];
  if (!COHORTS.includes(values.cohort)) return ['기수를 선택해 주세요.', form.elements.cohort];
  if (!values.name) return ['이름을 입력해 주세요.', form.elements.name];
  return null;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.hidden = true;
  const values = readForm();
  const problem = validate(values);
  if (problem) {
    fail(...problem);
    return;
  }

  submit.disabled = true;
  submit.querySelector('span').textContent = '가입 처리 중…';
  try {
    const session = await signUp(values);
    showSession(session);
    form.hidden = true;
    document.querySelector('.auth-head > p:last-child').hidden = true;
    document.getElementById('signup-done-name').textContent = session.name;
    done.hidden = false;
    done.focus();
  } catch (error) {
    fail(authMessage(error));
  } finally {
    submit.disabled = false;
    submit.querySelector('span').textContent = '회원가입';
  }
});
