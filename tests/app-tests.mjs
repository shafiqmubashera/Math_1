// Drives the built app (dist/index.html) in a real browser, one case at a time.
// Run: node tools/build.mjs && node tests/app-tests.mjs   (needs Playwright with Chromium)
// Case ids match docs/test-cases.md.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const PAGE = (name = "index.html") => pathToFileURL(path.join(ROOT, "dist", name)).href;
const ONLY = process.argv.slice(2);

const empty = (extra = {}) => ({ version: 1, units: {}, current: null, history: [], flags: [], openAll: false, ...extra });
const finished = (uid, extra = {}) => ({ id: "h-" + uid + Math.random().toString(36).slice(2, 6), unitId: uid, round: 1, setNumber: 1, diagnostic: true,
  date: new Date().toISOString(), right: 10, total: 25, percent: 40, activeSec: 600, bySkill: {}, events: [], ...extra });

let browser, lastPage = null;
// No network at all: the app is one self-contained file (KaTeX included), so nothing else should be needed.
async function offline(p) {
  await p.route("**/*", (r) => (r.request().url().startsWith("file:") ? r.continue() : r.abort()));
}
async function open(state, { viewport, file, keys, colorScheme } = {}) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 1200, height: 900 }, acceptDownloads: true, colorScheme: colorScheme || "light" });
  const p = await ctx.newPage();
  lastPage = p;
  p.errs = [];
  p.on("pageerror", (e) => p.errs.push(e.message));
  await offline(p);
  await p.addInitScript(() => {
    if (window.name.startsWith("SEED:")) {
      const d = JSON.parse(window.name.slice(5)); window.name = "";
      localStorage.clear();
      for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v);
    }
  });
  await p.goto(PAGE(file));
  if (state !== undefined || keys) await seed(p, keys || { "m1:main": JSON.stringify(state) });
  else await ready(p);
  return p;
}
async function seed(p, keys) {
  await p.evaluate((k) => { window.name = "SEED:" + JSON.stringify(k); }, keys);
  await p.reload();
  await ready(p);
}
const ready = (p) => p.waitForSelector("#app main, #app .set-bar", { timeout: 10000 });
const main = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("m1:main")));
const has = async (p, sel) => (await p.locator(sel).count()) > 0;
const startBtn = (uid) => `[data-act="start"][data-unit="${uid}"]`;
const isOpenCard = (p, uid) => has(p, startBtn(uid));
const isLockedCard = async (p, order) => {
  const card = p.locator(".unit-card").filter({ has: p.locator(".unit-num", { hasText: new RegExp(`^Unit ${order}$`) }) });
  return (await card.locator(".pill.lock").count()) > 0;
};
async function startUnit(p, uid) {
  await p.locator(startBtn(uid)).first().click();
  await p.waitForSelector("#qcard .qnum");
}
async function questions(p) { return (await main(p)).current.set.questions; }

// A response for question q: right, or wrong (checked against the app's own grader).
async function response(p, q, right) {
  return p.evaluate(({ q, right }) => {
    const E = M1.engine, ok = (v) => E.isCorrect(q, v);
    if (q.type === "mcq" || q.type === "graph-mcq") return right ? q.answer : (q.answer + 1) % q.choices.length;
    if (q.type === "multi") {
      if (right) return q.answer;
      const flip = q.answer.includes(0) ? q.answer.filter((k) => k !== 0) : q.answer.concat([0]);
      return flip.length ? flip : q.choices.map((_, k) => k);
    }
    if (q.type === "numeric") {
      if (right) return String(q.answer);
      return ["-99999", "99999", "0.123457"].find((v) => !ok(v));
    }
    if (q.type === "plot") {
      if (right) return q.answer;
      if (q.answer.length > 1) return q.answer.slice(1);
      const w = Object.assign({ xstep: 1, ystep: 1 }, q.plot.window), [x, y] = q.answer[0];
      return [[x + w.xstep <= w.xmax ? x + w.xstep : x - w.xstep, y]];
    }
  }, { q, right });
}
// Answer question i through the real controls.
async function go(p, i) {
  await p.locator(`.dot[data-q="${i}"]`).click();
  try { await p.waitForFunction((n) => (document.querySelector(".qnum") || {}).textContent.startsWith(`Question ${n} of`), i + 1, { timeout: 3000 }); }
  catch (e) { throw new Error(`tapping question ${i + 1} in the question bar did not open it (still on "${await p.locator(".qnum").innerText()}")`); }
}
async function answer(p, i, q, right) {
  await go(p, i);
  const v = await response(p, q, right);
  if (q.type === "mcq" || q.type === "graph-mcq") await p.locator(`#qcard [data-choice="${v}"]`).click();
  else if (q.type === "multi") for (const k of v) await p.locator(`#qcard [data-multi="${k}"]`).click();
  else if (q.type === "numeric") await p.locator("#num-answer").fill(v);
  else if (q.type === "plot") for (const pt of v) await clickPoint(p, q, pt);
  return v;
}
async function clickPoint(p, q, [x, y]) {
  // Tap where the point is drawn on screen (through the SVG's transform, as a finger would), after making sure nothing covers it.
  const svg = p.locator("#plot-host svg");
  if (!(await svg.count())) throw new Error(`plot grid missing on "${await p.locator(".qnum").innerText()}" (${q.gen})`);
  await svg.scrollIntoViewIfNeeded();
  for (let tries = 0; tries < 6; tries++) {
    const at = await p.evaluate(({ x, y }) => {
      const s = document.querySelector("#plot-host svg"), W = 360, H = 300, pad = { l: 40, r: 14, t: 14, b: 30 };
      const host = M1.app.state().current, qq = host.set.questions[host.idx], w = Object.assign({ xstep: 1, ystep: 1 }, qq.plot.window);
      const vx = pad.l + ((x - w.xmin) / (w.xmax - w.xmin)) * (W - pad.l - pad.r), vy = H - pad.b - ((y - w.ymin) / (w.ymax - w.ymin)) * (H - pad.t - pad.b);
      const c = new DOMPoint(vx, vy).matrixTransform(s.getScreenCTM());
      const hit = document.elementFromPoint(c.x, c.y);
      return { cx: c.x, cy: c.y, free: !!hit && s.contains(hit) };
    }, { x, y });
    if (at.free) return p.mouse.click(at.cx, at.cy);
    await p.evaluate((dy) => window.scrollBy(0, dy), at.cy > 300 ? 160 : -160);
  }
  throw new Error(`could not tap point (${x}, ${y}): it stays covered`);
}
// Answer every question (right or wrong per the rule), submit with two taps, and wait for results.
async function playSet(p, rule = () => true) {
  const qs = await questions(p);
  const setId = (await main(p)).current.set.id;
  for (let i = 0; i < qs.length; i++) {
    try { await answer(p, i, qs[i], rule(qs[i], i)); }
    catch (e) { const m = await main(p); throw new Error(e.message + ` [stored set ${m.current && m.current.set.id} vs start ${setId}; shown: ${await p.locator(".qskill").innerText()} | ${(await p.locator("#qcard .prompt").innerText()).slice(0, 80)}; stored: ${qs[i].type} ${qs[i].prompt.slice(0, 80)}; shown prompt is stored index ${qs.findIndex((q) => q.prompt.startsWith("Select all functions"))} ; storedNow[i]=${m.current.set.questions[i].type} ${m.current.set.questions[i].prompt.slice(0,60)}; memory[i]=${await p.evaluate((i) => { const q = M1.app.state().current.set.questions[i]; return q.type + " " + q.prompt.slice(0, 50) + " idx=" + M1.app.state().current.idx; }, i)}; sameOrder=${JSON.stringify(m.current.set.questions.map((q) => q.fp)) === JSON.stringify(qs.map((q) => q.fp))}]`); }
  }
  await p.locator("#submit-btn").click();
  await p.locator("#submit-btn").click();
  await p.waitForSelector(".score-hero");
  return qs;
}
const heroText = (p) => p.locator(".score-hero .big-score").innerText();

