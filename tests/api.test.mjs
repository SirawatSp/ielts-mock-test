import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCoachApi } from '../server/coach.mjs';

const API_KEY = 'test-server-key-never-return-this';
const ACCESS_CODE = 'test-private-access-code';
const BASE = 'https://ielts.example';
const NOW = Date.UTC(2026, 10, 14, 12);
const testEnv = { NODE_ENV: 'test', OPENAI_API_KEY: API_KEY };
const writingRequest = {
  skill: 'writing',
  taskType: 'task1',
  prompt: 'Summarise the changes in library membership.',
  response: 'Membership rose in both towns, with a larger increase in Westford.',
  context: 'Westford: 2000=1000, 2020=4000. Eastford: 2000=2000, 2020=3000.',
};

function feedback(overrides = {}) {
  return {
    skill: 'writing',
    band: 9,
    criteria: [
      { name: 'Task Achievement', band: 6, feedback: 'Includes an overview but needs key figures.' },
      { name: 'Coherence and Cohesion', band: 7, feedback: 'The comparison is easy to follow.' },
      { name: 'Lexical Resource', band: 6, feedback: 'Use more precise trend vocabulary.' },
      { name: 'Grammatical Range and Accuracy', band: 7, feedback: 'Accurate but needs a wider range of structures.' },
    ],
    summary: 'A clear overview, but add evidence and develop the comparisons.',
    mistakes: [{ original: 'larger increase', correction: 'a fourfold rise', explanation: 'Quantify the main change using the supplied figures.' }],
    improvedAnswer: 'Overall, membership increased in both towns, with Westford experiencing the stronger growth.',
    nextSteps: ['Write one comparison with figures.', 'Practise describing proportional change.'],
    pronunciationAssessed: false,
    ...overrides,
  };
}

