import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handleNodeApi } from './server/http.mjs';
import { publicFiles } from './server/public-files.mjs';

const rootUrl = new URL('./', import.meta.url);
const root = path.resolve(fileURLToPath(rootUrl));
const allowed = new Set(await publicFiles(rootUrl));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

export const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    // Keep old GitHub Pages project-relative URLs usable during local work.
    if (pathname.startsWith('/ielts-mock-test/')) pathname = pathname.slice('/ielts-mock-test'.length);
    if (pathname.startsWith('/api/')) {
      req.url = pathname + new URL(req.url || '/', 'http://localhost').search;
      await handleNodeApi(req, res);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!allowed.has(relative)) { res.writeHead(404).end('Not found'); return; }
    const file = await realpath(path.join(root, relative));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
      ...(relative === 'sw.js' ? { 'Service-Worker-Allowed': pathname.replace(/sw\.js$/, '') } : {}),
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('Not found'); }
});

server.requestTimeout = 70000;
server.headersTimeout = 10000;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8000);
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => console.log(`IELTS development server listening on ${host}:${port}. AI ${process.env.OPENAI_API_KEY ? 'key configured' : 'not configured'}.`));
}
