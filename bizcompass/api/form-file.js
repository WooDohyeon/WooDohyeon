// GET /api/form-file/?path=forms/nda.pdf — 서식 원본 파일 (승인된 회원 전용)
// Storage 는 서버 전용 계정만 읽을 수 있어, 파일 주소를 알아도 이 함수를 거치지 않고는 받을 수 없습니다.
import { isApprovedMember } from '../server/member.js';
import { isFormPath } from '../server/forms.js';
import { fetchFile } from '../server/firebase-service.js';

const TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export async function GET(request) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!(await isApprovedMember(request))) return new Response('승인된 회원만 받을 수 있습니다.', { status: 401, headers });

  const path = new URL(request.url).searchParams.get('path') || '';
  if (!isFormPath(path)) return new Response('잘못된 요청입니다.', { status: 400, headers });

  try {
    const source = await fetchFile(path);
    if (!source.ok) return new Response('서식을 찾을 수 없습니다.', { status: source.status === 404 ? 404 : 502, headers });
    const fileName = path.split('/').pop();
    const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
    return new Response(source.body, {
      headers: {
        ...headers,
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[form-file]', error);
    return new Response('파일을 불러오지 못했습니다.', { status: 502, headers });
  }
}
