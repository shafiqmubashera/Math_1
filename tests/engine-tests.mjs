// Checks the adaptive rules and grading, case by case. Run: node tests/engine-tests.mjs
// Case ids match docs/test-cases.md.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { console, Math, JSON };
ctx.globalThis = ctx;
vm.createContext(ctx);
const load = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx, { filename: rel });
load("app/src/qlib.js");
for (const d of fs.readdirSync(path.join(ROOT, "content"))) {
  for (const f of ["generators.js", "bank.js"]) if (fs.existsSync(path.join(ROOT, "content", d, f))) load(`content/${d}/${f}`);
}
load("app/src/engine.js");
const { M1 } = ctx;
M1.curriculum = { units: JSON.parse(fs.readFileSync(path.join(ROOT, "curriculum/units.json"), "utf8")).units };
const E = M1.engine, LIVE = M1.curriculum.units.filter((u) => u.status === "live").map((u) => u.id);

const results = [];
function test(id, title, fn) {
  try { fn(); results.push({ id, title, ok: true }); }
  catch (e) { results.push({ id, title, ok: false, err: e.message }); }
}
function expect(cond, msg) { if (!cond) throw new Error(msg); }

// A fake set where every question is one skill at one level, answered right or wrong as listed.
function fakeSet(skill, level, rightList, diagnostic = false) {
  const questions = rightList.map((_, i) => ({ id: "q" + i, skill, level, type: "numeric", answer: 1 }));
  const answers = rightList.map((ok) => (ok ? "1" : "2"));
  return { set: { diagnostic, questions }, answers };
}
const run = (state, fs0) => E.updateState(state, fs0.set, E.gradeSet(fs0.set, fs0.answers)).state;
const right = (q) => (q.type === "numeric" ? String(q.answer) : q.answer);

test("AD-01", "First set of each unit is a 25-question check with 3 basic, 7 intermediate and 15 hard/challenge", () => {
  for (const uid of LIVE) {
    const set = E.buildSet(uid, E.newUnitState(uid), [], 11);
    expect(set.diagnostic, `${uid}: first set not marked as the first check`);
    expect(set.questions.length === 25, `${uid}: ${set.questions.length} questions`);
    const n = (lv) => set.questions.filter((q) => q.level === lv).length;
    expect(n("basic") === 3 && n("intermediate") === 7 && n("hard") + n("challenge") === 15, `${uid}: levels ${n("basic")}/${n("intermediate")}/${n("hard") + n("challenge")}`);
  }
});

test("AD-02", "Questions in a set run from easier to harder", () => {
  const order = ["basic", "intermediate", "hard", "challenge"];
  for (const uid of LIVE) {
    const lv = E.buildSet(uid, E.newUnitState(uid), [], 12).questions.map((q) => order.indexOf(q.level));
    expect(lv.every((v, i) => i === 0 || v >= lv[i - 1]), `${uid}: levels out of order`);
  }
});

test("AD-03", "First-check placement: weak basics start a skill at Basic, strong answers start it at Hard", () => {
  const uid = "u1", sk = M1.curriculum.units.find((u) => u.id === uid).skills[0].id;
  const set = E.buildSet(uid, E.newUnitState(uid), [], 13);
  const allWrong = E.updateState(E.newUnitState(uid), set, E.gradeSet(set, set.questions.map(() => null))).state;
  expect(Object.values(allWrong.skills).every((s) => s.focus === 0), "all-wrong check did not place every skill at Basic");
  const allRight = E.updateState(E.newUnitState(uid), set, E.gradeSet(set, set.questions.map(right))).state;
  const tested = set.questions.filter((q) => q.skill === sk);
  if (tested.some((q) => q.level === "intermediate")) expect(allRight.skills[sk].focus === 2, "all-right check did not place the skill at Hard");
});

test("AD-04", "A level moves up after two sets in a row at 80% or better", () => {
  let st = E.newUnitState("u1"); st.sets = 1; const sk = Object.keys(st.skills)[0];
  st = run(st, fakeSet(sk, "basic", [1, 1, 1, 1, 0]));
  expect(st.skills[sk].focus === 0 && st.skills[sk].streak === 1, "moved up after one set");
  st = run(st, fakeSet(sk, "basic", [1, 1, 1, 1, 1]));
  expect(st.skills[sk].focus === 1, "did not move up after two sets at 80%+");
});