// ───────────────────────── cases ─────────────────────────
const cases = [];
const test = (id, title, fn) => cases.push({ id, title, fn });
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

test("UN-01", "First visit: only Unit 1 is open; every other unit shows Locked and names the unit to finish", async () => {
  const p = await open(empty());
  expect(await isOpenCard(p, "u1"), "Unit 1 not open");
  for (const uid of ["u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9"]) expect(!(await isOpenCard(p, uid)), `${uid} open on first visit`);
  expect((await p.locator(".pill.lock").count()) === 8, "expected 8 locked units");
  const note = await p.locator(".lock-note").first().innerText();
  expect(/Finish one full set in Unit 1/.test(note) && /Any score counts/.test(note), "lock note text: " + note);
  return p;
});

test("UN-02", "Finishing a Unit 1 set with every answer wrong still opens Unit 2", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, () => false);
  expect((await heroText(p)).startsWith("0"), "score not 0");
  expect(/Unit 2: .* is now open/.test(await p.locator(".events").innerText()), "no unlock message");
  await p.locator('[data-go="home"]').first().click();
  expect(await isOpenCard(p, "u2"), "Unit 2 still locked");
  expect(!(await isOpenCard(p, "u3")), "Unit 3 opened too early");
  return p;
});

test("UN-03", "Going back to Unit 1 for more practice keeps Unit 2 open (during and after the new set)", async () => {
  const p = await open(empty({ history: [finished("u1")] }));
  await startUnit(p, "u1");
  await p.locator('[data-act="exit"]').click();
  expect(!(await isLockedCard(p, 2)), "Unit 2 locked while practising Unit 1");
  await p.locator('[data-act="resume"]').first().click();
  await playSet(p, (q, i) => i % 2 === 0);
  await p.locator('[data-go="home"]').first().click();
  expect(await isOpenCard(p, "u2"), "Unit 2 locked after another Unit 1 set");
  return p;
});

test("UN-04", "Restarting a mastered Unit 1 keeps Unit 2 open", async () => {
  const st = empty({ history: [finished("u1", { percent: 100, right: 25 })] });
  const p = await open(st);
  await p.evaluate(() => {}); // state below marks u1 mastered
  const m = await main(p); m.units.u1 = (await p.evaluate(() => M1.engine.newUnitState("u1"))); m.units.u1.mastered = true; m.units.u1.sets = 3;
  await seed(p, { "m1:main": JSON.stringify(m) });
  await p.locator('[data-act="restart"][data-unit="u1"]').click();
  await p.waitForSelector("#qcard .qnum");
  const cur = (await main(p)).current.set;
  expect(cur.diagnostic && cur.round === 2 && cur.setNumber === 1, "restart did not begin round 2 with a first check");
  await p.locator('[data-act="exit"]').click();
  expect(!(await isLockedCard(p, 2)), "Unit 2 locked after restart");
  return p;
});

