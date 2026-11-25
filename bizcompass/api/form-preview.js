// GET /api/form-preview/?path=forms/nda.pdf — 서식 PDF 의 첫 쪽만 잘라서 내려 줍니다. (비회원 미리보기용)
import { PDFDocument } from 'pdf-lib';
import { isFormPath } from '../server/forms.js';
import { fetchFile } from '../server/firebase-service.js';

const PREVIEW_PAGES = 1;

export async function GET(request) {
  const path = new URL(request.url).searchParams.get('path') || '';
  // 서식 폴더 안의 PDF 만 허용합니다.
  const valid = isFormPath(path) && path.toLowerCase().endsWith('.pdf');
  if (!valid) return new Response('잘못된 요청입니다.', { status: 400 });

  try {
    const source = await fetchFile(path);
    if (!source.ok) return new Response('서식을 찾을 수 없습니다.', { status: source.status === 404 ? 404 : 502 });

    const original = await PDFDocument.load(await source.arrayBuffer(), { ignoreEncryption: true });
    const preview = await PDFDocument.create();
    const count = Math.min(PREVIEW_PAGES, original.getPageCount());
    const pages = await preview.copyPages(original, Array.from({ length: count }, (_, index) => index));
    pages.forEach((page) => preview.addPage(page));

    return new Response(await preview.save(), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
        'X-Total-Pages': String(original.getPageCount()),
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[form-preview]', error);
    return new Response('미리보기를 만들지 못했습니다.', { status: 502 });
  }
}
