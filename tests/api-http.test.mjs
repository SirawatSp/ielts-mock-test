import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

// Every request stays on an isolated loopback server. No OpenAI credentials or
// provider request are required to exercise the real HTTP/static boundary.
delete process.env.OPENAI_API_KEY;
delete process.env.APP_ACCESS_CODE;
process.env.NODE_ENV = 'test';
const { server } = await import('../server.mjs');
let base;
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });

test('the local server serves existing pages and project-prefixed public assets', async () => {
  for (const url of ['/', '/index.html', '/practice.html', '/ielts-mock-test/practice.html', '/app.js', '/assets/icon-192.png']) {
    const response = await fetch(base + url);
    assert.equal(response.status, 200, url);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    await response.arrayBuffer();
  }
  const head = await fetch(base + '/index.html', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('static serving never exposes server code, source metadata, env files, or dependencies', async () => {
  for (const url of ['/.env', '/.env.example', '/.git/config', '/package.json', '/package-lock.json', '/server.mjs', '/server/coach.mjs', '/api/status.js', '/tests/api.test.mjs', '/node_modules/ai/package.json', '/assets/../server.mjs', '/assets/%2e%2e%2f.env']) {
    const response = await fetch(base + url);
    assert([404, 405].includes(response.status), url + ' must not be published');
    await response.arrayBuffer();
  }
});

test('actual Node API transport returns missing-configuration errors without a paid request', async () => {
  const status = await fetch(base + '/api/status');
  assert.equal(status.status, 200);
  assert.equal((await status.json()).configured, false);
  const response = await fetch(base + '/api/assess', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skill: 'writing', taskType: 'task1', prompt: 'Describe the chart.', response: 'An answer.' }) });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).code, 'AI_NOT_CONFIGURED');
});

test('actual Node transport rejects bad JSON and over-limit streamed bodies before paid work', async () => {
  process.env.OPENAI_API_KEY = 'test-key-not-used-for-provider';
  try {
    const invalid = await fetch(base + '/api/assess', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad-json' });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).code, 'INVALID_JSON');
    const oversized = await fetch(base + '/api/assess', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(70000) });
    assert.equal(oversized.status, 413);
    assert.equal((await oversized.json()).code, 'REQUEST_TOO_LARGE');
  } finally { delete process.env.OPENAI_API_KEY; }
});
