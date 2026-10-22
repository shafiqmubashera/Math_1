/* Question-building helpers shared by every unit's generators.
   Plain script: attaches to globalThis.M1 so it runs in the browser and in node tests. */
(function (G) {
  const M1 = (G.M1 = G.M1 || {});

  // Seeded random numbers (mulberry32) so any question can be rebuilt from its seed.
  function rng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      sign: () => (next() < 0.5 ? -1 : 1),
      chance: (p) => next() < p,
      shuffle: (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
      intNot: (lo, hi, bad) => {
        for (let k = 0; k < 100; k++) {
          const v = lo + Math.floor(next() * (hi - lo + 1));
          if (!bad.includes(v)) return v;
        }
        return lo;
      },
    };
    return r;
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  // Format a number for display: integers plainly, simple fractions as a/b, else up to 4 decimals.
  function fmt(x) {
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    for (const d of [2, 3, 4, 5, 6, 8, 9, 10, 12, 16, 25, 27, 32, 64, 81, 100, 125, 243, 256]) {
      const n = x * d;
      if (Math.abs(n - Math.round(n)) < 1e-9) {
        const g = gcd(Math.round(n), d);
        return `${Math.round(n) / g}/${d / g}`;
      }
    }
    return String(Math.round(x * 10000) / 10000);
  }

  // Same, as KaTeX (fractions stacked).
  function tex(x) {
    const s = fmt(x);
    if (s.includes("/")) {
      const neg = s.startsWith("-");
      const [n, d] = s.replace("-", "").split("/");
      return `${neg ? "-" : ""}\\frac{${n}}{${d}}`;
    }
    return s;
  }

  // "+ 3" / "- 3" for writing equations.
  function signed(x, texMode = true) {
    const v = texMode ? tex(Math.abs(x)) : fmt(Math.abs(x));
    return x < 0 ? `- ${v}` : `+ ${v}`;
  }

  // Build a 4-option multiple choice from the correct text and named mistakes.
  // distractors: [{text, why}] — duplicates and copies of the answer are dropped;
  // fillers ({text, why}) top it up to 4 if needed.
  function mcq(correct, distractors, r, fillers = [], correctWhy = "Correct.") {
    const seen = new Set([norm(correct)]);
    const wrong = [];
    for (const d of distractors.concat(fillers)) {
      const k = norm(d.text);
      if (seen.has(k)) continue;
      seen.add(k);
      wrong.push(d);
      if (wrong.length === 3) break;
    }
    if (wrong.length < 3) throw new Error("mcq: not enough distinct distractors for " + correct);
    const all = r.shuffle([{ text: correct, why: correctWhy, ok: true }].concat(wrong));
    return {
      choices: all.map((c) => c.text),
      answer: all.findIndex((c) => c.ok),
      why: all.map((c) => c.why),
    };
  }

  // Multi-select: items [{text, ok, why}] shuffled; answer = sorted indices of ok items.
  function multi(items, r) {
    const all = r.shuffle(items);
    return {
      choices: all.map((c) => c.text),
      answer: all.map((c, i) => (c.ok ? i : -1)).filter((i) => i >= 0),
      why: all.map((c) => c.why || ""),
    };
  }

  function norm(s) {
    return String(s).replace(/\s+/g, "").toLowerCase();
  }

  // Parse a typed number: integers, decimals, fractions (3/4, -2 1/2), commas allowed.
  function parseNum(s) {
    if (s == null) return NaN;
    s = String(s).trim().replace(/,/g, "").replace(/−/g, "-").replace(/^\$/, "");
    if (!s) return NaN;
    let m = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
    if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
    m = s.match(/^(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)$/);
    if (m) return Number(m[1]) / Number(m[2]);
    if (/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return Number(s);
    return NaN;
  }

  // Sequence helpers
  const arith = (a, d, n) => a + d * (n - 1);
  // Remove floating-point dust (31.999999999 → 32) so answers and labels stay exact.
  const clean = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x) : Math.round(x * 1e10) / 1e10);
  const geom = (a, r, n) => clean(a * Math.pow(r, n - 1));
  const terms = (f, count, start = 1) => Array.from({ length: count }, (_, i) => f(start + i));
  const list = (arr) => arr.map((x) => fmt(x)).join(", ");
  const texList = (arr) => arr.map((x) => tex(x)).join(",\\ ");

  // Equation strings in function notation
  const eqArithExplicit = (a, d, name = "f") => `${name}(n) = ${tex(a)} ${signed(d)}(n - 1)`;
  const eqGeomExplicit = (a, r, name = "f") => `${name}(n) = ${tex(a)} \\cdot ${paren(r)}^{n - 1}`;
  const eqArithRecursive = (a, d, name = "f") => `${name}(1) = ${tex(a)},\\ ${name}(n) = ${name}(n - 1) ${signed(d)}`;
  const eqGeomRecursive = (a, r, name = "f") => `${name}(1) = ${tex(a)},\\ ${name}(n) = ${paren(r)} \\cdot ${name}(n - 1)`;
  function paren(x) {
    const t = tex(x);
    return x < 0 || t.includes("frac") ? `\\left(${t}\\right)` : t;
  }

  // Graph window that fits a list of points, with friendly tick steps.
  function windowFor(points, opts = {}) {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const xmax = Math.max(opts.minX || 0, ...xs) + 1;
    let ymin = Math.min(0, ...ys), ymax = Math.max(0, ...ys);
    const span = ymax - ymin || 1;
    const step = niceStep(span / 8);
    ymin = Math.floor(ymin / step) * step - (ymin < 0 ? step : 0);
    ymax = Math.ceil(ymax / step) * step + step;
    return { xmin: 0, xmax: Math.max(6, xmax), ymin, ymax, xstep: 1, ystep: step };
  }
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
    return 10 * p;
  }

  M1.qlib = { clean, rng, gcd, fmt, tex, signed, mcq, multi, parseNum, arith, geom, terms, list, texList,
    eqArithExplicit, eqGeomExplicit, eqArithRecursive, eqGeomRecursive, paren, windowFor, niceStep, norm };
  M1.units = M1.units || {};
})(typeof window !== "undefined" ? window : globalThis);
