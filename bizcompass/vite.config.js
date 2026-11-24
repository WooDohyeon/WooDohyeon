import { defineConfig, loadEnv } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { renderers } from './src/render/index.js';

const root = import.meta.dirname;
const IGNORED = new Set(['node_modules', 'dist', 'src', 'public', 'firebase', 'api', 'server']);

// 프로젝트 안의 모든 index.html 을 페이지로 등록합니다.
function findPages(dir = root) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith('.') || IGNORED.has(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return findPages(path);
    return name === 'index.html' ? [path] : [];
  });
}

// <!--@header active="forms"--> 같은 자리표시자를 공통 조각·데이터로 채웁니다.
function bizHtml(base) {
  return {
    name: 'bizcompass-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/<!--@([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g, (_, name, attrs) => {
            const render = renderers[name];
            if (!render) throw new Error(`알 수 없는 자리표시자: ${name}`);
            const props = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
            return render({ ...props, base });
          })
          .replaceAll('{{base}}', base);
      },
    },
  };
}

// 로컬 개발·미리보기 서버에서 /api/programs 를 Vercel 함수와 같은 코드로 응답합니다.
// 인증키는 .env.local 의 DATA_GO_KR_SERVICE_KEY 에서 읽습니다.
function localApi(serviceKey) {
  let cached = null;
  const handler = async (request, response, next) => {
    if (!/^\/api\/programs\/?(\?.*)?$/.test(request.url || '')) return next();
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      if (!cached || Date.now() - cached.at > 10 * 60 * 1000) {
        const { loadPrograms } = await import('./server/programs.js');
        cached = { at: Date.now(), body: JSON.stringify(await loadPrograms(serviceKey)) };
      }
      response.end(cached.body);
    } catch (error) {
      console.error('[programs]', error.message);
      response.statusCode = 502;
      response.end(JSON.stringify({ error: '공고를 불러오지 못했습니다.' }));
    }
    return undefined;
  };
  return {
    name: 'bizcompass-local-api',
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
}

export default defineConfig(({ mode }) => {
  // 하위 경로에 배포할 때는 BASE_PATH=/경로/ 로 빌드합니다. (기본: 도메인 루트)
  const base = process.env.BASE_PATH || '/';
  const env = loadEnv(mode, root, '');
  return {
    base,
    appType: 'mpa',
    plugins: [bizHtml(base), localApi(env.DATA_GO_KR_SERVICE_KEY)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(findPages().map((path) => [relative(root, path).replace(/[\\/]/g, '_').replace(/\.html$/, ''), resolve(path)])),
      },
    },
  };
});
