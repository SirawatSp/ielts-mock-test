# IELTS Pocket — Practice, Feedback & Mock Test

IELTS Academic practice with a mock test, daily training gym, and a four-skill **Skills Studio**. Reading and Listening exercises mark locally. An optional Node server connects Writing assessment and a live OpenAI speaking coach; API keys stay on the server. The original exercises still run as a static site.

**Live Skills Studio:** https://ielts-pocket-coach.onrender.com/skills.html

**Render dashboard:** https://dashboard.render.com/web/srv-dbs8h0uk1f9s738j72h0

**Original static site:** https://sirawatsp.github.io/ielts-mock-test/

The Render service runs the website and AI server together in My Workspace on the Free plan in Singapore. It tracks `codex/ielts-skills-coach`, with automatic deploys disabled. The GitHub Pages address serves the original static site and cannot run the AI server. Local changes and a successful test run do not update either published site automatically.

## Skills Studio (`skills.html`)

- **Reading:** three original passages, 24 questions, instant raw/percentage marks, accepted answers, and evidence explaining each result.
- **Listening:** three original scripts, 18 questions, browser text-to-speech, an optional transcript, and answer-by-answer explanations. A device voice is required for playback. These are short listening exercises, not a full recorded IELTS paper.
- **Writing:** three Academic Task 1 data sets and three Task 2 essays, word counts, planning checklists, model answers, and server-backed AI feedback on the four Writing criteria. Feedback includes quoted mistakes, corrections, reasons, an improved sample, and next exercises.
- **Speaking:** nine sets across Parts 1–3. A live OpenAI Realtime coach hears microphone audio, asks questions, responds aloud, and gives provisional IELTS criterion feedback. Part 2 uses an explicit finish-answer control so pauses do not interrupt the long turn. Typed practice also works; pronunciation and actual spoken fluency are not scored from text.
- **Review:** saved drafts, recent attempts, detailed corrections, and validated JSON backup/import. Access codes, API credentials, and raw microphone audio are not included in backups.

Short Reading/Listening sets show marks rather than inventing full-test bands. Writing bands apply to the individual task, and Speaking bands are tentative estimates from the available audio. The app does not infer an overall IELTS result from incomplete evidence. [Official IELTS criteria](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail).

## Connect OpenAI securely

Use Node.js 22 or later and the committed npm lockfile:

```sh
npm ci
cp .env.example .env
```

Edit `.env` privately in your editor. Set `OPENAI_API_KEY` to your OpenAI project key. Do not put it in HTML, browser settings, a Git commit, or a chat message. Set a random `APP_ACCESS_CODE` of at least 16 characters before exposing the server publicly. The browser asks for this separate coach access code and keeps it only in memory. Model names and optional server settings are described in `.env.example`.

```sh
npm start
```

Open the server's printed address in your browser and choose **Skills**. In **AI settings**, leave the server address empty when the website and API are hosted together, enter the coach access code, and check the connection. With no API key the server reports that AI is not connected; it never returns fabricated feedback. Microphone access needs HTTPS or localhost, browser permission, and WebRTC support.

Writing or typed feedback is sent to OpenAI only on submission. Live speaking starts streaming audio directly to OpenAI only after **Connect**. **End** closes the peer connection and microphone tracks. A browser deadline ends sessions after ten minutes, including a check when the page resumes. Short-lived browser credentials protect the permanent key; their expiry does not itself terminate an already connected session. Configure OpenAI project spending limits and platform rate limits for public hosting. The process-local request limiter is a basic guard, not a distributed spending cap.

The app server does not save learner answers or raw audio. Local history remains browser-specific. OpenAI processes submitted content according to the API project's data controls; the application does not promise that the provider retains nothing. [OpenAI WebRTC documentation](https://developers.openai.com/api/docs/guides/realtime-webrtc).

## Hosting the AI-enabled version

[Deploy this version to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FSirawatSp%2Fielts-mock-test%2Ftree%2Fcodex%2Fielts-skills-coach)