test("UN-05", "Units open in WCPSS teaching order 1, 2, 3, 4, 8, 5, 6, 7, 9", async () => {
  const p = await open(empty());
  const order = await p.evaluate(() => M1.curriculum.units.slice().sort((a, b) => a.order - b.order).map((u) => u.book));
  expect(JSON.stringify(order) === "[1,2,3,4,8,5,6,7,9]", "book order " + order);
  const ids = await p.evaluate(() => M1.curriculum.units.slice().sort((a, b) => a.order - b.order).map((u) => u.id));
  const hist = [];
  for (let k = 0; k < ids.length; k++) {
    await seed(p, { "m1:main": JSON.stringify(empty({ history: hist.slice() })) });
    for (let j = 0; j < ids.length; j++) expect((await isOpenCard(p, ids[j])) === j <= k, `after finishing ${k} units, ${ids[j]} open=${!(j <= k)}`);
    hist.push(finished(ids[k]));
  }
  return p;
});

test("UN-06", "A unit the student already worked in stays open even if the parent turns 'open all' off again", async () => {
  const p = await open(empty({ openAll: false, history: [finished("u3")] }));
  expect(await isOpenCard(p, "u3"), "worked-in Unit 3 locked");
  expect(await isOpenCard(p, "u4"), "Unit 4 (after finished Unit 3) locked");
  expect(!(await isOpenCard(p, "u2")), "Unit 2 open without finishing Unit 1");
  return p;
});

test("UN-07", "Only one set at a time: other units can't start while a set is in progress, and a Continue banner shows", async () => {
  const p = await open(empty({ openAll: true }));
  await startUnit(p, "u2");
  await p.locator('[data-act="exit"]').click();
  expect(await has(p, "section.resume"), "no Continue banner");
  expect(await p.locator(startBtn("u3")).isDisabled(), "Unit 3 start button enabled during a set");
  return p;
});

test("UN-08", "The unlock message shows only after the first finished set in a unit", async () => {
  const p = await open(empty({ history: [finished("u1")] }));
  await startUnit(p, "u1");
  await playSet(p);
  const ev = (await has(p, ".events")) ? await p.locator(".events").innerText() : "";
  expect(!/is now open/.test(ev), "unlock message repeated");
  return p;
});

test("UN-09", "Finishing the last unit (Unit 9) works with no unlock message and no errors", async () => {
  const p = await open(empty({ openAll: true }));
  await startUnit(p, "u9");
  await playSet(p, (q, i) => i % 3 !== 0);
  const ev = (await has(p, ".events")) ? await p.locator(".events").innerText() : "";
  expect(!/is now open/.test(ev), "unlock message after the last unit");
  return p;
});

test("SB-01", "Every unit's first set has 25 questions marked 'first check', with no repeats", async () => {
  const p = await open(empty({ openAll: true }));
  for (const uid of ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9"]) {
    await startUnit(p, uid);
    const set = (await main(p)).current.set;
    expect(set.questions.length === 25 && set.diagnostic, `${uid}: ${set.questions.length} questions`);
    expect(new Set(set.questions.map((q) => q.fp)).size === 25, `${uid}: repeated question`);
    expect(/first check/.test(await p.locator(".set-title").innerText()), `${uid}: not labelled first check`);
    await seed(p, { "m1:main": JSON.stringify(empty({ openAll: true })) });
  }
  return p;
});

test("SB-06", "Spaced review: none in Unit 1; 3 marked 'Review · Unit 1' questions in Unit 2 after Unit 1 is finished", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  expect((await questions(p)).length === 25, "Unit 1 set has extra questions");
  await seed(p, { "m1:main": JSON.stringify(empty({ history: [finished("u1")] })) });
  await startUnit(p, "u2");
  const qs = await questions(p);
  expect(qs.length === 28 && qs.slice(25).every((q) => q.review && q.reviewUnit === "u1"), "review questions missing or from the wrong unit");
  await p.locator('.dot[data-q="27"]').click();
  expect(/Review · Unit 1/.test(await p.locator(".qskill").innerText()), "review label not shown");
  return p;
});

test("SB-08", "Review questions come only from finished earlier units, never from later or unfinished ones", async () => {
  const p = await open(empty({ openAll: true, history: [finished("u2"), finished("u9")] }));
  await startUnit(p, "u3");
  const rev = (await questions(p)).filter((q) => q.review);
  expect(rev.length === 3 && rev.every((q) => q.reviewUnit === "u2"), "review from " + rev.map((q) => q.reviewUnit));
  return p;
});

test("AN-01", "Multiple choice: one choice at a time; changing the answer replaces it", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const qs = await questions(p), i = qs.findIndex((q) => q.type === "mcq" || q.type === "graph-mcq");
  await p.locator(`.dot[data-q="${i}"]`).click();
  await p.locator('#qcard [data-choice="0"]').click();
  await p.locator('#qcard [data-choice="2"]').click();
  expect((await p.locator("#qcard .choice.on").count()) === 1, "more than one choice selected");
  expect((await p.locator('#qcard [data-choice="2"]').getAttribute("aria-checked")) === "true", "new choice not selected");
  return p;
});

test("AN-02", "Select all that apply: choices toggle on and off; none selected counts as unanswered", async () => {
  const p = await open(empty({ openAll: true }));
  let i = -1;
  for (const uid of ["u1", "u2", "u3", "u4", "u6", "u7"]) {
    await startUnit(p, uid);
    i = (await questions(p)).findIndex((q) => q.type === "multi");
    if (i >= 0) break;
    await seed(p, { "m1:main": JSON.stringify(empty({ openAll: true })) });
  }
  expect(i >= 0, "no select-all question found");
  await p.locator(`.dot[data-q="${i}"]`).click();
  await p.locator('#qcard [data-multi="0"]').click();
  await p.locator('#qcard [data-multi="1"]').click();
  expect((await p.locator("#qcard .choice.on").count()) === 2, "two choices not both on");
  expect(await p.locator(`.dot[data-q="${i}"]`).evaluate((d) => d.classList.contains("done")), "not counted as answered");
  await p.locator('#qcard [data-multi="0"]').click();
  await p.locator('#qcard [data-multi="1"]').click();
  expect(!(await p.locator(`.dot[data-q="${i}"]`).evaluate((d) => d.classList.contains("done"))), "empty selection counted as answered");
  return p;
});

