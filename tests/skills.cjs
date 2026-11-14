const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const output = path.resolve(__dirname, '../.test-output/skills');
const writingFeedback = {
  skill: 'writing', band: 6.5, pronunciationAssessed: false,
  criteria: [
    { name: 'Task Achievement', band: 6, feedback: 'Add an overview that groups the main trends.' },
    { name: 'Coherence and Cohesion', band: 7, feedback: 'The comparisons progress clearly.' },
    { name: 'Lexical Resource', band: 6, feedback: 'Choose a more precise verb for the trend.' },
    { name: 'Grammatical Range and Accuracy', band: 7, feedback: 'Review subject–verb agreement.' },
  ],
  summary: 'AI practice estimate for the submitted task.',
  mistakes: [{ original: 'The figures shows <img src=x onerror="window.injected=true">', correction: 'The figures show a rise.', explanation: 'A plural subject takes show.' }],
  improvedAnswer: 'Overall, usage increased, with the largest rise in the final period.',
  nextSteps: ['Write one overview without listing every figure.'],
};
const speakingFeedback = {
  ...writingFeedback, skill: 'speaking', band: 9, pronunciationAssessed: true,
  criteria: [
    { name: 'Fluency and Coherence', band: 6, feedback: 'Extend the example without restarting the sentence.' },
    { name: 'Lexical Resource', band: 7, feedback: 'Your examples use precise vocabulary.' },
    { name: 'Grammatical Range and Accuracy', band: 6, feedback: 'Keep past tense consistent.' },
    { name: 'Pronunciation', band: 7, feedback: 'The recording is intelligible; keep stress on the main contrast.' },
  ],
};

async function noOverflow(page, label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2), `${label}: page overflows`);
}

async function answerAll(page, skill, correct = true) {
  const questions = await page.evaluate(name => window.IELTS_CONTENT[name][0].questions, skill);
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const input = page.locator(`#answer-${i}`);
    const value = correct ? question.answers[0] : question.type === 'select' ? question.options.find(option => !question.answers.includes(option)) : 'incorrect answer';
    if (question.type === 'select') await input.selectOption(value);
    else await input.fill(value);
  }
}

async function mockAi(context, { requiresAccessCode = false, failed = false } = {}) {
  await context.route('**/api/status', route => route.fulfill({ json: { configured: true, requiresAccessCode } }));
  await context.route('**/api/assess', route => {
    const data = route.request().postDataJSON();
    if (failed) return route.fulfill({ status: 429, json: { error: 'The API project has no remaining quota.' } });
    return route.fulfill({ json: data.skill === 'writing' ? writingFeedback : { ...speakingFeedback, band: null, pronunciationAssessed: false,
      criteria: speakingFeedback.criteria.map(c => /Pronunciation|Fluency/.test(c.name) ? { ...c, band: null } : c) } });
  });
}

async function installVoiceMock(context, mode = 'success') {
  await context.addInitScript(({ mode }) => {
    window.__voice = { sent: [], tracks: [], peers: [], pendingPermission: null };
    const state = window.__voice;
    class Channel extends EventTarget {
      constructor() { super(); this.readyState = 'connecting'; }
      send(value) { state.sent.push(JSON.parse(value)); }
      close() { this.readyState = 'closed'; this.dispatchEvent(new Event('close')); }
    }
    class Peer extends EventTarget {
      constructor() { super(); this.connectionState = 'new'; state.peers.push(this); }
      addTrack() {}
      createDataChannel() { this.channel = new Channel(); return this.channel; }
      async createOffer() { return { type: 'offer', sdp: 'mock-browser-offer' }; }
      async setLocalDescription(value) { this.localDescription = value; }
      async setRemoteDescription(value) {
        this.remoteDescription = value; this.connectionState = 'connected'; this.channel.readyState = 'open';
        this.channel.dispatchEvent(new Event('open'));
      }
      close() { this.connectionState = 'closed'; this.dispatchEvent(new Event('connectionstatechange')); }
    }
    Object.defineProperty(window, 'RTCPeerConnection', { configurable: true, value: Peer });
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      if (mode === 'denied') throw new DOMException('Permission denied', 'NotAllowedError');
      if (mode === 'pending') await new Promise(resolve => { state.pendingPermission = resolve; });
      const track = { enabled: true, stopped: false, stop() { this.stopped = true; } };
      state.tracks.push(track);
      return { getTracks: () => [track], getAudioTracks: () => [track] };
    } });
    window.__emitVoice = event => state.peers.at(-1).channel.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(event) }));
  }, { mode });
  await context.route('**/api/realtime', route => route.fulfill({ json: { clientSecret: 'ek_test_only', expiresAt: Math.floor(Date.now() / 1000) + 60, model: 'mock-realtime' } }));
  await context.route('https://api.openai.com/v1/realtime/calls', route => {
    assert.equal(route.request().headers().authorization, 'Bearer ek_test_only');
    assert.equal(route.request().postData(), 'mock-browser-offer');
    return route.fulfill({ contentType: 'application/sdp', body: 'mock-provider-answer' });
  });
}

