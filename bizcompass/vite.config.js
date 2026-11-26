import { defineConfig, loadEnv } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
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

// 로컬 개발·미리보기 서버에서 /api/* 를 Vercel 함수와 같은 코드(api/*.js)로 응답합니다.
// 공고 인증키 · 서버 전용 계정 정보는 .env.local 에서 읽습니다.
const SERVER_ENV = ['DATA_GO_KR_SERVICE_KEY', 'FIREBASE_SERVICE_EMAIL', 'FIREBASE_SERVICE_PASSWORD', 'NOTION_TOKEN', 'NOTION_DATABASE_ID', 'NOTION_OAUTH_CLIENT_ID', 'NOTION_OAUTH_CLIENT_SECRET'];
function localApi(env) {
  const routes = Object.fromEntries(['programs', 'references', 'forms', 'form-file', 'form-preview', 'insights', 'insight', 'insight-image', 'notion-connect', 'notion-callback'].map((name) => [name, `api/${name}.js`]));
  const handler = async (request, response, next) => {
    const match = /^\/api\/([\w-]+)\/?(\?.*)?$/.exec(request.url || '');
    if (!match || !routes[match[1]]) return next();
    try {
      SERVER_ENV.forEach((name) => { if (env[name]) process.env[name] ??= env[name]; });
      const { GET } = await import(pathToFileURL(resolve(root, routes[match[1]])).href);
      const headers = new Headers(Object.entries(request.headers).filter(([, value]) => typeof value === 'string'));
      const result = await GET(new Request(`http://localhost${request.url}`, { headers }));
      response.statusCode = result.status;
      result.headers.forEach((value, key) => response.setHeader(key, value));
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch (error) {
      console.error(`[api/${match[1]}]`, error.message);
      response.statusCode = 500;
      response.end('error');
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
    plugins: [bizHtml(base), localApi(env)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(findPages().map((path) => [relative(root, path).replace(/[\\/]/g, '_').replace(/\.html$/, ''), resolve(path)])),
      },
    },
  };
});
