import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { renderers } from './src/render/index.js';

const root = import.meta.dirname;
const IGNORED = new Set(['node_modules', 'dist', 'src', 'public', 'firebase']);

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

export default defineConfig(() => {
  // 하위 경로에 배포할 때는 BASE_PATH=/경로/ 로 빌드합니다. (기본: 도메인 루트)
  const base = process.env.BASE_PATH || '/';
  return {
    base,
    appType: 'mpa',
    plugins: [bizHtml(base)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(findPages().map((path) => [relative(root, path).replace(/[\\/]/g, '_').replace(/\.html$/, ''), resolve(path)])),
      },
    },
  };
});