(async () => {
  const { server } = await import('../server.mjs');
  await fs.mkdir(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/ielts-mock-test/skills.html`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium' });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
    await context.addInitScript(() => {
      window.__playedScripts = [];
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, getVoices: () => [], speak: utterance => window.__playedScripts.push(utterance.text) } });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.locator('#exercise-title').filter({ hasText: 'Why streets' }).waitFor();
    await answerAll(page, 'reading');
    await page.locator('#mark-answers').click();
    assert.match(await page.locator('#practice-feedback').innerText(), /8\/8/);
    assert.match(await page.locator('#practice-feedback').innerText(), /100%/);
    assert.equal(await page.locator('.question-review').count(), 8);
    await page.locator('#answer-0').selectOption('FALSE');
    assert.match(await page.locator('#practice-feedback').innerText(), /Mark again/);
    await page.reload();
    assert.equal(await page.locator('#answer-0').inputValue(), 'FALSE');
    await page.locator('#mark-answers').click();
    assert.match(await page.locator('#practice-feedback').innerText(), /7\/8/);
    assert.match(await page.locator('.question-review').first().innerText(), /Correct answer: TRUE/);
    await page.locator('#attempt-history .history-item').first().click();
    assert.match(await page.locator('#history-detail').innerText(), /7\/8/);
    await page.locator('#close-history').click();

    await page.locator('[data-skill="listening"]').click();
    assert.equal(await page.locator('#listening-transcript').getAttribute('open'), null);
    assert.equal(await page.evaluate(() => window.__playedScripts.length), 0, 'audio must start only on a user action');
    await page.locator('#dictation-play').click();
    assert.equal(await page.evaluate(() => window.__playedScripts[0]), await page.evaluate(() => window.IELTS_CONTENT.listening[0].script));
    await answerAll(page, 'listening', false);
    await page.locator('#mark-answers').click();
    assert.match(await page.locator('#practice-feedback').innerText(), /0\/6/);
    assert.equal(await page.locator('#question-form .question-review').count(), 6);
    await page.locator('#show-transcript').click();
    assert.notEqual(await page.locator('#listening-transcript').getAttribute('open'), null);

    await page.locator('[data-skill="writing"]').click();
    await page.locator('#response-input').fill('The figures shows an increase.');
    await page.locator('#assess-response').click();
    await page.locator('#settings-dialog').waitFor({ state: 'visible' });
    assert(!/Estimated practice band/.test(await page.locator('#practice-feedback').innerText()), 'unconfigured API must not fabricate feedback');
    await page.locator('#close-settings').click();
    await page.reload();
    assert.equal(await page.locator('#response-input').inputValue(), 'The figures shows an increase.');

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ['reading', 'listening', 'writing', 'speaking']) {
        await page.locator(`[data-skill="${name}"]`).click();
        await noOverflow(page, `${name} ${width}px`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('[data-skill="reading"]').click();
    await page.screenshot({ path: path.join(output, 'desktop-studio.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-skill="speaking"]').click();
    await page.screenshot({ path: path.join(output, 'phone-speaking.png'), fullPage: true });
    await page.locator('#theme-toggle').click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await noOverflow(page, 'dark phone speaking');

    await page.locator('[data-skill="reading"]').click();
    await page.locator('#offline-status').filter({ hasText: /ready offline/ }).waitFor();
    await context.setOffline(true);
    await page.reload();
    await page.locator('#mark-answers').click();
    assert.match(await page.locator('#practice-feedback').innerText(), /7\/8/);
    await context.setOffline(false);
    console.log('PASS: Reading/Listening marks, error explanations, draft/history retention, offline reload, themes and 320–1440px layouts.');
    await context.close();

    const aiContext = await browser.newContext({ serviceWorkers: 'block' });
    await mockAi(aiContext, { requiresAccessCode: true });
    const ai = await aiContext.newPage(); ai.on('pageerror', error => errors.push(error.message));
    const assessRequests = [];
    ai.on('request', req => { if (req.url().endsWith('/api/assess')) assessRequests.push(req); });
    await ai.goto(url + '#writing');
    await ai.locator('#response-input').fill('The figures shows an increase.');
    await ai.locator('#open-settings').click();
    await ai.locator('#access-code').fill('sk-should-never-be-sent');
    await ai.locator('#settings-form').evaluate(form => form.requestSubmit());
    assert.match(await ai.locator('#settings-status').innerText(), /not your OpenAI API key/);
    await ai.locator('#access-code').fill('private-test-access-code');
    await ai.locator('#settings-form').evaluate(form => form.requestSubmit());
    await ai.locator('#settings-status').filter({ hasText: /configured/ }).waitFor();
    await ai.locator('#close-settings').click();
    await ai.locator('#assess-response').click();
    await ai.locator('#practice-feedback .feedback-card').waitFor();
    assert.match(await ai.locator('#practice-feedback').innerText(), /6\.5/);
    assert.match(await ai.locator('#practice-feedback').innerText(), /A plural subject takes show/);
    assert.equal(await ai.locator('#practice-feedback img').count(), 0, 'AI text must not create HTML');
    assert.equal(await ai.evaluate(() => window.injected), undefined);
    assert.equal(assessRequests[0].headers()['x-coach-access-code'], 'private-test-access-code');
    assert.equal(assessRequests[0].postDataJSON().response, 'The figures shows an increase.');
    assert.equal(assessRequests[0].postDataJSON().skill, 'writing');
    await ai.locator('#attempt-history .history-item').click();
    assert.match(await ai.locator('#history-detail').innerText(), /A plural subject/);
    await ai.locator('#close-history').click();
    const downloadPromise = ai.waitForEvent('download');
    await ai.locator('#export-skills').click();
    const download = await downloadPromise;
    const backup = await fs.readFile(await download.path(), 'utf8');
    assert(backup.includes('The figures shows'));
    assert(!backup.includes('private-test-access-code') && !backup.includes('sk-should-never-be-sent'), 'backup must exclude credentials');
    await ai.locator('[data-skill="speaking"]').click();
    await ai.locator('#typed-speaking summary').click();
    await ai.locator('#response-input').fill('I like to walk in my neighbourhood because there are trees.');
    await ai.locator('#assess-response').click();
    await ai.locator('#practice-feedback .feedback-card').waitFor();
    const savedSpeaking = await ai.evaluate(() => JSON.parse(localStorage.getItem('ielts-skills-v1')).history.at(-1).assessment);
    assert.equal(savedSpeaking.band, null);
    assert.equal(savedSpeaking.pronunciationAssessed, false);
    assert(savedSpeaking.criteria.filter(c => /Pronunciation|Fluency/.test(c.name)).every(c => c.band === null));
    console.log('PASS: writing and typed-speaking API contract, evidence-based score limits, safe feedback rendering, reviewed history and credential-free backup.');
    await aiContext.close();

    const voiceContext = await browser.newContext({ serviceWorkers: 'block' });
    await mockAi(voiceContext); await installVoiceMock(voiceContext);
    const voice = await voiceContext.newPage(); voice.on('pageerror', error => errors.push(error.message));
    await voice.goto(url + '#speaking');
    await voice.locator('#voice-connect').click();
    await voice.locator('#voice-status-text').filter({ hasText: /Connected/ }).waitFor();
    await voice.evaluate(() => window.__emitVoice({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'learner-1', transcript: 'My neighbourhood is quiet and has useful public spaces.' }));
    await voice.locator('#voice-mute').click();
    assert.equal(await voice.evaluate(() => window.__voice.tracks[0].enabled), false);
    await voice.locator('#voice-mute').click();
    assert.equal(await voice.evaluate(() => window.__voice.tracks[0].enabled), true);
    await voice.locator('#voice-feedback').click();
    assert(await voice.evaluate(() => window.__voice.sent.some(e => e.type === 'response.create' && e.response.tool_choice?.name === 'report_assessment')));
    await voice.evaluate(feedback => window.__emitVoice({ type: 'response.function_call_arguments.done', name: 'report_assessment', call_id: 'assessment-1', arguments: JSON.stringify(feedback) }), speakingFeedback);
    await voice.locator('#practice-feedback .feedback-card').waitFor();
    const liveResult = await voice.evaluate(() => JSON.parse(localStorage.getItem('ielts-skills-v1')).history.at(-1).assessment);
    assert.equal(liveResult.band, 6.5, 'overall is computed from criteria rather than trusting model 9');
    assert.equal(liveResult.pronunciationAssessed, true);
    await voice.locator('#voice-end').click();
    assert(await voice.evaluate(() => window.__voice.tracks.every(track => track.stopped)));
    assert(await voice.evaluate(() => window.__voice.peers.every(peer => peer.connectionState === 'closed')));
    await voice.locator('#voice-connect').click();
    await voice.locator('#voice-status-text').filter({ hasText: /Connected/ }).waitFor();
    await voice.locator('[data-skill="reading"]').click();
    assert(await voice.evaluate(() => window.__voice.tracks.every(track => track.stopped)), 'changing skill stops microphone');

    await voice.locator('[data-skill="speaking"]').click();
    const part2 = await voice.evaluate(() => window.IELTS_CONTENT.speaking.find(item => item.part === 'part2').id);
    await voice.locator('#exercise-select').selectOption(part2);
    assert.equal(await voice.locator('#timer-clock').innerText(), '01:00');
    await voice.clock.install();
    await voice.locator('#voice-connect').click();
    await voice.locator('#voice-status-text').filter({ hasText: /Connected/ }).waitFor();
    assert.equal(await voice.evaluate(() => window.__voice.tracks.at(-1).enabled), false, 'Part 2 starts with microphone muted during preparation');
    await voice.locator('#voice-answer').click();
    assert.equal(await voice.locator('#timer-clock').innerText(), '02:00');
    assert.equal(await voice.evaluate(() => window.__voice.tracks.at(-1).enabled), true);
    await voice.clock.runFor(1500);
    await voice.locator('#voice-answer').click();
    assert.equal(await voice.evaluate(() => window.__voice.tracks.at(-1).enabled), false);
    assert(await voice.evaluate(() => window.__voice.sent.some(e => e.type === 'input_audio_buffer.commit')));
    await voice.locator('#voice-end').click();
    await voice.locator('#voice-connect').click();
    await voice.locator('#voice-status-text').filter({ hasText: /Connected/ }).waitFor();
    await voice.clock.fastForward(601000);
    assert.match(await voice.locator('#voice-status-text').innerText(), /10-minute session has ended/);
    assert(await voice.evaluate(() => window.__voice.tracks.every(track => track.stopped)), 'deadline stops microphone after a suspended clock');
    assert(await voice.evaluate(() => window.__voice.peers.every(peer => peer.connectionState === 'closed')));
    await voiceContext.close();

    for (const mode of ['denied', 'pending']) {
      const cancellation = await browser.newContext({ serviceWorkers: 'block' });
      await mockAi(cancellation); await installVoiceMock(cancellation, mode);
      const check = await cancellation.newPage(); check.on('pageerror', error => errors.push(error.message));
      await check.goto(url + '#speaking');
      await check.locator('#voice-connect').click();
      if (mode === 'denied') await check.locator('#voice-status-text').filter({ hasText: /blocked/ }).waitFor();
      else {
        await check.waitForFunction(() => !!window.__voice.pendingPermission);
        await check.locator('#voice-end').click();
        await check.evaluate(() => window.__voice.pendingPermission());
        await check.waitForFunction(() => window.__voice.tracks.length && window.__voice.tracks.every(t => t.stopped));
        assert.equal(await check.evaluate(() => window.__voice.peers.length), 0, 'cancelled permission never opens provider session');
      }
      assert.equal(await check.locator('#voice-connect').isEnabled(), true);
      await cancellation.close();
    }
    assert.deepEqual(errors, [], 'no uncaught page errors');
    console.log('PASS: mocked WebRTC handshake, speaking feedback normalization, Part 2 explicit turns, session deadline, microphone cleanup, denied and late-cancelled permissions.');
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
