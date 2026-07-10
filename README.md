# IELTS Academic — Mock Test 01

Self-contained IELTS Academic practice mock (single `index.html`, no build, no backend).

**Live:** https://sirawatsp.github.io/ielts-mock-test/

## What it does

- **Reading** — one academic passage (passive cooling), 13 questions (TFNG / matching headings / sentence completion), 20-min timer, instant marking with per-question explanations and an approximate band score.
- **Writing Task 1** — line-graph description task (SVG chart), 20-min timer, live word count.
- **Writing Task 2** — discussion essay (historic preservation vs. modern development), 40-min timer, live word count.
- **Speaking** — Parts 1–3 typed simulation with 1-min prep and 2-min talk timers.
- **Results** — compiles all answers into one copy-paste **assessment package** with strict IELTS-examiner marking instructions, ready to paste into a fresh Claude chat for banded feedback (4 criteria per skill, cross-task error patterns, next-session drills).

All answers autosave to `localStorage` — nothing leaves the browser.

## Adding more mocks

Each mock is one HTML file. Duplicate `index.html` → `mock-02.html`, swap in a new passage, answer key (`KEY` object in the script), chart, and prompts.
