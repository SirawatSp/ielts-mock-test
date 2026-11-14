import { Readable } from 'node:stream';
import { handleCoachRequest } from './coach.mjs';

export async function handleNodeApi(req, res, { trustedProxy = false } = {}) {
  const controller = new AbortController();
  const abort = () => { if (!res.writableEnded) controller.abort(); };
  req.once('aborted', abort);
  res.once('close', abort);
  try {
    const protocol = trustedProxy && req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    const method = req.method || 'GET';
    let body;
    if (!['GET', 'HEAD'].includes(method)) {
      body = req.body !== undefined
        ? typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body)
        : Readable.toWeb(req);
    }
    const request = new Request(new URL(req.url || '/', `${protocol}://${req.headers.host || 'localhost'}`), {
      method, headers, signal: controller.signal,
      ...(body !== undefined ? { body, duplex: 'half' } : {}),
    });
    const ip = trustedProxy && typeof req.headers['x-vercel-forwarded-for'] === 'string'
      ? req.headers['x-vercel-forwarded-for'].split(',')[0].trim()
      : req.socket?.remoteAddress || 'unknown';
    const response = await handleCoachRequest(request, { ip });
    for (const [key, value] of response.headers) res.setHeader(key, value);
    res.statusCode = response.status;
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ code: 'SERVER_ERROR', error: 'The coaching server could not handle this request.' }));
    } else res.end();
  } finally {
    req.off('aborted', abort);
    res.off('close', abort);
  }
}
