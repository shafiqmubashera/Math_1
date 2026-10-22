// Checks every generator and bank question. Run: node tests/run-tests.mjs
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
const unitDirs = fs.readdirSync(path.join(ROOT, "content")).filter((d) => fs.existsSync(path.join(ROOT, "content", d, "generators.js")));
for (const d of unitDirs) { load(`content/${d}/generators.js`); if (fs.existsSync(path.join(ROOT, "content", d, "bank.js"))) load(`content/${d}/bank.js`); }
load("app/src/engine.js");

const units = JSON.parse(fs.readFileSync(path.join(ROOT, "curriculum/units.json"), "utf8")).units;
const standards = JSON.parse(fs.readFileSync(path.join(ROOT, "curriculum/standards.json"), "utf8")).standards;
const { M1 } = ctx;
M1.curriculum = { units };
const LEVELS = ["basic", "intermediate", "hard", "challenge"];
const TYPES = ["mcq", "multi", "numeric", "plot", "graph-mcq"];
let fails = 0, checked = 0;
// Independent re-solves for the written bank (computed here, not copied from the item).
const geo = (a, r, n) => a * r ** (n - 1);
const BANK_CHECKS = {
  u1b01: () => 0,
  u1b02: () => { const d = (58 - 23) / 5, a = 23 - 3 * d; return a + (a + d); },
  u1b03: () => ["$729$", "$243$", "$2187$", "$486$"].indexOf("$" + geo(3, Math.cbrt(81 / 3), 6) + "$"),
  u1b04: () => { const f = (n) => 5 + 3 * (n - 1); return [1, 2, 3, 10].every((n) => f(n) === 3 * n + 2) ? 0 : -1; },
  u1b05: () => [0, 2, 4],
  u1b06: () => { let n = 1; while (3 ** n !== 729) n++; return n; },
  u1b07: () => 40 / 2,
  u1b08: () => ["$-24$", "$24$", "$-48$", "$48$"].indexOf("$" + 3 * (-2) ** 3 + "$"),
  u1b09: () => ["491.52 liters", "614.4 liters", "240 liters", "708.48 liters"].indexOf(+(1200 * 0.8 ** 4).toFixed(2) + " liters"),
  u1b10: () => (101 - 6) / 5 + 1,
  u1b11: () => (5 + 4 * 9 === 41 ? 0 : -1),
  u1b12: () => { let a = 2; for (let i = 2; i <= 4; i++) a = 3 * a - 1; return a; },
  u1b13: () => (Number.isInteger((100 - 7) / 4) ? 1 : 0),
  u1b14: () => 12 + 1.5 * 19,
  u1b15: () => 256 / 2 ** 5,
};
const fail = (where, msg) => { fails++; if (fails < 60) console.log("FAIL", where, "-", msg); };

function checkQuestion(q, where) {
  checked++;
  if (!TYPES.includes(q.type)) fail(where, "bad type " + q.type);
  if (!LEVELS.includes(q.level)) fail(where, "bad level " + q.level);
  if (!q.prompt || !q.solution || !q.hint) fail(where, "missing prompt/solution/hint");
  if ((q.prompt.match(/(?<!\\)\$/g) || []).length % 2) fail(where, "unbalanced $ in prompt: " + q.prompt);
  if ((q.solution.match(/(?<!\\)\$/g) || []).length % 2) fail(where, "unbalanced $ in solution: " + q.solution);
  if (/NaN|undefined|Infinity/.test(q.prompt + q.solution + JSON.stringify(q.choices || ""))) fail(where, "NaN/undefined in text: " + q.prompt);
  if (q.type === "mcq" || q.type === "graph-mcq") {
    if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(where, "mcq needs 4 choices");
    else if (new Set(q.choices.map(M1.qlib.norm)).size !== 4) fail(where, "duplicate choices " + q.choices.join(" | "));
    if (!(q.answer >= 0 && q.answer < 4)) fail(where, "answer index");
  }
  if (q.type === "multi") {
    if (!Array.isArray(q.answer) || q.answer.length < 1) fail(where, "multi needs at least one answer");
    if (q.answer.length === q.choices.length) fail(where, "multi: every choice correct");
    if (new Set(q.choices.map(M1.qlib.norm)).size !== q.choices.length) fail(where, "duplicate choices " + q.choices.join(" | "));
  }
  if (q.type === "numeric" && !Number.isFinite(q.answer)) fail(where, "numeric answer not finite");
  if (q.type === "numeric" && Math.abs(q.answer) > 1e7) fail(where, "answer too large " + q.answer);
  if (q.type === "plot") {
    const w = q.plot.window;
    for (const [x, y] of q.answer) if (x < w.xmin || x > w.xmax || y < w.ymin || y > w.ymax) fail(where, `point (${x},${y}) off grid`);
    for (const [x, y] of q.answer) if (Math.abs(((y - w.ymin) / w.ystep) - Math.round((y - w.ymin) / w.ystep)) > 1e-9 && Math.abs(y * 2 - Math.round(y * 2)) > 1e-9) fail(where, `point (${x},${y}) not on a grid line`);
  }
  if (q.graph) for (const [x, y] of q.graph.points.concat(q.graph.points2 || [])) {
    const w = q.graph.window;
    if (x < w.xmin || x > w.xmax || y < w.ymin || y > w.ymax) fail(where, `graph point (${x},${y}) off window`);
  }
  // The grader must accept the stored answer.
  const resp = q.type === "numeric" ? M1.qlib.fmt(q.answer) : q.answer;
  if (!M1.engine.isCorrect(q, resp)) fail(where, "grader rejects stored answer");
}