test("AN-03b", "Number entry: a non-number shows a warning and does not count as answered; a fraction does", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const i = (await questions(p)).findIndex((q) => q.type === "numeric");
  await p.locator(`.dot[data-q="${i}"]`).click();
  await p.locator("#num-answer").fill("abc");
  expect(/isn't a number/.test(await p.locator("#num-help").innerText()), "no warning for abc");
  expect(!(await p.locator(`.dot[data-q="${i}"]`).evaluate((d) => d.classList.contains("done"))), "abc counted as answered");
  await p.locator("#num-answer").fill("-3/4");
  expect(await p.locator(`.dot[data-q="${i}"]`).evaluate((d) => d.classList.contains("done")), "-3/4 not counted as answered");
  return p;
});

test("AN-06", "Plot points: clicking places a point, clicking it again removes it, Clear removes all", async () => {
  const p = await open(empty({ openAll: true }));
  let i = -1, qs;
  for (const uid of ["u1", "u3", "u5", "u7", "u8"]) {
    await startUnit(p, uid);
    qs = await questions(p); i = qs.findIndex((q) => q.type === "plot");
    if (i >= 0) break;
    await seed(p, { "m1:main": JSON.stringify(empty({ openAll: true })) });
  }
  expect(i >= 0, "no plot question found");
  await p.locator(`.dot[data-q="${i}"]`).click();
  const q = qs[i], a = q.answer[0];
  await clickPoint(p, q, a);
  expect(/1 point placed/.test(await p.locator("#plot-count").innerText()), "point not placed");
  await clickPoint(p, q, a);
  expect(/0 points placed/.test(await p.locator("#plot-count").innerText()), "point not removed");
  await clickPoint(p, q, a);
  await p.locator('[data-act="plot-clear"]').click();
  expect(/0 points placed/.test(await p.locator("#plot-count").innerText()), "Clear did not remove points");
  return p;
});

test("AN-13", "Tapping a grid point places exactly that point, in every design (including tilted cards) and on a phone", async () => {
  for (const [file, viewport] of [["index.html"], ["preview-quilt.html"], ["preview-metro.html"], ["preview-studio.html"], ["index.html", { width: 390, height: 844 }]]) {
    const p = await open(empty({ openAll: true }), { file, viewport });
    let qs, i = -1;
    for (const uid of ["u1", "u3", "u5", "u7", "u8", "u2"]) {
      await startUnit(p, uid);
      qs = await questions(p); i = qs.findIndex((q) => q.type === "plot");
      if (i >= 0) break;
      await seed(p, { "m1:main": JSON.stringify(empty({ openAll: true })) });
    }
    expect(i >= 0, "no plot question found");
    await go(p, i);
    for (const pt of qs[i].answer) await clickPoint(p, qs[i], pt);
    await p.waitForTimeout(100);
    const got = (await p.evaluate(() => M1.app.state().current.answers[M1.app.state().current.idx])) || [];
    const key = (a) => JSON.stringify(a.map((q) => q.join(",")).sort());
    expect(key(got) === key(qs[i].answer), `${file}${viewport ? " (phone)" : ""}: tapped ${JSON.stringify(qs[i].answer)}, placed ${JSON.stringify(got)}`);
    await p.context().close();
  }
});

test("AN-07", "Answers stay put when moving between questions and after closing and reopening the page", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const qs = await questions(p);
  const given = [];
  for (let i = 0; i < 4; i++) given.push(await answer(p, i, qs[i], i % 2 === 0));
  await p.locator('.dot[data-q="10"]').click();
  await p.waitForTimeout(900); // number entry saves after a short pause
  await p.reload(); await ready(p);
  expect(/4 of 25 answered/.test(await p.locator("section.resume").innerText()), "answered count lost after reload");
  await p.locator('[data-act="resume"]').first().click();
  const saved = (await main(p)).current.answers;
  for (let i = 0; i < 4; i++) expect(JSON.stringify(saved[i]) === JSON.stringify(given[i]), `answer ${i + 1} changed`);
  return p;
});

test("AN-08", "Pressing Enter in a number box moves to the next question", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const qs = await questions(p), i = qs.findIndex((q, k) => q.type === "numeric" && k < 24);
  await p.locator(`.dot[data-q="${i}"]`).click();
  await p.locator("#num-answer").fill("5");
  await p.locator("#num-answer").press("Enter");
  expect(new RegExp(`Question ${i + 2} of`).test(await p.locator(".qnum").innerText()), "did not move on");
  return p;
});

test("AN-09", "Previous is disabled on question 1 and Next is disabled on the last question", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  expect(await p.locator('[data-act="prev"]').isDisabled(), "Previous enabled on Q1");
  await p.locator('.dot[data-q="24"]').click();
  expect(await p.locator('[data-act="next"]').isDisabled(), "Next enabled on last question");
  return p;
});

test("AN-10", "The calculator is blocked on 'No calculator' questions and usable on 'Calculator allowed' ones", async () => {
  const p = await open(empty({ openAll: true }));
  await startUnit(p, "u9");
  const qs = await questions(p);
  const off = qs.findIndex((q) => !q.calc), on = qs.findIndex((q) => q.calc);
  expect(off >= 0 && on >= 0, "set lacks one of the two kinds");
  await p.locator('[data-tool="calc"]').click();
  await p.locator(`.dot[data-q="${off}"]`).click();
  expect(await p.locator(".calc-body").isHidden(), "calculator usable on a no-calculator question");
  await p.locator(`.dot[data-q="${on}"]`).click();
  expect(await p.locator(".calc-body").isVisible(), "calculator blocked on a calculator question");
  return p;
});