The included `render.yaml` runs the website and Node API together on Render. It selects the Free plan in Singapore, Node 24.22.1, the production authentication checks, and the required public network binding. Automatic deployments are disabled, so a later repository push does not silently release a new app version. Review the plan in Render before deploying; its Free plan has idle/cold-start limits. [Render deployment documentation](https://render.com/docs/deploy-to-render).

The existing service was created directly through Render, so its environment and deployment settings are managed in the linked Dashboard; the Blueprint is a template for creating another installation, not a linked source of infrastructure updates for this service. A random `APP_ACCESS_CODE` is already configured. To enable AI, open **Environment** in the dashboard, add your OpenAI project key as `OPENAI_API_KEY`, then choose **Save and deploy**. Find the coach access code in the same environment settings, open the website, and enter that code in **Skills → AI settings**. Leave the coach server address empty because the website and API share an origin. API usage is billed by OpenAI. Never publish `.env` or paste the OpenAI key into the website's coach-access-code field.

For a separate installation using the deployment button, Render prompts for `OPENAI_API_KEY` during setup and the Blueprint generates `APP_ACCESS_CODE` automatically.

The Node server serves an explicit list of public files, excluding credentials, repository metadata, source modules, and dependencies. The public-only `dist/` build is still available for static hosting.

Alternatively, keep the frontend on GitHub Pages and host the Node API separately. Set `ALLOWED_ORIGINS=https://sirawatsp.github.io` on the API server, then enter its HTTPS origin in Skills Studio's **AI settings**. Origins do not include the `/ielts-mock-test/` path. The server permits its exact Render-generated HTTPS origin using the trusted `RENDER_EXTERNAL_URL` environment value. For custom domains or a different Node host behind an HTTPS proxy, add the public HTTPS origin to `ALLOWED_ORIGINS`; client-supplied forwarded protocol headers do not grant access. Use a server you control: the coach access code is sent to the configured server. The API supports `GET /api/status`, `POST /api/assess`, and `POST /api/realtime`; the last endpoint mints a short-lived browser credential for direct OpenAI WebRTC audio.

Without an AI server, Reading/Listening marking, planning checklists, model answers, drafts, and history remain available. Writing assessment and live voice feedback require a configured server, network access, and a funded OpenAI API project with access to the configured models.

## Validation

```sh
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm test
npm run build
```

Set `PLAYWRIGHT_EXECUTABLE_PATH` to an installed Chromium, or run `npx playwright install chromium` and omit that variable. The checks cover API validation/authentication, private-file isolation, the installed AI SDK request/response contract, bug regressions, offline use, updates, responsive layouts, saved progress, and Skills Studio workflows. Voice tests simulate WebRTC/provider events to verify protocol and microphone cleanup without spending API credits. A successful mocked test does not verify model quality, a physical microphone, Safari behavior, or live OpenAI account permissions. Test artifacts stay in ignored `.test-output/`.

## What it does

- **Reading** — one academic passage (passive cooling), 13 questions (TFNG / matching headings / sentence completion), 20-min timer, instant marking with per-question explanations and an approximate band score.
- **Writing Task 1** — line-graph description task (SVG chart), 20-min timer, live word count.
- **Writing Task 2** — discussion essay (historic preservation vs. modern development), 40-min timer, live word count.
- **Speaking** — Parts 1–3 typed simulation with 1-min prep and 2-min talk timers.
- **Results** — compiles answers into a copy-paste **assessment package** for provisional Writing criterion feedback, typed Speaking language feedback, repeated error patterns and next-session drills. It does not request pronunciation, actual spoken-fluency bands or a four-skill overall result from typed answers. Also has **attempt history** and **export/import** for backups or transfers.

## Practice Gym (`practice.html`)

Daily skill training between mocks — seven stations plus a Quick Test mode, all progress tracked in `localStorage`:

- **⚡ Quick Test** — a mixed circuit (vocab, grammar, paraphrase, listening, speaking) sized to 5/10/15 minutes for short free time — no station-hopping, one continuous card stream against a countdown timer.
- **Vocabulary** — 201 band-7 words across 13 IELTS topics, in three modes: **Flashcards** (Leitner boxes, weakest words first), **Recall** (produce the word from its definition — active production, which is what Writing and Speaking actually test), and **Browse** (searchable, alphabetised reference list of the whole deck with box status).
- **Paraphrase match** — tile-matching game for academic paraphrase recognition (the skill behind TFNG questions), 44 pairs.
- **Grammar drills** — 72 questions on Thai-speaker traps (articles, agreement, tense, prepositions, complex sentences, hedging) with a per-category accuracy scoreboard.
- **Task 1 Gym** — write the overview sentence for 10 chart types, compare against band-7 models.
- **Listening dictation** — browser TTS (British voice) reads academic sentences; word-level diff marking, 3 difficulty levels, 30 sentences.
- **Speaking** — random Part 1/Part 3 question generator (44 questions) with response timers, plus a band-7 functional phrase bank.
- **Shadowing** — plays a sentence via TTS, then uses available browser speech recognition to transcribe your spoken echo and score word match. Requires mic permission and browser support; this is not a pronunciation or IELTS band score.
- **Progress trend** — sparklines on the home dashboard tracking dictation accuracy and shadowing match rate over your last 15 attempts of each.
- **Session history & backup** — a running log of every Quick Test circuit (date, duration, per-skill accuracy), plus export/import to back up or transfer all gym progress as a `.json` file.

Gym answers and scores autosave to `localStorage`, with no cloud sync. The optional coaching API is used by Skills Studio. Browser speech recognition may send audio to the browser provider's speech service and require a connection. TTS voice availability and offline support depend on the device.

**Dark mode** — both pages have a `◐ Theme` toggle in the header. It follows your system preference on first visit and remembers your choice after that, applied before first paint so there's no flash of the wrong palette. The Task 1 chart deliberately stays on white, as it would be on a real exam paper.

## How persistence works

Both pages save automatically to `localStorage`, which has no fixed expiry and normally survives closing or restarting the browser. It is device/browser-specific, not a cloud backup. Clearing website data, deleting an installed app, or browser storage eviction can remove it. The app requests persistent storage where supported when launched standalone, but approval is up to the browser. Use **Export progress** (Results on the mock, Gym Floor on the practice page) and **Import progress** for backups or transfers.

## iPhone Home Screen

1. Open https://sirawatsp.github.io/ielts-mock-test/practice.html in Safari.
2. Tap Share, then Add to Home Screen. Share may be in the More menu.
3. Keep Open as Web App enabled if shown, then tap Add.

The icon opens the Practice Gym, with bottom navigation to Home, Quick Test, Vocabulary, Mock Test and Skills Studio. The site also includes installation help via the Home Screen button. A website cannot add itself to an iPhone's home screen; installation requires the user's action. [Apple's guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

Export existing Safari progress before installing. If the installed app uses a separate storage container and opens with empty progress, import your backup inside it. This does not migrate automatically or sync between devices.

## Offline and Updates

Open once online and wait for **Offline ready**. Both pages, text exercises, local icons and app files are cached for offline use. External Google Fonts fall back to device fonts offline. Audio/TTS and speech recognition are not guaranteed offline; clipboard and microphone access still depend on device permissions.

`manifest.webmanifest` uses relative URLs so installation stays scoped to this GitHub Pages project. `sw.js` precaches one coherent version; it never clears progress in localStorage. A new service worker waits until the user taps **Update ready** and confirms reloading, rather than interrupting practice. Existing active timers stop on reload. Quick Test uses a wall-clock deadline and logs elapsed time, including when the phone was locked.

For static deployment, publish the public `dist/` build, including the Skills Studio files, shared app files, service worker, manifest and `assets/`. Run `npm start` on Render or another Node host for AI features; never publish private environment files. Bump `VERSION` in `sw.js` whenever a precached file changes. Service workers need HTTPS or localhost; opening HTML directly cannot enable offline installation. Icons are committed PNGs; the optional `scripts/generate-assets.cjs` regenerates them with Sharp and Lucide. Local Lucide icons are accompanied by their license in `assets/`.

Run browser checks with `node tests/pwa.cjs` in an environment with Playwright available (or set `NODE_PATH` to its module directory). Tests start and close their own local server, check phone/desktop layouts, offline use, saved progress, and opt-in updates without changing live user data.

## Adding more mocks

Each mock is one HTML file. Duplicate `index.html` → `mock-02.html`, swap in a new passage, answer key (`KEY` object in the script), chart, and prompts.