test("AD-05", "A set below 80% in between resets the run", () => {
  let st = E.newUnitState("u1"); st.sets = 1; const sk = Object.keys(st.skills)[0];
  st = run(st, fakeSet(sk, "basic", [1, 1, 1, 1, 1]));
  st = run(st, fakeSet(sk, "basic", [1, 1, 1, 0, 0]));
  st = run(st, fakeSet(sk, "basic", [1, 1, 1, 1, 1]));
  expect(st.skills[sk].focus === 0, "moved up without two sets in a row");
});

test("AD-06", "Under 50% at a level (with at least 2 questions) steps the skill back one level", () => {
  let st = E.newUnitState("u1"); st.sets = 1; const sk = Object.keys(st.skills)[0]; st.skills[sk].focus = 1;
  st = run(st, fakeSet(sk, "intermediate", [0, 0, 1]));
  expect(st.skills[sk].focus === 0, "did not step back");
});

test("AD-07", "A skill is achieved after 3 hard/challenge answers in a row, all right in that set", () => {
  let st = E.newUnitState("u1"); st.sets = 1; const sk = Object.keys(st.skills)[0]; st.skills[sk].focus = 2;
  const st2 = run(st, fakeSet(sk, "hard", [1, 1, 0, 1]));
  expect(!st2.skills[sk].achieved, "achieved with a wrong hard answer in the set");
  st = run(st, fakeSet(sk, "challenge", [1, 1, 1]));
  expect(st.skills[sk].achieved, "not achieved after 3 right");
});

test("AD-08", "Achieved skills stop appearing in later sets", () => {
  const uid = "u1"; const st = E.newUnitState(uid); st.sets = 2; const sk = Object.keys(st.skills)[0]; st.skills[sk].achieved = true;
  const set = E.buildSet(uid, st, [], 14);
  expect(!set.questions.some((q) => q.skill === sk), "achieved skill still in the set");
  expect(set.questions.length === 25, "set not full");
});

test("AD-09", "When every skill is achieved, sets still build (hard practice continues)", () => {
  for (const uid of LIVE) {
    const st = E.newUnitState(uid); st.sets = 3;
    for (const s of Object.values(st.skills)) { s.achieved = true; s.focus = 2; }
    const set = E.buildSet(uid, st, [], 15);
    expect(set.questions.length === 25, `${uid}: ${set.questions.length} questions`);
  }
});

test("AD-10", "Weaker skills get more questions than stronger ones, and every active skill gets its minimum", () => {
  for (const uid of LIVE) {
    const st = E.newUnitState(uid); st.sets = 1;
    const ids = Object.keys(st.skills); ids.forEach((id) => (st.skills[id].focus = 2)); st.skills[ids[0]].focus = 0;
    const set = E.buildSet(uid, st, [], 16), c = (id) => set.questions.filter((q) => q.skill === id).length;
    expect(ids.every((id) => c(id) >= 2), `${uid}: a skill got fewer than 2 questions`);
    // Units with many skills are capacity-bound: 25 questions only cover each skill's minimum.
    if (ids.length <= 6) expect(c(ids[0]) > c(ids[1]), `${uid}: weak skill ${c(ids[0])} vs strong skill ${c(ids[1])}`);
  }
});

test("AD-11", "100% marks the unit mastered; 24 of 25 does not", () => {
  const uid = "u2", set = E.buildSet(uid, E.newUnitState(uid), [], 17);
  const all = set.questions.map(right), one = all.slice(); one[3] = null;
  expect(E.updateState(E.newUnitState(uid), set, E.gradeSet(set, all)).state.mastered, "100% not mastered");
  expect(!E.updateState(E.newUnitState(uid), set, E.gradeSet(set, one)).state.mastered, "96% marked mastered");
});

test("AD-12", "Restarting a mastered unit starts round 2 with a fresh first check", () => {
  const prev = E.newUnitState("u1"); prev.sets = 4; prev.mastered = true;
  const st = E.newUnitState("u1", prev);
  expect(st.round === 2 && st.sets === 0 && !st.mastered, "restart state wrong");
  expect(E.buildSet("u1", st, [], 18).diagnostic, "restart did not begin with a first check");
});

