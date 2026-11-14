const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer(async (request, response) => {
  try {
    const filename = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
    if (!filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    response.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream');
    response.end(await fs.readFile(filename));
  } catch { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium' });
  const errors = [];
  const contexts = [];
  async function open(filename, stored = {}, speech = false) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    contexts.push(context);
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.addInitScript(({ stored, speech }) => {
      if (!sessionStorage.getItem('regression-seeded')) {
        Object.entries(stored).forEach(([key, value]) => localStorage.setItem(key, value));
        sessionStorage.setItem('regression-seeded', '1');
      }
      if (speech) window.SpeechRecognition = class {
        start() { window.testRecognition = this; this.onstart?.(); }
        stop() { this.onend?.(); }
      };
    }, { stored, speech });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/' + filename);
    return page;
  }
  async function importFile(page, selector, value) {
    await page.setInputFiles(selector, { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
  }
  try {
    const mock = await open('index.html');
    await mock.evaluate(() => go('reading'));
    await mock.locator('input[name="q10"]').fill('thermal "mass');
    await mock.reload();
    assert.equal(await mock.locator('input[name="q10"]').inputValue(), 'thermal "mass');
    await mock.evaluate(() => go('results'));
    await mock.locator('#preview-pkg').click();
    assert.match(await mock.locator('#pkg-preview').innerText(), /Do not estimate an overall IELTS band/);
    assert.doesNotMatch(await mock.locator('#pkg-preview').innerText(), /AS IF SPOKEN|estimated overall band across all four skills/);

    await mock.evaluate(() => go('reading'));
    await mock.locator('label:has(input[name="q1"][value="FALSE"])').click();
    await mock.locator('#mark-reading').click();
    assert.equal(await mock.evaluate(() => state.readingDone), true);
    await mock.locator('label:has(input[name="q1"][value="TRUE"])').click();
    assert.equal(await mock.evaluate(() => state.readingDone), false);
    assert.equal(await mock.locator('#reading-score').isVisible(), false);
    await mock.evaluate(() => go('results'));
    assert.equal(await mock.locator('#ck-reading').innerText(), 'Not submitted');
    assert.match(await mock.evaluate(() => buildPackage()), /READING \(already auto-marked\): not submitted/);
    await mock.clock.install();
    await mock.evaluate(() => go('reading'));
    await mock.locator('[data-timer="reading"]').click();
    await mock.clock.fastForward(5 * 60 * 1000);
    assert.equal(await mock.locator('#tb-reading .clock').innerText(), '15:00');
    await mock.clock.fastForward(15 * 60 * 1000);
    assert.equal(await mock.locator('#tb-reading .clock').innerText(), '00:00');
    assert.equal(await mock.locator('[data-timer="reading"]').textContent(), 'Start');
    console.log('PASS: quoted answers restore; edited answers invalidate scores; mock timers follow elapsed time; assessment respects missing evidence.');

    const preserved = JSON.stringify({ essay1: 'My saved draft' });
    const badMock = await open('index.html', { 'ielts-mock-01': preserved });
    await importFile(badMock, '#import-file', { answers: { essay1: 'Replacement' }, history: {} });
    await badMock.waitForFunction(() => document.querySelector('#toast').textContent.startsWith('Import failed'));
    assert.equal(await badMock.evaluate(() => localStorage.getItem('ielts-mock-01')), preserved);
    const previousHistory = JSON.stringify([{ date: 'previous attempt', readingRaw: 5 }]);
    await badMock.evaluate(history => {
      localStorage.setItem('ielts-mock-history', history);
      const original = Storage.prototype.setItem;
      let failOnce = true;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'ielts-mock-history' && failOnce) { failOnce = false; throw new DOMException('Storage full', 'QuotaExceededError'); }
        return original.call(this, key, value);
      };
    }, previousHistory);
    await importFile(badMock, '#import-file', { answers: { essay1: 'Replacement' }, history: [{ date: 'new attempt' }] });
    await badMock.waitForTimeout(100);
    assert.equal(await badMock.evaluate(() => localStorage.getItem('ielts-mock-01')), preserved, 'partial imports must roll back if another store cannot be written');
    assert.equal(await badMock.evaluate(() => localStorage.getItem('ielts-mock-history')), previousHistory);
    const malformed = '{broken JSON';
    const recoveredMock = await open('index.html', { 'ielts-mock-01': malformed, 'ielts-mock-history': '"invalid history"' });
    assert.equal(await recoveredMock.evaluate(raw => Object.keys(localStorage).some(key => key.startsWith('ielts-mock-01-recovery-') && localStorage.getItem(key) === raw), malformed), true);
    await recoveredMock.evaluate(() => go('writing1'));
    await recoveredMock.locator('#essay1').fill('A fresh recoverable draft');
    assert.equal(await recoveredMock.evaluate(() => JSON.parse(localStorage.getItem('ielts-mock-01')).essay1), 'A fresh recoverable draft');
    const payload = '<img src=x onerror="window.injected=true">';
    const safeHistory = await open('index.html', { 'ielts-mock-history': JSON.stringify([{ date: payload, readingRaw: 1, band: payload }]) });
    assert.equal(await safeHistory.locator('#history-list img').count(), 0);
    assert.match(await safeHistory.locator('#history-list').innerText(), /<img/);
    console.log('PASS: malformed mock backups preserve current progress; corrupt stores are recoverable; history displays imported text safely.');

    const gym = await open('practice.html', {}, true);
    await gym.evaluate(() => go('dictation'));
    const target = await gym.evaluate(() => DICT[dictLvl][dictIdx]);
    await gym.locator('#dict-input').fill(target);
    await gym.locator('#dict-mark').click();
    assert.match(await gym.locator('#dict-diff').innerText(), /^100% accuracy/);
    await gym.locator('#dict-input').fill(target + ' ' + payload);
    await gym.locator('#dict-mark').click();
    assert.doesNotMatch(await gym.locator('#dict-diff').innerText(), /^100% accuracy/);
    assert.equal(await gym.locator('#dict-diff img').count(), 0);
    await gym.evaluate(() => {
      go('quick'); qtStart();
      DICT.forEach(sentences => sentences.fill('the sample sentence'));
      const card = document.querySelector('#qt-card'); card.removeAttribute('data-answered'); qtCardDict(card);
    });
    await gym.locator('#qt-d-input').fill('the sample sentence extra');
    await gym.locator('#qt-d-mark').click();
    assert.match(await gym.locator('#qt-d-diff').innerText(), /^75% accuracy/);
    await gym.evaluate(() => { qtEnd(); go('shadow'); });
    await gym.locator('#shadow-record').click();
    await gym.evaluate(text => testRecognition.onresult({ results: [[{ transcript: 'the sample sentence ' + text }]] }), payload);
    assert.doesNotMatch(await gym.locator('#shadow-diff').innerText(), /^100% word match/);
    assert.equal(await gym.locator('#shadow-diff img').count(), 0);
    assert.equal(await gym.evaluate(() => window.injected), undefined);
    console.log('PASS: dictation, Quick Test and shadowing penalize insertions and display transcript text safely.');

    const savedGym = JSON.stringify({ boxes: { retrofit: 3 }, t1a0: '</textarea>' + payload, sessionHistory: [{ date: payload, minutes: 5, items: 2, vocab: payload, grammar: '50%', para: '—', dict: '—' }] });
    const gymBackup = await open('practice.html', { 'ielts-gym': savedGym });
    assert.equal(await gymBackup.locator('#t1-in-0').inputValue(), '</textarea>' + payload);
    assert.equal(await gymBackup.locator('#t1-list img, #session-history img').count(), 0);
    const before = await gymBackup.evaluate(() => localStorage.getItem('ielts-gym'));
    await importFile(gymBackup, '#import-gym-file', { progress: { boxes: 5 } });
    await gymBackup.waitForFunction(() => document.querySelector('#toast').textContent.startsWith('Import failed'));
    assert.equal(await gymBackup.evaluate(() => localStorage.getItem('ielts-gym')), before);
    const corruptGym = await open('practice.html', { 'ielts-gym': '{broken' });
    assert.equal(await corruptGym.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('ielts-gym-recovery-') && localStorage.getItem(key) === '{broken')), true);
    assert.equal(await corruptGym.locator('#fc-face .word').count(), 1);
    await gymBackup.clock.install();
    await gymBackup.evaluate(() => go('speaking'));
    await gymBackup.locator('#speak-timer60').click();
    assert.equal(await gymBackup.locator('#tb-speak .clock').innerText(), '01:00');
    await gymBackup.clock.fastForward(30 * 1000);
    assert.equal(await gymBackup.locator('#tb-speak .clock').innerText(), '00:30');
    assert.deepEqual(errors, [], 'all regression flows must avoid uncaught errors');
    console.log('PASS: gym imports validate before replacing progress; corrupt data is retained; saved text is safe; Speaking timers follow elapsed time.');
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
