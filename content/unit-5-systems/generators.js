/* Unit 5 Systems of Equations & Inequalities: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, lin, pt, box, findStep, paren, terms2 } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);
  const W = box(-8, 8);
  const OPS = { "<": "<", ">": ">", "<=": "\\le", ">=": "\\ge" };
  const holds = (op, a, b) => (op === "<" ? a < b : op === "<=" ? a <= b : op === ">" ? a > b : a >= b);
  const line = (m, b) => ({ pts: [[-9, -9 * m + b], [9, 9 * m + b]] });
  const SL = [1, 2, 3, -1, -2, -3, 0.5, -0.5, 1 / 3, -1 / 3, 2 / 3, -2 / 3, 1.5, -1.5];
  // shaded half-plane above (or below) y = mx + b
  const half = (m, b, above) => { const Y = above ? 60 : -60; return [[-9, -9 * m + b], [9, 9 * m + b], [9, Y], [-9, Y]]; };
  const std = (a, b, c) => `${terms2(a, b)} = ${c}`;

  // ───────────────────────── Solving linear systems ─────────────────────────
  add({ id: "u5.so.substitute", skill: "u5.solve", level: L.B, type: "numeric", calc: false,
    make(r) {
      const x = r.int(-6, 8), m = r.intNot(-4, 5, [0]), k = r.int(-6, 6), y = m * x + k, a = r.intNot(-3, 4, [0]), b = r.intNot(-3, 4, [0]);
      if (a + b * m === 0) return this.make(r);
      const askX = r.chance(0.5);
      return { key: [x, m, k, a, b, askX], answer: askX ? x : y,
        prompt: `Solve the system. What is the value of $${askX ? "x" : "y"}$?<br>$y = ${lin(m, k)}$<br>$${terms2(a, b)} = ${a * x + b * y}$`,
        hint: "Replace $y$ in the second equation with the first expression.",
        solution: `$${a === 1 ? "" : a === -1 ? "-" : a}x ${b < 0 ? "-" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}(${lin(m, k)}) = ${a * x + b * y}$, so $${lin(a + b * m, b * k)} = ${a * x + b * y}$ and $x = ${x}$. Then $y = ${lin(m, k)} = ${y}$. ${askX ? `$x = \\mathbf{${x}}$` : `$y = \\mathbf{${y}}$`}` };
    } });

  add({ id: "u5.so.check-point", skill: "u5.solve", level: L.B, type: "mcq", calc: false,
    make(r) {
      const x = r.int(-5, 6), y = r.int(-5, 6), a = r.intNot(-4, 4, [0]), b = r.intNot(-4, 4, [0]), c = r.intNot(-4, 4, [0]), d = r.intNot(-4, 4, [0]);
      if (a * d - b * c === 0) return this.make(r);
      const e1 = a * x + b * y, e2 = c * x + d * y;
      const right = `$${pt([x, y])}$`;
      const P1 = [x + 1, y + (a * 1 === 0 ? 0 : -1)], cand = [[y, x], [x + b, y - a], [x + d, y - c], [x, y + 1], [x - 1, y]];
      const wrong = cand.filter((p) => !(a * p[0] + b * p[1] === e1 && c * p[0] + d * p[1] === e2)).map((p) => ({ text: `$${pt(p)}$`, why: `Check both equations: ${a * p[0] + b * p[1] === e1 ? "it works in the first but not the second" : c * p[0] + d * p[1] === e2 ? "it works in the second but not the first" : "it fails both"}.` }));
      const m = mcq(right, wrong, r);
      return { key: [x, y, a, b, c, d, P1], ...m,
        prompt: `Which point is the solution of the system?<br>$${std(a, b, e1)}$<br>$${std(c, d, e2)}$`,
        hint: "A solution must make **both** equations true. Substitute each point.",
        solution: `$${pt([x, y])}$: $${a}(${x}) + ${paren(b)}(${y}) = ${e1}$ ✓ and $${c}(${x}) + ${paren(d)}(${y}) = ${e2}$ ✓. **${right}**` };
    } });

  add({ id: "u5.so.eliminate", skill: "u5.solve", level: L.I, type: "numeric", calc: false,
    make(r) {
      const x = r.int(-6, 8), y = r.int(-6, 8), a = r.intNot(-5, 5, [0]), b = r.intNot(1, 5, []), c = r.intNot(-5, 5, [0, -a]);
      const e1 = a * x + b * y, e2 = c * x - b * y, askX = r.chance(0.5);
      return { key: [x, y, a, b, c, askX], answer: askX ? x : y,
        prompt: `Solve the system. What is the value of $${askX ? "x" : "y"}$?<br>$${std(a, b, e1)}$<br>$${std(c, -b, e2)}$`,
        hint: "Add the two equations. The $y$-terms cancel.",
        solution: `Add: $${lin(a + c, 0)} = ${e1 + e2}$, so $x = ${x}$. Substitute: $${a}(${x}) + ${b === 1 ? "" : b}y = ${e1}$ gives $y = ${y}$. ${askX ? `$x = \\mathbf{${x}}$` : `$y = \\mathbf{${y}}$`}` };
    } });

  add({ id: "u5.so.plot-solution", skill: "u5.solve", level: L.I, type: "plot", calc: false,
    make(r) {
      const X = r.int(-5, 5), Y = r.int(-5, 5), m1 = r.pick(SL), m2 = r.pick(SL.filter((s) => s !== m1));
      const b1 = Y - m1 * X, b2 = Y - m2 * X;
      if (!Number.isInteger(b1) || !Number.isInteger(b2) || Math.abs(b1) > 9 || Math.abs(b2) > 9) return this.make(r);
      return { key: [X, Y, m1, m2], answer: [[X, Y]],
        plot: { window: W, paths: [line(m1, b1), { ...line(m2, b2), alt: true, dashed: true }] },
        prompt: `The graphs of $y = ${lin(m1, b1)}$ (solid) and $y = ${lin(m2, b2)}$ (dashed) are shown. Plot the solution of the system.`,
        hint: "The solution is where the two lines cross.",
        solution: `The lines cross at $${pt([X, Y])}$. Check: $${lin(m1, b1).replace(/x/g, `(${X})`)} = ${Y}$ and $${lin(m2, b2).replace(/x/g, `(${X})`)} = ${Y}$. **${pt([X, Y])}**` };
    } });

  add({ id: "u5.so.multiply", skill: "u5.solve", level: L.H, type: "numeric", calc: false,
    make(r) {
      const x = r.int(-6, 7), y = r.int(-6, 7), a = r.intNot(-5, 5, [0]), b = r.intNot(-5, 5, [0]), c = r.intNot(-5, 5, [0]), d = r.intNot(-5, 5, [0]);
      if (a * d - b * c === 0 || Math.abs(a) === Math.abs(c) || Math.abs(b) === Math.abs(d)) return this.make(r);
      const e1 = a * x + b * y, e2 = c * x + d * y;
      return { key: [x, y, a, b, c, d], answer: x + y,
        prompt: `$${std(a, b, e1)}$<br>$${std(c, d, e2)}$<br>If $(x, y)$ is the solution of the system, what is $x + y$?`,
        hint: "Multiply one or both equations so that one variable cancels when you add or subtract.",
        solution: `Multiply the first by ${d} and the second by ${b}: $${lin(a * d, 0)} ${b * d < 0 ? "-" : "+"} ${Math.abs(b * d)}y = ${e1 * d}$ and $${lin(c * b, 0)} ${b * d < 0 ? "-" : "+"} ${Math.abs(b * d)}y = ${e2 * b}$. Subtract: $${lin(a * d - c * b, 0)} = ${e1 * d - e2 * b}$, so $x = ${x}$, then $y = ${y}$. $x + y = \\mathbf{${x + y}}$` };
    } });

  add({ id: "u5.so.sat-combo", skill: "u5.solve", level: L.C, type: "numeric", calc: false,
    make(r) {
      // a x + b y = p, c x + d y = q with (a+c, b+d) a multiple of a nice target, ask for k(x + y) or (x - y)
      const x = r.int(-6, 9), y = r.int(-6, 9), k = r.int(2, 5), s = r.pick([1, -1]);
      const a = r.int(1, 6), b = r.int(-4, 6), c = k - a, d = s * k - b;
      if (a * d - b * c === 0 || c === 0 || d === 0 || b === 0) return this.make(r);
      const p = a * x + b * y, q = c * x + d * y;
      const ask = s === 1 ? `${k}x + ${k}y` : `${k}x - ${k}y`, ans = s === 1 ? k * (x + y) : k * (x - y);
      return { key: [x, y, k, s, a, b], answer: ans, think: true,
        prompt: `$${std(a, b, p)}$<br>$${std(c, d, q)}$<br>Based on the system, what is the value of $${ask}$?`,
        hint: "Before solving, look at what happens when you add the two equations.",
        solution: `Add the equations: $${terms2(a + c, b + d)} = ${p + q}$, which is $${ask} = \\mathbf{${ans}}$. No need to find $x$ and $y$ separately (they are ${x} and ${y}).` };
    } });

  add({ id: "u5.so.parameter", skill: "u5.solve", level: L.C, type: "numeric", calc: false,
    make(r) {
      const x = r.intNot(-5, 6, [0]), y = r.int(-6, 6), a = r.intNot(-5, 6, [0]), b = r.intNot(-4, 4, [0]), d = r.intNot(-4, 5, [0]);
      const p = a * x + b * y, c = r.intNot(-5, 5, [0]), q = c * x + d * y;
      if (a * d - b * c === 0) return this.make(r);
      return { key: [x, y, a, b, c, d], answer: a,
        prompt: `The system below has the solution $(${x}, y)$ for some $y$. What is the value of $a$?<br>$ax ${b < 0 ? "-" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}y = ${p}$<br>$${std(c, d, q)}$`,
        hint: "Use the second equation to find $y$ first.",
        solution: `$${c}(${x}) + ${paren(d)}y = ${q}$ gives $y = ${y}$. Then $a(${x}) + ${paren(b)}(${y}) = ${p}$, so $${x}a = ${p - b * y}$ and $a = \\mathbf{${a}}$.` };
    } });

  // ───────────────────────── Standard form and intercepts ─────────────────────────
  function stdLine(r) {
    for (;;) {
      const xi = r.intNot(-8, 8, [0]), yi = r.intNot(-8, 8, [0]);
      // a x + b y = c with intercepts xi, yi: a = yi*k, b = xi*k, c = xi*yi*k (reduce)
      let a = yi, b = xi, c = xi * yi;
      const g = M1.qlib.gcd(M1.qlib.gcd(a, b), c);
      a /= g; b /= g; c /= g;
      if (a < 0) { a = -a; b = -b; c = -c; }
      if (Math.abs(a) <= 9 && Math.abs(b) <= 9) return { a, b, c, xi, yi };
    }
  }
  add({ id: "u5.st.intercept", skill: "u5.standard", level: L.B, type: "numeric", calc: false,
    make(r) {
      const S = stdLine(r), askX = r.chance(0.5);
      return { key: [S.a, S.b, S.c, askX], answer: askX ? S.xi : S.yi,
        prompt: `What is the ${askX ? "$x$" : "$y$"}-intercept of $${std(S.a, S.b, S.c)}$? Give the ${askX ? "$x$" : "$y$"}-value.`,
        hint: askX ? "On the x-axis, $y = 0$." : "On the y-axis, $x = 0$.",
        solution: askX ? `Set $y = 0$: $${S.a === 1 ? "" : S.a}x = ${S.c}$, so $x = \\mathbf{${S.xi}}$.` : `Set $x = 0$: $${S.b === 1 ? "" : S.b === -1 ? "-" : S.b}y = ${S.c}$, so $y = \\mathbf{${S.yi}}$.` };
    } });

  add({ id: "u5.st.plot-intercepts", skill: "u5.standard", level: L.I, type: "plot", calc: false,
    make(r) {
      const S = stdLine(r);
      return { key: [S.a, S.b, S.c], answer: [[S.xi, 0], [0, S.yi]],
        plot: { window: W },
        prompt: `Plot the $x$-intercept and the $y$-intercept of $${std(S.a, S.b, S.c)}$.`,
        hint: "Set $y = 0$ to find one intercept and $x = 0$ to find the other.",
        solution: `$y = 0$: $x = ${S.xi}$, so $(${S.xi}, 0)$. $x = 0$: $y = ${S.yi}$, so $(0, ${S.yi})$. Plot **$(${S.xi}, 0)$ and $(0, ${S.yi})$**.` };
    } });

  add({ id: "u5.st.to-slope", skill: "u5.standard", level: L.I, type: "mcq", calc: false,
    make(r) {
      const S = stdLine(r), m = -S.a / S.b, k = S.c / S.b;
      const right = `$y = ${lin(m, k)}$`;
      const mm = mcq(right, [
        { text: `$y = ${lin(-m, k)}$`, why: "Moving the $x$-term to the other side changes its sign." },
        { text: `$y = ${lin(-S.a, S.c)}$`, why: `Divide every term by ${S.b}.` },
        { text: `$y = ${lin(m, S.c)}$`, why: `Divide the constant by ${S.b} too.` },
      ], r, [{ text: `$y = ${lin(-S.b / S.a, S.c / S.a)}$`, why: "Solve for $y$, not $x$." }, { text: `$y = ${lin(m, -k)}$`, why: "Check the sign of the constant." }, { text: `$y = ${lin(m, k + 1)}$`, why: "Divide the constant carefully." }, { text: `$y = ${lin(m + 1, k)}$`, why: "Divide the $x$-coefficient carefully." }]);
      return { key: [S.a, S.b, S.c], ...mm,
        prompt: `Which equation is the same line as $${std(S.a, S.b, S.c)}$?`,
        hint: "Solve for $y$.",
        solution: `$${S.b === 1 ? "" : S.b === -1 ? "-" : S.b}y = ${lin(-S.a, S.c)}$, so **${right}**.` };
    } });

  const STD_CTX = [
    { s: (a, b, c) => `A store sells small candles for \\$${a} and large candles for \\$${b}. Ana spends exactly \\$${c}. The equation $${a}x + ${b}y = ${c}$ shows $x$ small and $y$ large candles.`, xi: (v) => `Ana buys ${v} small candles and no large candles.`, yi: (v) => `Ana buys ${v} large candles and no small candles.` },
    { s: (a, b, c) => `Points in a game: ${a} for each coin and ${b} for each gem. Leo scored exactly ${c} points. The equation $${a}x + ${b}y = ${c}$ shows $x$ coins and $y$ gems.`, xi: (v) => `Leo got ${v} coins and no gems.`, yi: (v) => `Leo got ${v} gems and no coins.` },
    { s: (a, b, c) => `A runner trains ${a} minutes per run day and ${b} minutes per swim day, for exactly ${c} minutes in a month. The equation $${a}x + ${b}y = ${c}$ shows $x$ run days and $y$ swim days.`, xi: (v) => `${v} run days and no swim days.`, yi: (v) => `${v} swim days and no run days.` },
  ];
  add({ id: "u5.st.interpret", skill: "u5.standard", level: L.H, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, STD_CTX.length - 1), C = STD_CTX[i], a = r.int(2, 8), b = r.intNot(2, 9, [a]), n = r.int(2, 6), c = a * b * n, askX = r.chance(0.5);
      if (a * n === b || b * n === a) return this.make(r);
      const right = askX ? C.xi(c / a) : C.yi(c / b);
      const mm = mcq(right, [
        { text: askX ? C.yi(c / a) : C.xi(c / b), why: `The ${askX ? "$x$" : "$y$"}-intercept has ${askX ? "$y = 0$" : "$x = 0$"}, so only ${askX ? "$x$" : "$y$"} is nonzero.` },
        { text: askX ? C.xi(c / b) : C.yi(c / a), why: `Divide ${c} by the ${askX ? `${a}` : `${b}`} in front of ${askX ? "$x$" : "$y$"}.` },
        { text: askX ? C.xi(a) : C.yi(b), why: "That is the cost or value of one item, not the intercept." },
      ], r);
      return { key: [i, a, b, n, askX], ...mm,
        prompt: `${C.s(a, b, c)} What does the ${askX ? "$x$" : "$y$"}-intercept of the graph mean?`,
        hint: askX ? "At the x-intercept, $y = 0$." : "At the y-intercept, $x = 0$.",
        solution: `${askX ? `$y = 0$: $${a}x = ${c}$, $x = ${c / a}$.` : `$x = 0$: $${b}y = ${c}$, $y = ${c / b}$.`} **${right}**` };
    } });

  add({ id: "u5.st.combos", skill: "u5.standard", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(2, 6), b = r.intNot(2, 9, [a]), c = a * b * r.int(1, 3) + a * r.int(0, 3);
      let n = 0; const list = [];
      for (let x = 0; x * a <= c; x++) if ((c - a * x) % b === 0) { n++; list.push(`(${x}, ${(c - a * x) / b})`); }
      if (n < 2) return this.make(r);
      return { key: [a, b, c], answer: n, think: true,
        prompt: `Tickets cost \\$${a} for students and \\$${b} for adults. A group spent exactly \\$${c}. How many different combinations $(x, y)$ of student tickets $x$ and adult tickets $y$ are possible? (Each is a whole number, and either can be 0.)`,
        hint: `List the whole-number solutions of $${a}x + ${b}y = ${c}$.`,
        solution: `Try $x = 0, 1, 2, \\ldots$ and keep the ones where $${c} - ${a}x$ is a multiple of ${b}: ${list.join(", ")}. **${n}** combinations.` };
    } });

  // ───────────────────────── Graphing inequalities and systems ─────────────────────────
  add({ id: "u5.ie.which-point", skill: "u5.ineq2", level: L.B, type: "mcq", calc: false,
    make(r) {
      const m = r.intNot(-3, 3, [0]), b = r.int(-4, 4), op = r.pick(["<", ">", "<=", ">="]);
      const pts = []; for (let k = 0; k < 40 && pts.length < 12; k++) { const p = [r.int(-5, 5), r.int(-6, 6)]; if (!pts.some((q) => q[0] === p[0] && q[1] === p[1])) pts.push(p); }
      const ok = pts.filter((p) => holds(op, p[1], m * p[0] + b)), bad = pts.filter((p) => !holds(op, p[1], m * p[0] + b));
      if (!ok.length || bad.length < 3) return this.make(r);
      const P = ok[0];
      const mm = mcq(`$${pt(P)}$`, bad.slice(0, 3).map((p) => ({ text: `$${pt(p)}$`, why: `$${p[1]} ${OPS[op]} ${m}(${p[0]}) ${signed(b)}$ is false.` })), r);
      return { key: [m, b, op, pts], ...mm,
        prompt: `Which point is a solution of $y ${OPS[op]} ${lin(m, b)}$?`,
        hint: "Substitute each point and check whether the inequality is true.",
        solution: `$${P[1]} ${OPS[op]} ${m}(${P[0]}) ${signed(b)} = ${m * P[0] + b}$ is true. **${pt(P)}**` };
    } });

  add({ id: "u5.ie.describe", skill: "u5.ineq2", level: L.I, type: "mcq", calc: false,
    make(r) {
      const m = r.pick(SL), b = r.int(-5, 5), op = r.pick(["<", ">", "<=", ">="]);
      const solid = op.includes("="), above = op[0] === ">";
      const opts = [["solid", "above"], ["solid", "below"], ["dashed", "above"], ["dashed", "below"]].map(([l, s]) => `A ${l} line, shaded ${s} the line`);
      const ans = (solid ? 0 : 2) + (above ? 0 : 1);
      return { key: [m, b, op], choices: opts, answer: ans, why: opts.map((_, i) => (i === ans ? "Correct." : "Solid for $\\le$ or $\\ge$, dashed for $<$ or $>$. Shade above for $y >$ or $y \\ge$, below for $y <$ or $y \\le$.")),
        prompt: `How should the graph of $y ${OPS[op]} ${lin(m, b)}$ look?`,
        hint: "Does the line itself count? Which side has the bigger $y$-values?",
        solution: `${solid ? "Points on the line count, so the line is solid" : "Points on the line do not count, so the line is dashed"}. $y$ is ${above ? "greater" : "less"} than the line, so shade **${above ? "above" : "below"}**. **${opts[ans]}**.` };
    } });

  add({ id: "u5.ie.graph-to-ineq", skill: "u5.ineq2", level: L.H, type: "graph-mcq", calc: false,
    make(r) {
      const m = r.pick(SL), b = r.int(-4, 4), op = r.pick(["<", ">", "<=", ">="]);
      const solid = op.includes("="), above = op[0] === ">";
      const flip = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" }, strict = { "<": "<=", "<=": "<", ">": ">=", ">=": ">" };
      const mm = mcq(`$y ${OPS[op]} ${lin(m, b)}$`, [
        { text: `$y ${OPS[flip[op]]} ${lin(m, b)}$`, why: `The shading is ${above ? "above" : "below"} the line.` },
        { text: `$y ${OPS[strict[op]]} ${lin(m, b)}$`, why: `The line is ${solid ? "solid, so the line is included" : "dashed, so the line is not included"}.` },
        { text: `$y ${OPS[op]} ${lin(-m, b)}$`, why: "Check the slope: rise over run, and its sign." },
      ], r, [{ text: `$y ${OPS[op]} ${lin(m, -b)}$`, why: "Read the y-intercept again." }]);
      return { key: [m, b, op], ...mm,
        graph: { window: W, paths: [{ ...line(m, b), dashed: !solid }], shade: [half(m, b, above)] },
        prompt: "Which inequality is shown by the graph?",
        hint: "Find the slope and y-intercept. Then check the line (solid or dashed) and the side that is shaded.",
        solution: `Line: $y = ${lin(m, b)}$. It is ${solid ? "solid" : "dashed"} and shaded ${above ? "above" : "below"}. **$y ${OPS[op]} ${lin(m, b)}$**` };
    } });

  add({ id: "u5.ie.system-points", skill: "u5.ineq2", level: L.H, type: "multi", calc: false,
    make(r) {
      const m1 = r.intNot(-2, 2, [0]), b1 = r.int(-3, 3), op1 = r.pick(["<", ">=", ">", "<="]), m2 = r.intNot(-2, 2, [0, m1]), b2 = r.int(-3, 3), op2 = r.pick(["<", ">=", ">", "<="]);
      const ins = (p) => holds(op1, p[1], m1 * p[0] + b1) && holds(op2, p[1], m2 * p[0] + b2);
      const pts = []; for (let k = 0; k < 60 && pts.length < 5; k++) { const p = [r.int(-4, 4), r.int(-5, 5)]; if (!pts.some((q) => q[0] === p[0] && q[1] === p[1])) pts.push(p); }
      const items = pts.map((p) => ({ text: `$${pt(p)}$`, ok: ins(p) }));
      if (items.filter((i) => i.ok).length < 1 || items.every((i) => i.ok)) return this.make(r);
      const mm = multi(items, r);
      return { key: [m1, b1, op1, m2, b2, op2, pts], ...mm,
        prompt: `Select **all** points that are solutions of the system:<br>$y ${OPS[op1]} ${lin(m1, b1)}$<br>$y ${OPS[op2]} ${lin(m2, b2)}$`,
        hint: "A solution must make **both** inequalities true.",
        solution: pts.map((p) => `$${pt(p)}$: ${holds(op1, p[1], m1 * p[0] + b1) ? "✓" : "✗"} first, ${holds(op2, p[1], m2 * p[0] + b2) ? "✓" : "✗"} second`).join("; ") + "." };
    } });

  add({ id: "u5.ie.system-graph", skill: "u5.ineq2", level: L.C, type: "graph-mcq", calc: false,
    make(r) {
      const m1 = r.pick(SL), b1 = r.int(-3, 4), m2 = r.pick(SL.filter((s) => s !== m1)), b2 = r.int(-4, 3), a1 = r.chance(0.5), a2 = r.chance(0.5), s1 = r.chance(0.5), s2 = r.chance(0.5);
      const op = (above, solid) => (above ? (solid ? ">=" : ">") : solid ? "<=" : "<");
      const sys = (A1, A2) => `$y ${OPS[op(A1, s1)]} ${lin(m1, b1)}$ and $y ${OPS[op(A2, s2)]} ${lin(m2, b2)}$`;
      const choices = [sys(a1, a2), sys(!a1, a2), sys(a1, !a2), sys(!a1, !a2)];
      const mm = mcq(choices[0], choices.slice(1).map((t) => ({ text: t, why: "The solution region is where both shadings overlap. Check which side of each line is shaded." })), r);
      return { key: [m1, b1, m2, b2, a1, a2, s1, s2], ...mm,
        graph: { window: W, paths: [{ ...line(m1, b1), dashed: !s1 }, { ...line(m2, b2), dashed: !s2, alt: true }], shade: [half(m1, b1, a1), half(m2, b2, a2)] },
        prompt: "The darkest region (where the two shadings overlap) is the solution of a system. Which system is it?",
        hint: "Take one line at a time. Is the shading for that line above or below it?",
        solution: `Line $y = ${lin(m1, b1)}$ is shaded ${a1 ? "above" : "below"}; line $y = ${lin(m2, b2)}$ is shaded ${a2 ? "above" : "below"}. **${choices[0]}**` };
    } });

  add({ id: "u5.ie.greatest-y", skill: "u5.ineq2", level: L.C, type: "numeric", calc: false,
    make(r) {
      const m1 = r.intNot(-3, 3, [0]), b1 = r.int(-4, 6), m2 = r.intNot(-3, 3, [0, m1]), b2 = r.int(-6, 2), x0 = r.int(-3, 3), strict = r.chance(0.5);
      const top = m1 * x0 + b1, bot = m2 * x0 + b2;
      if (top - bot < 2) return this.make(r);
      const ans = strict ? top - 1 : top;
      return { key: [m1, b1, m2, b2, x0, strict], answer: ans,
        prompt: `$(${x0}, k)$ is a solution of the system below, and $k$ is an integer. What is the greatest possible value of $k$?<br>$y ${strict ? "<" : "\\le"} ${lin(m1, b1)}$<br>$y \\ge ${lin(m2, b2)}$`,
        hint: `Substitute $x = ${x0}$ into both inequalities.`,
        solution: `With $x = ${x0}$: $k ${strict ? "<" : "\\le"} ${top}$ and $k \\ge ${bot}$. The greatest integer is **${ans}**.` };
    } });

  // ───────────────────────── Modeling with constraints ─────────────────────────
  const TIX = [["adult", "child", "tickets to a play"], ["large", "small", "pizzas"], ["hardcover", "paperback", "books"], ["senior", "student", "passes"]];
  add({ id: "u5.mo.which-system", skill: "u5.model", level: L.B, type: "mcq", calc: false,
    make(r) {
      const T = r.pick(TIX), p = r.int(6, 15), q = r.intNot(3, 12, [p]), x = r.int(5, 40), y = r.int(5, 40), N = x + y, M = p * x + q * y;
      const right = `$x + y = ${N}$ and $${p}x + ${q}y = ${M}$`;
      const mm = mcq(right, [
        { text: `$x + y = ${M}$ and $${p}x + ${q}y = ${N}$`, why: `${N} counts items; ${M} is money.` },
        { text: `$${p}x + y = ${N}$ and $x + ${q}y = ${M}$`, why: "The count equation adds the numbers of items. The money equation uses both prices." },
        { text: `$x + y = ${N}$ and $${q}x + ${p}y = ${M}$`, why: `$x$ is the number of ${T[0]} ${T[2]}, which cost \\$${p} each.` },
      ], r);
      return { key: [T[0], p, q, x, y], ...mm,
        prompt: `A school sold ${N} ${T[2]}: ${T[0]} ones for \\$${p} each and ${T[1]} ones for \\$${q} each, for a total of \\$${M}. $x$ is the number of ${T[0]} ${T[2]} and $y$ the number of ${T[1]} ones. Which system models this?`,
        hint: "One equation counts the items. The other counts the money.",
        solution: `Count: $x + y = ${N}$. Money: $${p}x + ${q}y = ${M}$. **${right}**` };
    } });

  add({ id: "u5.mo.tickets", skill: "u5.model", level: L.I, type: "numeric", calc: true,
    make(r) {
      const T = r.pick(TIX), p = r.int(6, 15), q = r.intNot(3, 12, [p]), x = r.int(5, 60), y = r.int(5, 60), N = x + y, M = p * x + q * y, askX = r.chance(0.5);
      return { key: [T[0], p, q, x, y, askX], answer: askX ? x : y,
        prompt: `A school sold ${N} ${T[2]}: ${T[0]} ones for \\$${p} each and ${T[1]} ones for \\$${q} each. It collected \\$${M}. How many ${askX ? T[0] : T[1]} ${T[2]} were sold?`,
        hint: `Write $x + y = ${N}$ and $${p}x + ${q}y = ${M}$.`,
        solution: `From $y = ${N} - x$: $${p}x + ${q}(${N} - x) = ${M}$, so $${p - q}x = ${M - q * N}$ and $x = ${x}$, $y = ${y}$. **${askX ? x : y}**` };
    } });

  add({ id: "u5.mo.mixture", skill: "u5.model", level: L.H, type: "numeric", calc: true,
    make(r) {
      const kind = r.int(0, 1);
      if (kind === 0) {
        const n = r.int(5, 30), d = r.int(5, 30), coins = n + d, total = 5 * n + 10 * d;
        return { key: [0, n, d], answer: d,
          prompt: `A jar has ${coins} coins, all nickels and dimes, worth \\$${(total / 100).toFixed(2)} in all. How many dimes are in the jar?`,
          hint: "Work in cents: nickels are 5, dimes are 10.",
          solution: `$n + d = ${coins}$ and $5n + 10d = ${total}$. Multiply the first by 5 and subtract: $5d = ${total - 5 * coins}$, so $d = \\mathbf{${d}}$.` };
      }
      const a = r.pick([10, 20, 30]), b = r.pick([50, 60, 70]), A = r.int(1, 8) * 5, B = r.int(1, 8) * 5, pct = (a * A + b * B) / (A + B);
      if (!Number.isInteger(pct)) return this.make(r);
      return { key: [1, a, b, A, B], answer: A,
        prompt: `How many liters of a ${a}% juice drink must be mixed with a ${b}% juice drink to make ${A + B} liters of a ${pct}% juice drink?`,
        hint: `Write $x + y = ${A + B}$ and $${a / 100}x + ${b / 100}y = ${pct / 100}(${A + B})$.`,
        solution: `$x + y = ${A + B}$ and $${a}x + ${b}y = ${pct * (A + B)}$. Substitute $y = ${A + B} - x$: $${a - b}x = ${pct * (A + B) - b * (A + B)}$, so $x = \\mathbf{${A}}$ liters.` };
    } });

  add({ id: "u5.mo.constraint", skill: "u5.model", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 6), b = r.intNot(2, 8, [a - 2, a]), H = r.int(10, 30), M = r.int(5, 20) * 10, ask = r.int(0, 1);
      const S = `A student works $x$ hours at a cafe that pays \\$${a + 8} per hour and $y$ hours tutoring that pays \\$${b + 10} per hour.`;
      const right = ask === 0 ? `$x + y \\le ${H}$` : `$${a + 8}x + ${b + 10}y \\ge ${M}$`;
      const mm = mcq(right, ask === 0 ? [
        { text: `$x + y \\ge ${H}$`, why: "\"At most\" means $\\le$." },
        { text: `$${a + 8}x + ${b + 10}y \\le ${H}$`, why: `${H} is a number of hours, not dollars.` },
        { text: `$x + y < ${H}$`, why: `Working exactly ${H} hours is allowed.` },
      ] : [
        { text: `$${a + 8}x + ${b + 10}y \\le ${M}$`, why: "\"At least\" means $\\ge$." },
        { text: `$x + y \\ge ${M}$`, why: "Multiply the hours by the pay rates to get dollars." },
        { text: `$${b + 10}x + ${a + 8}y \\ge ${M}$`, why: "$x$ is cafe hours, which pay the cafe rate." },
      ], r);
      return { key: [a, b, H, M, ask], ...mm,
        prompt: `${S} ${ask === 0 ? `The student can work at most ${H} hours a week.` : `The student wants to earn at least \\$${M} a week.`} Which inequality shows this constraint?`,
        hint: ask === 0 ? "Add the hours." : "Multiply each number of hours by its pay.",
        solution: `**${right}**` };
    } });

  add({ id: "u5.mo.viable", skill: "u5.model", level: L.C, type: "multi", calc: true,
    make(r) {
      const pa = r.int(8, 14), pb = r.int(15, 25), H = r.int(12, 20), M = r.int(18, 30) * 10;
      const ok = (p) => p[0] >= 0 && p[1] >= 0 && p[0] + p[1] <= H && pa * p[0] + pb * p[1] >= M;
      const pts = []; for (let k = 0; k < 80 && pts.length < 5; k++) { const p = [r.int(0, H), r.int(0, H)]; if (!pts.some((q) => q[0] === p[0] && q[1] === p[1])) pts.push(p); }
      const items = pts.map((p) => ({ text: `${p[0]} hours at the cafe and ${p[1]} hours tutoring`, ok: ok(p) }));
      if (!items.some((i) => i.ok) || items.every((i) => i.ok)) return this.make(r);
      const mm = multi(items, r);
      return { key: [pa, pb, H, M, pts], ...mm, think: true,
        prompt: `Kim earns \\$${pa} an hour at a cafe ($x$ hours) and \\$${pb} an hour tutoring ($y$ hours). She can work at most ${H} hours a week and wants to earn at least \\$${M}:<br>$x + y \\le ${H}$ and $${pa}x + ${pb}y \\ge ${M}$<br>Select **all** schedules that meet both constraints.`,
        hint: "Check both inequalities for each schedule.",
        solution: pts.map((p) => `$(${p[0]}, ${p[1]})$: ${p[0] + p[1]} hours ${p[0] + p[1] <= H ? "✓" : "✗"}, \\$${pa * p[0] + pb * p[1]} ${pa * p[0] + pb * p[1] >= M ? "✓" : "✗"}`).join("; ") + "." };
    } });

  add({ id: "u5.mo.rectangle", skill: "u5.model", level: L.C, type: "numeric", calc: false,
    make(r) {
      const w = r.int(3, 15), k = r.int(2, 4), c = r.int(-3, 6), l = k * w + c, P = 2 * (l + w), ask = r.chance(0.5);
      if (l <= w) return this.make(r);
      return { key: [w, k, c, ask], answer: ask ? l : w,
        prompt: `A rectangle's length is ${c === 0 ? `${k} times` : `${Math.abs(c)} ${c > 0 ? "more" : "less"} than ${k} times`} its width. Its perimeter is ${P} cm. What is its ${ask ? "length" : "width"}, in cm?`,
        hint: `Write $l = ${lin(k, c, "w")}$ and $2l + 2w = ${P}$.`,
        solution: `$2(${lin(k, c, "w")}) + 2w = ${P}$, so $${2 * k + 2}w ${signed(2 * c)} = ${P}$ and $w = ${w}$. Then $l = ${l}$. **${ask ? l : w}**` };
    } });

  // ───────────────────────── Number of solutions ─────────────────────────
  const COUNT = ["No solution", "Exactly one solution", "Infinitely many solutions", "Exactly two solutions"];
  add({ id: "u5.co.graph", skill: "u5.count", level: L.B, type: "graph-mcq", calc: false,
    make(r) {
      const kind = r.int(0, 2), m1 = r.pick(SL), b1 = r.int(-4, 4);
      const m2 = kind === 1 ? r.pick(SL.filter((s) => s !== m1)) : m1, b2 = kind === 0 ? r.intNot(-5, 5, [b1]) : kind === 2 ? b1 : r.int(-4, 4);
      return { key: [kind, m1, b1, m2, b2], choices: COUNT, answer: kind, why: COUNT.map((_, i) => (i === kind ? "Correct." : ["Lines that cross meet once; lines on top of each other meet everywhere.", "Parallel lines never meet; identical lines meet everywhere.", "Only identical lines share every point.", "Two different lines can cross at most once."][i])),
        graph: { window: W, paths: [line(m1, b1), { ...line(m2, b2), alt: true, dashed: true }] },
        prompt: `The graphs of the two equations in a system are shown${kind === 2 ? " (they lie on top of each other)" : ""}. How many solutions does the system have?`,
        hint: "Count the points the lines share.",
        solution: kind === 0 ? "The lines are parallel and never meet: **no solution**." : kind === 1 ? "The lines cross at one point: **exactly one solution**." : "The lines are the same line, so every point on it is shared: **infinitely many solutions**." };
    } });

  add({ id: "u5.co.equations", skill: "u5.count", level: L.I, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 2), a = r.intNot(-5, 5, [0]), b = r.intNot(-5, 5, [0]), c = r.int(-12, 12), k = r.pick([2, 3, -2, 4]);
      const [A2, B2, C2] = kind === 2 ? [k * a, k * b, k * c] : kind === 0 ? [k * a, k * b, k * c + r.pick([1, 2, -1, 3])] : [a + r.pick([1, 2]), b, c];
      if (kind === 1 && A2 * b - B2 * a === 0) return this.make(r);
      return { key: [kind, a, b, c, k, C2], choices: COUNT, answer: kind, why: COUNT.map((_, i) => (i === kind ? "Correct." : "Compare slopes (and intercepts if the slopes match).")),
        prompt: `How many solutions does the system have?<br>$${std(a, b, c)}$<br>$${std(A2, B2, C2)}$`,
        hint: "Is the second equation a multiple of the first? Compare both sides.",
        solution: kind === 2 ? `The second equation is ${k} times the first: same line, **infinitely many solutions**.` : kind === 0 ? `The left side of the second is ${k} times the first, but the right side is not ($${k} \\cdot ${paren(c)} = ${k * c} \\ne ${C2}$): parallel lines, **no solution**.` : `The slopes $${tex(-a / b)}$ and $${tex(-A2 / B2)}$ are different, so the lines cross once: **exactly one solution**.` };
    } });

  add({ id: "u5.co.find-k", skill: "u5.count", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-5, 6, [0]), b = r.intNot(-5, 5, [0]), c = r.int(-9, 9), k = r.pick([2, 3, -2, -3]);
      const askA = r.chance(0.5);
      return { key: [a, b, c, k, askA], answer: askA ? k * a : k * b,
        prompt: `For what value of $p$ does the system have **no** solution?<br>$${std(a, b, c)}$<br>$${askA ? `px ${k * b < 0 ? "-" : "+"} ${Math.abs(k * b)}y` : `${k * a}x + py`} = ${k * c + 1}$`,
        hint: "No solution means parallel lines: the left sides are multiples of each other, the right sides are not.",
        solution: `The ${askA ? "$y$" : "$x$"}-coefficient is ${k} times the first one's, so for parallel lines $p = ${k} \\cdot ${paren(askA ? a : b)} = \\mathbf{${askA ? k * a : k * b}}$. The constants $${k} \\cdot ${paren(c)} = ${k * c}$ and ${k * c + 1} differ, so the lines are not the same.` };
    } });

  add({ id: "u5.co.infinite", skill: "u5.count", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-5, 6, [0]), b = r.intNot(-5, 5, [0]), c = r.intNot(-9, 9, [0]), k = r.pick([2, 3, 4, -2]);
      return { key: [a, b, c, k], answer: k * a + k * c,
        prompt: `The system has infinitely many solutions. What is $p + q$?<br>$${std(a, b, c)}$<br>$px ${k * b < 0 ? "-" : "+"} ${Math.abs(k * b)}y = q$`,
        hint: "Infinitely many solutions means the second equation is a multiple of the first.",
        solution: `$${k * b}$ is ${k} times ${b}, so the second equation is ${k} times the first: $p = ${k * a}$ and $q = ${k * c}$. $p + q = \\mathbf{${k * a + k * c}}$.` };
    } });

  add({ id: "u5.co.select-none", skill: "u5.count", level: L.C, type: "multi", calc: false,
    make(r) {
      const items = [];
      for (let i = 0; i < 5; i++) {
        const m = r.pick(SL), b = r.int(-6, 6), kind = r.int(0, 2);
        const m2 = kind === 1 ? r.pick(SL.filter((s) => s !== m)) : m, b2 = kind === 0 ? r.intNot(-6, 6, [b]) : kind === 2 ? b : r.int(-6, 6);
        items.push({ text: `$y = ${lin(m, b)}$ and $${kind === 2 ? `2y = ${lin(2 * m, 2 * b)}` : `y = ${lin(m2, b2)}`}$`, ok: kind === 0, kind });
      }
      if (!items.some((i) => i.ok) || items.every((i) => i.ok) || new Set(items.map((i) => i.text)).size < 5) return this.make(r);
      const mm = multi(items.map((i) => ({ text: i.text, ok: i.ok, why: i.kind === 1 ? "Different slopes: one solution." : i.kind === 2 ? "Same line: infinitely many." : "" })), r);
      return { key: items.map((i) => i.text), ...mm,
        prompt: "Select **all** systems that have **no** solution.",
        hint: "No solution: same slope, different $y$-intercept.",
        solution: "No solution means parallel lines: equal slopes and different intercepts. " + items.map((i) => `${i.text}: ${["no solution", "one solution", "infinitely many"][i.kind]}`).join("; ") + "." };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  add({ id: "u5.th.find-error", skill: "u5.solve", level: L.H, type: "mcq", calc: false,
    make(r) {
      const x = r.int(-5, 7), y = r.int(-5, 7), a = r.int(1, 5), b = r.int(1, 5), c = r.intNot(1, 5, [a]), kind = r.int(0, 3);
      const e1 = a * x + b * y, e2 = c * x + b * y;
      // subtract: (a - c)x = e1 - e2
      const lhs = a - c, rhs = kind === 0 ? e1 + e2 : e1 - e2;
      const s1 = kind === 0 ? `Subtract: $${lin(lhs, 0)} = ${e1} - ${paren(e2)} = ${rhs}$` : `Subtract: $${lin(lhs, 0)} = ${e1} - ${paren(e2)} = ${rhs}$`;
      const X = kind === 1 ? rhs * lhs : rhs / lhs;
      const s2 = kind === 1 ? `$x = ${rhs} \\cdot ${paren(lhs)} = ${X}$` : `$x = ${rhs} \\div ${paren(lhs)} = ${tex(X)}$`;
      const Y = kind === 2 ? (e1 - a * X) / b + 1 : (e1 - a * X) / b;
      const s3 = `$${a}(${tex(X)}) + ${b === 1 ? "" : b}y = ${e1}$, so $y = ${tex(Y)}$`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = [`$${e1} - ${paren(e2)}$ is ${e1 - e2}, not ${e1 + e2}.`, `To undo multiplying by ${lhs}, divide.`, "Solve for $y$ again: the arithmetic is off by 1."][Math.max(0, bad)];
      if (kind === 0 && e2 === 0) return this.make(r);
      if (kind === 1 && Math.abs(lhs) === 1) return this.make(r);
      const f = findStep([s1, s2, s3], bad, whyWrong);
      return { key: [x, y, a, b, c, kind], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `Mia solved the system by subtracting the equations:<br>$${std(a, b, e1)}$<br>$${std(c, b, e2)}$<br>${f.stepsText}<br>Where is Mia's first mistake?`,
        hint: "Redo each step.",
        solution: `$${lin(lhs, 0)} = ${e1 - e2}$, so $x = ${x}$ and $y = ${y}$.<br>` + (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  add({ id: "u5.th.make-true", skill: "u5.count", level: L.C, type: "numeric", calc: false,
    make(r) {
      const m = r.pick([2, 3, -2, -3, 4, 0.5]), b = r.int(-6, 6), want = r.pick(["one", "none"]);
      return want === "one"
        ? { key: [m, b, 0], answer: m + 1, accept: { not: [m] }, think: true,
          prompt: `Give **one** value of $k$ so that the system $y = ${lin(m, b)}$ and $y = kx + ${Math.abs(b) + 2}$ has **exactly one** solution.`,
          hint: "When do two lines cross exactly once?",
          solution: `The lines cross once when their slopes are different. **Any $k$ except $${tex(m)}$** works.` }
        : { key: [m, b, 1], answer: b + 1, accept: { not: [b] }, think: true,
          prompt: `Give **one** value of $c$ so that the system $y = ${lin(m, b)}$ and $y = ${lin(m, 0).replace(/^$/, "0")} + c$ has **no** solution.`,
          hint: "The slopes already match. What else must be true for the lines never to meet?",
          solution: `The slopes are equal, so the lines are parallel unless they are the same line. **Any $c$ except ${b}** gives no solution.` };
    } });

  const U5_ASN = [
    { s: "A system of two linear equations can have exactly two solutions.",
      right: "Never true: two different lines cross at most once, and identical lines share infinitely many points.",
      wrong: ["Sometimes true: when the lines cross twice.", "Always true: each equation gives one solution.", "Sometimes true: when the slopes are opposites."] },
    { s: "If two lines have different $y$-intercepts, the system has no solution.",
      right: "Sometimes true: only when the slopes are also equal. Different slopes means they cross once.",
      wrong: ["Always true: they start at different places.", "Never true: different intercepts always cross.", "Sometimes true: only when both slopes are positive."] },
    { s: "Adding two equations of a system gives a new equation that the solution also satisfies.",
      right: "Always true: if both equations are true at the solution, their sum is true there too.",
      wrong: ["Sometimes true: only if a variable cancels.", "Never true: adding changes the solution.", "Sometimes true: only for whole-number solutions."] },
    { s: "A point on the dashed boundary line of $y > 2x + 1$ is a solution.",
      right: "Never true: on the line, $y = 2x + 1$, which does not make $y > 2x + 1$ true.",
      wrong: ["Always true: the line is part of the graph.", "Sometimes true: when $x$ is positive.", "Sometimes true: when the point is on an axis."] },
    { s: "The solution region of a system of two linear inequalities is empty.",
      right: "Sometimes true: it is empty for $y > x + 2$ and $y < x - 1$, but most systems have overlapping regions.",
      wrong: ["Never true: shaded regions always overlap.", "Always true: two inequalities cancel out.", "Sometimes true: only when the lines cross."] },
  ];
  add({ id: "u5.th.always", skill: "u5.count", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U5_ASN.length - 1), it = U5_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Sketch a few examples.",
        solution: `**${it.right}**` };
    } });

  M1.units.u5 = Object.assign(M1.units.u5 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
