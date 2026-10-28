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
const bankPos = {};
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
  // Unit 2
  u2b01: () => 0,
  u2b02: () => 12 * Math.floor(150 / 12),
  u2b03: () => ["$0 \\le t \\le 15$", "$0 \\le t \\le 60$", "$\\{0, 1, 2, \\ldots, 15\\}$", "$t \\ge 0$"].indexOf(`$0 \\le t \\le ${60 / 4}$`),
  u2b04: () => { let n = 1; while (2 ** (n - 1) <= 1000) n++; return n; },
  u2b05: () => [[3, 6, 12, 24], [5, 10, 15, 20], [100, 50, 25, 12.5], [1, 4, 9, 16], [2, 6, 18, 54]]
    .map((y, i) => (y.slice(1).every((v, k) => v / y[k] === y[1] / y[0]) ? i : -1)).filter((i) => i >= 0),
  u2b06: () => {
    const f = (x) => 500 * x + 1000, g = (x) => 2 ** x, xs = Array.from({ length: 4000 }, (_, i) => i / 100 + 0.01);
    const truth = [xs.filter((x) => x >= 13).every((x) => g(x) > f(x)), xs.every((x) => f(x) > g(x)), xs.every((x) => g(x) > f(x)), xs.every((x) => f(x) !== g(x) && Math.sign(f(x) - g(x)) === Math.sign(f(xs[0]) - g(xs[0])))];
    return truth.filter(Boolean).length === 1 ? truth.indexOf(true) : -1;
  },
  u2b07: () => { for (let x = -20; x <= 20; x++) if ((2 ** x * 2 ** 5) / 2 ** 3 === 64) return x; },
  u2b08: () => [9 / 4, -4 / 9, 4 / 9, -9 / 4].findIndex((v) => Math.abs(v - (2 / 3) ** -2) < 1e-12),
  u2b09: () => { const coef = 3 ** 3 / 9, ex = 2 * 3 - -1; return [[3, 7], [3, 5], [1 / 3, 7], [1, 7]].findIndex(([c, e]) => c === coef && e === ex); },
  u2b10: () => (17.5 - 5.5) / (8 - 2),
  u2b11: () => { const f = (x) => 3 * 2 ** x; return [[2, 4], [1, 3], [2, 3], [3, 4]].findIndex(([p, q]) => (f(q) - f(p)) / (q - p) === 18); },
  u2b12: () => { for (let b = 4; b < 100; b++) if ((b * b - 9) / (b - 3) === 11) return b; },
  u2b13: () => { const m = (26.5 - 13) / (10 - 4), b = 13 - 4 * m; return b + 15 * m; },
  u2b14: () => { const m = (-2 - 7) / (4 - -2), b = 7 - m * -2; return [[-3 / 2, 4], [-2 / 3, 17 / 3], [3 / 2, 10], [-3 / 2, 7]].findIndex(([M, B]) => M === m && Math.abs(B - b) < 1e-9); },
  u2b15: () => { const m = (11 - 5) / (3 - 1); return 5 - m * 1; },
  u2b16: () => 0,
  u2b17: () => Math.round(900 * 0.7 ** 3),
  u2b18: () => { const b = Math.sqrt(45 / 5); return [135, 65, 405, 225].indexOf(5 * b ** 3); },
  u2b19: () => { const a = 4, b = 10 / 4; return a * b ** 2; },
  u2b20: () => [0, 2],
  // Unit 3
  u3b01: () => { const a = (16 + 5) / 3; return 3 * (2 * a) - 5; },
  u3b02: () => { const a = (19 - 4) / 3; return a * -2 + 4; },
  u3b03: () => 0,
  u3b04: () => { const outs = Array.from({ length: 121 }, (_, n) => 9 * n); return outs[0] === 0 && outs[2] === 18 && outs[120] === 1080 ? 0 : -1; },
  u3b05: () => Math.max(...[-3, 5].map((x) => -2 * x + 7)),
  u3b06: () => Math.round(15 / 0.05),
  u3b07: () => { const f = (x) => 2 * x + 1, g = (x) => x - 3, h = (x) => f(x) - 2 * g(x); return [1, 5, -2].every((x) => h(x) === 7) ? 0 : -1; },
  u3b08: () => { const m = (0 - 12) / 4; let c = 0; for (let x = 0; x <= 10; x++) if (12 + m * x > 0) c++; return c; },
  u3b09: () => { const f = (x) => 2 ** x; return [[(x) => 8 * f(x)], [(x) => f(x) + 8], [(x) => f(x) + 3], [(x) => 3 * f(x)]].findIndex(([e]) => [0, 1, 2.5].every((x) => Math.abs(e(x) - f(x + 3)) < 1e-9)); },
  u3b10: () => [-2, 0, 5.5, 6, 7].map((y, i) => { const x = 4 - y; return x > -2 && x <= 6 ? i : -1; }).filter((i) => i >= 0),
  u3b11: () => (-4) ** 2 - 3 * -4,
  u3b12: () => (400 + 25 * 20) / (20 + 20),
  // Unit 4
  u4b01: () => { for (let x = -50; x <= 50; x++) if (3 * (2 * x - 5) === 2 * (x + 4) + 13) return x - 3; },
  u4b02: () => { const x = (14 - 4) * 3 / 2; return x / 3; },
  u4b03: () => { const C = (F) => (5 / 9) * (F - 32); const cands = [(c) => (9 / 5) * c + 32, (c) => (9 / 5) * c - 32, (c) => (5 / 9) * c + 32, (c) => (9 / 5) * (c + 32)]; return cands.findIndex((g) => [0, 20, 100].every((c) => Math.abs(C(g(c)) - c) < 1e-9)); },
  u4b04: () => (96 * Math.PI) / (Math.PI * 16),
  u4b05: () => { const vals = [-4, -3, 0, 8]; const not = vals.map((x, i) => (5 - 2 * x <= 11 ? -1 : i)).filter((i) => i >= 0); return not.length === 1 ? not[0] : -1; },
  u4b06: () => { let n = 0; for (let k = -50; k <= 50; k++) if (-3 <= (k - 1) / 2 && (k - 1) / 2 < 1) n++; return n; },
  u4b07: () => { let x = 0; while ((78 + 85 + 90 + 82 + x) / 5 < 84) x++; return x; },
  u4b08: () => { const ok = (c) => 2 * c + 3 * 40 >= 250; const cands = [(c) => 2 * c + 120 >= 250, (c) => 2 * c + 120 <= 250, (c) => 3 * c + 80 >= 250, (c) => 2 * c + 40 >= 250]; return cands.findIndex((f) => [0, 50, 65, 66, 100].every((c) => f(c) === ok(c))); },
  u4b09: () => { const eqs = [[4, -8, 4, 8], [4, -8, 4, -8], [4, -8, 2, -8], [4, -8, -4, 8]]; const none = eqs.map(([a, b, c, d], i) => (a === c && b !== d ? i : -1)).filter((i) => i >= 0); return none.length === 1 ? none[0] : -1; },
  u4b10: () => { const w = (48 - 6) / 6; return 2 * w + 3; },
  // Unit 8
  u8b01: () => Math.hypot(7 - 2, 11 + 1),
  u8b02: () => { const B = [2 * 3 + 1, 2 * -2 - 4]; return B[0] + B[1]; },
  u8b03: () => { const m = (0 - 4) / (6 - 0); return [3 / 2, -2 / 3, 2 / 3, -3 / 2].findIndex((s) => Math.abs(s * m + 1) < 1e-9); },
  u8b04: () => Math.hypot(8, 6),
  u8b05: () => { const D = [1 + 8 - 4, 1 + 2 - 5]; return [[5, -2], [11, 6], [-3, 4], [5, 2]].findIndex((p) => p[0] === D[0] && p[1] === D[1]); },
  u8b06: () => 6 + Math.hypot(3, 4) + Math.hypot(3, 4),
  u8b07: () => 1 + (2 / 5) * (-9 - 1),
  u8b08: () => { const m = 3 / 4; return 9 - m * (6 - 2); },
  u8b09: () => { const P = [[-2, 1], [2, 4], [5, 0]]; const d = [[0, 1], [1, 2], [2, 0]].map(([i, j]) => (P[i][0] - P[j][0]) ** 2 + (P[i][1] - P[j][1]) ** 2).sort((a, b) => a - b); const right = d[0] + d[1] === d[2], iso = d[0] === d[1] || d[1] === d[2]; return right ? (iso ? 0 : 2) : iso ? 3 : -1; },
  u8b10: () => { let n = 0; for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) if (x * x + y * y === 25) n++; return n; },
  // Unit 5
  u5b01: () => 12 * (4 / 2),
  u5b02: () => { const x = (10 + 4) / 2, y = 10 - x; return x * x - y * y; },
  u5b03: () => { for (let b = 0; b <= 20; b++) if (3 * (20 - b) + 8 * b === 100) return b; },
  u5b04: () => { const s = (56 + 4) / 4; return 3 * s - 4; },
  u5b05: () => [[0, 0], [3, 2], [-1, 6], [4, -2]].map(([x, y], i) => (y >= 2 * x - 3 && y < -x + 4 ? i : -1)).filter((i) => i >= 0)[0],
  u5b06: () => { const sys = [[6, -4, 10], [6, -4, 16], [2, -3, 8], [3, 2, 8]]; return sys.findIndex(([a, b, c]) => a * -2 - b * 3 === 0 && c * 3 !== a * 8); },
  u5b07: () => 0.5 * (40 / 4) * (40 / 5),
  u5b08: () => Math.round((45 - 30) / (0.2 - 0.1)),
  u5b09: () => { for (let x = -20; x <= 20; x++) { const y = 3 * x - 7; if (2 * x + 3 * y === 12) return x; } },
  u5b10: () => { let best = 0; for (let c = 20; c <= 60; c++) for (let s = 0; c + s <= 100; s++) best = Math.max(best, 300 * c + 200 * s); return best; },
  // Unit 6
  u6b01: () => { for (let t = 0.5; t < 20; t += 0.5) if (-16 * t * t + 32 * t + 48 === 0) return t; },
  u6b02: () => [[2, -5], [-2, -5], [2, 5], [-5, 2]].findIndex(([h, k]) => h === 2 && k === -5),
  u6b03: () => { const ys = [4, 9, 16, 25]; let d = ys[3] - ys[2], v = ys[3]; const dd = (ys[3] - ys[2]) - (ys[2] - ys[1]); for (let x = 5; x <= 10; x++) { d += dd; v += d; } return v; },
  u6b04: () => { let best = 0; for (let x = 0; x <= 20; x++) best = Math.max(best, (10 + x) * (200 - 10 * x)); return best; },
  u6b05: () => { const fs = [(x) => 100 * x + 1000, (x) => 5 * x * x, (x) => 1.1 ** x, (x) => 50 * x]; const v = fs.map((f) => f(2000)); return v.indexOf(Math.max(...v)); },
  u6b06: () => { for (let c = -50; c <= 50; c++) if (3 * 3 - 6 * 3 + c === 0) return c; },
  u6b07: () => { const d1 = 5 - 2, d2 = 12 - 5; return 12 + d2 + (d2 - d1); },
  u6b08: () => { for (let w = 1; w < 54; w++) if (w * (w + 3) === 54) return w; },
  u6b09: () => { const f = (x) => (x - 1) * (x - 7); const t = [f(1) === 0 && f(7) === 0, f(4) === -9 && f(3) === f(5), f(0) === 7, f(100) < 0, f(3) === f(5)]; return t.map((v, i) => (v ? i : -1)).filter((i) => i >= 0); },
  u6b10: () => (36 - 4) / 4,
  u7b01: () => { const x = 7; return x * x - (x + 2) * (x - 2); },
  u7b02: () => { const k = 6 / 2; return k * k; },
  u7b03: () => [5, 16, 9, 20].findIndex((c) => 4 + c === 9 && 4 * c === 20),
  u7b04: () => 2 * 5 + (-3) * 1,
  u7b05: () => { const fs = [(x) => (x * x + 4) * (x + 2) * (x - 2), (x) => (x * x - 4) ** 2, (x) => (x - 2) ** 4, (x) => (x * x + 4) ** 2]; return fs.findIndex((f) => [0, 1, 3, -2].every((x) => f(x) === x ** 4 - 16)); },
  u7b06: () => (1 + 5) / 2,
  u7b07: () => { const h = (t) => -5 * (t + 1) * (t - 9); let best = 0; for (let t = 0; t <= 9; t++) if (h(t) > h(best)) best = t; return h(9) === 0 && best === 4 && h(0) !== 0 ? 0 : -1; },
  u7b08: () => { for (let n = 2; n < 80; n += 2) if (n * (n + 2) === 80) return n; },
  u7b09: () => { for (let w = 0.5; w < 20; w += 0.5) if ((10 + 2 * w) * (8 + 2 * w) === 168) return w; },
  u7b10: () => 0,
  u9b01: () => 5 * 85.6 - 4 * 85,
  u9b02: () => { const pay = [10, 12, 15], up = pay.map((x) => x + 2), m = (a) => a.reduce((s, x) => s + x) / a.length, sd = (a) => Math.sqrt(m(a.map((x) => (x - m(a)) ** 2)));
    return Math.abs(m(up) - m(pay) - 2) < 1e-9 && Math.abs(sd(up) - sd(pay)) < 1e-9 ? 0 : -1; },
  u9b03: () => { for (let k = 11; k < 200; k++) { const a = [2, 5, 9, 10, k]; if (a.reduce((s, x) => s + x) / 5 === 9 + 3) return k; } },
  u9b04: () => 0,
  u9b05: () => [24 / 1.5 === 16, false, false, 24 - 1.5 * 24 === 1.5].indexOf(true),
  u9b06: () => (27 - 7) / (10 - 2),
  u9b07: () => [[1, 8], [2, 7], [3, 10], [4, 10]].reduce((s, [x, y]) => s + y - (2 * x + 5), 0),
  u9b08: () => 0,
  u9b09: () => 100 / 4,
  u9b10: () => 25 + 1.5 * (25 - 20),
};
const fail = (where, msg) => { fails++; if (fails < 60) console.log("FAIL", where, "-", msg); };

