/* Unit 3 Features of Functions: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, lin, pt, box, findStep, paren } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);
  const W = box(-7, 7);

  // ── Piecewise-linear graphs with whole-number corners ──
  // Corners alternate up and down, so every piece is one increasing or decreasing run.
  function zigzag(r, { pieces = r.int(3, 4), withZero = false } = {}) {
    for (let tries = 0; tries < 2000; tries++) {
      const pool = [];
      for (let x = -6; x <= 6; x++) pool.push(x);
      let xs = r.shuffle(pool).slice(0, pieces + 1).sort((a, b) => a - b);
      if (withZero && !xs.includes(0)) continue;
      if (xs.some((x, i) => i && x - xs[i - 1] < 2)) continue;
      let up = r.chance(0.5), y = r.int(-4, 4);
      const ys = [y];
      let ok = true;
      for (let i = 1; i < xs.length; i++) {
        const step = r.int(2, 6);
        y = up ? y + step : y - step;
        if (y > 6 || y < -6) { ok = false; break; }
        ys.push(y); up = !up;
      }
      if (!ok) continue;
      // one highest and one lowest corner keeps "maximum at" questions single-answer
      const mx = Math.max(...ys), mn = Math.min(...ys);
      if (ys.filter((v) => v === mx).length > 1 || ys.filter((v) => v === mn).length > 1) continue;
      return makePw(xs, ys);
    }
    throw new Error("zigzag: no graph found");
  }
  function makePw(xs, ys) {
    const f = (x) => {
      for (let i = 0; i < xs.length - 1; i++) if (x >= xs[i] - 1e-9 && x <= xs[i + 1] + 1e-9) return ys[i] + ((ys[i + 1] - ys[i]) * (x - xs[i])) / (xs[i + 1] - xs[i]);
      return NaN;
    };
    const runs = xs.slice(0, -1).map((x, i) => ({ a: x, b: xs[i + 1], up: ys[i + 1] > ys[i] }));
    return { xs, ys, f, runs, pts: xs.map((x, i) => [x, ys[i]]), lo: xs[0], hi: xs[xs.length - 1],
      max: Math.max(...ys), min: Math.min(...ys) };
  }
  const graphOf = (P, extra = {}) => Object.assign({ window: W, paths: [{ pts: P.pts }], closed: [P.pts[0], P.pts[P.pts.length - 1]] }, extra);
  const iv = (a, b, lc = "[", rc = "]") => `${lc}${a}, ${b}${rc}`;

  // ───────────────────────── Key features from graphs and tables ─────────────────────────
  add({ id: "u3.fe.y-intercept", skill: "u3.features", level: L.B, type: "numeric", calc: false,
    make(r) {
      const P = zigzag(r, { withZero: true });
      return { key: [P.xs, P.ys], answer: P.f(0), graph: graphOf(P),
        prompt: "The graph of $y = f(x)$ is shown. What is the $y$-intercept of the graph?",
        hint: "The y-intercept is where the graph crosses the y-axis, where $x = 0$.",
        solution: `At $x = 0$ the graph is at $y = ${P.f(0)}$. The $y$-intercept is **${P.f(0)}**.` };
    } });

  add({ id: "u3.fe.max-min", skill: "u3.features", level: L.B, type: "numeric", calc: false,
    make(r) {
      const P = zigzag(r), askMax = r.chance(0.5);
      const v = askMax ? P.max : P.min;
      return { key: [P.xs, P.ys, askMax], answer: v, graph: graphOf(P),
        prompt: `The whole graph of $y = f(x)$ is shown. What is the ${askMax ? "maximum" : "minimum"} value of $f$?`,
        hint: `The ${askMax ? "maximum" : "minimum"} value is the ${askMax ? "greatest" : "least"} $y$-value on the graph.`,
        solution: `The ${askMax ? "highest" : "lowest"} point is $${pt(P.pts[P.ys.indexOf(v)])}$. The ${askMax ? "maximum" : "minimum"} value is the $y$-value, **${v}**.` };
    } });

  add({ id: "u3.fe.increasing", skill: "u3.features", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const P = zigzag(r, { pieces: 3 }), askUp = r.chance(0.5);
      const runs = P.runs.filter((x) => x.up === askUp), other = P.runs.filter((x) => x.up !== askUp);
      const R0 = r.pick(runs), O = r.pick(other);
      const yA = P.f(R0.a), yB = P.f(R0.b);
      const m = mcq(`$${iv(R0.a, R0.b, "(", ")")}$`, [
        { text: `$${iv(O.a, O.b, "(", ")")}$`, why: `On that interval the graph goes ${askUp ? "down" : "up"} from left to right.` },
        { text: `$${iv(Math.min(yA, yB), Math.max(yA, yB), "(", ")")}$`, why: "Those are y-values. Intervals of increase and decrease use x-values." },
        { text: `$${iv(P.lo, P.hi, "(", ")")}$`, why: `The graph does not ${askUp ? "rise" : "fall"} over the whole domain.` },
      ], r, [{ text: `$${iv(R0.a - 1, R0.b + 1, "(", ")")}$`, why: "That interval goes past the turning points." }]);
      return { key: [P.xs, P.ys, askUp, R0.a], ...m, graph: graphOf(P),
        prompt: `The graph of $y = f(x)$ is shown. On which interval is $f$ ${askUp ? "increasing" : "decreasing"}?`,
        hint: `Read left to right. Where does the graph go ${askUp ? "up" : "down"}?`,
        solution: `From $x = ${R0.a}$ to $x = ${R0.b}$ the graph goes ${askUp ? "up" : "down"}. $f$ is ${askUp ? "increasing" : "decreasing"} on **$${iv(R0.a, R0.b, "(", ")")}$**.` };
    } });

  add({ id: "u3.fe.table-zero", skill: "u3.features", level: L.I, type: "numeric", calc: false,
    make(r) {
      const m = r.pick([2, 4, -2, -4, 3, -3]), z = r.int(-6, 10) + (Math.abs(m) % 2 === 0 && r.chance(0.4) ? 0.5 : 0);
      const b = -m * z, xs = [0, 1, 2, 3, 4];
      if (xs.includes(z)) return this.make(r);
      return { key: [m, z], answer: z,
        table: { headers: ["$x$", "$f(x)$"], rows: xs.map((x) => [String(x), String(m * x + b)]) },
        prompt: "The table shows values of a linear function $f$. What is the $x$-intercept of the graph of $f$ (the value of $x$ where $f(x) = 0$)?",
        hint: "Find the slope from the table, then work back to where the output is 0.",
        solution: `From the table the output changes by ${m} each time $x$ goes up by 1, so the slope is ${m}, and $f(0) = ${b}$. $f(x) = ${lin(m, b)}$. Set $${lin(m, b)} = 0$: $x = \\mathbf{${tex(z)}}$.` };
    } });

  add({ id: "u3.fe.select-true", skill: "u3.features", level: L.H, type: "multi", calc: false,
    make(r) {
      const P = zigzag(r, { pieces: r.int(3, 4) });
      const iMax = P.ys.indexOf(P.max), iMin = P.ys.indexOf(P.min);
      const R0 = r.pick(P.runs);
      const a = r.int(P.lo, P.hi), b = r.int(P.lo, P.hi);
      const items = [
        { text: `The maximum value is ${P.max}.`, ok: true },
        { text: `The maximum value is ${P.xs[iMax]}.`, ok: P.xs[iMax] === P.max, why: `${P.xs[iMax]} is where the maximum happens. The value is ${P.max}.` },
        { text: `$f$ is ${R0.up ? "increasing" : "decreasing"} on $${iv(R0.a, R0.b, "(", ")")}$.`, ok: true },
        { text: `$f$ is ${R0.up ? "decreasing" : "increasing"} on $${iv(R0.a, R0.b, "(", ")")}$.`, ok: false, why: `The graph goes ${R0.up ? "up" : "down"} there.` },
        { text: `$f(${a}) ${P.f(a) > P.f(b) ? ">" : P.f(a) < P.f(b) ? "<" : "="} f(${b})$`, ok: true },
        { text: `The minimum value happens at $x = ${P.xs[iMin]}$.`, ok: true },
      ];
      // keep 5 items, at least one false
      const keep = r.shuffle(items).slice(0, 5);
      if (!keep.some((x) => !x.ok)) keep[0] = items[3];
      if (keep.every((x) => !x.ok) || new Set(keep.map((x) => x.text)).size < keep.length) return this.make(r);
      const m = multi(keep, r);
      return { key: [P.xs, P.ys, R0.a, a, b, keep.map((x) => x.text)], ...m, graph: graphOf(P),
        prompt: "The whole graph of $y = f(x)$ is shown. Select **all** true statements.",
        hint: "Values are y-values. Where things happen are x-values.",
        solution: `Highest point $${pt(P.pts[iMax])}$, lowest point $${pt(P.pts[iMin])}$. ${P.runs.map((u) => `${u.up ? "Increasing" : "Decreasing"} on $(${u.a}, ${u.b})$`).join("; ")}. $f(${a}) = ${fmt(P.f(a))}$ and $f(${b}) = ${fmt(P.f(b))}$.<br>True: ${m.answer.map((i) => m.choices[i]).join(" · ")}` };
    } });

  add({ id: "u3.fe.story", skill: "u3.features", level: L.H, type: "graph-mcq", calc: false,
    make(r) {
      // distance from home over time: away, rest, back or further
      const pts = [[0, 0]];
      let t = 0, d = 0;
      const kinds = r.shuffle(["away", "rest", "back"]);
      if (kinds[0] === "back" || (kinds[0] === "rest")) kinds.unshift("away");
      for (const k of kinds) {
        const dt = r.int(1, 3);
        t += dt;
        if (k === "away") d += r.int(2, 4) * dt;
        if (k === "back") d = Math.max(1, d - r.int(1, 3) * dt);
        pts.push([t, d]);
      }
      if (t > 10 || d > 14 || pts.some((p, i) => i && p[1] <= 0)) return this.make(r);
      const segs = pts.slice(0, -1).map((p, i) => ({ a: p[0], b: pts[i + 1][0], k: pts[i + 1][1] > p[1] ? 0 : pts[i + 1][1] === p[1] ? 1 : 2 }));
      const S = r.pick(segs);
      const choices = ["She is walking away from home.", "She is stopped.", "She is walking back toward home.", "She is at home."];
      const why = ["The distance from home would go up.", "The distance would stay the same.", "The distance from home would go down.", "Her distance from home is not 0 there."];
      return { key: [pts, S.a], choices, answer: S.k, why: why.map((w, i) => (i === S.k ? "Correct." : w)),
        graph: { window: { xmin: 0, xmax: Math.max(10, t), ymin: 0, ymax: 16, xstep: 1, ystep: 2 }, paths: [{ pts }], closed: [pts[0], pts[pts.length - 1]] },
        prompt: `The graph shows Maya's distance from home, in blocks, $t$ minutes after she leaves. What is happening from $t = ${S.a}$ to $t = ${S.b}$?`,
        hint: "Is the distance going up, staying the same, or going down?",
        solution: `From $t = ${S.a}$ to $t = ${S.b}$ the distance goes from ${fmt(pts.find((p) => p[0] === S.a)[1])} to ${fmt(pts.find((p) => p[0] === S.b)[1])} blocks. **${choices[S.k]}**` };
    } });

  add({ id: "u3.fe.solutions", skill: "u3.features", level: L.C, type: "numeric", calc: false,
    make(r) {
      const P = zigzag(r, { pieces: 4 });
      const ks = []; for (let k = P.min + 1; k < P.max; k++) if (!P.ys.includes(k)) ks.push(k);
      if (!ks.length) return this.make(r);
      const k = r.pick(ks);
      const n = P.runs.filter((u) => (P.f(u.a) - k) * (P.f(u.b) - k) < 0).length;
      return { key: [P.xs, P.ys, k], answer: n, graph: graphOf(P),
        prompt: `The whole graph of $y = f(x)$ is shown. How many solutions does the equation $f(x) = ${k}$ have?`,
        hint: `Draw the horizontal line $y = ${k}$. Count where it meets the graph.`,
        solution: `The line $y = ${k}$ crosses the graph on ${n === 1 ? "one piece" : `${n} pieces`}: ${P.runs.filter((u) => (P.f(u.a) - k) * (P.f(u.b) - k) < 0).map((u) => `between $x = ${u.a}$ and $x = ${u.b}$`).join(", ")}. **${n}** solution${n === 1 ? "" : "s"}.` };
    } });

  add({ id: "u3.fe.count-above", skill: "u3.features", level: L.C, type: "numeric", calc: false,
    make(r) {
      const P = zigzag(r, { pieces: 3 });
      const k = r.int(P.min, P.max - 1);
      const xs = []; for (let x = P.lo; x <= P.hi; x++) if (P.f(x) > k) xs.push(x);
      if (!xs.length) return this.make(r);
      return { key: [P.xs, P.ys, k], answer: xs.length, graph: graphOf(P),
        prompt: `The whole graph of $y = f(x)$ is shown. For how many **whole-number** values of $x$ is $f(x) > ${k}$?`,
        hint: "Check each whole number in the domain. Points exactly on the line do not count.",
        solution: `The whole numbers with $f(x) > ${k}$ are ${xs.join(", ")}. That is **${xs.length}** values.` };
    } });

  // ───────────────────────── Domain, range and interval notation ─────────────────────────
  add({ id: "u3.do.ineq-to-interval", skill: "u3.domain", level: L.B, type: "mcq", calc: false,
    make(r) {
      const a = r.int(-9, 4), b = a + r.int(2, 10), lc = r.pick(["[", "("]), rc = r.pick(["]", ")"]);
      const ineq = `${a} ${lc === "[" ? "\\le" : "<"} x ${rc === "]" ? "\\le" : "<"} ${b}`;
      const flip = (c) => ({ "[": "(", "(": "[", "]": ")", ")": "]" }[c]);
      const m = mcq(`$${iv(a, b, lc, rc)}$`, [
        { text: `$${iv(a, b, flip(lc), rc)}$`, why: `$${lc === "[" ? "\\le" : "<"}$ on the left means ${lc === "[" ? "include" : "leave out"} ${a}: ${lc === "[" ? "square bracket" : "round bracket"}.` },
        { text: `$${iv(a, b, lc, flip(rc))}$`, why: `$${rc === "]" ? "\\le" : "<"}$ on the right means ${rc === "]" ? "include" : "leave out"} ${b}.` },
        { text: `$${iv(a, b, flip(lc), flip(rc))}$`, why: "Square brackets include an endpoint; round brackets leave it out." },
      ], r);
      return { key: [a, b, lc, rc], ...m,
        prompt: `Which interval means the same as $${ineq}$?`,
        hint: "Square bracket: the endpoint is included. Round bracket: it is not.",
        solution: `${lc === "[" ? `${a} is included` : `${a} is not included`} and ${rc === "]" ? `${b} is included` : `${b} is not included`}: **$${iv(a, b, lc, rc)}$**.` };
    } });

  add({ id: "u3.do.graph-domain", skill: "u3.domain", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const P = zigzag(r, { pieces: 3 });
      const openL = r.chance(0.5), openR = r.chance(0.5), askDomain = r.chance(0.5);
      const first = P.pts[0], last = P.pts[P.pts.length - 1];
      const g = graphOf(P, { closed: [openL ? null : first, openR ? null : last].filter(Boolean), open: [openL ? first : null, openR ? last : null].filter(Boolean) });
      let right, wrong;
      if (askDomain) {
        right = `$${iv(P.lo, P.hi, openL ? "(" : "[", openR ? ")" : "]")}$`;
        wrong = [{ text: `$${iv(P.min, P.max, "[", "]")}$`, why: "That uses y-values. The domain is the x-values." }]
          .concat([["[", "]"], ["(", ")"], ["[", ")"], ["(", "]"]].map(([p, q]) => ({ text: `$${iv(P.lo, P.hi, p, q)}$`, why: "Open circles are left out (round bracket); filled circles are included (square bracket)." })));
      } else {
        // the range ends come from the highest and lowest points; an open end only matters if the extreme is there
        const iMax = P.ys.indexOf(P.max), iMin = P.ys.indexOf(P.min), n = P.ys.length - 1;
        const maxOpen = (iMax === 0 && openL) || (iMax === n && openR), minOpen = (iMin === 0 && openL) || (iMin === n && openR);
        right = `$${iv(P.min, P.max, minOpen ? "(" : "[", maxOpen ? ")" : "]")}$`;
        wrong = [
          { text: `$${iv(P.lo, P.hi, minOpen ? "(" : "[", maxOpen ? ")" : "]")}$`, why: "That uses x-values. The range is the y-values." },
          { text: `$${iv(P.min, P.max, minOpen ? "[" : "(", maxOpen ? "]" : ")")}$`, why: "Check whether the highest and lowest points are filled or open." },
          { text: `$${iv(first[1], last[1], "[", "]")}$`, why: "The range runs from the lowest to the highest y-value, not from the ends of the graph." },
        ];
      }
      const m = mcq(right, wrong, r, [{ text: `$${iv(P.min - 1, P.max + 1, "[", "]")}$`, why: "Read the lowest and highest y-values exactly." }, { text: `$${iv(P.lo - 1, P.hi + 1, "[", "]")}$`, why: "Read the ends of the graph exactly." }]);
      return { key: [P.xs, P.ys, openL, openR, askDomain], ...m, graph: g,
        prompt: `The whole graph of $y = f(x)$ is shown. A filled circle means the point is included; an open circle means it is not. What is the ${askDomain ? "domain" : "range"} of $f$?`,
        hint: askDomain ? "Domain: the x-values the graph covers, left to right." : "Range: the y-values the graph covers, bottom to top.",
        solution: `${askDomain ? `The graph runs from $x = ${P.lo}$ to $x = ${P.hi}$` : `The lowest y-value is ${P.min} and the highest is ${P.max}`}. The ${askDomain ? "domain" : "range"} is **${right}**.` };
    } });

  add({ id: "u3.do.words", skill: "u3.domain", level: L.I, type: "mcq", calc: false,
    make(r) {
      const a = r.int(-5, 10), b = a + r.int(3, 20);
      const forms = [
        [`at least ${a} and less than ${b}`, "[", ")"], [`greater than ${a} and at most ${b}`, "(", "]"],
        [`between ${a} and ${b}, including both`, "[", "]"], [`more than ${a} but less than ${b}`, "(", ")"],
      ];
      const i = r.int(0, 3), [w, lc, rc] = forms[i];
      const all = [["[", "]"], ["[", ")"], ["(", "]"], ["(", ")"]].map(([p, q]) => `$${iv(a, b, p, q)}$`);
      const right = `$${iv(a, b, lc, rc)}$`;
      const m = mcq(right, all.filter((x) => x !== right).map((t) => ({ text: t, why: "\"At least\" and \"at most\" include the endpoint. \"Greater than\", \"less than\" and \"more than\" leave it out." })), r);
      return { key: [a, b, i], ...m,
        prompt: `The input $x$ can be any number ${w}. Which interval shows the domain?`,
        hint: "\"At least\" includes the number. \"More than\" does not.",
        solution: `**${right}**` };
    } });

  add({ id: "u3.do.context", skill: "u3.domain", level: L.H, type: "mcq", calc: false,
    make(r) {
      const start = r.pick([60, 80, 90, 100]), rate = r.pick([4, 5, 10, 20].filter((x) => start % x === 0)), askD = r.chance(0.5);
      const T = start / rate;
      const right = askD ? `$${iv(0, T)}$` : `$${iv(0, start)}$`;
      const m = mcq(right, [
        { text: askD ? `$${iv(0, start)}$` : `$${iv(0, T)}$`, why: askD ? `${start} is a battery level, an output.` : `${T} is a number of hours, an input.` },
        { text: askD ? `$[0, \\infty)$` : `$[0, \\infty)$`, why: "The model stops when the battery is empty." },
        { text: askD ? `$${iv(0, T, "(", ")")}$` : `$${iv(0, start, "(", ")")}$`, why: "Both ends happen: the start and the moment the battery hits 0%." },
      ], r);
      return { key: [start, rate, askD], ...m,
        prompt: `A phone battery is at ${start}%. It loses ${rate}% each hour until it is empty. $B(t)$ is the battery level $t$ hours from now. What is the ${askD ? "domain" : "range"} of $B$ for this situation?`,
        hint: "When does the battery reach 0%?",
        solution: `$B(t) = ${start} - ${rate}t$ reaches 0 when $t = ${start} \\div ${rate} = ${T}$. Times run from 0 to ${T}; levels run from ${start} down to 0. The ${askD ? "domain" : "range"} is **${right}**.` };
    } });

  add({ id: "u3.do.range-linear", skill: "u3.domain", level: L.C, type: "mcq", calc: false,
    make(r) {
      const m0 = r.pick([2, 3, 4, -2, -3]), b = r.int(-6, 6), a = r.int(-3, 4), openA = r.chance(0.5);
      const fa = m0 * a + b;
      const right = m0 > 0 ? `$${openA ? "(" : "["}${fa}, \\infty)$` : `$(-\\infty, ${fa}${openA ? ")" : "]"}$`;
      const m = mcq(right, [
        { text: m0 > 0 ? `$(-\\infty, ${fa}${openA ? ")" : "]"}$` : `$${openA ? "(" : "["}${fa}, \\infty)$`, why: m0 > 0 ? "The slope is positive, so outputs go up as $x$ goes up." : "The slope is negative, so outputs go down as $x$ goes up." },
        { text: `$${openA ? "(" : "["}${a}, \\infty)$`, why: "That is the domain. The range is the outputs." },
        { text: `$(-\\infty, \\infty)$`, why: "The domain is cut off at one end, so the range is too." },
      ], r, [{ text: m0 > 0 ? `$${openA ? "[" : "("}${fa}, \\infty)$` : `$(-\\infty, ${fa}${openA ? "]" : ")"}$`, why: openA ? `$x = ${a}$ is not in the domain, so ${fa} is not in the range.` : `$x = ${a}$ is in the domain, so ${fa} is in the range.` }]);
      return { key: [m0, b, a, openA], ...m,
        prompt: `$f(x) = ${lin(m0, b)}$ with domain $x ${openA ? ">" : "\\ge"} ${a}$. What is the range of $f$?`,
        hint: `Find $f(${a})$. Then decide whether the outputs go up or down from there.`,
        solution: `$f(${a}) = ${fa}$. The slope ${m0} is ${m0 > 0 ? "positive, so outputs increase without end" : "negative, so outputs decrease without end"}${openA ? `, and $x = ${a}$ is not included, so ${fa} is not either` : ""}. Range: **${right}**.` };
    } });

  add({ id: "u3.do.select-in", skill: "u3.domain", level: L.C, type: "multi", calc: false,
    make(r) {
      const P = zigzag(r, { pieces: 3 });
      const openL = r.chance(0.6), openR = !openL || r.chance(0.5);
      const first = P.pts[0], last = P.pts[P.pts.length - 1];
      // y is in the range if some included x gives it (each piece is strictly monotone, so it hits y once)
      const inRange = (y) => P.runs.some((u, i) => {
        const ya = P.ys[i], yb = P.ys[i + 1];
        if (y < Math.min(ya, yb) || y > Math.max(ya, yb)) return false;
        const x = u.a + ((y - ya) * (u.b - u.a)) / (yb - ya);
        return !((x === P.lo && openL) || (x === P.hi && openR));
      });
      const inDomain = (x) => x > P.lo && x < P.hi || (x === P.lo && !openL) || (x === P.hi && !openR);
      const items = [
        { text: `${P.lo} is in the domain.`, ok: inDomain(P.lo), why: openL ? "The left end is an open circle." : "" },
        { text: `${P.hi} is in the domain.`, ok: inDomain(P.hi), why: openR ? "The right end is an open circle." : "" },
        { text: `${first[1]} is in the range.`, ok: inRange(first[1]), why: "" },
        { text: `${last[1]} is in the range.`, ok: inRange(last[1]), why: "" },
        { text: `${P.max} is in the range.`, ok: inRange(P.max), why: "" },
        { text: `${P.hi + 1} is in the domain.`, ok: false, why: "The graph stops before that." },
      ];
      const uniq = []; for (const it of items) if (!uniq.some((u) => u.text === it.text)) uniq.push(it);
      if (uniq.length < 4 || uniq.every((x) => x.ok) || !uniq.some((x) => x.ok)) return this.make(r);
      const m = multi(uniq.slice(0, 5), r);
      return { key: [P.xs, P.ys, openL, openR], ...m,
        graph: graphOf(P, { closed: [openL ? null : first, openR ? null : last].filter(Boolean), open: [openL ? first : null, openR ? last : null].filter(Boolean) }),
        prompt: "The whole graph of $y = f(x)$ is shown. Filled circles are included; open circles are not. Select **all** true statements.",
        hint: "A y-value at an open circle can still be in the range if the graph reaches it somewhere else.",
        solution: `True: ${m.answer.map((i) => m.choices[i]).join(" · ")} A value at an open circle counts only if the graph reaches it at another, included point.` };
    } });

  // ───────────────────────── Function notation ─────────────────────────
  add({ id: "u3.no.evaluate", skill: "u3.notation", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-6, 6, [0, 1]), b = r.int(-9, 9), k = r.intNot(-5, 6, [0]), sq = r.chance(0.35);
      const val = sq ? k * k + b : a * k + b;
      return { key: [a, b, k, sq], answer: val,
        prompt: `$f(x) = ${sq ? `x^2 ${signed(b)}` : lin(a, b)}$. What is $f(${k})$?`,
        hint: `Replace every $x$ with ${paren(k)}.`,
        solution: `$f(${k}) = ${sq ? `(${k})^2 ${signed(b)} = ${k * k} ${signed(b)}` : `${a}(${k}) ${signed(b)} = ${a * k} ${signed(b)}`} = \\mathbf{${val}}$` };
    } });

  add({ id: "u3.no.table", skill: "u3.notation", level: L.B, type: "numeric", calc: false,
    make(r) {
      const xs = [-2, -1, 0, 1, 2, 3], ys = xs.map(() => r.int(-9, 12));
      const askOut = r.chance(0.5), i = r.int(0, 5);
      if (!askOut && ys.filter((v) => v === ys[i]).length > 1) return this.make(r);
      return { key: [ys, i, askOut], answer: askOut ? ys[i] : xs[i],
        table: { headers: ["$x$", "$f(x)$"], rows: xs.map((x, k) => [String(x), String(ys[k])]) },
        prompt: askOut ? `Use the table. What is $f(${xs[i]})$?` : `Use the table. For what value of $x$ is $f(x) = ${ys[i]}$?`,
        hint: askOut ? `Find the row where $x = ${xs[i]}$.` : `Find ${ys[i]} in the $f(x)$ column.`,
        solution: askOut ? `In the row $x = ${xs[i]}$, $f(x) = \\mathbf{${ys[i]}}$.` : `$f(x) = ${ys[i]}$ in the row where $x = \\mathbf{${xs[i]}}$.` };
    } });

  add({ id: "u3.no.solve", skill: "u3.notation", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-7, 7, [0, 1]), b = r.int(-12, 12), x = r.int(-8, 10);
      const k = a * x + b;
      return { key: [a, b, x], answer: x,
        prompt: `$g(x) = ${lin(a, b)}$. For what value of $x$ is $g(x) = ${k}$?`,
        hint: "Set the expression equal to the output and solve.",
        solution: `$${lin(a, b)} = ${k}$, so $${a}x = ${k - b}$ and $x = \\mathbf{${x}}$.` };
    } });

  add({ id: "u3.no.graph-read", skill: "u3.notation", level: L.I, type: "numeric", calc: false,
    make(r) {
      const P = zigzag(r);
      const askOut = r.chance(0.5);
      if (askOut) {
        const x = r.int(P.lo, P.hi);
        if (!Number.isInteger(P.f(x))) return this.make(r);
        return { key: [P.xs, P.ys, x, 1], answer: P.f(x), graph: graphOf(P),
          prompt: `The graph of $y = f(x)$ is shown. What is $f(${x})$?`,
          hint: `Go to $x = ${x}$ and read the height of the graph.`,
          solution: `At $x = ${x}$ the graph is at $y = ${P.f(x)}$, so $f(${x}) = \\mathbf{${P.f(x)}}$.` };
      }
      // a y-value hit exactly once, at a corner
      const iMax = P.ys.indexOf(P.max), k = P.max;
      return { key: [P.xs, P.ys, 0], answer: P.xs[iMax], graph: graphOf(P),
        prompt: `The whole graph of $y = f(x)$ is shown. For what value of $x$ is $f(x) = ${k}$?`,
        hint: `Find where the graph is at height ${k}.`,
        solution: `The graph reaches $y = ${k}$ only at the point $${pt(P.pts[iMax])}$, so $x = \\mathbf{${P.xs[iMax]}}$.` };
    } });

  const MEANINGS = [
    { f: "C", in: "m", what: (x, y) => [`$C(m)$ is the cost, in dollars, of a phone call that lasts $m$ minutes.`, `A ${x}-minute call costs ${y} dollars.`, `A ${y}-minute call costs ${x} dollars.`, `Each minute costs ${y} dollars.`, `The call costs ${y} dollars more after ${x} minutes.`] },
    { f: "h", in: "t", what: (x, y) => [`$h(t)$ is the height, in feet, of a kite $t$ seconds after it is launched.`, `${x} seconds after launch, the kite is ${y} feet high.`, `${y} seconds after launch, the kite is ${x} feet high.`, `The kite rises ${y} feet every ${x} seconds.`, `The kite takes ${x} seconds to rise ${x * y} feet.`] },
    { f: "P", in: "d", what: (x, y) => [`$P(d)$ is the number of people at a fair on day $d$ of the fair.`, `On day ${x}, ${y} people were at the fair.`, `On day ${y}, ${x} people were at the fair.`, `${y} more people came each day for ${x} days.`, `In ${x} days, ${x * y} people came in total.`] },
    { f: "W", in: "w", what: (x, y) => [`$W(w)$ is the weight, in pounds, of a puppy $w$ weeks after it is born.`, `At ${x} weeks old, the puppy weighs ${y} pounds.`, `At ${y} weeks old, the puppy weighs ${x} pounds.`, `The puppy gains ${y} pounds each week.`, `The puppy gains ${x} pounds in ${y} weeks.`] },
  ];
  add({ id: "u3.no.meaning", skill: "u3.notation", level: L.H, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, MEANINGS.length - 1), M = MEANINGS[i];
      const x = r.int(2, 30), y = r.int(5, 90);
      if (x === y) return this.make(r);
      const [ctx, right, swap, rate, total] = M.what(x, y);
      const m = mcq(right, [
        { text: swap, why: `The number inside the parentheses is the input, ${M.in}. The other number is the output.` },
        { text: rate, why: "The statement gives one input and one output, not a rate." },
        { text: total, why: "It says nothing about a total over time." },
      ], r);
      return { key: [i, x, y], ...m,
        prompt: `${ctx} What does $${M.f}(${x}) = ${y}$ mean?`,
        hint: "Input inside the parentheses, output on the other side.",
        solution: `The input is $${M.in} = ${x}$ and the output is ${y}. **${right}**` };
    } });

  add({ id: "u3.no.expressions", skill: "u3.notation", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-5, 6, [0, 1]), b = r.int(-9, 9), p = r.int(-4, 5), q = r.int(-4, 5), kind = r.int(0, 2);
      const f = (x) => a * x + b;
      const [expr, val, work] = kind === 0
        ? [`f(${p}) + f(${q})`, f(p) + f(q), `$f(${p}) = ${f(p)}$ and $f(${q}) = ${f(q)}$, so the sum is ${f(p) + f(q)}.`]
        : kind === 1 ? [`f(${p + q}) - f(${p})`, f(p + q) - f(p), `$f(${p + q}) = ${f(p + q)}$ and $f(${p}) = ${f(p)}$, so the difference is ${f(p + q) - f(p)}.`]
          : [`2f(${p}) - f(${2 * p})`, 2 * f(p) - f(2 * p), `$2f(${p}) = 2(${f(p)}) = ${2 * f(p)}$ and $f(${2 * p}) = ${f(2 * p)}$, so the result is ${2 * f(p) - f(2 * p)}.`];
      if (kind === 1 && q === 0) return this.make(r);
      return { key: [a, b, p, q, kind], answer: val,
        prompt: `$f(x) = ${lin(a, b)}$. What is the value of $${expr}$?`,
        hint: "Find each function value first, then combine.",
        solution: `${work} The value is **${val}**.` };
    } });

  add({ id: "u3.no.two-values", skill: "u3.notation", level: L.C, type: "numeric", calc: false,
    make(r) {
      const m = r.intNot(-5, 6, [0]), b = r.int(-10, 10), p = r.int(-3, 3), q = p + r.int(2, 5), t = r.int(6, 12);
      return { key: [m, b, p, q, t], answer: m * t + b,
        prompt: `$f$ is a linear function with $f(${p}) = ${m * p + b}$ and $f(${q}) = ${m * q + b}$. What is $f(${t})$?`,
        hint: "Find the slope from the two values first.",
        solution: `Slope $= \\frac{${m * q + b} - ${paren(m * p + b)}}{${q} - ${paren(p)}} = ${m}$. Then $b = ${m * p + b} - ${paren(m)}(${p}) = ${b}$, so $f(x) = ${lin(m, b)}$ and $f(${t}) = \\mathbf{${m * t + b}}$.` };
    } });

  add({ id: "u3.no.exp-shift", skill: "u3.notation", level: L.C, type: "numeric", calc: false,
    make(r) {
      const g = r.pick([2, 3]), k = g === 2 ? r.int(4, 8) : r.int(3, 5), s = r.int(1, 2), up = r.chance(0.4);
      const val = up ? g ** (k + s) : g ** (k - s);
      return { key: [g, k, s, up], answer: val,
        prompt: `$h(x) = ${g}^x$ and $h(k) = ${g ** k}$. What is $h(k ${up ? "+" : "-"} ${s})$?`,
        hint: `Each step of 1 in $x$ ${up ? "multiplies" : "divides"} the output by ${g}.`,
        solution: `$h(k) = ${g}^k = ${g ** k}$, so $k = ${k}$. $h(${k} ${up ? "+" : "-"} ${s}) = ${g}^{${up ? k + s : k - s}} = \\mathbf{${val}}$. (Or ${up ? "multiply" : "divide"} ${g ** k} by ${g} ${s === 1 ? "once" : "twice"}.)` };
    } });

  // ───────────────────────── Combining functions ─────────────────────────
  const fx = (m, b) => lin(m, b);
  add({ id: "u3.co.evaluate", skill: "u3.combine", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-5, 6, [0]), b = r.int(-9, 9), c = r.intNot(-5, 6, [0]), d = r.int(-9, 9), k = r.int(-4, 5), op = r.pick(["+", "-"]);
      const v = op === "+" ? a * k + b + (c * k + d) : a * k + b - (c * k + d);
      return { key: [a, b, c, d, k, op], answer: v,
        prompt: `$f(x) = ${fx(a, b)}$ and $g(x) = ${fx(c, d)}$. What is $f(${k}) ${op} g(${k})$?`,
        hint: "Find each value, then combine.",
        solution: `$f(${k}) = ${a * k + b}$ and $g(${k}) = ${c * k + d}$. $${a * k + b} ${op} ${paren(c * k + d)} = \\mathbf{${v}}$` };
    } });

  add({ id: "u3.co.add", skill: "u3.combine", level: L.B, type: "mcq", calc: false,
    make(r) {
      const a = r.intNot(-5, 6, [0]), b = r.int(-9, 9), c = r.intNot(-5, 6, [0, -a]), d = r.int(-9, 9);
      if (b + d === 0 && b === 0) return this.make(r);
      const m = mcq(`$${lin(a + c, b + d)}$`, [
        { text: `$${lin(a * c, b * d)}$`, why: "Adding functions adds like terms. It does not multiply them." },
        { text: `$${lin(a + c, b - d)}$`, why: "Both constants are added." },
        { text: `$${lin(a - c, b + d)}$`, why: "Both $x$-terms are added." },
      ], r, [{ text: `$${lin(a + c + 1, b + d)}$`, why: "Combine the $x$-terms carefully." }]);
      return { key: [a, b, c, d], ...m,
        prompt: `$f(x) = ${fx(a, b)}$ and $g(x) = ${fx(c, d)}$. Which expression is $f(x) + g(x)$?`,
        hint: "Add the $x$-terms, then add the constants.",
        solution: `$(${fx(a, b)}) + (${fx(c, d)}) = \\mathbf{${lin(a + c, b + d)}}$` };
    } });

  add({ id: "u3.co.subtract", skill: "u3.combine", level: L.I, type: "mcq", calc: false,
    make(r) {
      const a = r.intNot(-5, 8, [0]), b = r.int(-9, 9), c = r.intNot(-5, 8, [0, a]), d = r.intNot(-9, 9, [0]);
      const m = mcq(`$${lin(a - c, b - d)}$`, [
        { text: `$${lin(a - c, b + d)}$`, why: "Subtract all of $g(x)$: the constant changes sign too." },
        { text: `$${lin(a + c, b - d)}$`, why: "Subtract the $x$-terms too." },
        { text: `$${lin(c - a, d - b)}$`, why: "That is $g(x) - f(x)$." },
      ], r, [{ text: `$${lin(a - c, d - b)}$`, why: "Distribute the minus sign to every term of $g(x)$." }]);
      return { key: [a, b, c, d], ...m,
        prompt: `$f(x) = ${fx(a, b)}$ and $g(x) = ${fx(c, d)}$. Which expression is $f(x) - g(x)$?`,
        hint: "Put $g(x)$ in parentheses and distribute the minus sign.",
        solution: `$(${fx(a, b)}) - (${fx(c, d)}) = ${fx(a, b)} ${c < 0 ? "+" : "-"} ${Math.abs(c) === 1 ? "" : Math.abs(c)}x ${d < 0 ? "+" : "-"} ${Math.abs(d)} = \\mathbf{${lin(a - c, b - d)}}$` };
    } });

  add({ id: "u3.co.table", skill: "u3.combine", level: L.I, type: "numeric", calc: false,
    make(r) {
      const xs = [0, 1, 2, 3, 4], fv = xs.map(() => r.int(-6, 15)), gv = xs.map(() => r.int(-6, 15));
      const i = r.int(0, 4), j = r.int(0, 4), kind = r.int(0, 2);
      const [expr, val, work] = kind === 0 ? [`(f + g)(${xs[i]})`, fv[i] + gv[i], `$f(${xs[i]}) + g(${xs[i]}) = ${fv[i]} + ${paren(gv[i])}$`]
        : kind === 1 ? [`(f - g)(${xs[i]})`, fv[i] - gv[i], `$f(${xs[i]}) - g(${xs[i]}) = ${fv[i]} - ${paren(gv[i])}$`]
          : [`f(${xs[i]}) + g(${xs[j]})`, fv[i] + gv[j], `$f(${xs[i]}) + g(${xs[j]}) = ${fv[i]} + ${paren(gv[j])}$`];
      return { key: [fv, gv, i, j, kind], answer: val,
        table: { headers: ["$x$", "$f(x)$", "$g(x)$"], rows: xs.map((x, k) => [String(x), String(fv[k]), String(gv[k])]) },
        prompt: `Use the table. What is $${expr}$?`,
        hint: "$(f + g)(x)$ means $f(x) + g(x)$.",
        solution: `${work} = **${val}**` };
    } });

  add({ id: "u3.co.profit", skill: "u3.combine", level: L.H, type: "mcq", calc: false,
    make(r) {
      const item = r.pick(["T-shirts", "bracelets", "candles", "phone cases"]);
      const p = r.int(12, 30), c = r.int(3, p - 4), F = r.int(5, 40) * 10;
      const m = mcq(`$P(x) = ${p - c}x - ${F}$`, [
        { text: `$P(x) = ${p - c}x + ${F}$`, why: "The fixed cost is subtracted, because $C(x)$ is subtracted." },
        { text: `$P(x) = ${p + c}x - ${F}$`, why: "Subtract the cost per item." },
        { text: `$P(x) = ${p + c}x + ${F}$`, why: "Profit is revenue minus cost: $R(x) - C(x)$." },
      ], r);
      return { key: [p, c, F, item], ...m,
        prompt: `A student sells ${item}. Revenue is $R(x) = ${p}x$ and cost is $C(x) = ${c}x + ${F}$, in dollars, for $x$ ${item}. Profit is revenue minus cost. Which function gives the profit $P(x)$?`,
        hint: "$P(x) = R(x) - C(x)$. Distribute the minus sign.",
        solution: `$P(x) = ${p}x - (${c}x + ${F}) = \\mathbf{${p - c}x - ${F}}$` };
    } });

  add({ id: "u3.co.multiply", skill: "u3.combine", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.intNot(-5, 6, [0, 1]), b = r.intNot(-7, 7, [0]);
      const m = mcq(`$${a}x^2 ${signed(a * b)}x$`, [
        { text: `$${a}x^2 ${signed(b)}$`, why: `Multiply ${a}x by both terms: $${a}x \\cdot ${paren(b)} = ${a * b}x$.` },
        { text: `$${lin(a + 1, b)}$`, why: "That adds the functions. Multiplying gives an $x^2$ term." },
        { text: `$${a}x^2 ${signed(a * b)}$`, why: `$${a}x \\cdot ${paren(b)}$ still has an $x$.` },
      ], r);
      return { key: [a, b], ...m,
        prompt: `$f(x) = ${a}x$ and $g(x) = ${lin(1, b)}$. Which expression is $f(x) \\cdot g(x)$?`,
        hint: "Distribute $f(x)$ to each term of $g(x)$.",
        solution: `$${a}x(x ${signed(b)}) = ${a}x \\cdot x + ${a}x \\cdot ${paren(b)} = \\mathbf{${a}x^2 ${signed(a * b)}x}$` };
    } });

  add({ id: "u3.co.break-even", skill: "u3.combine", level: L.C, type: "numeric", calc: false,
    make(r) {
      const p = r.int(8, 25), c = r.int(2, p - 3), n = r.int(10, 60), F = (p - c) * n, goal = r.chance(0.5) ? 0 : r.int(2, 10) * 10;
      const ans = Math.ceil((F + goal) / (p - c));
      return { key: [p, c, n, goal], answer: ans,
        prompt: `A club's revenue is $R(x) = ${p}x$ and its cost is $C(x) = ${c}x + ${F}$, in dollars, for $x$ items sold. What is the least number of items the club must sell so that $R(x) - C(x) ${goal ? `\\ge ${goal}` : "\\ge 0"}$?`,
        hint: "Write $R(x) - C(x)$ as one expression first.",
        solution: `$R(x) - C(x) = ${p - c}x - ${F}$. ${goal ? `$${p - c}x - ${F} \\ge ${goal}$ gives $x \\ge \\frac{${F + goal}}{${p - c}}${(F + goal) % (p - c) ? ` \\approx ${fmt(Math.round(((F + goal) / (p - c)) * 100) / 100)}` : ""}$` : `$${p - c}x - ${F} \\ge 0$ gives $x \\ge ${F / (p - c)}$`}. The least whole number is **${ans}**.` };
    } });

  add({ id: "u3.co.graph-sum", skill: "u3.combine", level: L.C, type: "numeric", calc: false,
    make(r) {
      const m1 = r.pick([1, 2, -1, 0.5, -2]), b1 = r.int(-3, 3), m2 = r.pick([1, -1, 2, -0.5, 3]), b2 = r.int(-3, 3), k = r.pick([-2, 2, 4, -4, 0]);
      const f = (x) => m1 * x + b1, g = (x) => m2 * x + b2, op = r.pick(["+", "-"]);
      if (!Number.isInteger(f(k)) || !Number.isInteger(g(k)) || Math.abs(f(k)) > 7 || Math.abs(g(k)) > 7 || m1 === m2) return this.make(r);
      const v = op === "+" ? f(k) + g(k) : f(k) - g(k);
      return { key: [m1, b1, m2, b2, k, op], answer: v,
        graph: { window: W, paths: [{ pts: [[-7, f(-7)], [7, f(7)]] }, { pts: [[-7, g(-7)], [7, g(7)]], alt: true, dashed: true }] },
        prompt: `The graphs of $f$ (solid) and $g$ (dashed) are shown. What is $(f ${op} g)(${k})$?`,
        hint: `Read $f(${k})$ and $g(${k})$ from the graphs.`,
        solution: `$f(${k}) = ${f(k)}$ and $g(${k}) = ${g(k)}$. $(f ${op} g)(${k}) = ${f(k)} ${op} ${paren(g(k))} = \\mathbf{${v}}$` };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  add({ id: "u3.th.find-error", skill: "u3.notation", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.intNot(-6, 6, [0, 1, -1]), b = r.intNot(-12, 12, [0]), x = r.int(-6, 8), k = a * x + b, kind = r.int(0, 3);
      const s1 = kind === 0 ? `$${lin(a, b)} = ${k}$ becomes $${a}x = ${k + b}$` : `$${lin(a, b)} = ${k}$ becomes $${a}x = ${k - b}$`;
      const lhs = kind === 0 ? k + b : k - b;
      const s2 = kind === 1 ? `$x = ${lhs} \\cdot ${paren(a)} = ${lhs * a}$` : `$x = ${lhs} \\div ${paren(a)} = ${tex(lhs / a)}$`;
      const xx = kind === 1 ? lhs * a : lhs / a;
      const s3 = kind === 2 ? `So $g(${tex(xx)}) = ${k}$, and the answer is $${k}$.` : `So the answer is $x = ${tex(xx)}$.`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = [`To undo $${signed(b)}$, ${b > 0 ? "subtract" : "add"} ${Math.abs(b)} on both sides.`, `To undo multiplying by ${a}, divide by ${a}.`, "The question asks for the input $x$, not the output."][Math.max(0, bad)];
      const f = findStep([s1, s2, s3], bad, whyWrong);
      return { key: [a, b, x, kind], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `$g(x) = ${lin(a, b)}$. Sam solved "For what $x$ is $g(x) = ${k}$?" like this:<br>${f.stepsText}<br>Where is Sam's first mistake?`,
        hint: "Redo each step yourself.",
        solution: `$${lin(a, b)} = ${k}$, so $${a}x = ${k - b}$ and $x = ${x}$.<br>` + (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  add({ id: "u3.th.f-of-sum", skill: "u3.notation", level: L.C, type: "mcq", calc: false,
    make(r) {
      const a = r.intNot(-5, 6, [0, 1]), b = r.intNot(-9, 9, [0]), p = r.int(1, 6), q = r.int(1, 6);
      const lhs = a * (p + q) + b, rhs = a * p + b + a * q + b;
      const right = `No. $f(${p + q}) = ${lhs}$ but $f(${p}) + f(${q}) = ${rhs}$, because the constant ${b} is counted twice on the right.`;
      const m = mcq(right, [
        { text: `Yes. Function notation works like multiplication, so $f(${p} + ${q}) = f(${p}) + f(${q})$.`, why: "$f(\\ldots)$ means \"put this input into f\", not \"multiply by f\"." },
        { text: `Yes, because ${p} + ${q} = ${p + q} on both sides.`, why: `Compute both sides: ${lhs} and ${rhs}.` },
        { text: `No, because $f(${p + q})$ is ${lhs + 1} and $f(${p}) + f(${q})$ is ${rhs}.`, why: `$f(${p + q}) = ${a}(${p + q}) ${signed(b)} = ${lhs}$.` },
      ], r);
      return { key: [a, b, p, q], ...m, think: true,
        prompt: `$f(x) = ${lin(a, b)}$. Is $f(${p} + ${q})$ equal to $f(${p}) + f(${q})$? Pick the answer with the correct reason.`,
        hint: "Work out both sides.",
        solution: `$f(${p + q}) = ${a}(${p + q}) ${signed(b)} = ${lhs}$. $f(${p}) + f(${q}) = ${a * p + b} + ${paren(a * q + b)} = ${rhs}$. **${right}**` };
    } });

  add({ id: "u3.th.make-true", skill: "u3.features", level: L.C, type: "numeric", calc: false,
    make(r) {
      const P = zigzag(r, { pieces: 3 });
      const k = r.int(P.min + 1, P.max - 1), want = r.pick(["up", "down"]);
      const xs = [];
      for (const u of P.runs) if ((want === "up") === u.up) for (let x = u.a; x < u.b; x++) if (x > u.a && P.f(x) > k) xs.push(x);
      if (xs.length < 2) return this.make(r);
      return { key: [P.xs, P.ys, k, want], answer: xs[0], accept: { in: xs }, think: true, graph: graphOf(P),
        prompt: `The whole graph of $y = f(x)$ is shown. Give **one** whole number $x$ where $f$ is ${want === "up" ? "increasing" : "decreasing"} **and** $f(x) > ${k}$.`,
        hint: "First find the intervals where the graph goes the right way. Then look above the line $y = " + k + "$.",
        solution: `$f$ is ${want === "up" ? "increasing" : "decreasing"} on ${P.runs.filter((u) => (want === "up") === u.up).map((u) => `$(${u.a}, ${u.b})$`).join(" and ")}. Of those whole numbers, these have $f(x) > ${k}$: **${xs.join(", ")}**. Any one of them is correct.` };
    } });

  const U3_ASN = [
    { s: "A function's maximum value happens at the right end of its domain.",
      right: "Sometimes true: it does for an increasing line on $[0, 5]$, but a hill-shaped graph peaks in the middle.",
      wrong: ["Always true: the graph ends at its highest point.", "Never true: the maximum is always in the middle.", "Always true: x-values get larger to the right."] },
    { s: "If $f(a) = f(b)$ and $a \\ne b$, then $f$ is not a function.",
      right: "Never true: two inputs can share an output. A function only forbids one input having two outputs.",
      wrong: ["Always true: each output must come from one input.", "Sometimes true: only when $a$ and $b$ are close together.", "Always true: that fails the vertical line test."] },
    { s: "The range of a linear function with domain $[0, 4]$ is a closed interval.",
      right: "Always true: the outputs run between $f(0)$ and $f(4)$, and both are reached. (If the slope is 0, the range is the single number $f(0)$.)",
      wrong: ["Never true: lines go on forever.", "Sometimes true: only when the slope is positive.", "Sometimes true: only when $f(0) = 0$."] },
    { s: "A graph that is increasing on $(0, 3)$ and decreasing on $(3, 6)$ has its maximum at $x = 3$.",
      right: "Sometimes true: it is the highest point of that hill, but the graph could go higher somewhere else outside $(0, 6)$.",
      wrong: ["Always true: going up then down makes a maximum.", "Never true: the maximum is a y-value, not an x-value.", "Always true: a turning point is always the maximum."] },
    { s: "If $f$ and $g$ are linear functions, then $f(x) + g(x)$ is a linear function.",
      right: "Always true: adding two expressions of the form $mx + b$ gives another one of that form. (It may be a constant, which is still linear.)",
      wrong: ["Sometimes true: only when both slopes are positive.", "Never true: adding makes an $x^2$ term.", "Sometimes true: only when the lines cross."] },
    { s: "If $f(x) = 3x$, then $f(2x) = 2f(x)$.",
      right: "Always true: $f(2x) = 6x$ and $2f(x) = 2(3x) = 6x$.",
      wrong: ["Never true: the 2 is in different places.", "Sometimes true: only when $x = 0$.", "Sometimes true: only for positive $x$."] },
  ];
  add({ id: "u3.th.always", skill: "u3.features", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U3_ASN.length - 1), it = U3_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Try a few examples, including unusual ones.",
        solution: `**${it.right}**` };
    } });

  M1.units.u3 = Object.assign(M1.units.u3 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
