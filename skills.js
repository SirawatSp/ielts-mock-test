'use strict';

(() => {
  const CONTENT = window.IELTS_CONTENT;
  const SKILLS = ['reading', 'listening', 'writing', 'speaking'];
  const STORE = 'ielts-skills-v1';
  const API_STORE = 'ielts-skills-api-base';
  const $ = id => document.getElementById(id);
  const title = text => text.charAt(0).toUpperCase() + text.slice(1);
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const words = value => value.trim() ? value.trim().split(/\s+/).length : 0;
  const normalise = value => String(value).normalize('NFKC').trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
  const text = (value, limit = 30000) => typeof value === 'string' && value.length <= limit;
  const band = value => value === null || (Number.isFinite(value) && value >= 0 && value <= 9 && Number.isInteger(value * 2));
  let skill = SKILLS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'reading';
  let exercise, state = { version: 1, drafts: {}, history: [] }, storageWarning = false, storageLocked = false;
  let apiBase = '', accessCode = '', apiStatus = { configured: false, requiresAccessCode: false };
  let request = null, statusRequest = null, requestVersion = 0;
  let timerDeadline = 0, timerRemaining = 0, timerHandle;
  let live = null, voiceGeneration = 0, toastHandle;

  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastHandle);
    toastHandle = setTimeout(() => $('toast').classList.remove('show'), 4000);
  }

  function save(nextState = state) {
    try {
      if (storageLocked) throw new Error('Recovery data must be preserved.');
      localStorage.setItem(STORE, JSON.stringify(nextState)); $('saved-status').textContent = 'Saved on this device'; return true;
    }
    catch { $('saved-status').textContent = 'Storage full or unavailable — export a backup'; if (!storageWarning) { toast('Your browser could not save progress. Export a backup before leaving.'); storageWarning = true; } return false; }
  }

  function validAssessment(value, expectedSkill) {
    return !!value && typeof value === 'object' && value.skill === expectedSkill && band(value.band) &&
      text(value.summary, 12000) && text(value.improvedAnswer, 20000) && typeof value.pronunciationAssessed === 'boolean' &&
      Array.isArray(value.criteria) && value.criteria.length >= 3 && value.criteria.length <= 6 && value.criteria.every(c => c && text(c.name, 150) && band(c.band) && text(c.feedback, 12000)) &&
      Array.isArray(value.mistakes) && value.mistakes.length <= 30 && value.mistakes.every(m => m && text(m.original, 5000) && text(m.correction, 5000) && text(m.explanation, 8000)) &&
      Array.isArray(value.nextSteps) && value.nextSteps.length <= 15 && value.nextSteps.every(s => text(s, 5000));
  }

  function cleanAssessment(value, expectedSkill, heardAudio = false) {
    if (!validAssessment(value, expectedSkill)) throw new Error('The coach returned incomplete feedback. Please try again.');
    const result = { skill: value.skill, band: value.band, summary: value.summary, improvedAnswer: value.improvedAnswer, pronunciationAssessed: heardAudio && value.pronunciationAssessed,
      criteria: value.criteria.map(c => ({ name: c.name, band: c.band, feedback: c.feedback })),
      mistakes: value.mistakes.map(m => ({ original: m.original, correction: m.correction, explanation: m.explanation })), nextSteps: value.nextSteps.slice() };
    if (expectedSkill === 'speaking') {
      const expected = ['fluency and coherence', 'lexical resource', 'grammatical range and accuracy', 'pronunciation'];
      const nameKey = name => name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
      if (result.criteria.length !== 4 || expected.some(name => result.criteria.filter(c => nameKey(c.name) === name).length !== 1)) throw new Error('The coach returned incomplete Speaking criteria. Please try again.');
      if (!heardAudio) result.criteria.forEach(c => { if (['fluency and coherence', 'pronunciation'].includes(nameKey(c.name))) c.band = null; });
      if (!result.pronunciationAssessed) result.criteria.find(c => nameKey(c.name) === 'pronunciation').band = null;
      result.band = result.pronunciationAssessed && result.criteria.every(c => c.band !== null) ? Math.round(result.criteria.reduce((sum, c) => sum + c.band, 0) / 4 * 2) / 2 : null;
    }
    return result;
  }

  function findExercise(id) {
    for (const name of SKILLS) { const found = CONTENT[name].find(item => item.id === id); if (found) return { skill: name, exercise: found }; }
    return null;
  }

  function cleanBackup(value) {
    if (!value || value.version !== 1 || !value.drafts || typeof value.drafts !== 'object' || Array.isArray(value.drafts) || !Array.isArray(value.history) || value.history.length > 100) throw new Error('Choose a Skills Studio backup exported by this page.');
    const result = { version: 1, drafts: {}, history: [] };
    for (const [id, draft] of Object.entries(value.drafts)) {
      const found = findExercise(id);
      if (!found || !draft || typeof draft !== 'object' || Array.isArray(draft)) throw new Error('The backup contains an unknown exercise or invalid draft.');
      const cleaned = {};
      if (draft.response !== undefined) { if (!text(draft.response, 20000)) throw new Error('A saved response is invalid.'); cleaned.response = draft.response; }
      if (draft.answers !== undefined) {
        if (!draft.answers || typeof draft.answers !== 'object' || Array.isArray(draft.answers) || !found.exercise.questions) throw new Error('Saved answers are invalid.');
        cleaned.answers = {};
        for (const [qid, answer] of Object.entries(draft.answers)) {
          if (!found.exercise.questions.some(q => q.id === qid) || !text(answer, 1000)) throw new Error('A saved answer is invalid.');
          cleaned.answers[qid] = answer;
        }
      }
      if (draft.checklist !== undefined) {
        if (!Array.isArray(draft.checklist) || draft.checklist.length > 20 || !draft.checklist.every(x => typeof x === 'boolean')) throw new Error('The saved checklist is invalid.');
        cleaned.checklist = draft.checklist.slice();
      }
      result.drafts[id] = cleaned;
    }
    for (const attempt of value.history) {
      const found = attempt && findExercise(attempt.exerciseId);
      if (!found || found.skill !== attempt.skill || !text(attempt.date, 80) || !Number.isFinite(Date.parse(attempt.date)) || !text(attempt.response || '', 50000)) throw new Error('An attempt is invalid.');
      const cleaned = { exerciseId: attempt.exerciseId, skill: attempt.skill, date: attempt.date, response: attempt.response || '' };
      if (attempt.answers !== undefined) {
        if (!found.exercise.questions || !attempt.answers || typeof attempt.answers !== 'object' || Array.isArray(attempt.answers)) throw new Error('An attempt has invalid answers.');
        cleaned.answers = {};
        for (const [qid, answer] of Object.entries(attempt.answers)) {
          if (!found.exercise.questions.some(q => q.id === qid) || !text(answer, 1000)) throw new Error('An attempt answer is invalid.');
          cleaned.answers[qid] = answer;
        }
        const marked = mark(found.exercise, cleaned.answers);
        cleaned.raw = marked.raw; cleaned.total = marked.total; cleaned.percent = marked.percent;
      }
      if (attempt.assessment) cleaned.assessment = cleanAssessment(attempt.assessment, attempt.skill, attempt.audio === true);
      cleaned.audio = attempt.audio === true;
      if (attempt.selfReview === true) cleaned.selfReview = true;
      result.history.push(cleaned);
    }
    return result;
  }

  function draft() { return state.drafts[exercise.id] || (state.drafts[exercise.id] = {}); }
  function rememberAttempt(attempt, item = exercise, attemptSkill = skill) {
    state.history.push({ ...attempt, exerciseId: item.id, skill: attemptSkill, date: new Date().toISOString() });
    state.history = state.history.slice(-100);
    while (state.history.length > 1 && JSON.stringify(state).length > 4000000) state.history.shift();
    save(); renderHistory(); renderStats();
  }

  function mark(item, answers) {
    const rows = item.questions.map(question => ({ question, answer: answers[question.id] || '', correct: question.answers.some(answer => normalise(answer) === normalise(answers[question.id] || '')) && normalise(answers[question.id] || '') !== '' }));
    const raw = rows.filter(row => row.correct).length;
    return { rows, raw, total: rows.length, percent: Math.round(100 * raw / rows.length) };
  }

  function scoreBanner(raw, total, percent) {
    const block = make('div', undefined, 'score-banner');
    block.append(make('strong', `${raw}/${total}`, 'score'));
    const caption = make('div'); caption.append(make('h3', `${percent}% correct`), make('p', 'Review the evidence below, then try the questions you missed.'));
    block.append(caption); return block;
  }

  function reviewRow(row) {
    const block = make('div', undefined, 'question-review');
    block.append(make('p', row.correct ? '✓ Correct' : 'Review this answer', 'verdict'), make('p', `Your answer: ${row.answer || '(blank)'}`));
    if (!row.correct) block.append(make('p', `Correct answer: ${row.question.answers.join(' / ')}`));
    block.append(make('p', row.question.explanation)); return block;
  }

  function renderHistory() {
    const records = state.history.filter(item => item.skill === skill).slice().reverse();
    $('history-count').textContent = `${records.length} saved`;
    $('attempt-history').replaceChildren();
    if (!records.length) $('attempt-history').append(make('p', 'Your completed attempts will appear here. Open an attempt to revisit its answers and feedback.', 'small'));
    records.slice(0, 8).forEach(record => {
      const button = make('button', undefined, 'history-item'); button.type = 'button';
      button.append(make('strong', findExercise(record.exerciseId)?.exercise.title || 'Practice attempt'));
      const result = record.total ? `${record.raw}/${record.total} · ${record.percent}%` : record.assessment?.band !== null && record.assessment?.band !== undefined ? `Practice band ${record.assessment.band.toFixed(1)}` : record.assessment ? 'Criterion feedback' : 'Self-review';
      button.append(make('span', `${new Date(record.date).toLocaleDateString()} · ${result}`));
      button.addEventListener('click', () => openAttempt(record)); $('attempt-history').append(button);
    });
  }

  function renderStats() {
    const records = state.history.filter(item => item.skill === skill);
    $('skill-stats').replaceChildren();
    const entries = [['Completed attempts', records.length]];
    const latest = records.slice().reverse().find(r => r.total);
    if (latest) entries.push(['Latest mini-exercise', `${latest.raw}/${latest.total}`]);
    const lastBand = records.slice().reverse().find(r => r.assessment?.band !== null && r.assessment?.band !== undefined);
    if (lastBand) entries.push(['Latest practice estimate', lastBand.assessment.band.toFixed(1)]);
    const completed = new Set(records.map(r => r.exerciseId));
    entries.push(['Exercises tried', `${completed.size}/${CONTENT[skill].length}`]);
    entries.forEach(([label, value]) => { const row = make('div', undefined, 'stat-line'); row.append(make('span', label), make('strong', String(value))); $('skill-stats').append(row); });
    const rubrics = {
      reading: ['Locate specific evidence.', 'Distinguish a contradiction from missing information.', 'Check spelling and word limits.'],
      listening: ['Identify details and the speaker’s meaning.', 'Check names, numbers and spelling.', 'Replay and compare against the transcript.'],
      writing: ['Task achievement / task response', 'Coherence and cohesion', 'Lexical resource', 'Grammatical range and accuracy'],
      speaking: ['Fluency and coherence', 'Lexical resource', 'Grammatical range and accuracy', 'Pronunciation from live audio']
    };
    const list = make('ul', undefined, 'rubric-list'); rubrics[skill].forEach(point => list.append(make('li', point))); $('rubric-summary').replaceChildren(list);
  }

  function openAttempt(record) {
    const found = findExercise(record.exerciseId); if (!found) return;
    const root = $('history-detail'); root.replaceChildren(make('p', `${title(record.skill)} · ${new Date(record.date).toLocaleString()}`, 'meta'), make('h3', found.exercise.title), make('p', found.exercise.prompt || found.exercise.description || ''));
    if (record.answers) {
      const marked = mark(found.exercise, record.answers); root.append(scoreBanner(marked.raw, marked.total, marked.percent));
      marked.rows.forEach((row, i) => { const block = make('div', undefined, `question ${row.correct ? 'correct' : 'incorrect'}`); block.append(make('p', `${i + 1}. ${row.question.prompt}`), reviewRow(row)); root.append(block); });
    }
    if (record.response) { const details = make('details'); details.append(make('summary', record.audio ? 'Your conversation transcript' : 'Your response'), make('div', record.response, 'feedback-answer')); root.append(details); }
    if (record.assessment) root.append(assessmentCard(record.assessment));
    else if (record.selfReview) root.append(make('p', 'Self-review saved. No AI band was assigned.', 'notice'));
    $('history-dialog').showModal();
  }

  function renderTimer() {
    if (timerDeadline) timerRemaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    $('timer-clock').textContent = `${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(timerRemaining % 60).padStart(2, '0')}`;
    $('timer-start').textContent = timerDeadline ? 'Pause timer' : 'Start timer';
    $('timer-clock').closest('.timer-box').classList.toggle('expired', timerRemaining === 0);
    if (timerDeadline && timerRemaining === 0) { timerDeadline = 0; clearInterval(timerHandle); $('timer-start').textContent = 'Restart timer'; if (live?.activeAnswer) finishVoiceAnswer(); toast('Practice time is up. Your work is saved; you can continue or review it.'); }
  }

  function resetTimer() { clearInterval(timerHandle); timerDeadline = 0; timerRemaining = skill === 'speaking' && exercise?.part === 'part2' ? 60 : Math.round((exercise?.timeMinutes || 10) * 60); renderTimer(); }
  $('timer-start').addEventListener('click', () => {
    if (timerDeadline) { renderTimer(); timerDeadline = 0; clearInterval(timerHandle); renderTimer(); }
    else { if (!timerRemaining) resetTimer(); timerDeadline = Date.now() + timerRemaining * 1000; timerHandle = setInterval(renderTimer, 500); renderTimer(); }
  });
  $('timer-reset').addEventListener('click', resetTimer);

  function stopTts() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  function speakTts(value, onEnd) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) { toast('This browser cannot play the exercise audio. Use the transcript to practise or try another browser.'); return; }
    stopTts(); const utterance = new SpeechSynthesisUtterance(value); utterance.lang = 'en-GB'; utterance.rate = 0.95;
    const voices = speechSynthesis.getVoices(); const voice = voices.find(item => item.lang === 'en-GB') || voices.find(item => item.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.onerror = event => { if (!['interrupted', 'canceled'].includes(event.error)) toast('Audio playback failed. Check your device voices, or reveal the transcript.'); onEnd?.(); };
    utterance.onend = () => onEnd?.(); speechSynthesis.speak(utterance);
  }

  function renderExercise() {
    requestVersion++; request?.abort(); request = null;
    stopVoice(); stopTts(); resetTimer();
    const root = $('exercise-body'); root.replaceChildren(); $('practice-feedback').replaceChildren();
    $('exercise-title').textContent = exercise.title;
    $('exercise-meta').textContent = skill === 'writing' ? `${exercise.taskType === 'task1' ? 'Academic Task 1' : 'Task 2'} · ${exercise.minWords}+ words` : skill === 'speaking' ? `Speaking ${exercise.part.replace('part', 'Part ')} · AI voice or typed practice` : `${exercise.questions.length} questions · ${exercise.timeMinutes} minutes`;
    if (skill === 'reading' || skill === 'listening') renderQuestions(root);
    else renderProductive(root);
    $('saved-status').textContent = state.drafts[exercise.id] ? 'Saved draft restored' : 'Drafts save on this device';
  }

  function renderQuestions(root) {
    root.append(make('p', exercise.description, 'small'));
    if (skill === 'reading') {
      const passage = make('div', undefined, 'passage');
      exercise.passage.split(/\n\s*\n/).forEach(paragraph => passage.append(make('p', paragraph))); root.append(passage);
    } else {
      root.append(make('p', 'Listen to the passage, then answer the questions. The voice is generated by your browser; audio may need a connection or an installed English voice.', 'notice'));
      const actions = make('div', undefined, 'actions'); const play = make('button', '▶ Play passage', 'btn'); play.type = 'button'; play.id = 'dictation-play';
      play.addEventListener('click', () => speakTts(exercise.script)); const stop = make('button', 'Stop audio', 'btn ghost'); stop.type = 'button'; stop.addEventListener('click', stopTts); actions.append(play, stop); root.append(actions);
      const details = make('details'); details.id = 'listening-transcript'; const summary = make('summary', 'Reveal listening transcript'); summary.id = 'show-transcript'; details.append(summary, make('div', exercise.script, 'feedback-answer')); root.append(details);
    }
    const form = make('form'); form.id = 'question-form'; const list = make('ol', undefined, 'question-list');
    exercise.questions.forEach((question, index) => {
      const row = make('li', undefined, 'question'); row.dataset.question = question.id;
      const id = `answer-${index}`; const label = make('label', `${index + 1}. ${question.prompt}`); label.htmlFor = id;
      let input;
      if (question.type === 'select') { input = make('select'); const blank = make('option', 'Choose your answer'); blank.value = ''; input.append(blank); question.options.forEach(option => { const item = make('option', option); item.value = option; input.append(item); }); }
      else { input = make('input'); input.type = 'text'; input.maxLength = 1000; input.autocomplete = 'off'; }
      input.id = id; input.name = question.id; input.value = draft().answers?.[question.id] || '';
      const changed = () => { draft().answers ||= {}; draft().answers[question.id] = input.value; save(); row.classList.remove('correct', 'incorrect'); row.querySelector('.question-review')?.remove(); $('practice-feedback').replaceChildren(make('p', 'Answers changed. Mark again to update your score.', 'small')); };
      input.addEventListener(question.type === 'select' ? 'change' : 'input', changed);
      row.append(label, input); list.append(row);
    });
    const submit = make('button', 'Mark my answers', 'btn signal'); submit.id = 'mark-answers'; submit.type = 'submit'; form.append(list, submit);
    form.addEventListener('submit', event => {
      event.preventDefault(); const answers = {};
      exercise.questions.forEach((question, index) => { answers[question.id] = $(`answer-${index}`).value.trim(); });
      draft().answers = answers; const result = mark(exercise, answers);
      list.querySelectorAll('.question').forEach((row, i) => { row.classList.toggle('correct', result.rows[i].correct); row.classList.toggle('incorrect', !result.rows[i].correct); row.querySelector('.question-review')?.remove(); row.append(reviewRow(result.rows[i])); });
      $('practice-feedback').replaceChildren(scoreBanner(result.raw, result.total, result.percent)); rememberAttempt({ answers: { ...answers }, raw: result.raw, total: result.total, percent: result.percent });
      $('practice-feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }); root.append(form);
  }

  function checklist(item) {
    const list = make('ul', undefined, 'checklist');
    item.checklist.forEach((point, index) => {
      const row = make('li'); const label = make('label'); const check = make('input'); check.type = 'checkbox'; check.checked = draft().checklist?.[index] === true;
      check.addEventListener('change', () => { draft().checklist ||= []; draft().checklist[index] = check.checked; for (let i = 0; i < item.checklist.length; i++) draft().checklist[i] = draft().checklist[i] === true; save(); });
      label.append(check, make('span', point)); row.append(label); list.append(row);
    }); return list;
  }

  function renderProductive(root) {
    root.append(make('p', exercise.prompt, 'task-prompt'));
    if (exercise.context) root.append(make('div', exercise.context, 'task-context'));
    if (skill === 'speaking') {
      root.append(renderVoicePanel());
      const details = make('details'); details.id = 'typed-speaking'; details.append(make('summary', 'Prefer to type? Practise answer structure here.'));
      const body = make('div'); body.append(make('p', 'Typed practice gives feedback on language and organisation. Pronunciation, delivery and an overall Speaking band cannot be assessed from text.', 'small'));
      details.append(body); root.append(details); responseEditor(body);
    } else responseEditor(root);
    const details = make('details'); details.append(make('summary', 'Self-review checklist'), checklist(exercise)); root.append(details);
    if (exercise.modelAnswer) { const model = make('details'); model.append(make('summary', 'Compare with a model response'), make('div', exercise.modelAnswer, 'feedback-answer')); root.append(model); }
    if (skill === 'speaking' && exercise.followUps.length) { const followUps = make('details'); followUps.append(make('summary', 'More questions to practise')); const list = make('ul'); exercise.followUps.forEach(question => list.append(make('li', question))); followUps.append(list); root.append(followUps); }
  }

  function responseEditor(root) {
    const label = make('label', skill === 'writing' ? 'Your writing' : 'Your typed response'); label.htmlFor = 'response-input';
    const input = make('textarea'); input.id = 'response-input'; input.maxLength = 20000; input.value = draft().response || ''; input.placeholder = 'Write your answer here…';
    const count = make('p', undefined, 'meta'); count.id = 'word-count';
    function updateCount() { const n = words(input.value); count.textContent = `${n} words${exercise.minWords ? ` · aim for at least ${exercise.minWords}` : ''}`; }
    input.addEventListener('input', () => { draft().response = input.value; save(); updateCount(); $('practice-feedback').replaceChildren(); }); updateCount();
    const actions = make('div', undefined, 'actions'); const assess = make('button', 'Get AI feedback', 'btn signal'); assess.type = 'button'; assess.id = 'assess-response';
    assess.addEventListener('click', assessResponse);
    const self = make('button', 'Save self-review', 'btn ghost'); self.type = 'button'; self.id = 'save-self-review'; self.addEventListener('click', () => { if (!input.value.trim()) { toast('Write a response first.'); return; } rememberAttempt({ response: input.value, selfReview: true }); $('practice-feedback').replaceChildren(make('p', 'Your response is saved in Recent attempts. Use the checklist and model response to review it. No band score has been assigned.', 'notice')); });
    actions.append(assess, self); root.append(label, input, count, actions, make('p', 'AI feedback sends this response to your configured OpenAI coach. You’ll see criterion estimates, specific corrections and a next-step plan.', 'small'));
  }

  function assessmentCard(result) {
    const root = make('div', undefined, 'feedback-card');
    root.append(make('p', result.band === null ? 'Feedback from the evidence available' : `Estimated practice band · ${result.band.toFixed(1)}`, 'eyebrow'), make('h3', 'Your feedback'), make('p', result.summary));
    if (result.skill === 'speaking' && !result.pronunciationAssessed) root.append(make('p', 'Pronunciation and a complete Speaking band have not been assessed. Use live audio practice for feedback on delivery.', 'notice'));
    result.criteria.forEach(item => { const row = make('div', undefined, 'criterion'); const heading = make('h4', item.name); heading.append(make('span', item.band === null ? 'Not assessed' : item.band.toFixed(1))); row.append(heading, make('p', item.feedback)); root.append(row); });
    if (result.mistakes.length) { root.append(make('h3', 'What to correct')); result.mistakes.forEach(item => { const block = make('div', undefined, 'mistake'); const before = make('p'); before.append(make('strong', 'Your words: '), make('del', item.original)); const after = make('p'); after.append(make('strong', 'Try: '), make('ins', item.correction)); block.append(before, after, make('p', item.explanation)); root.append(block); }); }
    if (result.improvedAnswer) { const details = make('details'); details.append(make('summary', 'An improved version of your answer'), make('div', result.improvedAnswer, 'feedback-answer')); root.append(details); }
    if (result.nextSteps.length) { root.append(make('h3', 'Your next practice')); const list = make('ol'); result.nextSteps.forEach(point => list.append(make('li', point))); root.append(list); }
    root.append(make('p', 'This is an AI practice estimate based on this response, not an official IELTS result or a prediction across all four skills.', 'small')); return root;
  }

  function apiUrl(path) { return apiBase ? `${apiBase}/api/${path}` : new URL(`api/${path}`, location.href).href; }
  async function api(path, body, signal) {
    const headers = { Accept: 'application/json' }; if (body !== undefined) headers['Content-Type'] = 'application/json'; if (accessCode) headers['x-coach-access-code'] = accessCode;
    let response;
    try { response = await fetch(apiUrl(path), { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal, cache: 'no-store', credentials: 'omit' }); }
    catch (error) { if (error.name === 'AbortError') throw error; throw new Error('The coach server could not be reached. Check AI settings and your connection.'); }
    if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('No coach API is available at this address. Open AI settings to connect your server.');
    const result = await response.json().catch(() => { throw new Error('The coach server returned an unreadable response.'); });
    if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error.slice(0, 500) : 'The coach request failed. Please try again.');
    return result;
  }

  async function checkApi() {
    statusRequest?.abort(); statusRequest = new AbortController(); const active = statusRequest;
    const timeout = setTimeout(() => active.abort(), 10000);
    $('settings-status').textContent = 'Checking your coach server…';
    try {
      const data = await api('status', undefined, active.signal);
      if (typeof data.configured !== 'boolean' || typeof data.requiresAccessCode !== 'boolean') throw new Error('This address did not return a compatible coach status.');
      apiStatus = data;
      $('settings-status').textContent = data.configured ? data.requiresAccessCode && !accessCode ? 'The server is configured. Enter its coach access code to use AI feedback.' : 'Your coach server is configured. AI requests will use your OpenAI API account.' : data.message || 'The server is running, but its OpenAI API key has not been configured.';
      $('api-dot').textContent = data.configured ? '●' : '○'; $('api-dot').classList.toggle('ready', data.configured);
    } catch (error) {
      if (active !== statusRequest) return;
      apiStatus = { configured: false, requiresAccessCode: false };
      $('api-dot').textContent = '○'; $('api-dot').classList.remove('ready');
      $('settings-status').textContent = error.name === 'AbortError' ? 'The coach server did not respond. Check its address and try again.' : error.message;
    } finally { clearTimeout(timeout); }
  }

  async function assessResponse() {
    const input = $('response-input'); if (!input.value.trim()) { toast('Write a response first.'); input.focus(); return; }
    if (!apiStatus.configured) { $('settings-dialog').showModal(); checkApi(); return; }
    if (apiStatus.requiresAccessCode && !accessCode) { $('settings-dialog').showModal(); $('access-code').focus(); return; }
    request?.abort(); const controller = new AbortController(); request = controller; const version = ++requestVersion;
    const button = $('assess-response'); button.disabled = true; button.textContent = 'Assessing your response…'; const timeout = setTimeout(() => controller.abort(), 120000);
    const submitted = input.value, submittedSkill = skill, submittedExercise = exercise;
    $('practice-feedback').replaceChildren(make('p', 'Your coach is reading your response and checking it against the assessment criteria…', 'notice'));
    try {
      const data = await api('assess', { skill, taskType: exercise.taskType || exercise.part, prompt: exercise.prompt, response: submitted, context: exercise.context || '' }, controller.signal);
      if (version !== requestVersion || exercise !== submittedExercise) return;
      const result = cleanAssessment(data, submittedSkill, false);
      // Keep the feedback linked to the exact submitted response if the draft was edited while waiting.
      rememberAttempt({ response: submitted, assessment: result });
      $('practice-feedback').replaceChildren(assessmentCard(result));
      if (input.value !== submitted) $('practice-feedback').prepend(make('p', 'This feedback is for your submitted version. Your newer draft is saved above.', 'notice'));
    } catch (error) {
      if (version === requestVersion) $('practice-feedback').replaceChildren(make('p', error.name === 'AbortError' ? 'The assessment timed out. Your draft is saved; please try again.' : error.message, 'notice error'));
    } finally {
      clearTimeout(timeout); if (version === requestVersion) { button.disabled = false; button.textContent = 'Get AI feedback'; request = null; }
    }
  }

  function renderVoicePanel() {
    const panel = make('div', undefined, 'voice-panel'); panel.append(make('h3', 'Talk with your IELTS coach'), make('p', 'Connect for a live conversation. Your AI coach asks questions, listens to your actual speech and responds aloud. Ask for corrections, or choose Get feedback to review the IELTS criteria.', 'small'));
    if (exercise.part === 'part2') panel.append(make('p', 'Part 2: take one minute to prepare. Choose Start my answer when ready, speak for up to two minutes, then choose Finish my answer. Your coach will not interrupt pauses in your long turn.', 'notice'));
    const status = make('div', undefined, 'voice-status'); const light = make('span', undefined, 'voice-light'); light.id = 'voice-light'; const label = make('span', 'Not connected'); label.id = 'voice-status-text'; const elapsed = make('span', '00:00 / 10:00'); elapsed.id = 'voice-elapsed'; status.append(light, label, elapsed); panel.append(status);
    const actions = make('div', undefined, 'actions');
    for (const [id, caption, style, handler] of [['voice-connect', 'Connect & start', 'btn signal', startVoice], ['voice-mute', 'Mute microphone', 'btn ghost', muteVoice], ['voice-feedback', 'Get feedback', 'btn', requestVoiceFeedback], ['voice-end', 'End session', 'btn ghost', () => stopVoice('Session ended. Your microphone is off.')]]) {
      const button = make('button', caption, style); button.id = id; button.type = 'button'; button.disabled = id !== 'voice-connect'; button.addEventListener('click', handler); actions.append(button);
    }
    if (exercise.part === 'part2') { const answer = make('button', 'Start my answer', 'btn'); answer.id = 'voice-answer'; answer.type = 'button'; answer.disabled = true; answer.addEventListener('click', () => { if (live?.activeAnswer) finishVoiceAnswer(); else startVoiceAnswer(); }); actions.insertBefore(answer, actions.querySelector('#voice-feedback')); }
    panel.append(actions, make('p', 'Connecting streams microphone audio to OpenAI and may incur API charges. This app does not store an audio recording. Sessions end after 10 minutes; choose End session whenever you finish.', 'voice-note'));
    const audio = make('audio'); audio.id = 'voice-audio'; audio.autoplay = true; audio.controls = true; audio.className = 'audio-controls'; audio.setAttribute('aria-label', 'AI coach audio'); audio.hidden = true; panel.append(audio);
    const transcript = make('div', undefined, 'transcript'); transcript.id = 'voice-transcript'; transcript.setAttribute('aria-label', 'Conversation transcript'); transcript.append(make('p', 'Your conversation transcript appears here after connecting.', 'small')); panel.append(transcript); return panel;
  }

  function voiceStatus(message) { if ($('voice-status-text')) $('voice-status-text').textContent = message; }
  function updateVoiceControls() {
    if (!$('voice-connect')) return;
    $('voice-connect').disabled = !!live;
    $('voice-end').disabled = !live;
    $('voice-mute').disabled = !live?.connected || live?.feedbackRequested;
    $('voice-mute').textContent = live?.muted ? 'Unmute microphone' : 'Mute microphone';
    $('voice-feedback').disabled = !live?.connected || !live?.userTurns || live?.responseActive || live?.feedbackRequested || live?.activeAnswer;
    if ($('voice-answer')) { $('voice-answer').disabled = !live?.connected || live?.responseActive || live?.feedbackRequested; $('voice-answer').textContent = live?.activeAnswer ? 'Finish my answer' : 'Start my answer'; }
    $('voice-light').classList.toggle('live', !!live?.connected && !live?.muted);
  }

  function stopVoice(message, saveTranscript = true) {
    voiceGeneration++;
    if (live) {
      const previous = live; live = null;
      previous.controller.abort(); clearTimeout(previous.timeout); clearInterval(previous.clock);
      previous.stream?.getTracks().forEach(track => track.stop()); previous.dc?.close(); previous.pc?.close();
      const audio = $('voice-audio'); if (audio) { audio.pause(); audio.srcObject?.getTracks().forEach(track => track.stop()); audio.srcObject = null; audio.hidden = true; }
      if (saveTranscript && previous.userTurns && !previous.savedAssessment) {
        const transcript = [...previous.entries.values()].map(entry => `${entry.role === 'user' ? 'You' : 'Coach'}: ${entry.value}`).join('\n\n').slice(-50000);
        rememberAttempt({ response: transcript, audio: true, selfReview: true }, previous.exercise, 'speaking');
      }
    }
    updateVoiceControls(); if (message) voiceStatus(message);
  }

  function voiceClock() {
    if (!live) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - live.startedAt) / 1000));
    if ($('voice-elapsed')) $('voice-elapsed').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')} / 10:00`;
    if (elapsed >= 600) stopVoice('The 10-minute session has ended. Your microphone is off.');
  }

  function sendVoice(event) { if (live?.dc?.readyState === 'open') live.dc.send(JSON.stringify(event)); }
  function muteVoice() {
    if (!live || live.feedbackRequested) return;
    live.muted = !live.muted; live.stream?.getAudioTracks().forEach(track => { track.enabled = !live.muted; });
    voiceStatus(live.muted ? 'Microphone muted' : 'Connected — speak naturally'); updateVoiceControls();
  }

  function startVoiceAnswer() {
    if (!live?.connected || live.part !== 'part2' || live.responseActive || live.feedbackRequested) return;
    sendVoice({ type: 'input_audio_buffer.clear' });
    live.activeAnswer = true; live.answerStarted = Date.now(); live.muted = false; live.stream.getAudioTracks().forEach(track => { track.enabled = true; });
    clearInterval(timerHandle); timerRemaining = 120; timerDeadline = Date.now() + 120000; timerHandle = setInterval(renderTimer, 500); renderTimer();
    voiceStatus('Your long turn — speak for up to two minutes.'); updateVoiceControls();
  }

  function finishVoiceAnswer() {
    if (!live?.activeAnswer) return;
    if (Date.now() - live.answerStarted < 1000) { toast('Speak your answer before finishing the long turn.'); return; }
    live.activeAnswer = false; live.muted = true; live.stream.getAudioTracks().forEach(track => { track.enabled = false; });
    renderTimer(); timerDeadline = 0; clearInterval(timerHandle); renderTimer();
    sendVoice({ type: 'input_audio_buffer.commit' });
    sendVoice({ type: 'response.create', response: { instructions: 'The learner has finished their Part 2 long turn. Briefly acknowledge it and give one specific useful correction before asking a relevant follow-up question. Do not invent a full band from a short sample.', tool_choice: 'none' } });
    voiceStatus('Answer finished — your coach is responding.'); updateVoiceControls();
  }

  function transcriptEntry(session, role, id, value, append = false) {
    if (!text(value, 30000)) return;
    const key = `${role}:${id}`;
    if (!session.entries.has(key)) {
      if (!session.entries.size) $('voice-transcript').replaceChildren();
      const entry = make('div', undefined, 'transcript-entry'); const content = make('span'); entry.append(make('strong', role === 'user' ? 'You' : 'AI coach'), content);
      $('voice-transcript').append(entry); session.entries.set(key, { role, content, value: '' });
    }
    const entry = session.entries.get(key); entry.value = (append ? entry.value + value : value).slice(0, 30000); entry.content.textContent = entry.value;
    const panel = $('voice-transcript'); panel.scrollTop = panel.scrollHeight;
  }

  function readVoiceEvent(session, event) {
    if (live !== session || !event || typeof event.type !== 'string') return;
    if (event.type === 'response.created') session.responseActive = true;
    if (event.type === 'response.done') {
      session.responseActive = false;
      if (event.response?.status === 'failed') { voiceStatus('The coach could not complete its response. Try again or end the session.'); if (session.feedbackRequested) { session.feedbackRequested = false; session.stream?.getAudioTracks().forEach(track => { track.enabled = !session.muted; }); } }
      if (Array.isArray(event.response?.output)) event.response.output.filter(item => item?.type === 'function_call' && item.name === 'report_assessment').forEach(item => receiveVoiceAssessment(session, item.arguments, item.call_id));
    }
    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      if (text(event.transcript, 30000) && event.transcript.trim()) { const id = event.item_id || String(session.userTurns); transcriptEntry(session, 'user', id, event.transcript); if (!session.userItems.has(id)) { session.userItems.add(id); session.userTurns++; } }
    }
    if (event.type === 'conversation.item.input_audio_transcription.failed') voiceStatus('Transcription failed. You can continue speaking, but wait for a transcript before requesting feedback.');
    if (event.type === 'response.output_audio_transcript.delta') transcriptEntry(session, 'assistant', event.item_id || event.response_id || 'current', event.delta, true);
    if (event.type === 'response.output_audio_transcript.done') transcriptEntry(session, 'assistant', event.item_id || event.response_id || 'current', event.transcript);
    if (event.type === 'response.function_call_arguments.done' && event.name === 'report_assessment') receiveVoiceAssessment(session, event.arguments, event.call_id);
    if (event.type === 'error') {
      const message = text(event.error?.message, 1000) ? event.error.message : 'The voice connection reported an error.';
      voiceStatus(message);
      if (session.feedbackRequested) { session.feedbackRequested = false; session.stream?.getAudioTracks().forEach(track => { track.enabled = !session.muted; }); }
    }
    updateVoiceControls();
  }

  function receiveVoiceAssessment(session, argumentsText, callId) {
    if (live !== session || !text(callId, 512) || !callId || session.assessedCalls.has(callId) || !text(argumentsText, 100000)) return;
    session.assessedCalls.add(callId);
    try {
      const result = cleanAssessment(JSON.parse(argumentsText), 'speaking', session.userTurns > 0);
      const conversation = [...session.entries.values()].map(entry => `${entry.role === 'user' ? 'You' : 'Coach'}: ${entry.value}`).join('\n\n').slice(-50000);
      session.savedAssessment = true; rememberAttempt({ response: conversation, assessment: result, audio: true }, session.exercise, 'speaking'); $('practice-feedback').replaceChildren(assessmentCard(result));
      sendVoice({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify({ saved: true }) } });
      sendVoice({ type: 'response.create', response: { output_modalities: ['audio'], tool_choice: 'none', instructions: 'Briefly explain the feedback you just submitted: give the learner the two most useful corrections and one next practice task. Do not ask another interview question. Remind them that the band is a practice estimate. Speak for no more than 45 seconds.' } });
      session.feedbackRequested = true; session.muted = true; session.stream?.getAudioTracks().forEach(track => { track.enabled = false; });
      voiceStatus('Feedback saved — microphone paused. End the session when finished.');
    } catch {
      sendVoice({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify({ saved: false, error: 'The report did not match the assessment schema.' }) } });
      session.feedbackRequested = false; session.stream?.getAudioTracks().forEach(track => { track.enabled = !session.muted; }); voiceStatus('The feedback report was incomplete. Please request feedback again.');
    }
    updateVoiceControls();
  }

  function requestVoiceFeedback() {
    if (!live?.connected || !live.userTurns || live.responseActive || live.feedbackRequested) return;
    live.feedbackRequested = true; live.stream?.getAudioTracks().forEach(track => { track.enabled = false; });
    voiceStatus('Assessing your spoken answers…');
    sendVoice({ type: 'response.create', response: { output_modalities: ['text'], tool_choice: { type: 'function', name: 'report_assessment' }, instructions: 'Stop the interview and call report_assessment now. Assess only the learner speech you actually heard in this session against the IELTS Speaking public descriptors. Give evidence for Fluency and coherence, Lexical resource, Grammatical range and accuracy, and Pronunciation. If the sample is too short or unclear for a criterion, use null and explain the limitation. Do not invent errors or penalise accent alone. Include specific original words and corrections and exactly three useful next practice tasks. No full-test or four-skill overall prediction.' } });
    updateVoiceControls();
  }

  async function startVoice() {
    if (live) return;
    if (!apiStatus.configured) { $('settings-dialog').showModal(); checkApi(); return; }
    if (apiStatus.requiresAccessCode && !accessCode) { $('settings-dialog').showModal(); $('access-code').focus(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) { voiceStatus('Live speaking needs microphone access in a browser that supports WebRTC over HTTPS. You can use typed practice below.'); return; }
    stopTts();
    const generation = ++voiceGeneration;
    const session = { controller: new AbortController(), entries: new Map(), userItems: new Set(), assessedCalls: new Set(), startedAt: Date.now(), connected: false, muted: exercise.part === 'part2', responseActive: false, userTurns: 0, feedbackRequested: false, part: exercise.part, exercise, activeAnswer: false };
    live = session; updateVoiceControls(); voiceStatus('Requesting microphone permission…');
    session.timeout = setTimeout(() => { if (live === session) stopVoice('Connection timed out. Your microphone is off; please try again.'); }, 30000);
    session.clock = setInterval(voiceClock, 1000);
    try {
      // Request permission before minting a billed session, and stop a late permission result after cancellation.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (generation !== voiceGeneration || live !== session) { stream.getTracks().forEach(track => track.stop()); return; }
      session.stream = stream; if (session.muted) stream.getAudioTracks().forEach(track => { track.enabled = false; }); voiceStatus('Connecting to your AI coach…');
      const token = await api('realtime', { part: exercise.part, prompt: exercise.prompt }, session.controller.signal);
      if (generation !== voiceGeneration || live !== session) return;
      if (!text(token.clientSecret, 1000) || !token.clientSecret || !Number.isFinite(token.expiresAt)) throw new Error('The server returned an invalid voice session.');
      const pc = new RTCPeerConnection(); session.pc = pc;
      const audio = $('voice-audio'); audio.hidden = false;
      pc.addEventListener('track', event => { if (live !== session) { event.track.stop(); return; } audio.srcObject = event.streams[0] || new MediaStream([event.track]); audio.play().catch(() => { if (live !== session) return; session.muted = true; stream.getAudioTracks().forEach(track => { track.enabled = false; }); voiceStatus('Audio needs a tap. Press Play below, then unmute when ready.'); updateVoiceControls(); }); });
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));
      const dc = pc.createDataChannel('oai-events'); session.dc = dc;
      dc.addEventListener('message', event => { try { readVoiceEvent(session, JSON.parse(event.data)); } catch { voiceStatus('An unreadable voice event was ignored.'); } });
      dc.addEventListener('open', () => {
        if (live !== session) return; clearTimeout(session.timeout); session.connected = true; voiceStatus('Connected — your coach will speak first.'); updateVoiceControls();
        sendVoice({ type: 'response.create', response: { instructions: 'Greet the learner briefly and ask the first IELTS speaking practice question for the chosen task. Ask one question at a time. Do not give a band or feedback before hearing their answer.', tool_choice: 'none' } });
      });
      dc.addEventListener('close', () => { if (live === session) stopVoice('Voice connection closed. Your microphone is off.'); });
      pc.addEventListener('connectionstatechange', () => { if (live !== session) return; if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) stopVoice('Voice connection ended. Your microphone is off.'); });
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const response = await fetch('https://api.openai.com/v1/realtime/calls', { method: 'POST', headers: { Authorization: `Bearer ${token.clientSecret}`, 'Content-Type': 'application/sdp' }, body: offer.sdp, signal: session.controller.signal });
      if (generation !== voiceGeneration || live !== session) return;
      if (!response.ok) throw new Error('OpenAI could not start the voice connection. Check your API account’s Realtime access and try again.');
      await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() });
    } catch (error) {
      if (live !== session) return;
      const message = error.name === 'NotAllowedError' ? 'Microphone permission was blocked. Allow it in your browser settings, then try again.' : error.name === 'NotFoundError' ? 'No microphone was found. Connect one or use typed practice.' : error.name === 'AbortError' ? 'The voice connection was cancelled. Your microphone is off.' : error.message;
      stopVoice(message);
    }
  }

  function chooseSkill(name) {
    if (!SKILLS.includes(name)) return;
    skill = name; history.replaceState(null, '', `#${skill}`);
    $('skill-nav').querySelectorAll('button').forEach(button => { if (button.dataset.skill === skill) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
    $('skill-heading').textContent = title(skill); $('skill-kicker').textContent = `${title(skill)} practice`;
    const select = $('exercise-select'); select.replaceChildren();
    CONTENT[skill].forEach(item => { const option = make('option', item.title); option.value = item.id; select.append(option); });
    exercise = CONTENT[skill][0]; renderExercise(); renderStats(); renderHistory();
  }

  $('skill-nav').addEventListener('click', event => { const button = event.target.closest('[data-skill]'); if (button) chooseSkill(button.dataset.skill); });
  $('exercise-select').addEventListener('change', event => { exercise = CONTENT[skill].find(item => item.id === event.target.value); renderExercise(); });
  window.addEventListener('hashchange', () => { const name = location.hash.slice(1); if (SKILLS.includes(name) && name !== skill) chooseSkill(name); });
  document.addEventListener('visibilitychange', () => { renderTimer(); voiceClock(); if (document.hidden) stopTts(); });
  window.addEventListener('pagehide', () => { stopVoice(); stopTts(); request?.abort(); });

  $('theme-toggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
    $('theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#161d2b' : '#f4efe4';
    try { localStorage.setItem('ielts-theme', dark ? 'dark' : 'light'); } catch {}
  });
  $('open-settings').addEventListener('click', () => { $('settings-dialog').showModal(); checkApi(); });
  $('close-settings').addEventListener('click', () => $('settings-dialog').close());
  $('close-history').addEventListener('click', () => $('history-dialog').close());
  $('settings-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const value = $('api-base').value.trim(); let candidateBase = '';
      if (value) {
        const url = new URL(value);
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
        if (!(url.protocol === 'https:' || (url.protocol === 'http:' && local)) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use the HTTPS origin of your coach server, for example https://coach.example.com. Do not include /api or a key.');
        candidateBase = url.origin;
      }
      const candidateCode = $('access-code').value.trim();
      if (/^sk-/.test(candidateCode)) throw new Error('Enter your coach access code here, not your OpenAI API key. Keep the API key on the server.');
      apiBase = candidateBase; accessCode = candidateCode;
      stopVoice('Settings changed. Your microphone is off.'); request?.abort();
      try { localStorage.setItem(API_STORE, apiBase); } catch {}
      checkApi();
    } catch (error) { $('settings-status').textContent = error.message; }
  });

  $('export-skills').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const link = make('a'); link.href = url; link.download = `ielts-skills-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Skills Studio backup exported.');
  });
  $('import-skills').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    try {
      if (file.size > 5000000) throw new Error('This backup is too large. Choose a Skills Studio backup under 5 MB.');
      const imported = cleanBackup(JSON.parse(await file.text()));
      if (!confirm('Replace Skills Studio drafts and history with this backup? Your Mock Test and Practice Gym progress stay unchanged.')) return;
      if (!save(imported)) throw new Error('The browser could not save the imported backup.');
      stopVoice(undefined, false); state = imported; renderExercise(); renderHistory(); renderStats(); toast('Backup imported.');
    } catch (error) { toast(error instanceof SyntaxError ? 'Import failed: this file is not valid JSON. Your current progress is unchanged.' : `${error.message} Current progress is unchanged.`); }
  });

  let registration;
  async function prepareOffline() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      const offer = () => { $('app-update').hidden = !(registration.waiting && navigator.serviceWorker.controller); };
      offer(); registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', offer); });
      await navigator.serviceWorker.ready;
      const reflect = () => { $('offline-status').textContent = navigator.onLine ? 'Text practice ready offline · AI needs a connection' : 'Offline · Reading and saved text exercises are ready'; };
      reflect(); window.addEventListener('online', reflect); window.addEventListener('offline', reflect);
      let reloading = false;
      $('app-update').addEventListener('click', () => { if (!registration.waiting || !confirm('Load the updated app now? Your saved progress stays intact. Running timers and voice sessions will stop.')) return; stopVoice(); reloading = true; registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' }); });
      navigator.serviceWorker.addEventListener('controllerchange', () => { reflect(); offer(); if (reloading) location.reload(); });
    } catch { $('offline-status').textContent = 'Offline download unavailable · keep a progress backup'; }
  }

  if (!CONTENT || !SKILLS.every(name => Array.isArray(CONTENT[name]) && CONTENT[name].length)) { $('exercise-body').append(make('p', 'Practice content could not be loaded. Reconnect and refresh the page.', 'notice error')); return; }
  let saved;
  try {
    saved = localStorage.getItem(STORE); if (saved) state = cleanBackup(JSON.parse(saved));
  } catch {
    if (saved) {
      try { localStorage.setItem(`ielts-skills-recovery-${Date.now()}`, saved); toast('Saved data could not be read. A recovery copy was kept in this browser; import a valid backup to restore your work.'); }
      catch { storageLocked = true; toast('Saved data could not be read and was left untouched. Saving is paused to preserve it; export any new work before leaving.'); }
    } else { storageLocked = true; toast('Browser storage is unavailable. Export a backup before leaving.'); }
  }
  try {
    const savedBase = localStorage.getItem(API_STORE);
    if (savedBase) { const url = new URL(savedBase); if (url.origin === savedBase && (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) apiBase = savedBase; }
  } catch { /* A malformed saved server address never changes saved practice data. */ }
  $('api-base').value = apiBase; chooseSkill(skill); checkApi(); prepareOffline();
})();