test("AD-13", "40 sets in a row never repeat a question (no repeats within or across sets)", () => {
  for (const uid of LIVE) {
    let st = E.newUnitState(uid), seen = [];
    for (let k = 0; k < 40; k++) {
      const set = E.buildSet(uid, st, seen, 500 + k), fps = set.questions.map((q) => q.fp);
      expect(new Set(fps).size === fps.length && !fps.some((f) => seen.includes(f)), `${uid}: set ${k + 1} repeats a question`);
      seen = seen.concat(fps);
      st = E.updateState(st, set, E.gradeSet(set, set.questions.map((q, i) => (i % 3 ? right(q) : null)))).state;
    }
  }
});

test("AN-03", "Number entry accepts integers, negatives, decimals and fractions, and rejects non-numbers", () => {
  const q = { type: "numeric", answer: -0.75 };
  for (const v of ["-0.75", " -0.75 ", "-3/4", "-6/8", "−3/4"]) expect(E.isCorrect(q, v), `"${v}" marked wrong`);
  for (const v of ["", "abc", "3/", "1/0", "-3/4x", "0.7"]) expect(!E.isCorrect(q, v), `"${v}" marked right`);
  expect(E.isCorrect({ type: "numeric", answer: 12 }, "12"), "12 marked wrong");
});

test("AN-04", "Rounded answers are accepted within the stated tolerance", () => {
  const q = { type: "numeric", answer: 0.91, tol: 0.011 };
  expect(E.isCorrect(q, "0.91") && E.isCorrect(q, "0.9") && E.isCorrect(q, "0.92"), "rounded value rejected");
  expect(!E.isCorrect(q, "0.95"), "far value accepted");
});

test("AN-05", "\"Give a value that works\" questions accept every valid value and nothing else", () => {
  expect(E.isCorrect({ type: "numeric", answer: 6, accept: { in: [6, 10, 12] } }, "10"), "listed value rejected");
  expect(!E.isCorrect({ type: "numeric", answer: 6, accept: { in: [6, 10, 12] } }, "7"), "unlisted value accepted");
  const ge = { type: "numeric", answer: 10, accept: { lo: 10, int: true } };
  expect(E.isCorrect(ge, "10") && E.isCorrect(ge, "250"), "valid value rejected");
  expect(!E.isCorrect(ge, "9") && !E.isCorrect(ge, "10.5"), "invalid value accepted");
});

test("AN-12", "Select-all questions need exactly the right choices; plot questions need exactly the right points in any order", () => {
  const m = { type: "multi", answer: [0, 2] };
  expect(E.isCorrect(m, [2, 0]), "right choices in other order rejected");
  expect(!E.isCorrect(m, [0]) && !E.isCorrect(m, [0, 1, 2]), "partial or extra choices accepted");
  const p = { type: "plot", answer: [[1, 2], [3, 4]] };
  expect(E.isCorrect(p, [[3, 4], [1, 2]]), "points in other order rejected");
  expect(!E.isCorrect(p, [[1, 2]]) && !E.isCorrect(p, [[1, 2], [3, 4], [0, 0]]), "missing or extra point accepted");
});

test("SB-07", "Spaced review takes 3 questions only from the units given, never basic, and scores separately", () => {
  const rev = E.reviewQuestions(["u1", "u2"], [], 19);
  expect(rev.length === 3 && rev.every((q) => q.review && ["u1", "u2"].includes(q.reviewUnit) && q.level !== "basic"), "wrong review questions");
  expect(E.reviewQuestions([], [], 19).length === 0, "review questions with no finished units");
  const set = E.buildSet("u3", E.newUnitState("u3"), [], 20); set.questions = set.questions.concat(rev);
  const g = E.gradeSet(set, set.questions.map((q) => (q.review ? null : right(q))));
  expect(g.total === 25 && g.percent === 100 && g.review.total === 3, "review changed the unit score");
});

const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${pad(r.id, 6)} ${r.title}${r.ok ? "" : "\n        → " + r.err}`);
const failed = results.filter((r) => !r.ok).length;
fs.mkdirSync(path.join(ROOT, "tests/results"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "tests/results/engine.json"), JSON.stringify(results, null, 1));
console.log(`\n${results.length - failed} of ${results.length} engine cases passed.`);
process.exit(failed ? 1 : 0);