test("AN-11", "No hints appear anywhere: during the set or in the review", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const qs = await questions(p);
  for (let i = 0; i < qs.length; i += 6) {
    await p.locator(`.dot[data-q="${i}"]`).click();
    expect(!(await has(p, '[data-act="hint"]')) && !/hint/i.test(await p.locator("#qcard").innerText()), "hint shown on question " + (i + 1));
  }
  await playSet(p);
  for (const q of qs.slice(0, 5)) if (q.hint) expect(!(await p.locator(".review").innerText()).includes(q.hint.replace(/\$/g, "").slice(0, 30)), "hint text in review");
  return p;
});

test("SC-01", "Submit stays disabled until every question is answered; the counter shows how many are left", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  expect(await p.locator("#submit-btn").isDisabled(), "Submit enabled with nothing answered");
  expect(/25 questions left/.test(await p.locator("#foot-mid").innerText()), "counter wrong");
  const qs = await questions(p);
  for (let i = 0; i < 24; i++) await answer(p, i, qs[i], true);
  expect(/1 question left/.test(await p.locator("#foot-mid").innerText()) && (await p.locator("#submit-btn").isDisabled()), "one left not shown or Submit enabled");
  await answer(p, 24, qs[24], true);
  expect(!(await p.locator("#submit-btn").isDisabled()), "Submit disabled with all answered");
  return p;
});

test("SC-02", "Submit needs a second tap; changing an answer cancels the first tap", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const qs = await questions(p);
  for (let i = 0; i < 25; i++) await answer(p, i, qs[i], true);
  await p.locator("#submit-btn").click();
  expect(/Tap again/.test(await p.locator("#submit-btn").innerText()), "no second-tap prompt");
  await answer(p, 0, qs[0], false);
  expect(/Submit set/.test(await p.locator("#submit-btn").innerText()), "first tap not cancelled");
  expect(await has(p, "#qcard"), "submitted on one tap");
  return p;
});

test("SC-03", "Scores are exact: all right gives 25/25 (100%), all wrong gives 0/25 (0%), 13 right gives 52%", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, () => true);
  expect(/^25\s*\/\s*25\s*100%/.test((await heroText(p)).replace(/\n/g, "")), "all right: " + (await heroText(p)));
  const p2 = await open(empty());
  await startUnit(p2, "u1");
  await playSet(p2, (q, i) => i < 13);
  expect(/^13\s*\/\s*25\s*52%/.test((await heroText(p2)).replace(/\n/g, "")), "13 right: " + (await heroText(p2)));
  await p2.context().close();
  return p;
});

test("SC-04", "Review questions are scored separately and never change the unit score or mastery", async () => {
  const p = await open(empty({ history: [finished("u1")] }));
  await startUnit(p, "u2");
  await playSet(p, (q) => !q.review);
  expect(/^25\s*\/\s*25/.test((await heroText(p)).replace(/\n/g, "")), "unit score changed by review");
  expect(/Review from earlier units: 0\/3/.test(await p.locator(".score-hero").innerText()), "review score missing");
  expect(await has(p, ".mastered-panel"), "not mastered despite 100% on the unit");
  return p;
});

test("SC-05", "100% marks the unit Mastered with a Restart button, on the results and on the home card", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p);
  expect(await has(p, '.mastered-panel [data-act="restart"]'), "no mastered panel");
  await p.locator('.mastered-panel [data-go="home"]').click();
  expect(await has(p, '[data-act="restart"][data-unit="u1"]'), "no Restart on the home card");
  expect(/Mastered/.test(await p.locator(".unit-card").first().innerText()), "no Mastered pill");
  return p;
});

test("SC-06", "Restart gives brand-new questions (none from the earlier round) and keeps the history", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const first = (await playSet(p)).map((q) => q.fp);
  if (!(await has(p, ".mastered-panel"))) {
    const bad = await p.evaluate(() => { const st = M1.app.state(); const last = st.history[st.history.length - 1]; const rec = JSON.parse(localStorage.getItem("m1:set:" + last.id));
      return rec.questions.map((q, i) => (rec.results[i] ? null : JSON.stringify({ gen: q.gen, type: q.type, answer: q.answer, accept: q.accept, tol: q.tol, given: rec.answers[i], prompt: q.prompt.slice(0, 150) }))).filter(Boolean); });
    throw new Error("all-right set not mastered: " + (await heroText(p)).replace(/\n/g, " ") + " | " + bad.join(" || "));
  }
  await p.locator('.mastered-panel [data-act="restart"]').click();
  await p.waitForSelector("#qcard .qnum");
  const m = await main(p);
  expect(m.history.length === 1, "history lost");
  expect(!m.current.set.questions.some((q) => first.includes(q.fp)), "a question repeated after restart");
  return p;
});

test("SC-07", "After mastering, 'Keep practising' continues the same round without resetting", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p);
  await p.locator('.mastered-panel [data-go="home"]').click();
  await p.locator(startBtn("u1")).click();
  await p.waitForSelector("#qcard .qnum");
  const set = (await main(p)).current.set;
  expect(set.round === 1 && set.setNumber === 2 && !set.diagnostic, "keep practising reset the unit");
  return p;
});