for (const u of units) {
  const content = M1.units[u.id];
  if (!content) continue;
  const skillIds = new Set(u.skills.map((s) => s.id));
  for (const s of u.skills) for (const st of s.standards) if (!standards[st]) fail(u.id, "unknown standard " + st);
  const coverage = {};
  for (const g of content.generators) {
    if (!skillIds.has(g.skill)) fail(g.id, "unknown skill " + g.skill);
    coverage[g.skill] = coverage[g.skill] || new Set();
    coverage[g.skill].add(g.level);
    const keys = new Set();
    for (let seed = 1; seed <= 300; seed++) {
      let q;
      try { q = M1.engine.instantiate(g, seed); } catch (e) { fail(g.id + "#" + seed, "threw " + e.message); continue; }
      keys.add(q.fp);
      checkQuestion(q, g.id + "#" + seed);
    }
    if (keys.size < 4) fail(g.id, `only ${keys.size} different questions`);
  }
  for (const s of u.skills) {
    const lv = coverage[s.id] || new Set();
    for (const l of LEVELS) if (!lv.has(l)) console.log(`note: ${s.id} has no ${l} generator`);
  }
  // Bank items: shape checks plus an independent re-solve of every numeric/choice answer.
  const ids = new Set();
  for (const b of content.bank || []) {
    if (ids.has(b.id)) fail(b.id, "duplicate bank id"); ids.add(b.id);
    if (!skillIds.has(b.skill)) fail(b.id, "unknown skill " + b.skill);
    if (!standards[b.standard]) fail(b.id, "unknown standard " + b.standard);
    checkQuestion(b, b.id);
    const check = BANK_CHECKS[b.id];
    if (!check) fail(b.id, "no independent check written");
    else if (JSON.stringify(check()) !== JSON.stringify(b.answer)) fail(b.id, `independent check gives ${JSON.stringify(check())}, stored ${JSON.stringify(b.answer)}`);
  }
  // Build 40 simulated sets to make sure set building never runs dry.
  let state = M1.engine.newUnitState(u.id);
  let seen = [];
  for (let k = 0; k < 40; k++) {
    const set = M1.engine.buildSet(u.id, state, seen, 1000 + k);
    if (set.questions.length !== 25) fail(u.id, `set ${k} has ${set.questions.length} questions`);
    const fps = new Set(set.questions.map((q) => q.fp));
    if (fps.size !== set.questions.length) fail(u.id, `set ${k} repeats a question`);
    for (const q of set.questions) if (seen.includes(q.fp)) fail(u.id, `set ${k} reuses a seen question`);
    seen = seen.concat([...fps]);
    // Simulate a student who gets basics right and others right 60% of the time.
    const answers = set.questions.map((q, i) => (q.level === "basic" || (i * 7) % 10 < 6 ? (q.type === "numeric" ? M1.qlib.fmt(q.answer) : q.answer) : null));
    const res = M1.engine.gradeSet(set, answers);
    state = M1.engine.updateState(state, set, res).state;
  }
  console.log(`${u.id}: ${content.generators.length} generators, 40 sets built, seen ${seen.length} unique questions`);
}
console.log(`\nChecked ${checked} questions. ${fails ? fails + " FAILURES" : "All passed."}`);
process.exit(fails ? 1 : 0);
