(() => {
  'use strict';

  const app = document.getElementById('app');
  const ICONS = {
    'Java': '☕', 'DSA': '🌳', 'DBMS': '🗄️',
    'Operating Systems': '⚙️', 'Data Science & ML': '📊', 'All': '🎯'
  };
  const state = {
    name: localStorage.getItem('qn_name') || '',
    count: Number(localStorage.getItem('qn_count')) || 10,
    cats: [],
    quiz: null,
    result: null,
    timer: null
  };

  /* ---------- helpers ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const topicName = c => (c === 'All' ? 'Mixed topics' : c);
  const $ = (s, r = document) => r.querySelector(s);

  async function api(path, opts) {
    const res = await fetch(path, opts);
    if (!res.ok) {
      let msg = 'Something went wrong. Please try again.';
      try { msg = (await res.json()).message || msg; } catch (_) { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  const go = v => { location.hash = v; };

  /* ---------- router ---------- */
  function route() {
    clearInterval(state.timer);
    const v = (location.hash || '#home').slice(1);
    const view = ['home', 'quiz', 'result', 'board', 'add'].includes(v) ? v : 'home';
    if (view === 'quiz' && !state.quiz) return go('home');
    if (view === 'result' && !state.result) return go('home');
    const navKey = (view === 'quiz' || view === 'result') ? 'home' : view;
    document.querySelectorAll('[data-nav]').forEach(a =>
      a.classList.toggle('active', a.dataset.nav === navKey));
    window.scrollTo(0, 0);
    ({ home: renderHome, quiz: renderQuiz, result: renderResult, board: renderBoard, add: renderAdd })[view]();
  }
  window.addEventListener('hashchange', route);

  /* ---------- home ---------- */
  async function renderHome() {
    app.innerHTML = `
      <section class="hero">
        <h1>Test yourself. Learn from every answer.</h1>
        <p>Pick a topic, answer a few questions, and see a short explanation for each one at the end.</p>
      </section>
      <section class="card setup">
        <div class="field" id="nameField">
          <label for="name">Your name</label>
          <input id="name" maxlength="30" placeholder="For example, Sami" value="${esc(state.name)}" autocomplete="given-name">
          <div class="hint" id="nameHint"></div>
        </div>
        <div class="field">
          <span id="countLabel">Number of questions</span>
          <div class="seg" id="count" role="group" aria-labelledby="countLabel">
            ${[5, 10, 15].map(n => `<button type="button" data-n="${n}" class="${n === state.count ? 'on' : ''}" aria-pressed="${n === state.count}">${n}</button>`).join('')}
          </div>
        </div>
      </section>
      <h2 class="section-title">Choose a topic</h2>
      <div id="cats" class="grid"><p class="muted">Loading topics…</p></div>`;

    $('#count').addEventListener('click', e => {
      const b = e.target.closest('button[data-n]');
      if (!b) return;
      state.count = Number(b.dataset.n);
      localStorage.setItem('qn_count', state.count);
      document.querySelectorAll('#count button').forEach(x => {
        const on = x === b;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', on);
      });
    });
    $('#name').addEventListener('input', () => {
      $('#nameField').classList.remove('error');
      $('#nameHint').textContent = '';
    });

    try {
      state.cats = await api('/api/categories');
      const total = state.cats.reduce((s, c) => s + c.count, 0);
      const cards = [{ name: 'All', count: total, mixed: true }, ...state.cats];
      $('#cats').innerHTML = cards.map(c => `
        <button type="button" class="topic ${c.mixed ? 'mixed' : ''}" data-cat="${esc(c.name)}">
          <span class="ico" aria-hidden="true">${ICONS[c.name] || '📘'}</span>
          <span><strong>${esc(topicName(c.name))}</strong><small>${c.count} questions</small></span>
        </button>`).join('');
      $('#cats').addEventListener('click', e => {
        const b = e.target.closest('[data-cat]');
        if (b) begin(b.dataset.cat);
      });
    } catch (err) {
      $('#cats').innerHTML = `
        <div class="card empty" style="grid-column:1/-1">
          <strong>Can't load topics</strong>
          <p>Check that the app is running, then try again.</p>
          <button class="btn primary" id="retry">Try again</button>
        </div>`;
      $('#retry').addEventListener('click', renderHome);
    }
  }

  async function begin(category) {
    const input = $('#name');
    if (input) {
      const name = input.value.trim();
      if (!name) {
        $('#nameField').classList.add('error');
        $('#nameHint').textContent = 'Enter your name to start.';
        input.focus();
        return;
      }
      state.name = name;
      localStorage.setItem('qn_name', name);
    }
    try {
      const questions = await api(`/api/quiz?category=${encodeURIComponent(category)}&count=${state.count}`);
      state.quiz = { category, questions, index: 0, answers: {}, start: Date.now() };
      state.result = null;
      go('quiz');
    } catch (err) {
      toast(err.message);
    }
  }

  /* ---------- quiz ---------- */
  function renderQuiz() {
    const z = state.quiz;
    const total = z.questions.length;
    const q = z.questions[z.index];
    const chosen = z.answers[q.id];
    const last = z.index === total - 1;

    app.innerHTML = `
      <div class="quizbar">
        <div class="meta">
          <span>${esc(topicName(z.category))}</span>
          <span class="timer" id="timer" aria-label="Time elapsed">0:00</span>
        </div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${z.index + 1}">
          <i style="width:${((z.index + 1) / total) * 100}%"></i>
        </div>
      </div>
      <article class="card question">
        <p class="count">Question ${z.index + 1} of ${total}</p>
        <h2 id="qtext">${esc(q.text)}</h2>
        <div class="options" role="radiogroup" aria-labelledby="qtext">
          ${q.options.map((o, i) => `
            <button type="button" role="radio" aria-checked="${chosen === i}" class="opt ${chosen === i ? 'sel' : ''}" data-i="${i}">
              <b>${'ABCD'[i]}</b><span>${esc(o)}</span>
            </button>`).join('')}
        </div>
      </article>
      <div class="actions">
        <button class="btn ghost" id="back" ${z.index === 0 ? 'disabled' : ''}>Back</button>
        <button class="btn primary" id="next">${last ? 'Finish quiz' : 'Next'}</button>
      </div>`;

    const tick = () => { const t = $('#timer'); if (t) t.textContent = fmt(Math.round((Date.now() - z.start) / 1000)); };
    tick();
    state.timer = setInterval(tick, 1000);

    $('.options').addEventListener('click', e => {
      const b = e.target.closest('.opt');
      if (b) choose(Number(b.dataset.i));
    });
    $('#back').addEventListener('click', back);
    $('#next').addEventListener('click', next);
  }

  function choose(i) {
    const z = state.quiz;
    const q = z.questions[z.index];
    if (i >= q.options.length) return;
    z.answers[q.id] = i;
    document.querySelectorAll('.opt').forEach((b, idx) => {
      b.classList.toggle('sel', idx === i);
      b.setAttribute('aria-checked', idx === i);
    });
  }

  function back() {
    if (state.quiz.index > 0) { state.quiz.index--; renderQuiz(); }
  }

  function next() {
    const z = state.quiz;
    if (z.index < z.questions.length - 1) { z.index++; renderQuiz(); window.scrollTo(0, 0); }
    else finish();
  }

  async function finish() {
    const z = state.quiz;
    const unanswered = z.questions.filter(q => z.answers[q.id] === undefined).length;
    if (unanswered && !confirm(`${unanswered} question${unanswered > 1 ? 's are' : ' is'} unanswered. Finish anyway?`)) return;

    const answers = {};
    z.questions.forEach(q => { answers[q.id] = z.answers[q.id] ?? -1; });
    const seconds = Math.round((Date.now() - z.start) / 1000);
    const btn = $('#next');
    if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }
    try {
      const res = await api('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: state.name, category: z.category, answers, seconds })
      });
      state.result = { ...res, seconds, category: z.category, questions: z.questions };
      go('result');
    } catch (err) {
      toast(err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'Finish quiz'; }
    }
  }

  document.addEventListener('keydown', e => {
    if ((location.hash || '') !== '#quiz' || !state.quiz) return;
    if (/^[1-4]$/.test(e.key)) choose(Number(e.key) - 1);
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') back();
    else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) next();
  });

  /* ---------- result ---------- */
  function renderResult() {
    const r = state.result;
    const pct = r.percent;
    const msg = pct >= 80 ? 'Excellent work!'
      : pct >= 60 ? 'Good job. Keep going.'
      : pct >= 40 ? 'Getting there. Review the answers below.'
      : 'Keep practicing. Every attempt helps.';
    const C = 2 * Math.PI * 54;

    app.innerHTML = `
      <section class="card resultcard">
        <div class="ring" role="img" aria-label="Score ${pct} percent">
          <svg viewBox="0 0 120 120">
            <circle class="bg" cx="60" cy="60" r="54"/>
            <circle class="fg" cx="60" cy="60" r="54" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}" transform="rotate(-90 60 60)"/>
          </svg>
          <div class="num"><strong>${pct}%</strong><span>${r.score} of ${r.total}</span></div>
        </div>
        <h1>${msg}</h1>
        <p class="muted">${esc(topicName(r.category))}. Finished in ${fmt(r.seconds)}.</p>
        <div class="btns">
          <button class="btn primary" id="again">Play again</button>
          <button class="btn ghost" id="topics">Choose another topic</button>
          <button class="btn ghost" id="lb">See leaderboard</button>
        </div>
      </section>
      <div class="review-head">
        <h2>Review your answers</h2>
        <label class="toggle"><input type="checkbox" id="wrongOnly"> Show only mistakes</label>
      </div>
      <div id="review"></div>`;

    const drawReview = () => {
      const only = $('#wrongOnly').checked;
      const items = r.questions.map((q, n) => ({ q, n, v: r.review.find(x => x.id === q.id) }))
        .filter(x => x.v && (!only || !x.v.correct));
      $('#review').innerHTML = items.length ? items.map(({ q, n, v }) => `
        <article class="card rev">
          <span class="badge ${v.correct ? 'ok' : v.chosenIndex < 0 ? 'skip' : 'bad'}">
            ${v.correct ? 'Correct' : v.chosenIndex < 0 ? 'Skipped' : 'Incorrect'}
          </span>
          <h3>${n + 1}. ${esc(q.text)}</h3>
          ${q.options.map((o, i) => {
            const right = i === v.correctIndex;
            const wrong = i === v.chosenIndex && !right;
            return `<div class="ans ${right ? 'right' : wrong ? 'wrong' : ''}">
              <span>${'ABCD'[i]}. ${esc(o)}</span>
              ${right ? '<em>Correct answer</em>' : wrong ? '<em>Your answer</em>' : ''}
            </div>`;
          }).join('')}
          ${v.explanation ? `<p class="why"><b>Why:</b> ${esc(v.explanation)}</p>` : ''}
        </article>`).join('')
        : `<div class="card empty"><strong>No mistakes to show</strong><p>You answered everything correctly.</p></div>`;
    };
    drawReview();
    $('#wrongOnly').addEventListener('change', drawReview);
    $('#again').addEventListener('click', () => begin(r.category));
    $('#topics').addEventListener('click', () => go('home'));
    $('#lb').addEventListener('click', () => go('board'));
  }

  /* ---------- leaderboard ---------- */
  async function renderBoard() {
    if (!state.cats.length) { try { state.cats = await api('/api/categories'); } catch (_) { /* ignore */ } }
    app.innerHTML = `
      <div class="board-top">
        <h1>Leaderboard</h1>
        <div class="field">
          <label for="bcat">Topic</label>
          <select id="bcat">
            <option value="All">All topics</option>
            ${state.cats.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="rows" class="rows"><p class="muted">Loading scores…</p></div>`;
    const load = async () => {
      try {
        const rows = await api(`/api/leaderboard?category=${encodeURIComponent($('#bcat').value)}`);
        $('#rows').innerHTML = rows.length ? rows.map((r, i) => `
          <div class="row">
            <span class="rank ${i === 0 ? 'r1' : ''}">${i + 1}</span>
            <div class="who"><strong>${esc(r.playerName)}</strong><small>${esc(topicName(r.category))}</small></div>
            <div class="sc">${r.percent}%<small>${r.score}/${r.total}, ${fmt(r.seconds)}</small></div>
          </div>`).join('')
          : `<div class="card empty"><strong>No scores yet</strong><p>Take a quiz to be the first on the board.</p><button class="btn primary" id="first">Start a quiz</button></div>`;
        const f = $('#first'); if (f) f.addEventListener('click', () => go('home'));
      } catch (err) {
        $('#rows').innerHTML = `<div class="card empty"><strong>Can't load scores</strong><p>${esc(err.message)}</p></div>`;
      }
    };
    $('#bcat').addEventListener('change', load);
    load();
  }

  /* ---------- add question ---------- */
  async function renderAdd() {
    if (!state.cats.length) { try { state.cats = await api('/api/categories'); } catch (_) { /* ignore */ } }
    app.innerHTML = `
      <form class="form card" id="qform" novalidate>
        <h1>Add a question</h1>
        <p class="muted">Teachers and admins can grow the question bank here. Ask the app owner for the admin key.</p>
        <div class="two">
          <div class="field"><label for="akey">Admin key</label>
            <input id="akey" type="password" autocomplete="off" value="${esc(sessionStorage.getItem('qn_key') || '')}"></div>
          <div class="field"><label for="acat">Topic</label>
            <input id="acat" list="catlist" placeholder="Pick or type a new topic" maxlength="40">
            <datalist id="catlist">${state.cats.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist></div>
        </div>
        <div class="field"><label for="atext">Question</label><textarea id="atext" maxlength="500"></textarea></div>
        <div class="two">
          ${'ABCD'.split('').map((l, i) => `
            <div class="field"><label for="o${i}">Option ${l}${i > 1 ? ' (optional)' : ''}</label><input id="o${i}" maxlength="200"></div>`).join('')}
        </div>
        <div class="two">
          <div class="field"><label for="acorrect">Correct option</label>
            <select id="acorrect"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></div>
          <div class="field"><label for="awhy">Explanation (optional)</label><input id="awhy" maxlength="500"></div>
        </div>
        <div><button class="btn primary" type="submit">Save question</button></div>
      </form>`;

    $('#qform').addEventListener('submit', async e => {
      e.preventDefault();
      const key = $('#akey').value;
      sessionStorage.setItem('qn_key', key);
      const body = {
        category: $('#acat').value,
        text: $('#atext').value,
        options: [0, 1, 2, 3].map(i => $('#o' + i).value),
        correctIndex: Number($('#acorrect').value),
        explanation: $('#awhy').value
      };
      // Options keep their position only if the empty ones are at the end.
      const filled = body.options.filter(o => o.trim());
      if (filled.length < body.options.filter((_, i) => i < filled.length).length || body.options.slice(0, filled.length).some(o => !o.trim())) {
        return toast('Fill the options in order: A, then B, then C, then D.');
      }
      try {
        await api('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
          body: JSON.stringify(body)
        });
        toast('Question saved');
        state.cats = [];
        ['atext', 'o0', 'o1', 'o2', 'o3', 'awhy'].forEach(id => { $('#' + id).value = ''; });
        $('#acorrect').value = '0';
      } catch (err) {
        toast(err.message);
      }
    });
  }

  route();
})();