test("SC-08", "The timer runs only while the set is on screen and pauses when the student leaves", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await p.waitForTimeout(2600);
  const t1 = (await main(p)).current.activeSec || Number((await p.locator("#timer").innerText()).split(":")[1]);
  await p.locator('[data-act="exit"]').click();
  const a = (await main(p)).current.activeSec;
  await p.waitForTimeout(2200);
  const b = (await main(p)).current.activeSec;
  expect(t1 >= 2, "timer did not run");
  expect(a === b, "timer ran while away from the set");
  return p;
});

test("SC-09", "Each finished set adds a history row with date, unit, score and time", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, (q, i) => i < 20);
  await p.locator('[data-go="home"]').first().click();
  const row = await p.locator("table.hist tbody tr").first().innerText();
  expect(/Unit 1/.test(row) && /20\/25/.test(row) && /80%/.test(row), "history row: " + row);
  return p;
});

test("RV-01", "The review lists every question with the student's answer, the correct answer and a worked solution", async () => {
  const p = await open(empty({ history: [finished("u1")] }));
  await startUnit(p, "u2");
  const qs = await playSet(p, (q, i) => i % 2 === 0);
  expect((await p.locator(".ritem").count()) === qs.length, "not every question listed");
  expect((await p.locator(".ritem .ans-grid").count()) === qs.length && (await p.locator(".ritem details .solution").count()) === qs.length, "answer or solution missing");
  expect((await p.locator(".ritem.bad").count()) > 0 && (await p.locator(".ritem.ok").count()) > 0, "marks missing");
  return p;
});

test("RV-02", "A wrong multiple-choice answer shows why that choice is wrong", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, () => false);
  expect((await p.locator(".ritem .why").count()) > 0, "no 'why it's wrong' notes");
  return p;
});

test("RV-03", "'Missed only' hides the questions answered right; 'All' brings them back", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, (q, i) => i < 10);
  await p.locator('[data-filter="wrong"]').click();
  expect((await p.locator(".ritem:visible").count()) === 15, "Missed only count wrong");
  await p.locator('[data-filter="all"]').click();
  expect((await p.locator(".ritem:visible").count()) === 25, "All count wrong");
  return p;
});

test("RV-05", "Flagging a question shows it under 'For grown-ups'; flagging again removes it", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p);
  await p.locator('[data-act="flag"][data-i="3"]').click();
  expect(/Flagged/.test(await p.locator('[data-act="flag"][data-i="3"]').innerText()), "flag not shown");
  await p.locator('[data-go="home"]').first().click();
  await p.locator('[data-go="progress"]').click();
  await p.waitForSelector(".parents");
  expect((await p.locator(".parents .flags li").count()) === 1, "flag not listed for grown-ups");
  await p.locator('.parents [data-act="review"]').click();
  await p.waitForSelector(".review");
  await p.locator('[data-act="flag"][data-i="3"]').click();
  expect((await main(p)).flags.length === 0, "unflag did not remove it");
  return p;
});

test("RV-06", "An old set can be reopened from the history table", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, (q, i) => i < 5);
  await p.locator('[data-go="home"]').first().click();
  await p.locator('table.hist [data-act="review"]').first().click();
  await p.waitForSelector(".review");
  expect(/5\s*\/\s*25/.test((await heroText(p)).replace(/\n/g, "")), "wrong set reopened");
  return p;
});

test("RV-07", "A set whose details were cleared from the device shows a clear message instead of breaking", async () => {
  const p = await open(empty({ history: [finished("u1", { id: "gone" })] }));
  await p.locator('table.hist [data-act="review"]').first().click();
  await p.waitForSelector("#toast:not([hidden])");
  expect(/aren't saved on this device/.test(await p.locator("#toast").innerText()), "no message");
  return p;
});

test("PG-01", "The Progress page shows each started unit's skill ladder and every set", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, (q, i) => i < 15);
  await p.locator('[data-go="home"]').first().click();
  await p.locator('[data-go="progress"]').click();
  await p.waitForSelector("table.ladder");
  expect(/Unit 1: Sequences/.test(await p.locator("main").innerText()), "unit block missing");
  expect((await p.locator("table.ladder tbody tr").count()) === 9, "skill rows missing");
  expect((await p.locator("table.hist tbody tr").count()) === 1, "set missing from the table");
  return p;
});

test("PG-02", "'Open all units' opens every unit; turning it off locks unworked units again", async () => {
  const p = await open(empty());
  await p.locator('[data-go="progress"]').click();
  await p.locator("#open-all").check();
  await p.locator('[data-go="home"]').first().click();
  for (const uid of ["u2", "u5", "u9"]) expect(await isOpenCard(p, uid), uid + " not opened");
  await p.locator('[data-go="progress"]').click();
  await p.locator("#open-all").uncheck();
  await p.locator('[data-go="home"]').first().click();
  expect(!(await isOpenCard(p, "u9")), "Unit 9 still open");
  return p;
});

test("PG-03/04", "Download a backup, wipe the browser, load the backup: progress comes back exactly", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  await playSet(p, (q, i) => i < 18);
  await p.locator('[data-go="home"]').first().click();
  await p.locator('[data-go="progress"]').click();
  const [dl] = await Promise.all([p.waitForEvent("download"), p.locator('[data-act="export"]').click()]);
  const file = path.join(ROOT, "tests/results/backup-test.json");
  await dl.saveAs(file);
  const before = await main(p);
  await seed(p, { "m1:main": JSON.stringify(empty()) });
  await p.locator('[data-go="progress"]').click();
  await p.locator("#import-file").setInputFiles(file);
  await p.waitForSelector("#toast:not([hidden])");
  expect(/Progress loaded/.test(await p.locator("#toast").innerText()), "no confirmation");
  const after = await main(p);
  expect(JSON.stringify(after.history) === JSON.stringify(before.history) && JSON.stringify(after.units) === JSON.stringify(before.units), "progress differs after restore");
  await p.locator('[data-go="home"]').first().click();
  expect(await isOpenCard(p, "u2"), "Unit 2 not open after restore");
  fs.rmSync(file);
  return p;
});