function request(path, body, options = {}) {
  const { method = body === undefined ? 'GET' : 'POST', headers = {} } = options;
  return new Request(BASE + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

function api(options = {}) {
  return createCoachApi({ env: { ...testEnv }, now: () => NOW, ...options });
}

async function errorResponse(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type') || '', /application\/json/);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
  const body = await response.json();
  assert.equal(typeof body.error, 'string');
  assert.equal(typeof body.code, 'string');
  assert(!JSON.stringify(body).includes(API_KEY), 'server API key must never appear in an error');
  return body;
}

test('status reports missing credentials without claiming that AI is configured', async () => {
  const response = await api({ env: { NODE_ENV: 'test' } })(request('/api/status'));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.configured, false);
  assert.equal(typeof body.requiresAccessCode, 'boolean');
  assert(!JSON.stringify(body).includes(API_KEY));
});

test('production fails closed without a private access code, including a short code', async () => {
  for (const accessCode of [undefined, 'too-short']) {
    const env = { ...testEnv, NODE_ENV: 'production', ...(accessCode ? { APP_ACCESS_CODE: accessCode } : {}) };
    const handle = api({ env });
    const status = await (await handle(request('/api/status'))).json();
    assert.equal(status.configured, false);
    assert.equal(status.requiresAccessCode, true);
    await errorResponse(await handle(request('/api/assess', writingRequest)), 503);
  }
});

test('a configured backend still requires its access code on AI requests', async () => {
  let called = false;
  const handle = api({
    env: { ...testEnv, NODE_ENV: 'production', APP_ACCESS_CODE: ACCESS_CODE },
    generateAssessment: async () => { called = true; return feedback(); },
  });
  const status = await (await handle(request('/api/status'))).json();
  assert.equal(status.configured, true);
  assert.equal(status.requiresAccessCode, true);
  await errorResponse(await handle(request('/api/assess', writingRequest)), 401);
  await errorResponse(await handle(request('/api/assess', writingRequest, { headers: { 'x-coach-access-code': 'wrong-code' } })), 401);
  assert.equal(called, false);
  const response = await handle(request('/api/assess', writingRequest, { headers: { 'x-coach-access-code': ACCESS_CODE } }));
  assert.equal(response.status, 200);
});

test('unconfigured AI requests return an actionable error and make no provider call', async () => {
  let calls = 0;
  const handle = api({ env: { NODE_ENV: 'test' }, fetchImpl: async () => { calls++; }, generateAssessment: async () => { calls++; } });
  await errorResponse(await handle(request('/api/assess', writingRequest)), 503);
  await errorResponse(await handle(request('/api/realtime', { part: 'part1', prompt: 'Tell me about your hometown.' })), 503);
  assert.equal(calls, 0);
});

test('only explicit cross origins may call the API', async () => {
  let calls = 0;
  const handle = api({
    env: { ...testEnv, ALLOWED_ORIGINS: 'https://sirawatsp.github.io,https://practice.example' },
    generateAssessment: async () => { calls++; return feedback(); },
  });
  await errorResponse(await handle(request('/api/assess', writingRequest, { headers: { Origin: 'https://sirawatsp.github.io.attacker.example' } })), 403);
  assert.equal(calls, 0);
  const accepted = await handle(request('/api/assess', writingRequest, { headers: { Origin: 'https://sirawatsp.github.io' } }));
  assert.equal(accepted.status, 200);
  assert.equal(accepted.headers.get('access-control-allow-origin'), 'https://sirawatsp.github.io');
  assert.notEqual(accepted.headers.get('access-control-allow-origin'), '*');
});

test('CORS preflight permits the access-code header for the configured site', async () => {
  const handle = api({ env: { ...testEnv, ALLOWED_ORIGINS: 'https://sirawatsp.github.io' } });
  const response = await handle(request('/api/assess', undefined, {
    method: 'OPTIONS',
    headers: { Origin: 'https://sirawatsp.github.io', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-coach-access-code' },
  }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://sirawatsp.github.io');
  assert.match(response.headers.get('access-control-allow-headers') || '', /x-coach-access-code/i);
});

test('malformed JSON, unknown fields and mismatched skill/task types are rejected before generation', async () => {
  let calls = 0;
  const handle = api({ generateAssessment: async () => { calls++; return feedback(); } });
  const badBodies = [
    '{bad-json',
    { ...writingRequest, model: 'arbitrary-client-model' },
    { ...writingRequest, apiKey: 'client-controlled-key' },
    { ...writingRequest, skill: 'listening' },
    { ...writingRequest, taskType: 'part1' },
    { ...writingRequest, response: '' },
    { ...writingRequest, prompt: ' '.repeat(3) },
    { ...writingRequest, response: 123 },
  ];
  for (const body of badBodies) await errorResponse(await handle(request('/api/assess', body)), 400);
  assert.equal(calls, 0);
});

test('request byte and field limits reject oversized input before paid work', async () => {
  let calls = 0;
  const handle = api({ generateAssessment: async () => { calls++; return feedback(); } });
  await errorResponse(await handle(request('/api/assess', 'x'.repeat(70_000))), 413);
  await errorResponse(await handle(request('/api/assess', { ...writingRequest, prompt: 'p'.repeat(8_001) })), 400);
  await errorResponse(await handle(request('/api/assess', { ...writingRequest, response: 'r'.repeat(20_001) })), 400);
  await errorResponse(await handle(request('/api/assess', { ...writingRequest, context: 'c'.repeat(12_001) })), 400);
  assert.equal(calls, 0);
});

test('writing assessment returns real feedback and computes its band from four equally weighted criteria', async () => {
  let seen;
  const handle = api({
    env: { ...testEnv, OPENAI_TEXT_MODEL: 'configured-text-model' },
    generateAssessment: async (payload, options) => { seen = { payload, options }; return feedback(); },
  });
  const response = await handle(request('/api/assess', writingRequest));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
  const body = await response.json();
  assert.equal(body.band, 6.5, 'the provider-supplied overall 9 must not override criterion average');
  assert.equal(body.criteria.length, 4);
  assert.equal(body.pronunciationAssessed, false);
  assert.equal(body.mistakes[0].correction, 'a fourfold rise');
  assert.equal(seen.payload.response, writingRequest.response);
  assert.equal(seen.options.apiKey, API_KEY);
  assert.equal(seen.options.model, 'configured-text-model');
  assert(seen.options.signal instanceof AbortSignal);
  assert(!JSON.stringify(body).includes(API_KEY));
});

test('the installed AI SDK sends a strict Responses request and parses provider output end to end', async () => {
  let seen;
  const handle = api({
    env: { ...testEnv, OPENAI_TEXT_MODEL: 'gpt-5.4-mini' },
    fetchImpl: async (url, options) => {
      seen = { url: String(url), options, body: JSON.parse(options.body) };
      return Response.json({
        id: 'resp_test', object: 'response', created_at: Math.floor(NOW / 1000),
        status: 'completed', model: 'gpt-5.4-mini',
        output: [{
          id: 'msg_test', type: 'message', role: 'assistant', status: 'completed',
          content: [{ type: 'output_text', text: JSON.stringify(feedback()), annotations: [], logprobs: [] }],
        }],
        usage: { input_tokens: 12, output_tokens: 24, total_tokens: 36, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
      });
    },
  });
  const response = await handle(request('/api/assess', writingRequest));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.band, 6.5);
  assert.equal(body.mistakes[0].original, 'larger increase');
  assert.equal(seen.url, 'https://api.openai.com/v1/responses');
  assert.equal(new Headers(seen.options.headers).get('authorization'), `Bearer ${API_KEY}`);
  assert.equal(seen.body.model, 'gpt-5.4-mini');
  assert.equal(seen.body.store, false, 'learner submissions should not create stored Responses');
  assert.equal(seen.body.text.format.type, 'json_schema');
  assert.equal(seen.body.text.format.strict, true);
  assert(seen.body.text.format.schema.properties.criteria);
});

test('typed speaking cannot claim pronunciation, spoken fluency, or a full Speaking band', async () => {
  const candidate = feedback({
    skill: 'speaking',
    band: 8,
    criteria: [
      { name: 'Fluency and Coherence', band: 9, feedback: 'Ideas connect clearly in the text.' },
      { name: 'Lexical Resource', band: 7, feedback: 'Uses relevant vocabulary.' },
      { name: 'Grammatical Range and Accuracy', band: 6, feedback: 'Some article errors.' },
      { name: 'Pronunciation', band: 9, feedback: 'Unjustified prediction from text.' },
    ],
    pronunciationAssessed: true,
  });
  const handle = api({ generateAssessment: async () => candidate });
  const response = await handle(request('/api/assess', { skill: 'speaking', taskType: 'part1', prompt: 'Describe your hometown.', response: 'I live in a busy city in Thailand.' }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.band, null);
  assert.equal(body.pronunciationAssessed, false);
  for (const criterion of body.criteria.filter(item => /pronunciation|fluency/i.test(item.name))) assert.equal(criterion.band, null);
});

test('malformed provider feedback fails safely without inventing scores', async () => {
  const handle = api({ generateAssessment: async () => feedback({ criteria: [] }) });
  const body = await errorResponse(await handle(request('/api/assess', writingRequest)), 502);
  assert.equal(body.band, undefined);
});

test('provider rate limits, errors and timeouts never expose private provider details', async () => {
  const upstreamErrors = [
    Object.assign(new Error(`internal provider problem ${API_KEY}`), { status: 429, statusCode: 429 }),
    Object.assign(new Error(`invalid credential ${API_KEY}`), { status: 401, statusCode: 401 }),
    new DOMException(`request aborted ${API_KEY}`, 'AbortError'),
  ];
  for (let i = 0; i < upstreamErrors.length; i++) {
    const handle = api({ generateAssessment: async () => { throw upstreamErrors[i]; } });
    await errorResponse(await handle(request('/api/assess', writingRequest)), [429, 502, 504][i]);
  }
});

test('Realtime issues a short-lived client secret with the configured model and IELTS assessment tool', async () => {
  let seen;
  const handle = api({
    env: { ...testEnv, OPENAI_REALTIME_MODEL: 'gpt-realtime-2.1' },
    fetchImpl: async (url, options) => {
      seen = { url: String(url), options, body: JSON.parse(options.body) };
      return Response.json({ value: 'ek_test_ephemeral_only', expires_at: Math.floor(NOW / 1000) + 60, session: { type: 'realtime' } });
    },
  });
  const response = await handle(request('/api/realtime', { part: 'part2', prompt: 'Describe a place you enjoy visiting.' }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.clientSecret, 'ek_test_ephemeral_only');
  assert.equal(body.expiresAt, Math.floor(NOW / 1000) + 60);
  assert.equal(body.model, 'gpt-realtime-2.1');
  assert(!JSON.stringify(body).includes(API_KEY));
  assert.equal(seen.url, 'https://api.openai.com/v1/realtime/client_secrets');
  assert.equal(seen.options.method, 'POST');
  assert.equal(new Headers(seen.options.headers).get('authorization'), `Bearer ${API_KEY}`);
  assert.equal(seen.body.expires_after.seconds, 60);
  assert.equal(seen.body.session.type, 'realtime');
  assert.equal(seen.body.session.model, 'gpt-realtime-2.1');
  assert.match(seen.body.session.instructions, /IELTS/);
  assert.match(seen.body.session.instructions, /pronunciation/i);
  const tool = seen.body.session.tools.find(item => item.name === 'report_assessment');
  assert(tool, 'a structured report tool must be available to the voice model');
  assert.equal(tool.type, 'function');
  assert.equal(tool.parameters.type, 'object');
  assert(tool.parameters.properties.criteria);
  assert(tool.parameters.properties.pronunciationAssessed);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
});

test('Realtime rejects client-controlled models and invalid session prompts', async () => {
  let calls = 0;
  const handle = api({ fetchImpl: async () => { calls++; } });
  for (const body of [
    { part: 'part1', prompt: 'A prompt.', model: 'client-model' },
    { part: 'part4', prompt: 'A prompt.' },
    { part: 'part1', prompt: '' },
  ]) await errorResponse(await handle(request('/api/realtime', body)), 400);
  assert.equal(calls, 0);
});

test('Realtime maps upstream failures safely and rejects missing ephemeral secrets', async () => {
  for (const upstream of [
    new Response(`private error ${API_KEY}`, { status: 429 }),
    new Response(`private error ${API_KEY}`, { status: 500 }),
    Response.json({ expires_at: Math.floor(NOW / 1000) + 60 }),
    Response.json({ value: 'sk_not_an_ephemeral_secret', expires_at: Math.floor(NOW / 1000) + 60 }),
    Response.json({ value: 'ek_already_expired', expires_at: Math.floor(NOW / 1000) - 1 }),
  ]) {
    const handle = api({ fetchImpl: async () => upstream });
    await errorResponse(await handle(request('/api/realtime', { part: 'part1', prompt: 'Describe your work.' })), upstream.status === 429 ? 429 : 502);
  }
});

test('the process-local Realtime request limit stops additional paid session creation', async () => {
  let calls = 0;
  const handle = api({
    fetchImpl: async () => {
      calls++;
      return Response.json({ value: 'ek_test_ephemeral_only', expires_at: Math.floor(NOW / 1000) + 60 });
    },
  });
  for (let i = 0; i < 5; i++) {
    const response = await handle(request('/api/realtime', { part: 'part1', prompt: 'Describe your work.' }), { ip: 'test-ip' });
    assert.equal(response.status, 200);
  }
  const limited = await handle(request('/api/realtime', { part: 'part1', prompt: 'Describe your work.' }), { ip: 'test-ip' });
  await errorResponse(limited, 429);
  assert(limited.headers.get('retry-after'));
  assert.equal(calls, 5);
});

test('unsupported methods are rejected rather than triggering paid requests', async () => {
  const handle = api();
  await errorResponse(await handle(request('/api/assess')), 405);
  await errorResponse(await handle(request('/api/realtime')), 405);
  await errorResponse(await handle(request('/api/status', undefined, { method: 'DELETE' })), 405);
});
