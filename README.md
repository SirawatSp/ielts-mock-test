# IELTS Academic — Mock Test 01

Self-contained IELTS Academic practice mock (single `index.html`, no build, no backend).

**Live:** https://sirawatsp.github.io/ielts-mock-test/

## What it does

- **Reading** — one academic passage (passive cooling), 13 questions (TFNG / matching headings / sentence completion), 20-min timer, instant marking with per-question explanations and an approximate band score.
- **Writing Task 1** — line-graph description task (SVG chart), 20-min timer, live word count.
- **Writing Task 2** — discussion essay (historic preservation vs. modern development), 40-min timer, live word count.
- **Speaking** — Parts 1–3 typed simulation with 1-min prep and 2-min talk timers.
- **Results** — compiles all answers into one copy-paste **assessment package** with strict IELTS-examiner marking instructions, ready to paste into a fresh Claude chat for banded feedback (4 criteria per skill, cross-task error patterns, next-session drills).

## Practice Gym (`practice.html`)

Daily skill training between mocks — six stations with progress tracked in `localStorage`:

- **Vocabulary** — 48 band-7 words across 6 IELTS topics; Leitner-box flashcards with collocations and the band-6 word each upgrades.
- **Paraphrase match** — tile-matching game for academic paraphrase recognition (the skill behind TFNG questions).
- **Grammar drills** — 36 questions on Thai-speaker traps (articles, agreement, tense, prepositions, complex sentences, hedging) with a per-category accuracy scoreboard.
- **Task 1 Gym** — write the overview sentence for 6 chart types, compare against band-7 models.
- **Listening dictation** — browser TTS (British voice) reads academic sentences; word-level diff marking, 3 difficulty levels.
- **Speaking** — random Part 1/Part 3 question generator with response timers, plus a band-7 functional phrase bank.

All answers autosave to `localStorage` — nothing leaves the browser.

## Adding more mocks

Each mock is one HTML file. Duplicate `index.html` → `mock-02.html`, swap in a new passage, answer key (`KEY` object in the script), chart, and prompts.