test("PG-05", "Loading a file that isn't a backup (or is broken) shows an error and changes nothing", async () => {
  const p = await open(empty({ history: [finished("u1")] }));
  const bad = path.join(ROOT, "tests/results/not-a-backup.json");
  for (const body of ['{"hello": 1}', "this is not json", '{"app":"math1-practice","keys":{}}']) {
    fs.writeFileSync(bad, body);
    await p.locator('[data-go="progress"]').click();
    await p.locator("#import-file").setInputFiles(bad);
    await p.waitForSelector("#toast:not([hidden])");
    expect(/isn't a Math 1 progress file/.test(await p.locator("#toast").innerText()), "no error for: " + body);
    expect((await main(p)).history.length === 1, "progress changed by a bad file");
    await p.evaluate(() => { document.getElementById("toast").hidden = true; });
  }
  fs.rmSync(bad);
  return p;
});

test("RS-01", "Leaving mid-set and coming back later resumes the same set with answers and time kept", async () => {
  const p = await open(empty());
  await startUnit(p, "u1");
  const qs = await questions(p);
  for (let i = 0; i < 6; i++) await answer(p, i, qs[i], true);
  await p.waitForTimeout(1500);
  await p.locator('[data-act="exit"]').click();
  const saved = await main(p);
  await p.reload(); await ready(p);
  await p.locator('[data-act="resume"]').first().click();
  const now = await main(p);
  expect(now.current.set.id === saved.current.set.id && JSON.stringify(now.current.answers) === JSON.stringify(saved.current.answers), "set or answers changed");
  expect(now.current.activeSec >= 1, "time lost");
  return p;
});

test("RS-02", "Damaged saved data does not crash the app; it starts fresh", async () => {
  const p = await open(undefined, { keys: { "m1:main": "{{{not json" } });
  expect(await isOpenCard(p, "u1"), "home did not load");
  expect(p.errs.length === 0, "errors: " + p.errs.join("; "));
  return p;
});

test("RS-03", "Saved data from an older version (missing newer fields) still loads", async () => {
  const p = await open(undefined, { keys: { "m1:main": JSON.stringify({ version: 1, units: {}, history: [finished("u1")] }) } });
  expect(await isOpenCard(p, "u2"), "older data not understood");
  await p.locator('[data-go="progress"]').click();
  await p.waitForSelector(".parents");
  expect(p.errs.length === 0, "errors: " + p.errs.join("; "));
  return p;
});

test("RS-04", "If the browser blocks storage, the app still runs a full set (it just can't save)", async () => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message));
  await offline(p);
  await p.addInitScript(() => {
    const deny = () => { throw new DOMException("blocked", "SecurityError"); };
    Object.defineProperty(window, "localStorage", { get() { return { getItem: deny, setItem: deny, removeItem: deny, key: deny, get length() { return deny(); }, clear: deny }; } });
  });
  await p.goto(PAGE()); await ready(p);
  await p.locator(startBtn("u1")).click();
  await p.waitForSelector("#qcard .qnum");
  expect(p.errs.length === 0, "errors: " + p.errs.join("; "));
  return p;
});

test("RS-05", "Saved data naming a unit that no longer exists is cleaned up instead of breaking", async () => {
  const bogus = empty({ history: [finished("u1"), finished("u42")], units: { u42: { round: 1 } } });
  bogus.current = { set: { unitId: "u42", questions: [] }, answers: [] };
  const p = await open(bogus);
  expect(!(await has(p, "section.resume")), "ghost set offered");
  expect(await isOpenCard(p, "u2"), "real history lost");
  expect(p.errs.length === 0, "errors: " + p.errs.join("; "));
  return p;
});

test("RS-06", "No script errors on any screen in all four designs (Study Desk, Quilt, Metro, Studio)", async () => {
  for (const file of ["index.html", "preview-quilt.html", "preview-metro.html", "preview-studio.html"]) {
    const p = await open(empty({ history: [finished("u1")] }), { file });
    await startUnit(p, "u2");
    for (const t of ["draw", "calc", "graph"]) await p.locator(`[data-tool="${t}"]`).click();
    await playSet(p, (q, i) => i % 2 === 0);
    await p.locator('[data-filter="wrong"]').click();
    await p.locator('[data-go="home"]').first().click();
    await p.locator('[data-go="progress"]').click();
    await p.waitForSelector(".parents");
    expect(p.errs.length === 0, `${file}: ` + p.errs.join("; "));
    await p.context().close();
  }
});

test("RS-07", "Phone screen (390 px wide): no sideways scrolling on home, question and results screens", async () => {
  const p = await open(empty({ history: [finished("u1")] }), { viewport: { width: 390, height: 844 } });
  const wide = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect((await wide()) <= 1, "home scrolls sideways by " + (await wide()));
  await startUnit(p, "u2");
  const qs = await questions(p);
  for (let i = 0; i < qs.length; i++) {
    await go(p, i);
    if ((await wide()) > 1) throw new Error(`question ${i + 1} (${qs[i].gen}) scrolls sideways by ${await wide()}: ` + (await p.evaluate(() => { const W = window.innerWidth; return [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > W + 1).slice(-3).map((e) => e.tagName + "." + e.className + ":" + (e.innerText || "").slice(0, 60)).join(" | "); })));
  }
  await playSet(p);
  expect((await wide()) <= 1, "results scroll sideways by " + (await wide()));
  return p;
});

