'use strict';

(() => {
  const isGym = !!document.getElementById('quick');
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const icon = name => `<svg class="app-icon" aria-hidden="true"><use href="assets/ui-icons.svg#${name}"></use></svg>`;
  const bar = document.createElement('div');
  bar.className = 'app-bar';
  bar.innerHTML = `<span class="app-connection" role="status" aria-live="polite">Preparing offline practice...</span>
    <div class="app-actions">
      <button type="button" class="app-action" id="app-update" hidden>${icon('refresh-cw')}Update ready</button>
      <button type="button" class="app-action" id="app-install">${icon('smartphone')}<span>Home Screen</span></button>
    </div>`;
  document.querySelector('header').after(bar);
  const connection = bar.querySelector('.app-connection');
  const install = bar.querySelector('#app-install');
  const update = bar.querySelector('#app-update');
  install.title = 'Add IELTS Pocket to your home screen';
  update.title = 'Save your work and load the new app version';

  const dialog = document.createElement('dialog');
  dialog.className = 'app-install-dialog';
  dialog.setAttribute('aria-labelledby', 'app-install-title');
  dialog.innerHTML = `<div class="app-dialog-heading">
      <img src="assets/apple-touch-icon.png" width="64" height="64" alt="IELTS Pocket app icon">
      <div><p class="app-eyebrow">IELTS Pocket</p><h2 id="app-install-title">Add to Home Screen</h2></div>
      <button type="button" class="app-icon-button" id="app-close" aria-label="Close installation help" title="Close" autofocus>${icon('x')}</button>
    </div>
    <h3>On iPhone or iPad</h3>
    <ol>
      <li>Open this website in <strong>Safari</strong>.</li>
      <li>Tap <strong>Share</strong> ${icon('share')} then <strong>Add to Home Screen</strong>. The Share action may be inside the More menu.</li>
      <li>Keep <strong>Open as Web App</strong> on if it appears, then tap <strong>Add</strong>.</li>
    </ol>
    <p>On Android or desktop, use your browser's Install app action.</p>
    <div class="app-install-note">
      <p>Open once online and wait for <strong>Offline ready</strong>. Text practice then works without a connection. Audio voices and speech recognition may need internet.</p>
      <p>Already have progress in Safari? Export it before installing. If the home-screen app opens with an empty history, import that backup inside the app. Progress does not sync between devices.</p>
    </div>
    <p class="app-help-link"><a href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios" target="_blank" rel="noopener noreferrer">Apple's installation guide</a></p>`;
  document.body.append(dialog);
  dialog.querySelector('#app-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  let installPrompt;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    install.querySelector('span').textContent = 'Install app';
  });
  install.addEventListener('click', async () => {
    if (!installPrompt) { dialog.showModal(); return; }
    const prompt = installPrompt;
    installPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; }
    catch { dialog.showModal(); }
    install.querySelector('span').textContent = 'Home Screen';
  });
  const reflectInstall = () => {
    install.hidden = standalone();
    document.documentElement.classList.toggle('app-standalone', standalone());
  };
  reflectInstall();
  window.addEventListener('appinstalled', () => { install.hidden = true; });

  const dock = document.createElement('nav');
  dock.className = 'app-dock';
  dock.setAttribute('aria-label', 'Daily practice');
  dock.innerHTML = isGym
    ? `<button type="button" data-app-section="home" title="Practice home">${icon('house')}<span>Home</span></button>
       <button type="button" data-app-section="quick" title="Quick Test">${icon('zap')}<span>Quick Test</span></button>
       <button type="button" data-app-section="vocab" title="Vocabulary">${icon('book-open')}<span>Vocab</span></button>
       <a href="index.html" title="Mock Test">${icon('clipboard-list')}<span>Mock</span></a>`
    : `<a href="practice.html" title="Practice Gym">${icon('house')}<span>Practice</span></a>
       <button type="button" data-app-section="reading" title="Reading">${icon('book-open')}<span>Reading</span></button>
       <button type="button" data-app-section="writing1" title="Writing Task 1">${icon('pen-line')}<span>Writing</span></button>
       <button type="button" data-app-section="results" title="Results">${icon('clipboard-list')}<span>Results</span></button>`;
  document.body.append(dock);
  dock.addEventListener('click', event => {
    const button = event.target.closest('[data-app-section]');
    if (button) go(button.dataset.appSection);
  });
  function reflectSection(section) {
    dock.querySelectorAll('[data-app-section]').forEach(button => {
      const current = button.dataset.appSection === section;
      button.classList.toggle('is-current', current);
      if (current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.querySelector('#nav button.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  document.addEventListener('ielts:navigate', event => {
    reflectSection(event.detail);
    history.replaceState(null, '', '#' + event.detail);
  });
  function openHash() {
    const section = location.hash.slice(1);
    if (section && document.getElementById(section)?.matches('main section')) go(section);
    else reflectSection(document.querySelector('main section.active')?.id);
  }
  openHash();
  window.addEventListener('hashchange', openHash);

  // A native topic picker keeps the vocabulary card in reach on small screens.
  const topics = document.getElementById('topic-pick');
  if (topics) {
    const label = document.createElement('label');
    label.className = 'app-topic-picker';
    label.innerHTML = '<span>Topic</span><select aria-label="Vocabulary topic"></select>';
    const select = label.querySelector('select');
    const buttons = [...topics.querySelectorAll('button')];
    buttons.forEach(button => select.add(new Option(button.textContent, button.textContent)));
    select.addEventListener('change', () => buttons.find(button => button.textContent === select.value)?.click());
    topics.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (button) select.value = button.textContent;
    });
    topics.after(label);
  }

  // Keep the iOS status-bar colour in sync with the saved light/dark theme.
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeButton = document.getElementById('theme-toggle');
  themeButton.innerHTML = icon('moon');
  const reflectTheme = () => {
    themeMeta.content = document.documentElement.dataset.theme === 'dark' ? '#161d2b' : '#f4efe4';
    document.documentElement.style.colorScheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    themeButton.title = document.documentElement.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeButton.setAttribute('aria-label', themeButton.title);
  };
  reflectTheme();
  new MutationObserver(reflectTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let offlineReady = false;
  function reflectConnection() {
    connection.textContent = offlineReady
      ? (navigator.onLine ? 'Offline ready' : 'Offline - text practice ready')
      : (navigator.onLine ? 'Online - offline download pending' : 'Offline - reconnect to download practice');
    connection.classList.toggle('is-ready', offlineReady);
  }
  window.addEventListener('online', reflectConnection);
  window.addEventListener('offline', reflectConnection);
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    connection.textContent = 'Open the live site for offline access';
    return;
  }
  let registration;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    offlineReady = true;
    reflectConnection();
    offerUpdate();
    if (reloading) location.reload();
  });
  function offerUpdate() { update.hidden = !(registration?.waiting && navigator.serviceWorker.controller); }
  update.addEventListener('click', () => {
    if (!registration?.waiting) return;
    if (!confirm('Load the new version now? Saved progress stays intact. Any running timers will stop.')) return;
    reloading = true;
    registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
  });
  (async () => {
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      offerUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); });
      });
      await navigator.serviceWorker.ready;
      offlineReady = true;
      reflectConnection();
      if (standalone() && navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) registration.update().catch(() => {});
      });
    } catch { reflectConnection(); }
  })();
})();