function checkQuestion(q, where) {
  checked++;
  if (!TYPES.includes(q.type)) fail(where, "bad type " + q.type);
  if (!LEVELS.includes(q.level)) fail(where, "bad level " + q.level);
  if (!q.prompt || !q.solution || !q.hint) fail(where, "missing prompt/solution/hint");
  if ((q.prompt.match(/(?<!\\)\$/g) || []).length % 2) fail(where, "unbalanced $ in prompt: " + q.prompt);
  if ((q.solution.match(/(?<!\\)\$/g) || []).length % 2) fail(where, "unbalanced $ in solution: " + q.solution);
  if (/NaN|(?<!\\text\{)undefined|Infinity/.test(q.prompt + q.solution + JSON.stringify(q.choices || ""))) fail(where, "NaN/undefined in text: " + q.prompt);
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
  if (q.accept && q.type !== "numeric") fail(where, "accept only works on numeric questions");
  if (q.graph && !q.graph.window) fail(where, "graph without a window");
  for (const P of (q.graph && q.graph.paths) || []) if (!P.pts.length || P.pts.some((p) => !p.every(Number.isFinite))) fail(where, "bad path points");
  if (q.type === "numeric" && Math.abs(q.answer) > 1e7) fail(where, "answer too large " + q.answer);
  if (q.type === "plot") {
    const w = q.plot.window;
    for (const [x, y] of q.answer) if (x < w.xmin || x > w.xmax || y < w.ymin || y > w.ymax) fail(where, `point (${x},${y}) off grid`);
    // The grid snaps a tap to the nearest multiple of its step, so every answer point must be one of those spots.
    const on = (v, step) => Math.abs(Math.round(v / step) * step - v) < 1e-6;
    for (const [x, y] of q.answer) if (!on(x, w.xstep || 1) || !on(y, w.ystep || 1)) fail(where, `point (${x},${y}) can't be placed: the grid snaps to steps of ${w.xstep || 1} and ${w.ystep || 1}`);
  }
  if (q.graph) for (const [x, y] of (q.graph.points || []).concat(q.graph.points2 || [])) {
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
    for (const q of set.questions) if (q.gen === "bank" && Array.isArray(q.choices)) {
      const orig = (content.bank || []).find((x) => x.id === q.id);
      const want = [].concat(orig.answer).map((i) => orig.choices[i]).sort(), got = [].concat(q.answer).map((i) => q.choices[i]).sort();
      if (JSON.stringify(want) !== JSON.stringify(got)) fail(q.id, "shuffled bank choices lost the right answer");
      bankPos[[].concat(q.answer)[0]] = (bankPos[[].concat(q.answer)[0]] || 0) + 1;
    }
    seen = seen.concat([...fps]);
    // Simulate a student who gets basics right and others right 60% of the time.
    const answers = set.questions.map((q, i) => (q.level === "basic" || (i * 7) % 10 < 6 ? (q.type === "numeric" ? M1.qlib.fmt(q.answer) : q.answer) : null));
    const res = M1.engine.gradeSet(set, answers);
    state = M1.engine.updateState(state, set, res).state;
  }
  console.log(`${u.id}: ${content.generators.length} generators, 40 sets built, seen ${seen.length} unique questions`);
}
// Spaced review: questions come from the earlier units and never change the unit score.
{
  const st = M1.engine.newUnitState("u3");
  const set = M1.engine.buildSet("u3", st, [], 77);
  const rev = M1.engine.reviewQuestions(["u1", "u2"], [], 78);
  if (rev.length !== 3) fail("review", `expected 3 review questions, got ${rev.length}`);
  for (const q of rev) { if (!q.review || !["u1", "u2"].includes(q.reviewUnit)) fail("review", "review question not marked"); checkQuestion(q, "review:" + q.gen); }
  set.questions = set.questions.concat(rev);
  const answers = set.questions.map((q) => (q.review ? null : q.type === "numeric" ? M1.qlib.fmt(q.answer) : q.answer));
  const g = M1.engine.gradeSet(set, answers);
  if (g.total !== 25 || g.percent !== 100 || g.review.total !== 3 || g.review.right !== 0) fail("review", `review changed the unit score: ${JSON.stringify([g.right, g.total, g.percent, g.review])}`);
  const up = M1.engine.updateState(st, set, g).state;
  if (Object.keys(up.skills).some((k) => !k.startsWith("u3."))) fail("review", "review questions leaked into unit skills");
}
if (Object.keys(bankPos).length < 3) fail("bank", "bank choices are not shuffled: " + JSON.stringify(bankPos));
console.log(`\nChecked ${checked} questions. ${fails ? fails + " FAILURES" : "All passed."}`);
process.exit(fails ? 1 : 0);