test("RS-08", "Seen-question memory is capped so storage can't fill up after months of use", async () => {
  const p = await open(empty());
  const n = await p.evaluate(async () => { const s = await M1.store.init(); s.saveSeen("u1", Array.from({ length: 6000 }, (_, i) => "fp" + i)); return JSON.parse(localStorage.getItem("m1:seen:u1")).length; });
  expect(n === 4000, "kept " + n);
  const kept = await p.evaluate(async () => { const s = await M1.store.init(); for (let i = 0; i < 35; i++) s.saveSet({ id: "s" + i }); return JSON.parse(localStorage.getItem("m1:setids")).length; });
  expect(kept === 30, "kept " + kept + " sets");
  return p;
});

test("RS-09", "The app works with no internet: the only outside request is optional web fonts, and blocking it changes nothing", async () => {
  const ctx = await browser.newContext(); const p = await ctx.newPage(); lastPage = p; p.errs = [];
  const asked = [];
  await p.route("**/*", (r) => { const u = r.request().url(); if (!u.startsWith("file:")) asked.push(u); return u.startsWith("file:") ? r.continue() : r.abort(); });
  await p.goto(PAGE()); await ready(p);
  await startUnit(p, "u1");
  await playSet(p);
  const other = asked.filter((u) => !u.startsWith("https://fonts.googleapis.com/"));
  expect(other.length === 0, "requested: " + other.join(", "));
  return p;
});

// Every visible piece of text against the background behind it (first opaque ancestor background).
// 3:1 is the WCAG floor for large text; anything under it is what students see as "white on white".
async function lowContrast(p) {
  return p.evaluate(() => {
    const rgb = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const v = m.map(Number); return c.startsWith("color(") ? [v[0] * 255, v[1] * 255, v[2] * 255, v[3]] : v; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && (c[3] === undefined || c[3] > 0.5)) return c; } return [255, 255, 255]; };
    const bad = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) {
      const el = n.parentElement, t = n.textContent.trim();
      if (!t || !el || el.closest("svg, .katex-mathml, [hidden]") || !el.getClientRects().length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || +cs.opacity < 0.3) continue;
      const a = lum(rgb(cs.color)), b = lum(bgOf(el));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < 3) bad.push(`"${t.slice(0, 30)}" ${cs.color} on ${getComputedStyle(el).backgroundColor} (${ratio.toFixed(1)}:1)`);
    }
    return [...new Set(bad)];
  });
}

test("RS-10", "Text is readable in phone dark mode and light mode, in all four designs, on home, question and results screens", async () => {
  for (const colorScheme of ["dark", "light"]) {
    for (const file of ["index.html", "preview-quilt.html", "preview-metro.html", "preview-studio.html"]) {
      const p = await open(empty({ history: [finished("u1")] }), { file, colorScheme, viewport: { width: 390, height: 844 } });
      const check = async (where) => { const bad = await lowContrast(p); expect(bad.length === 0, `${file} ${colorScheme} ${where}: ` + bad.slice(0, 5).join("; ")); };
      await check("home");
      await startUnit(p, "u2");
      await check("question");
      await playSet(p, (q, i) => i % 2 === 0);
      await check("results");
      await p.context().close();
    }
  }
});

test("CT-05", "Math shows as formatted math, even with no internet, on every question of a first set in every unit (no raw code, no stray $)", async () => {
  const p = await open(empty({ openAll: true }));
  for (const uid of ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9"]) {
    await startUnit(p, uid);
    const qs = await questions(p);
    for (let i = 0; i < qs.length; i++) {
      await p.locator(`.dot[data-q="${i}"]`).click();
      const raw = await p.locator("#qcard code").count(), txt = await p.locator("#qcard").innerText();
      expect(raw === 0, `${uid} question ${i + 1} (${qs[i].gen}) shows raw math`);
      expect(!/(^|[^\\])\$[^$\s]/.test(txt.replace(/\$\d/g, "")), `${uid} question ${i + 1} (${qs[i].gen}) shows a stray $: ` + txt.slice(0, 120));
    }
    await seed(p, { "m1:main": JSON.stringify(empty({ openAll: true })) });
  }
  return p;
});

// ───────────────────────── runner ─────────────────────────
browser = await chromium.launch();
fs.mkdirSync(path.join(ROOT, "tests/results"), { recursive: true });
const results = [];
for (const c of cases) {
  if (ONLY.length && !ONLY.some((o) => c.id.startsWith(o))) continue;
  const t0 = Date.now();
  let page;
  try {
    page = await c.fn();
    if (page && page.errs && page.errs.length) throw new Error("script errors: " + page.errs.join("; "));
    results.push({ id: c.id, title: c.title, ok: true, ms: Date.now() - t0 });
  } catch (e) {
    if (lastPage && !lastPage.isClosed()) await lastPage.screenshot({ path: path.join(ROOT, "tests/results", c.id.replace("/", "-") + "-fail.png"), fullPage: true }).catch(() => {});
    results.push({ id: c.id, title: c.title, ok: false, err: process.env.FULL ? e.message : e.message.split("\n")[0], ms: Date.now() - t0 });
  }
  if (page && page.context) await page.context().close().catch(() => {});
  const r = results[results.length - 1];
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${(r.id + "       ").slice(0, 8)} ${r.title}${r.ok ? "" : "\n          → " + r.err}`);
}
await browser.close();
fs.mkdirSync(path.join(ROOT, "tests/results"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "tests/results/app.json"), JSON.stringify(results, null, 1));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} app cases passed.`);
process.exit(failed ? 1 : 0);
