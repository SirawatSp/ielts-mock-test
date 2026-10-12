# IELTS Academic — Mock Test 01

Static IELTS Academic practice site with a mock test and daily training gym. No build or backend required; keep the shared app files alongside both HTML pages.

**Live:** https://sirawatsp.github.io/ielts-mock-test/

## What it does

- **Reading** — one academic passage (passive cooling), 13 questions (TFNG / matching headings / sentence completion), 20-min timer, instant marking with per-question explanations and an approximate band score.
- **Writing Task 1** — line-graph description task (SVG chart), 20-min timer, live word count.
- **Writing Task 2** — discussion essay (historic preservation vs. modern development), 40-min timer, live word count.
- **Speaking** — Parts 1–3 typed simulation with 1-min prep and 2-min talk timers.
- **Results** — compiles all answers into one copy-paste **assessment package** with strict IELTS-examiner marking instructions, ready to paste into a fresh Claude chat for banded feedback (4 criteria per skill, cross-task error patterns, next-session drills). Also has **attempt history** (snapshot each sitting so redoing the test doesn't erase how you did last time) and **export/import** for backing up or moving progress to another browser or device.

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

Answers and scores autosave to `localStorage`; there is no app-owned server or cloud sync. Browser speech recognition may send audio to the browser provider's speech service and require a connection. TTS voice availability and offline support depend on the device.

**Dark mode** — both pages have a `◐ Theme` toggle in the header. It follows your system preference on first visit and remembers your choice after that, applied before first paint so there's no flash of the wrong palette. The Task 1 chart deliberately stays on white, as it would be on a real exam paper.

## How persistence works

Both pages save automatically to `localStorage`, which has no fixed expiry and normally survives closing or restarting the browser. It is device/browser-specific, not a cloud backup. Clearing website data, deleting an installed app, or browser storage eviction can remove it. The app requests persistent storage where supported when launched standalone, but approval is up to the browser. Use **Export progress** (Results on the mock, Gym Floor on the practice page) and **Import progress** for backups or transfers.

## iPhone Home Screen

1. Open https://sirawatsp.github.io/ielts-mock-test/practice.html in Safari.
2. Tap Share, then Add to Home Screen. Share may be in the More menu.
3. Keep Open as Web App enabled if shown, then tap Add.

The icon opens the Practice Gym, with bottom navigation to Home, Quick Test, Vocabulary and Mock Test. The site also includes installation help via the Home Screen button. A website cannot add itself to an iPhone's home screen; installation requires the user's action. [Apple's guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

Export existing Safari progress before installing. If the installed app uses a separate storage container and opens with empty progress, import your backup inside it. This does not migrate automatically or sync between devices.

## Offline and Updates

Open once online and wait for **Offline ready**. Both pages, text exercises, local icons and app files are cached for offline use. External Google Fonts fall back to device fonts offline. Audio/TTS and speech recognition are not guaranteed offline; clipboard and microphone access still depend on device permissions.

`manifest.webmanifest` uses relative URLs so installation stays scoped to this GitHub Pages project. `sw.js` precaches one coherent version; it never clears progress in localStorage. A new service worker waits until the user taps **Update ready** and confirms reloading, rather than interrupting practice. Existing active timers stop on reload. Quick Test uses a wall-clock deadline and logs elapsed time, including when the phone was locked.

For deployment, publish all files, including `app.js`, `app.css`, `sw.js`, the manifest and `assets/`. Bump `VERSION` in `sw.js` whenever a precached file changes. Service workers need HTTPS or localhost; opening an HTML file directly still runs exercises but cannot enable offline installation. Icons are committed PNGs; the optional `scripts/generate-assets.cjs` regenerates them with Sharp and Lucide. Local Lucide icons are accompanied by their license in `assets/`.

Run browser checks with `node tests/pwa.cjs` in an environment with Playwright available (or set `NODE_PATH` to its module directory). Tests start and close their own local server, check phone/desktop layouts, offline use, saved progress, and opt-in updates without changing live user data.

## Adding more mocks

Each mock is one HTML file. Duplicate `index.html` → `mock-02.html`, swap in a new passage, answer key (`KEY` object in the script), chart, and prompts.
