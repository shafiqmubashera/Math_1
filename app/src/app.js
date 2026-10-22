/* Screens: units, set player (with tools and timer), results with review, progress (and parent view). */
(function (G) {
  const M1 = G.M1;
  const E = M1.engine, R = M1.math.render, esc = M1.math.escapeHtml;
  const $ = (sel, root = document) => root.querySelector(sel);
  const LEVEL_LABEL = { basic: "Basic", intermediate: "Intermediate", hard: "Hard", challenge: "Challenge" };
  const TYPE_LABEL = { mcq: "Multiple choice", "graph-mcq": "Read the graph", multi: "Select all that apply", numeric: "Type your answer", plot: "Plot points" };
  const LETTERS = "ABCDEFGH";

  let store, main, view = "home", timer = null, tick = 0, toolsApi = {}, confirmArmed = false, viewing = null;

  // ───────────── helpers ─────────────
  const units = () => M1.curriculum.units;
  const unit = (id) => E.unitInfo(id);
  const skillName = (uid, sid) => (unit(uid).skills.find((s) => s.id === sid) || {}).name || sid;
  function dur(sec) {
    sec = Math.round(sec || 0);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h} h ${m} min` : m ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
  }
  const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const dateStr = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ", " + new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  function save() { store.saveMain(main); }
  function unitState(uid) { return main.units[uid] || (main.units[uid] = E.newUnitState(uid)); }
  function answered(cur, i) {
    const a = cur.answers[i], q = cur.set.questions[i];
    if (q.type === "multi" || q.type === "plot") return Array.isArray(a) && a.length > 0;
    if (q.type === "numeric") return a != null && String(a).trim() !== "" && Number.isFinite(M1.qlib.parseNum(a));
    return a != null;
  }

  function setView(v) {
    view = v; confirmArmed = false;
    document.body.dataset.view = v;
    render();
    window.scrollTo(0, 0);
  }

  // ───────────── shell ─────────────
  function render() {
    const root = $("#app");
    if (view === "set") return renderSet(root);
    if (view === "results") return renderResults(root);
    if (view === "progress") return renderProgress(root);
    return renderHome(root);
  }

  function header(active) {
    const modeText = store.mode === "account" ? "Progress saves to your account" : "Progress saves in this browser only";
    return `
      <header class="top">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 26 L12 18 L18 22 L28 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="18" r="2.6" fill="currentColor"/><circle cx="18" cy="22" r="2.6" fill="currentColor"/><circle cx="28" cy="8" r="2.6" fill="currentColor"/></svg></div>
          <div><div class="brand-name">Math 1 Practice</div><div class="brand-sub">NC Math 1 · WCPSS units · Grade 8</div></div>
        </div>
        <nav class="tabs" aria-label="Sections">
          <button type="button" class="tab${active === "home" ? " on" : ""}" data-go="home">Units</button>
          <button type="button" class="tab${active === "progress" ? " on" : ""}" data-go="progress">Progress</button>
        </nav>
        <div class="save-chip ${store.mode}" title="${modeText}">${modeText}</div>
      </header>`;
  }

  // ───────────── Home ─────────────
  function renderHome(root) {
    const cur = main.current;
    const resume = cur ? (() => {
      const done = cur.set.questions.filter((_, i) => answered(cur, i)).length;
      return `<section class="resume">
        <div><div class="eyebrow">Set in progress</div>
        <div class="resume-title">Unit ${unit(cur.set.unitId).order}: ${esc(unit(cur.set.unitId).title)} · Set ${cur.set.setNumber}</div>
        <div class="muted">${done} of ${cur.set.questions.length} answered · ${dur(cur.activeSec)} so far</div></div>
        <button type="button" class="btn primary" data-act="resume">Continue set</button>
      </section>`;
    })() : "";

    const cards = units().slice().sort((a, b) => a.order - b.order).map((u) => {
      const live = u.status === "live" && M1.units[u.id];
      const st = main.units[u.id];
      const hist = main.history.filter((h) => h.unitId === u.id);
      const last = hist[hist.length - 1];
      const achieved = st ? Object.values(st.skills).filter((s) => s.achieved).length : 0;
      const meter = live ? `<div class="skill-meter" aria-label="${achieved} of ${u.skills.length} skills achieved">${u.skills.map((s) => {
        const ss = st && st.skills[s.id];
        const cls = !ss || !st.sets ? "" : ss.achieved ? "ach" : ["t0", "t1", "t2"][ss.focus];
        return `<span class="sm ${cls}" title="${esc(s.name)}"></span>`;
      }).join("")}</div>` : "";
      // Skill checklist: shown by designs that style it (the desk design), hidden by the base styles.
      const checklist = live ? `<ul class="skill-list">${u.skills.map((s) => {
        const ss = st && st.skills[s.id];
        const state = !ss || !st.sets ? "todo" : ss.achieved ? "done" : "going";
        const note = state === "done" ? "got it" : state === "going" ? `working at ${E.TIER_NAMES[ss.focus]}` : "";
        return `<li class="sk ${state}"><span class="sk-box" aria-hidden="true">${state === "done" ? "✓" : state === "going" ? "•" : ""}</span><span class="sk-name">${esc(s.name)}</span><span class="sk-note">${note}</span></li>`;
      }).join("")}</ul>` : "";
      let action = "";
      if (live) {
        if (cur && cur.set.unitId === u.id) action = `<button type="button" class="btn" data-act="resume">Continue set</button>`;
        else if (st && st.mastered) action = `<button type="button" class="btn primary" data-act="restart" data-unit="${u.id}">Restart with fresh questions</button>
          <button type="button" class="btn quiet" data-act="start" data-unit="${u.id}">Keep practising</button>`;
        else action = `<button type="button" class="btn primary" data-act="start" data-unit="${u.id}" ${cur ? "disabled title=\"Finish the set in progress first\"" : ""}>${!st || !st.sets ? "Start first set" : `Start set ${st.sets + 1}`}</button>`;
      }
      return `<article class="unit-card${live ? "" : " planned"}${st && st.mastered ? " mastered" : ""}">
        <div class="unit-head"><span class="unit-num">Unit ${u.order}</span>${st && st.mastered ? `<span class="pill ach">Mastered</span>` : live ? "" : `<span class="pill">Coming next</span>`}</div>
        <h3>${esc(u.title)}</h3>
        <div class="unit-meta">${u.lessons.length} lessons · ${u.skills.length} skills${u.order !== u.book ? ` · Book unit ${u.book}` : ""}</div>
        ${meter}${checklist}
        ${live ? `<div class="unit-stats">${st && st.sets ? `${achieved}/${u.skills.length} skills achieved · last set ${last ? last.percent + "%" : "—"}` : "First set is a 25-question check of where you are."}</div>` : ""}
        <div class="unit-actions">${action}</div>
      </article>`;
    }).join("");

    root.innerHTML = `${header("home")}
      <main class="page">
        ${resume}
        <section class="intro">
          <h1>Pick a unit</h1>
          <p>Each set has 25 questions. Answer all of them, then submit to see your score, your time, and a worked solution for every question. The next set is built around what you missed.</p>
        </section>
        <section class="unit-grid">${cards}</section>
        ${historyTable(main.history.slice(-8).reverse(), "Recent sets")}
      </main>`;
  }

  function historyTable(rows, title, studentId) {
    if (!rows.length) return `<section class="panel"><h2>${title}</h2><p class="muted">No sets finished yet.</p></section>`;
    return `<section class="panel"><h2>${title}</h2><div class="table-wrap"><table class="hist">
      <thead><tr><th>Date</th><th>Unit</th><th>Set</th><th class="num">Score</th><th class="num">Time</th><th class="num">Per question</th><th></th></tr></thead>
      <tbody>${rows.map((h) => `<tr>
        <td>${dateStr(h.date)}</td><td>Unit ${unit(h.unitId).order}</td>
        <td>${h.setNumber}${h.diagnostic ? ' <span class="pill sm">first check</span>' : ""}${h.round > 1 ? ` <span class="pill sm">round ${h.round}</span>` : ""}</td>
        <td class="num"><span class="score s${h.percent >= 80 ? "hi" : h.percent >= 60 ? "mid" : "lo"}">${h.right}/${h.total}</span> ${h.percent}%</td>
        <td class="num">${dur(h.activeSec)}</td><td class="num">${dur(h.activeSec / h.total)}</td>
        <td><button type="button" class="btn-link" data-act="review" data-set="${h.id}" ${studentId ? `data-student="${studentId}"` : ""}>Review</button></td></tr>`).join("")}</tbody>
    </table></div></section>`;
  }

  // ───────────── Starting a set ─────────────
  async function startSet(uid) {
    if (main.current) return setView("set");
    const st = unitState(uid);
    const seen = await store.loadSeen(uid);
    const set = E.buildSet(uid, st, seen, (Date.now() % 2e9) ^ ((Math.random() * 1e9) | 0));
    store.saveSeen(uid, seen.concat(set.questions.map((q) => q.fp)));
    main.current = { set, answers: set.questions.map(() => null), qTimes: set.questions.map(() => 0), hints: set.questions.map(() => false), idx: 0, startedAt: new Date().toISOString(), activeSec: 0 };
    save();
    setView("set");
  }

  // ───────────── Set player ─────────────
  function renderSet(root) {
    const cur = main.current;
    if (!cur) return setView("home");
    const u = unit(cur.set.unitId);
    root.innerHTML = `
      <header class="set-bar">
        <button type="button" class="btn quiet" data-act="exit" aria-label="Save and go back to units">← Units</button>
        <div class="set-title"><span class="muted">Unit ${u.order}: ${esc(u.title)}</span><strong>Set ${cur.set.setNumber}${cur.set.diagnostic ? " · first check" : ""}</strong></div>
        <div class="timer" aria-label="Time on this set"><span class="timer-dot"></span><span id="timer">${clock(cur.activeSec)}</span></div>
      </header>
      <nav class="dots" aria-label="Questions">${cur.set.questions.map((q, i) => `<button type="button" class="dot" data-q="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join("")}</nav>
      <div class="player">
        <section class="qcard" id="qcard" aria-live="polite"></section>
        <aside class="tools" aria-label="Tools">
          <div class="tool-tabs" role="tablist">
            <button type="button" role="tab" class="ttab on" data-tool="graph">Graph</button>
            <button type="button" role="tab" class="ttab" data-tool="draw">Draw</button>
            <button type="button" role="tab" class="ttab" data-tool="calc">Calculator</button>
          </div>
          <div class="tool-pane" data-pane="graph"></div>
          <div class="tool-pane" data-pane="draw" hidden></div>
          <div class="tool-pane" data-pane="calc" hidden></div>
        </aside>
      </div>
      <footer class="set-foot">
        <button type="button" class="btn" data-act="prev">Previous</button>
        <div class="foot-mid" id="foot-mid"></div>
        <button type="button" class="btn" data-act="next">Next</button>
        <button type="button" class="btn primary" data-act="submit" id="submit-btn">Submit set</button>
      </footer>`;
    M1.tools.ScratchGraph($('[data-pane="graph"]'));
    toolsApi.draw = M1.tools.DrawPad($('[data-pane="draw"]'));
    toolsApi.calc = M1.tools.Calculator($('[data-pane="calc"]'));
    showQuestion(cur.idx);
    startTimer();
  }

  function showQuestion(i) {
    const cur = main.current;
    cur.idx = Math.max(0, Math.min(cur.set.questions.length - 1, i));
    const q = cur.set.questions[cur.idx];
    const a = cur.answers[cur.idx];
    const card = $("#qcard");
    let input = "";
    if (q.type === "mcq" || q.type === "graph-mcq") {
      input = `<div class="choices" role="radiogroup">${q.choices.map((c, k) => `
        <button type="button" role="radio" aria-checked="${a === k}" class="choice${a === k ? " on" : ""}" data-choice="${k}">
          <span class="letter">${LETTERS[k]}</span><span class="ctext">${R(c)}</span></button>`).join("")}</div>`;
    } else if (q.type === "multi") {
      const sel = a || [];
      input = `<div class="choices multi">${q.choices.map((c, k) => `
        <button type="button" role="checkbox" aria-checked="${sel.includes(k)}" class="choice${sel.includes(k) ? " on" : ""}" data-multi="${k}">
          <span class="box" aria-hidden="true"></span><span class="ctext">${R(c)}</span></button>`).join("")}</div>`;
    } else if (q.type === "numeric") {
      input = `<label class="num-entry"><span>Your answer</span>
        <input id="num-answer" type="text" inputmode="text" autocomplete="off" value="${esc(a == null ? "" : a)}" placeholder="e.g. 42, -3, 3/4, 2.5">
        </label><div class="num-help" id="num-help">Type a number. Fractions like 3/4 are fine.</div>`;
    } else if (q.type === "plot") {
      input = `<div class="plot-wrap"><div id="plot-host"></div>
        <div class="tool-row"><span class="muted" id="plot-count"></span><button type="button" class="btn-quiet" data-act="plot-clear">Clear points</button></div></div>`;
    }
    card.innerHTML = `
      <div class="qmeta">
        <span class="qnum">Question ${cur.idx + 1} of ${cur.set.questions.length}</span>
        <span class="pill lvl-${q.level}">${LEVEL_LABEL[q.level]}</span>
        <span class="pill ${q.calc ? "calc-ok" : "calc-no"}">${q.calc ? "Calculator allowed" : "No calculator"}</span>
      </div>
      <div class="qskill">${esc(skillName(cur.set.unitId, q.skill))} · ${TYPE_LABEL[q.type]}</div>
      <div class="prompt">${R(q.prompt)}</div>
      ${q.table ? tableHtml(q.table) : ""}
      ${q.graph ? `<div class="qgraph" id="qgraph"></div>${q.graph.points2 ? `<div class="legend"><span class="lg-c"></span> Sequence A <span class="lg-s"></span> Sequence B</div>` : ""}` : ""}
      ${input}
      <div class="hint-row">${cur.hints[cur.idx] ? `<div class="hint"><strong>Hint:</strong> ${R(q.hint)}</div>` : `<button type="button" class="btn-link" data-act="hint">Show a hint</button>`}</div>`;

    if (q.graph) M1.tools.GraphGrid($("#qgraph"), { window: q.graph.window, points: q.graph.points, points2: q.graph.points2 });
    if (q.type === "plot") {
      const upd = (pts) => { $("#plot-count").textContent = `${pts.length} point${pts.length === 1 ? "" : "s"} placed`; };
      const grid = M1.tools.GraphGrid($("#plot-host"), { window: q.plot.window, points: a || [], interactive: true,
        onChange: (pts) => { cur.answers[cur.idx] = pts; upd(pts); afterAnswer(); } });
      upd(a || []);
      $('[data-act="plot-clear"]').onclick = () => grid.clear();
    }
    if (q.type === "numeric") {
      const inp = $("#num-answer");
      inp.addEventListener("input", () => {
        cur.answers[cur.idx] = inp.value;
        const ok = inp.value.trim() === "" || Number.isFinite(M1.qlib.parseNum(inp.value));
        $("#num-help").textContent = ok ? "Type a number. Fractions like 3/4 are fine." : "That isn't a number yet. Use digits, a minus sign, a decimal point, or a fraction like 3/4.";
        $("#num-help").classList.toggle("warn", !ok);
        afterAnswer(true);
      });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") showQuestion(cur.idx + 1); });
    }
    toolsApi.calc && toolsApi.calc.setAllowed(!!q.calc);
    updateNav();
  }

  function tableHtml(t) {
    return `<div class="table-wrap"><table class="qtable"><thead><tr>${t.headers.map((h) => `<th>${R(h)}</th>`).join("")}</tr></thead>
      <tbody>${t.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th>${R(c)}</th>` : `<td>${R(c)}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function afterAnswer(quiet) {
    confirmArmed = false;
    updateNav();
    if (!quiet) save();
    else { clearTimeout(afterAnswer.t); afterAnswer.t = setTimeout(save, 800); }
  }

  function updateNav() {
    const cur = main.current; if (!cur) return;
    document.querySelectorAll(".dot").forEach((d) => {
      const i = Number(d.dataset.q);
      d.classList.toggle("done", answered(cur, i));
      d.classList.toggle("here", i === cur.idx);
      d.setAttribute("aria-current", i === cur.idx ? "step" : "false");
    });
    const left = cur.set.questions.filter((_, i) => !answered(cur, i)).length;
    const btn = $("#submit-btn");
    btn.disabled = left > 0;
    btn.textContent = confirmArmed ? "Tap again to submit" : "Submit set";
    $("#foot-mid").textContent = left ? `${left} question${left === 1 ? "" : "s"} left to answer` : "All answered. You can still change answers.";
    $('[data-act="prev"]').disabled = cur.idx === 0;
    $('[data-act="next"]').disabled = cur.idx === cur.set.questions.length - 1;
  }

  // Active time: counts only while the set is on screen and the tab is visible.
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      const cur = main.current;
      if (view !== "set" || !cur || document.visibilityState !== "visible") return;
      cur.activeSec++; cur.qTimes[cur.idx]++;
      const t = $("#timer"); if (t) t.textContent = clock(cur.activeSec);
      if (++tick % 15 === 0) save();
    }, 1000);
  }

  function submit() {
    const cur = main.current;
    const set = cur.set;
    const grade = E.gradeSet(set, cur.answers);
    const prev = unitState(set.unitId);
    const { state, events } = E.updateState(prev, set, grade);
    main.units[set.unitId] = state;
    const finishedAt = new Date().toISOString();
    const summary = { id: set.id, unitId: set.unitId, round: set.round, setNumber: set.setNumber, diagnostic: set.diagnostic,
      date: finishedAt, startedAt: cur.startedAt, right: grade.right, total: grade.total, percent: grade.percent,
      activeSec: cur.activeSec, wallSec: Math.round((Date.parse(finishedAt) - Date.parse(cur.startedAt)) / 1000),
      hintsUsed: cur.hints.filter(Boolean).length, events: events.map((e) => e.text),
      bySkill: Object.fromEntries(Object.entries(grade.bySkill).map(([k, v]) => [k, [v.right, v.total]])) };
    main.history.push(summary);
    const rec = Object.assign({}, summary, { questions: set.questions, answers: cur.answers, results: grade.results, qTimes: cur.qTimes, hints: cur.hints });
    store.saveSet(rec);
    main.current = null;
    main.lastResult = { id: set.id };
    save();
    clearInterval(timer);
    viewing = { rec, events, fresh: true };
    setView("results");
  }

  // ───────────── Results / review ─────────────
  function answerText(q, a) {
    if (a == null || (Array.isArray(a) && !a.length) || a === "") return "<em>No answer</em>";
    if (q.type === "mcq" || q.type === "graph-mcq") return `${LETTERS[a]}. ${R(q.choices[a])}`;
    if (q.type === "multi") return a.slice().sort().map((k) => `${LETTERS[k]}. ${R(q.choices[k])}`).join("<br>");
    if (q.type === "plot") return a.map((p) => `(${M1.qlib.fmt(p[0])}, ${M1.qlib.fmt(p[1])})`).join(", ");
    return esc(a);
  }
  function correctText(q) {
    if (q.type === "mcq" || q.type === "graph-mcq") return `${LETTERS[q.answer]}. ${R(q.choices[q.answer])}`;
    if (q.type === "multi") return q.answer.map((k) => `${LETTERS[k]}. ${R(q.choices[k])}`).join("<br>");
    if (q.type === "plot") return q.answer.map((p) => `(${M1.qlib.fmt(p[0])}, ${M1.qlib.fmt(p[1])})`).join(", ");
    return R("$" + M1.qlib.tex(q.answer) + "$");
  }

  function renderResults(root) {
    if (!viewing) return setView("home");
    const { rec, events, fresh, studentName } = viewing;
    const u = unit(rec.unitId);
    const st = main.units[rec.unitId];
    const mastered = fresh && rec.percent === 100;
    const skillRows = u.skills.filter((s) => rec.bySkill[s.id]).map((s) => {
      const [r, t] = rec.bySkill[s.id];
      const ss = fresh && st ? st.skills[s.id] : null;
      const level = ss ? (ss.achieved ? `<span class="pill ach">Achieved</span>` : `<span class="pill t${ss.focus}">${E.TIER_NAMES[ss.focus]}</span>`) : "";
      return `<tr><td>${esc(s.name)}</td><td class="num">${r}/${t}</td><td><div class="bar"><span style="width:${Math.round((100 * r) / t)}%"></span></div></td>${fresh ? `<td>${level}</td>` : ""}</tr>`;
    }).join("");
    const evs = (events || rec.events || []).map((e) => (typeof e === "string" ? e : e.text));
    root.innerHTML = `${fresh ? "" : header("progress")}
      <main class="page results">
        ${studentName ? `<div class="eyebrow">Viewing ${esc(studentName)}</div>` : ""}
        <section class="score-hero${mastered ? " mastered" : ""}">
          <div>
            <div class="eyebrow">Unit ${u.order}: ${esc(u.title)} · Set ${rec.setNumber}${rec.diagnostic ? " · first check" : ""}</div>
            <div class="big-score"><span>${rec.right}</span>/${rec.total}<small>${rec.percent}%</small></div>
          </div>
          <dl class="time-stats">
            <div><dt>Active time</dt><dd>${dur(rec.activeSec)}</dd></div>
            <div><dt>Per question</dt><dd>${dur(rec.activeSec / rec.total)}</dd></div>
            <div><dt>Start to finish</dt><dd>${dur(rec.wallSec)}</dd></div>
            <div><dt>Hints used</dt><dd>${rec.hintsUsed || 0}</dd></div>
          </dl>
        </section>
        ${mastered ? `<section class="mastered-panel"><h2>Unit mastered</h2><p>Every question right. You can restart this unit with brand-new questions. The assessment starts again from a fresh first check.</p>
          <div class="row"><button type="button" class="btn primary" data-act="restart" data-unit="${rec.unitId}">Restart with fresh questions</button>
          <button type="button" class="btn" data-go="home">Back to units</button></div></section>` : ""}
        ${evs.length ? `<section class="panel"><h2>What changed</h2><ul class="events">${evs.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
        <section class="panel"><h2>By skill</h2><div class="table-wrap"><table class="skills"><thead><tr><th>Skill</th><th class="num">This set</th><th></th>${fresh ? "<th>Level now</th>" : ""}</tr></thead><tbody>${skillRows}</tbody></table></div></section>
        ${fresh && !mastered ? `<div class="row center"><button type="button" class="btn primary big" data-act="start" data-unit="${rec.unitId}">Start next set</button><button type="button" class="btn" data-go="home">Back to units</button></div>` : ""}
        <section class="panel"><h2>Review every question</h2>
          <div class="review-filter" role="group" aria-label="Show"><button type="button" class="seg-btn on" data-filter="all">All</button><button type="button" class="seg-btn" data-filter="wrong">Missed only</button></div>
          <ol class="review">${rec.questions.map((q, i) => reviewItem(q, i, rec)).join("")}</ol>
        </section>
        ${fresh ? "" : `<div class="row center"><button type="button" class="btn" data-go="progress">Back to progress</button></div>`}
      </main>`;
    rec.questions.forEach((q, i) => {
      const host = document.getElementById("rg-" + i);
      if (!host) return;
      if (q.graph) M1.tools.GraphGrid(host, { window: q.graph.window, points: q.graph.points, points2: q.graph.points2 });
      if (q.type === "plot") { const g = M1.tools.GraphGrid(host, { window: q.plot.window, points: rec.answers[i] || [] }); g.showAnswer(q.answer); }
    });
  }

  function reviewItem(q, i, rec) {
    const ok = rec.results[i], a = rec.answers[i];
    const why = !ok && (q.type === "mcq" || q.type === "graph-mcq") && a != null && q.why && q.why[a] ? `<div class="why"><strong>Why ${LETTERS[a]} is wrong:</strong> ${R(q.why[a])}</div>` : "";
    return `<li class="ritem ${ok ? "ok" : "bad"}" data-ok="${ok}">
      <div class="rhead"><span class="mark" aria-label="${ok ? "Correct" : "Incorrect"}">${ok ? "✓" : "✗"}</span><span>Question ${i + 1}</span>
        <span class="pill lvl-${q.level}">${LEVEL_LABEL[q.level]}</span><span class="muted">${esc(skillName(rec.unitId, q.skill))} · ${dur(rec.qTimes ? rec.qTimes[i] : 0)}${rec.hints && rec.hints[i] ? " · hint used" : ""}</span></div>
      <div class="prompt">${R(q.prompt)}</div>
      ${q.table ? tableHtml(q.table) : ""}
      ${q.graph || q.type === "plot" ? `<div class="qgraph small" id="rg-${i}"></div>${q.type === "plot" ? `<div class="legend"><span class="lg-c"></span> Your points <span class="lg-ring"></span> Correct points</div>` : ""}` : ""}
      ${q.choices && q.type !== "multi" ? "" : ""}
      <div class="ans-grid"><div><div class="lbl">Your answer</div><div>${answerText(q, a)}</div></div>
      <div><div class="lbl">Correct answer</div><div>${correctText(q)}</div></div></div>
      ${why}
      <details ${ok ? "" : "open"}><summary>Worked solution</summary><div class="solution">${R(q.solution)}</div></details>
    </li>`;
  }

  // ───────────── Progress (and parent view) ─────────────
  async function renderProgress(root) {
    root.innerHTML = `${header("progress")}<main class="page"><p class="muted">Loading progress…</p></main>`;
    let students = [];
    if (store.isOwner && store.mode === "account") {
      students = (await store.listStudents()).filter((s) => s.id !== store.uid);
    }
    const names = await store.names(students.map((s) => s.id));
    const sel = viewing && viewing.studentPick;
    const shown = sel ? students.find((s) => s.id === sel) : null;
    const data = shown ? Object.assign(M1.store.emptyMain(), shown.main) : main;
    const picker = students.length ? `<section class="panel picker"><label for="stu-pick">Showing progress for</label>
      <select id="stu-pick"><option value="">Me</option>${students.map((s) => `<option value="${esc(s.id)}" ${sel === s.id ? "selected" : ""}>${esc(names[s.id] || "Student")}</option>`).join("")}</select></section>` : "";

    const unitBlocks = units().slice().sort((a, b) => a.order - b.order).filter((u) => data.units[u.id]).map((u) => {
      const st = data.units[u.id];
      const hist = data.history.filter((h) => h.unitId === u.id);
      const time = hist.reduce((s, h) => s + (h.activeSec || 0), 0);
      return `<section class="panel"><div class="panel-head"><h2>Unit ${u.order}: ${esc(u.title)}</h2>
        <div class="muted">${st.sets} set${st.sets === 1 ? "" : "s"} this round · round ${st.round} · ${dur(time)} total${st.mastered ? ' · <span class="pill ach">Mastered</span>' : ""}</div></div>
        <div class="table-wrap"><table class="skills ladder"><thead><tr><th>Skill</th><th>Basic</th><th>Intermediate</th><th>Hard</th><th>Achieved</th><th class="num">Overall</th></tr></thead><tbody>
        ${u.skills.map((s) => {
          const ss = st.skills[s.id];
          const step = !st.sets ? -1 : ss.achieved ? 3 : ss.focus;
          return `<tr><td>${esc(s.name)}</td>${[0, 1, 2, 3].map((k) => `<td><span class="rung ${step > k ? "done" : step === k ? "now" : ""}" aria-label="${step > k ? "done" : step === k ? "current" : "not yet"}"></span></td>`).join("")}
          <td class="num">${ss.total ? Math.round((100 * ss.right) / ss.total) + "%" : "—"}</td></tr>`;
        }).join("")}</tbody></table></div></section>`;
    }).join("");

    root.innerHTML = `${header("progress")}<main class="page">
      ${picker}
      <section class="intro"><h1>Progress</h1><p>Each skill climbs from Basic to Intermediate to Hard. Two sets in a row at 80% or better move it up a level. Three hard questions in a row, all right, mark it achieved.</p></section>
      ${unitBlocks || `<section class="panel"><p class="muted">No units started yet.</p></section>`}
      ${historyTable(data.history.slice().reverse(), "All sets and times", shown ? shown.id : "")}
    </main>`;
    const pick = $("#stu-pick");
    if (pick) pick.onchange = () => { viewing = { studentPick: pick.value || null }; renderProgress(root); };
  }

  async function openReview(setId, studentId) {
    const rec = await store.loadSet(studentId, setId);
    if (!rec) { alertBox("That set's details aren't saved on this device."); return; }
    let studentName = "";
    if (studentId) studentName = (await store.names([studentId]))[studentId] || "Student";
    viewing = { rec, fresh: false, studentName, studentPick: studentId || null };
    setView("results");
  }

  function alertBox(msg) {
    let b = $("#toast");
    if (!b) { b = document.createElement("div"); b.id = "toast"; b.className = "toast"; b.setAttribute("role", "status"); document.body.appendChild(b); }
    b.textContent = msg; b.hidden = false;
    clearTimeout(alertBox.t); alertBox.t = setTimeout(() => (b.hidden = true), 3500);
  }

  // ───────────── events ─────────────
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-go]");
    if (!t) return;
    const cur = main && main.current;
    if (t.dataset.go) return setView(t.dataset.go);
    if (t.dataset.q != null) return showQuestion(Number(t.dataset.q));
    if (t.dataset.choice != null) { cur.answers[cur.idx] = Number(t.dataset.choice); showQuestion(cur.idx); return afterAnswer(); }
    if (t.dataset.multi != null) {
      const k = Number(t.dataset.multi), s = new Set(cur.answers[cur.idx] || []);
      s.has(k) ? s.delete(k) : s.add(k);
      cur.answers[cur.idx] = [...s].sort((a, b) => a - b);
      showQuestion(cur.idx); return afterAnswer();
    }
    if (t.dataset.tool) {
      document.querySelectorAll(".ttab").forEach((b) => b.classList.toggle("on", b === t));
      document.querySelectorAll(".tool-pane").forEach((p) => (p.hidden = p.dataset.pane !== t.dataset.tool));
      if (t.dataset.tool === "draw" && toolsApi.draw) toolsApi.draw.redraw();
      return;
    }
    if (t.dataset.filter) {
      document.querySelectorAll(".review-filter .seg-btn").forEach((b) => b.classList.toggle("on", b === t));
      document.querySelectorAll(".ritem").forEach((li) => (li.hidden = t.dataset.filter === "wrong" && li.dataset.ok === "true"));
      return;
    }
    switch (t.dataset.act) {
      case "start": return startSet(t.dataset.unit);
      case "resume": return setView("set");
      case "restart": {
        const uid = t.dataset.unit;
        main.units[uid] = E.newUnitState(uid, main.units[uid]);
        save();
        return startSet(uid);
      }
      case "exit": save(); clearInterval(timer); return setView("home");
      case "prev": return showQuestion(cur.idx - 1);
      case "next": return showQuestion(cur.idx + 1);
      case "hint": cur.hints[cur.idx] = true; showQuestion(cur.idx); return save();
      case "submit":
        if (!confirmArmed) { confirmArmed = true; return updateNav(); }
        return submit();
      case "review": return openReview(t.dataset.set, t.dataset.student);
    }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && main) save(); });

  async function boot() {
    $("#app").innerHTML = `<div class="loading">Loading your progress…</div>`;
    store = await M1.store.init();
    main = await store.loadMain();
    store.onModeChange = () => { alertBox("Couldn't save to your account. Progress is saving in this browser."); if (view !== "set") render(); };
    setView(main.current ? "home" : "home");
  }
  M1.app = { boot };
})(window);
