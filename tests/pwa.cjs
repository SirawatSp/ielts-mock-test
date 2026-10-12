const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium, webkit, devices } = require('playwright');
const root = path.resolve(__dirname, '..');
const prefix = '/ielts-mock-test/';
const engine = process.env.BROWSER_ENGINE || 'chromium';
const output = path.join(root, '.test-output', engine);
let version = '1';
let serverOffline = false;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer(async (request, response) => {
  if (serverOffline) { request.socket.destroy(); return; }
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    let body = await fs.readFile(file);
    if (relative === 'sw.js') body = Buffer.from(body.toString().replace("const VERSION = '2026-10-12-1';", `const VERSION = 'test-${version}';`));
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});

async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll('main *, .app-bar, .app-dock, header')].filter(element => {
      const box = element.getBoundingClientRect();
      return box.width && box.height && box.right > width + 2 && getComputedStyle(element).position !== 'absolute';
    }).map(element => element.tagName + '.' + element.className).slice(0, 8);
  });
  assert.deepEqual(overflow, [], label + ' must not overflow the screen');
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  let browser;
  try {
    const type = engine === 'webkit' ? webkit : chromium;
    browser = await type.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    const context = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'allow', colorScheme: 'light', reducedMotion: 'reduce' });
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + 'practice.html');
    await page.locator('.app-connection.is-ready').waitFor();
    assert.equal(await page.locator('#app-update').isVisible(), false, 'first installation must not offer an update');
    const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel="manifest"]').href)).json());
    assert.equal(new URL(manifest.start_url, base).pathname, prefix + 'practice.html');
    assert.equal(new URL(manifest.scope, base).pathname, prefix);
    assert.equal(manifest.display, 'standalone');
    await noOverflow(page, 'iPhone home');
    await page.screenshot({ path: path.join(output, 'iphone-home.png') });

    // The first home-screen transition must never destroy older progress.
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('ielts-gym'));
      saved.boxes = { retrofit: 3 };
      localStorage.setItem('ielts-gym', JSON.stringify(saved));
      localStorage.setItem('ielts-mock-01', JSON.stringify({ essay1: 'A saved draft from before installing.' }));
      localStorage.setItem('ielts-mock-history', JSON.stringify([{ date: 'earlier attempt', readingRaw: 10 }]));
      localStorage.setItem('another-site-key', 'untouched');
    });
    await page.reload();
    await page.locator('#app-install').click();
    await page.getByRole('dialog').waitFor();
    assert.match(await page.getByRole('dialog').innerText(), /Safari/);
    await page.screenshot({ path: path.join(output, 'iphone-install.png') });
    await page.locator('#app-close').click();
    await page.locator('.app-dock [data-app-section="vocab"]').click();
    await page.locator('.app-topic-picker select').selectOption('Law');
    assert.match(await page.locator('#fc-topic').innerText(), /Law/i);
    await page.locator('#fcard').click();
    await page.locator('#fc-face .def').waitFor();
    await noOverflow(page, 'iPhone vocabulary');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'iphone-vocab.png') });
    await page.locator('#vocab-mode [data-mode="recall"]').click();
    const answer = await page.evaluate(() => rcQueue[rcIdx].w);
    await page.locator('#rc-input').fill(answer);
    await page.locator('#rc-check').click();
    assert.match(await page.locator('#rc-score').innerText(), /1\/1/);
    await page.reload();
    await page.locator('.app-dock [data-app-section="vocab"]').click();
    assert.equal(await page.evaluate(() => S.boxes.retrofit), 3);

    await page.locator('.app-dock [data-app-section="quick"]').click();
    await page.locator('#qt-start').click();
    assert.equal(await page.locator('#tb-qt .clock').innerText(), '05:00');
    // Simulate the wall clock advancing while an iPhone has suspended callbacks.
    await page.evaluate(() => {
      qtStartedAt -= 91000;
      qtDeadline -= 91000;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.match(await page.locator('#tb-qt .clock').innerText(), /^03:2[78-9]$/);
    await page.locator('#qt-stop').click();
    assert.match(await page.locator('#qt-sum-headline').innerText(), /1\.5 min/);
    const sessions = await page.evaluate(() => S.sessionHistory.length);
    await page.evaluate(() => qtEnd());
    assert.equal(await page.evaluate(() => S.sessionHistory.length), sessions, 'ending twice must not duplicate history');
    console.log('PASS: installation UI, vocabulary recall, progress retention, lock-screen timing.');

    // WebKit's automation-level offline toggle errors before consulting workers.
    // Cutting the HTTP server instead verifies the real cached-response path.
    if (engine === 'webkit') serverOffline = true;
    else await context.setOffline(true);
    await page.reload();
    await page.locator('.app-connection.is-ready').waitFor();
    if (engine !== 'webkit') assert.match(await page.locator('.app-connection').innerText(), /Offline -/);
    assert.equal(await page.evaluate(() => S.boxes.retrofit), 3);
    await page.locator('#nav [data-sec="grammar"]').click();
    await page.locator('.gq .opts button').first().click();
    await page.locator('.gq.answered .why').first().waitFor();
    await noOverflow(page, 'offline grammar');
    await page.goto(base + 'index.html');
    assert.equal(await page.locator('#essay1').inputValue(), 'A saved draft from before installing.');
    await page.locator('.app-dock [data-app-section="writing1"]').click();
    await page.locator('#essay1').fill('An offline draft saved on the phone.');
    await page.reload();
    assert.equal(await page.locator('#essay1').inputValue(), 'An offline draft saved on the phone.');
    await noOverflow(page, 'offline mock writing');
    await page.locator('.app-dock [data-app-section="reading"]').click();
    await page.evaluate(() => {
      for (const [name, value] of Object.entries(KEY)) {
        const answer = Array.isArray(value) ? value[0] : value;
        const radio = document.querySelector(`input[name="${name}"][value="${answer}"]`);
        if (radio) radio.checked = true;
        else document.querySelector(`[name="${name}"]`).value = answer;
      }
    });
    await page.locator('#mark-reading').click();
    assert.equal(await page.locator('#raw-score').innerText(), '13');
    await noOverflow(page, 'offline mock reading');
    await page.screenshot({ path: path.join(output, 'iphone-offline-reading.png'), fullPage: true });
    await page.goto(base + 'practice.html#vocab');
    await page.locator('#vocab.active').waitFor();
    await page.goto(base + 'practice.html?source=home#vocab');
    await page.locator('#vocab.active').waitFor();
    await page.goto(base);
    await page.locator('#overview.active').waitFor();
    await page.goto(base + 'practice.html#vocab');
    console.log('PASS: both pages reload offline; grammar, reading marking and writing save work offline.');

    serverOffline = false;
    await context.setOffline(false);
    await page.evaluate(async () => {
      const scope = (await navigator.serviceWorker.getRegistration()).scope;
      await caches.open('ielts-pocket:' + scope + ':old-test');
      await caches.open('unrelated-project-cache');
    });
    version = '2';
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await page.locator('#app-update').waitFor();
    assert.equal(await page.locator('#vocab.active').count(), 1, 'waiting update must not interrupt practice');
    page.once('dialog', dialog => dialog.accept());
    await Promise.all([page.waitForEvent('load'), page.locator('#app-update').click()]);
    await page.locator('.app-connection.is-ready').waitFor();
    const retained = await page.evaluate(async () => ({
      boxes: JSON.parse(localStorage.getItem('ielts-gym')).boxes,
      history: JSON.parse(localStorage.getItem('ielts-mock-history')),
      other: localStorage.getItem('another-site-key'),
      caches: await caches.keys()
    }));
    assert.equal(retained.boxes.retrofit, 3);
    assert.equal(retained.history[0].date, 'earlier attempt');
    assert.equal(retained.other, 'untouched');
    assert(retained.caches.includes('unrelated-project-cache'));
    assert(!retained.caches.some(key => key.endsWith(':old-test')));
    assert(!retained.caches.some(key => key.endsWith(':test-1')));
    console.log('PASS: opt-in update keeps progress and unrelated caches; only old app caches are removed.');

    for (const width of [320, 375, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const section of ['home', 'quick', 'vocab', 'para', 'grammar', 'task1', 'dictation', 'speaking', 'shadow']) {
        await page.evaluate(section => go(section), section);
        await noOverflow(page, `${width}px ${section}`);
      }
    }
    await page.evaluate(() => go('home'));
    await page.screenshot({ path: path.join(output, 'desktop-home.png'), fullPage: true });
    await page.locator('#theme-toggle').click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await page.screenshot({ path: path.join(output, 'desktop-dark.png'), fullPage: true });
    assert.deepEqual(errors, [], 'no uncaught JavaScript errors');
    await context.close();
    const appContext = await browser.newContext({ ...devices['iPhone 13'] });
    await appContext.addInitScript(() => Object.defineProperty(navigator, 'standalone', { get: () => true }));
    const app = await appContext.newPage();
    await app.goto(base + 'practice.html');
    assert.equal(await app.locator('#app-install').isVisible(), false, 'standalone launch hides installation action');
    assert.equal(await app.evaluate(() => document.documentElement.classList.contains('app-standalone')), true);
    await appContext.close();
    console.log(`PASS: ${engine} layouts at 320/375/430/768/1440px; light/dark; no page errors.`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
