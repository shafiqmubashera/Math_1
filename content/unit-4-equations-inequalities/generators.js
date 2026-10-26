/* Unit 4 Equations & Inequalities: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, lin, paren, findStep } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);
  const OPS = { "<": "<", ">": ">", "<=": "\\le", ">=": "\\ge" };
  const FLIP = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
  const STRICT = { "<": "<=", "<=": "<", ">": ">=", ">=": ">" };
  const ineq = (op, v, x = "x") => `${x} ${OPS[op]} ${tex(v)}`;
  const holds = (op, a, b) => (op === "<" ? a < b : op === "<=" ? a <= b : op === ">" ? a > b : a >= b);

  // ───────────────────────── Multi-step linear equations ─────────────────────────
  add({ id: "u4.li.two-step", skill: "u4.linear", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-9, 9, [0, 1]), b = r.int(-15, 15), x = r.int(-10, 12), c = a * x + b;
      return { key: [a, b, x], answer: x,
        prompt: `Solve for $x$: $${lin(a, b)} = ${c}$`,
        hint: `Undo the ${b >= 0 ? "adding" : "subtracting"} first, then the multiplying.`,
        solution: `$${a}x = ${c} ${signed(-b)} = ${c - b}$, so $x = ${c - b} \\div ${paren(a)} = \\mathbf{${x}}$.` };
    } });

  add({ id: "u4.li.distribute", skill: "u4.linear", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-6, 7, [0, 1]), b = r.intNot(-9, 9, [0]), x = r.int(-8, 10), c = a * (x + b);
      return { key: [a, b, x], answer: x,
        prompt: `Solve for $x$: $${a}(x ${signed(b)}) = ${c}$`,
        hint: `Divide both sides by ${a}, or distribute first.`,
        solution: `Divide by ${a}: $x ${signed(b)} = ${c / a}$, so $x = \\mathbf{${x}}$.` };
    } });

  add({ id: "u4.li.both-sides", skill: "u4.linear", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-8, 9, [0]), c = r.intNot(-8, 9, [0, a]), x = r.int(-9, 10), b = r.int(-15, 15), d = (a - c) * x + b;
      return { key: [a, b, c, x], answer: x,
        prompt: `Solve for $x$: $${lin(a, b)} = ${lin(c, d)}$`,
        hint: "Get the $x$-terms on one side and the numbers on the other.",
        solution: `Subtract $${lin(c, 0)}$ from both sides: $${lin(a - c, b)} = ${d}$. Then $${lin(a - c, 0)} = ${d - b}$, so $x = \\mathbf{${x}}$.` };
    } });

  add({ id: "u4.li.fraction", skill: "u4.linear", level: L.I, type: "numeric", calc: false,
    make(r) {
      const d = r.pick([2, 3, 4, 5, 6]), k = r.int(-6, 8), b = r.intNot(-9, 9, [0]), x = d * k, c = k + b;
      return { key: [d, k, b], answer: x,
        prompt: `Solve for $x$: $\\frac{x}{${d}} ${signed(b)} = ${c}$`,
        hint: `Undo the ${b > 0 ? "adding" : "subtracting"}, then multiply by ${d}.`,
        solution: `$\\frac{x}{${d}} = ${c} ${signed(-b)} = ${k}$, so $x = ${k} \\cdot ${d} = \\mathbf{${x}}$.` };
    } });

  add({ id: "u4.li.multi-step", skill: "u4.linear", level: L.H, type: "numeric", calc: false,
    make(r) {
      // a(x + b) - cx = d(x - e)
      const a = r.int(2, 7), b = r.int(-6, 6), c = r.int(1, 5), d = r.int(1, 5), x = r.int(-8, 9);
      if (a - c - d === 0) return this.make(r);
      const lhs = a * (x + b) - c * x, e = d * x - lhs; // d(x) - d*e' : we want d(x - E) = lhs  => E = (d x - lhs)/d
      if (e % d !== 0) return this.make(r);
      const E = e / d;
      return { key: [a, b, c, d, x], answer: x,
        prompt: `Solve for $x$: $${a}(x ${signed(b)}) - ${c === 1 ? "" : c}x = ${d === 1 ? "" : d}(x ${signed(-E)})$`,
        hint: "Distribute on both sides, combine like terms, then solve.",
        solution: `Distribute: $${a}x ${signed(a * b)} - ${c === 1 ? "" : c}x = ${d === 1 ? "" : d}x ${signed(-d * E)}$. Combine: $${lin(a - c, a * b)} = ${lin(d, -d * E)}$. So $${lin(a - c - d, 0)} = ${-d * E - a * b}$ and $x = \\mathbf{${x}}$.` };
    } });

  add({ id: "u4.li.how-many", skill: "u4.linear", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 6), b = r.intNot(-6, 6, [0]), kind = r.int(0, 2), c = r.intNot(-5, 5, [0]);
      // a(x + b) = a x + K  or  = (a + c)x + K
      const K = kind === 0 ? a * b + r.pick([-3, -2, 2, 3, 5]) : a * b;
      const m2 = kind === 2 ? a + c : a;
      const sol = kind === 2 ? (a * b - K) / (m2 - a) : null;
      const right = kind === 0 ? "No solution" : kind === 1 ? "Infinitely many solutions" : `Exactly one solution, $x = ${tex(sol)}$`;
      const m = mcq(right, [
        { text: "No solution", why: "No solution happens when the $x$-terms match but the numbers do not." },
        { text: "Infinitely many solutions", why: "Infinitely many happens only when both sides are exactly the same." },
        { text: "Exactly one solution, $x = 0$", why: "Simplify both sides and compare." },
        { text: `Exactly one solution, $x = ${tex(K - a * b || 1)}$`, why: "Simplify both sides and compare the $x$-terms first." },
      ], r);
      return { key: [a, b, kind, c, K], ...m,
        prompt: `How many solutions does $${a}(x ${signed(b)}) = ${lin(m2, K)}$ have?`,
        hint: "Distribute, then compare the two sides.",
        solution: `Left side: $${lin(a, a * b)}$. Right side: $${lin(m2, K)}$. ${kind === 0 ? "Same $x$-term, different numbers: **no solution**." : kind === 1 ? "The sides are identical: **infinitely many solutions**." : `Different $x$-terms, so exactly one: $${a * b - K} = ${m2 - a}x$, $x = ${tex(sol)}$.`}` };
    } });

  add({ id: "u4.li.no-solution-k", skill: "u4.linear", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(2, 6), b = r.intNot(-5, 5, [0]), c = r.int(1, 4), d = r.int(-9, 9), e = r.intNot(-9, 9, [a * b - d]);
      // a(x + b) + kx - d... keep simple: a(x + b) + kx = c x + e has no solution when a + k = c
      const k = c - a;
      return { key: [a, b, c, d, e], answer: k,
        prompt: `For what value of $k$ does $${a}(x ${signed(b)}) + kx = ${lin(c, e)}$ have **no** solution?`,
        hint: "No solution means the $x$-terms are equal but the constants are not.",
        solution: `Left side: $(${a} + k)x ${signed(a * b)}$. For no solution the $x$-coefficients must match: $${a} + k = ${c}$, so $k = \\mathbf{${k}}$. The constants ${a * b} and ${e} differ, so the equation is never true.` };
    } });

  add({ id: "u4.li.fractions-both", skill: "u4.linear", level: L.C, type: "numeric", calc: false,
    make(r) {
      const p = r.pick([2, 3, 4, 5]), q = r.pick([2, 3, 4, 5, 6].filter((v) => v !== p)), a = r.intNot(-6, 6, [0]), c = r.intNot(-6, 6, [0]);
      // (x + a)/p = (x + c)/q  =>  q(x + a) = p(x + c)  =>  x = (p c - q a)/(q - p)
      const x = (p * c - q * a) / (q - p);
      if (!Number.isInteger(x)) return this.make(r);
      return { key: [p, q, a, c], answer: x,
        prompt: `Solve for $x$: $\\frac{x ${signed(a)}}{${p}} = \\frac{x ${signed(c)}}{${q}}$`,
        hint: `Multiply both sides by ${p * q}.`,
        solution: `Multiply by ${p * q}: $${q}(x ${signed(a)}) = ${p}(x ${signed(c)})$, so $${q}x ${signed(q * a)} = ${p}x ${signed(p * c)}$. Then $${lin(q - p, 0)} = ${p * c - q * a}$ and $x = \\mathbf{${x}}$.` };
    } });

  // ───────────────────────── Literal equations and formulas ─────────────────────────
  const FORMULAS = [
    { f: "d = rt", v: "t", right: "t = \\frac{d}{r}", wrong: ["t = dr", "t = d - r", "t = \\frac{r}{d}"], what: "distance, rate and time" },
    { f: "A = lw", v: "w", right: "w = \\frac{A}{l}", wrong: ["w = Al", "w = A - l", "w = \\frac{l}{A}"], what: "the area of a rectangle" },
    { f: "V = Bh", v: "h", right: "h = \\frac{V}{B}", wrong: ["h = VB", "h = V - B", "h = \\frac{B}{V}"], what: "the volume of a prism" },
    { f: "C = 2\\pi r", v: "r", right: "r = \\frac{C}{2\\pi}", wrong: ["r = 2\\pi C", "r = \\frac{2\\pi}{C}", "r = C - 2\\pi"], what: "the circumference of a circle" },
    { f: "I = Prt", v: "r", right: "r = \\frac{I}{Pt}", wrong: ["r = IPt", "r = \\frac{Pt}{I}", "r = I - Pt"], what: "simple interest" },
  ];
  add({ id: "u4.lt.one-step", skill: "u4.literal", level: L.B, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, FORMULAS.length - 1), F = FORMULAS[i];
      const m = mcq(`$${F.right}$`, F.wrong.map((w) => ({ text: `$${w}$`, why: `$${F.v}$ is multiplied, so divide both sides to undo it.` })), r);
      return { key: [i], ...m,
        prompt: `The formula $${F.f}$ is about ${F.what}. Which shows it solved for $${F.v}$?`,
        hint: `What is being done to $${F.v}$? Undo it on both sides.`,
        solution: `Divide both sides by everything multiplied with $${F.v}$: **$${F.right}$**.` };
    } });

  add({ id: "u4.lt.perimeter", skill: "u4.literal", level: L.I, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 3);
      const F = [
        { f: "P = 2l + 2w", v: "w", right: "w = \\frac{P - 2l}{2}", wrong: [["w = P - 2l", "Divide by 2 as well."], ["w = \\frac{P}{2} - 2l", "Divide all of $P - 2l$ by 2."], ["w = \\frac{P + 2l}{2}", "Subtract $2l$; do not add it."]] },
        { f: "y = mx + b", v: "x", right: "x = \\frac{y - b}{m}", wrong: [["x = \\frac{y}{m} - b", "Subtract $b$ before dividing by $m$."], ["x = y - b - m", "$m$ multiplies $x$, so divide by it."], ["x = \\frac{y + b}{m}", "Subtract $b$; do not add it."]] },
        { f: "A = \\frac{1}{2}bh", v: "h", right: "h = \\frac{2A}{b}", wrong: [["h = \\frac{A}{2b}", "Multiply by 2 to undo the $\\frac{1}{2}$."], ["h = 2Ab", "Divide by $b$."], ["h = \\frac{A}{b} - \\frac{1}{2}", "$\\frac{1}{2}$ is multiplied, not added."]] },
        { f: "V = \\frac{1}{3}Bh", v: "B", right: "B = \\frac{3V}{h}", wrong: [["B = \\frac{V}{3h}", "Multiply by 3 to undo the $\\frac{1}{3}$."], ["B = 3Vh", "Divide by $h$."], ["B = \\frac{3h}{V}", "$V$ goes on top."]] },
      ][kind];
      const m = mcq(`$${F.right}$`, F.wrong.map(([t, w]) => ({ text: `$${t}$`, why: w })), r);
      return { key: [kind], ...m,
        prompt: `Solve $${F.f}$ for $${F.v}$.`,
        hint: "Undo adding or subtracting first, then multiplying.",
        solution: `**$${F.right}$**` };
    } });

  add({ id: "u4.lt.evaluate", skill: "u4.literal", level: L.I, type: "numeric", calc: true,
    make(r) {
      const kind = r.int(0, 2);
      if (kind === 0) { const b = r.int(3, 14), h = r.int(2, 15); return { key: [0, b, h], answer: h,
        prompt: `The area of a triangle is $A = \\frac{1}{2}bh$. A triangle has area ${b * h / 2} square inches and base ${b} inches. What is its height, in inches?`,
        hint: "Solve the formula for $h$ first, or substitute and solve.",
        solution: `$h = \\frac{2A}{b} = \\frac{2(${b * h / 2})}{${b}} = \\mathbf{${h}}$ inches.` }; }
      if (kind === 1) { const l = r.int(5, 30), w = r.int(2, 20); return { key: [1, l, w], answer: w,
        prompt: `The perimeter of a rectangle is $P = 2l + 2w$. A rectangle has perimeter ${2 * l + 2 * w} cm and length ${l} cm. What is its width, in cm?`,
        hint: "Subtract $2l$, then divide by 2.",
        solution: `$w = \\frac{P - 2l}{2} = \\frac{${2 * l + 2 * w} - ${2 * l}}{2} = \\mathbf{${w}}$ cm.` }; }
      const rate = r.pick([30, 40, 45, 50, 55, 60, 65]), t = r.pick([1.5, 2, 2.5, 3, 4, 0.5]);
      return { key: [2, rate, t], answer: t,
        prompt: `Distance is $d = rt$. A bus travels ${rate * t} miles at ${rate} miles per hour. How many hours does the trip take?`,
        hint: "Solve for $t$.",
        solution: `$t = \\frac{d}{r} = \\frac{${rate * t}}{${rate}} = \\mathbf{${t}}$ hours.` };
    } });

  add({ id: "u4.lt.standard-y", skill: "u4.literal", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.intNot(-6, 6, [0]), b = r.pick([2, 3, 4, 5, -2, -3]), c = r.intNot(-12, 12, [0]);
      const right = `$y = ${lin(-a / b, c / b)}$`;
      const m = mcq(right, [
        { text: `$y = ${lin(a / b, c / b)}$`, why: `Subtract $${lin(a, 0)}$ from both sides first. The $x$-term changes sign.` },
        { text: `$y = ${lin(-a, c)}$`, why: `Divide every term by ${b}.` },
        { text: `$y = ${lin(-a / b, c)}$`, why: `Divide the constant by ${b} as well.` },
      ], r, [{ text: `$y = ${lin(-b / a, c / a)}$`, why: `Divide by the coefficient of $y$, which is ${b}.` }]);
      return { key: [a, b, c], ...m,
        prompt: `Solve $${lin(a, 0)} ${b < 0 ? "-" : "+"} ${Math.abs(b)}y = ${c}$ for $y$.`,
        hint: "Move the $x$-term, then divide every term by the coefficient of $y$.",
        solution: `$${b}y = ${lin(-a, c)}$, so $y = \\frac{${lin(-a, c)}}{${b}} = ${lin(-a / b, c / b)}$. **${right}**` };
    } });

  add({ id: "u4.lt.two-step-var", skill: "u4.literal", level: L.H, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 3);
      const F = [
        { f: "F = \\frac{9}{5}C + 32", v: "C", right: "C = \\frac{5}{9}(F - 32)", wrong: [["C = \\frac{5}{9}F - 32", "Subtract 32 before multiplying by $\\frac{5}{9}$."], ["C = \\frac{9}{5}(F - 32)", "Multiply by $\\frac{5}{9}$ to undo $\\frac{9}{5}$."], ["C = \\frac{5}{9}(F + 32)", "Subtract 32; do not add it."]] },
        { f: "S = \\frac{n}{2}(a + l)", v: "l", right: "l = \\frac{2S}{n} - a", wrong: [["l = \\frac{2S - a}{n}", "Divide $2S$ by $n$ first, then subtract $a$."], ["l = \\frac{S}{2n} - a", "Multiply by 2 to undo dividing by 2."], ["l = \\frac{2S}{n} + a", "Subtract $a$; do not add it."]] },
        { f: "A = P + Prt", v: "t", right: "t = \\frac{A - P}{Pr}", wrong: [["t = \\frac{A}{Pr} - P", "Subtract $P$ before dividing."], ["t = A - P - Pr", "$Pr$ multiplies $t$, so divide by it."], ["t = \\frac{A - P}{r}", "Divide by both $P$ and $r$."]] },
        { f: "ax + by = c", v: "x", right: "x = \\frac{c - by}{a}", wrong: [["x = \\frac{c}{a} - by", "Subtract $by$ before dividing by $a$."], ["x = c - by - a", "$a$ multiplies $x$, so divide by it."], ["x = \\frac{c + by}{a}", "Subtract $by$; do not add it."]] },
      ][kind];
      const m = mcq(`$${F.right}$`, F.wrong.map(([t, w]) => ({ text: `$${t}$`, why: w })), r);
      return { key: [kind], ...m,
        prompt: `Solve $${F.f}$ for $${F.v}$.`,
        hint: "Work backward: undo the last operation first.",
        solution: `**$${F.right}$**` };
    } });

  add({ id: "u4.lt.what-happens", skill: "u4.literal", level: L.C, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 2), k = r.pick([2, 3, 4]);
      const F = [
        { prompt: `In $d = rt$, the distance $d$ stays the same and the rate $r$ is multiplied by ${k}. What happens to the time $t$?`, right: `It is divided by ${k}.`, sol: `$t = \\frac{d}{r}$. Multiplying the denominator by ${k} divides $t$ by ${k}.` },
        { prompt: `In $A = \\frac{1}{2}bh$, the area $A$ stays the same and the base $b$ is multiplied by ${k}. What happens to the height $h$?`, right: `It is divided by ${k}.`, sol: `$h = \\frac{2A}{b}$. Multiplying $b$ by ${k} divides $h$ by ${k}.` },
        { prompt: `In $V = lwh$, the length and width are each multiplied by ${k} and the height stays the same. What happens to the volume $V$?`, right: `It is multiplied by ${k * k}.`, sol: `$V$ becomes $(${k}l)(${k}w)h = ${k * k}lwh$, so it is multiplied by ${k * k}.` },
      ][kind];
      const all = [`It is divided by ${k}.`, `It is multiplied by ${k}.`, `It is multiplied by ${k * k}.`, "It stays the same.", `It is divided by ${k * k}.`];
      const m = mcq(F.right, all.filter((t) => t !== F.right).map((t) => ({ text: t, why: F.sol })), r);
      return { key: [kind, k], ...m, think: true,
        prompt: F.prompt,
        hint: "Solve for the quantity asked about, then see how it changes.",
        solution: `${F.sol} **${F.right}**` };
    } });

  // ───────────────────────── Solving inequalities ─────────────────────────
  add({ id: "u4.in.one-step", skill: "u4.ineq", level: L.B, type: "mcq", calc: false,
    make(r) {
      const op = r.pick(["<", ">", "<=", ">="]), b = r.intNot(-12, 12, [0]), v = r.int(-10, 12), c = v + b;
      const m = mcq(`$${ineq(op, v)}$`, [
        { text: `$${ineq(op, c + b)}$`, why: `To undo $${signed(b)}$, ${b > 0 ? "subtract" : "add"} ${Math.abs(b)}.` },
        { text: `$${ineq(FLIP[op], v)}$`, why: "Adding or subtracting never flips the sign." },
        { text: `$${ineq(STRICT[op], v)}$`, why: "Keep the same kind of sign: strict stays strict." },
      ], r);
      return { key: [op, b, v], ...m,
        prompt: `Solve: $x ${signed(b)} ${OPS[op]} ${c}$`,
        hint: "Undo the number added to $x$ on both sides.",
        solution: `$x ${OPS[op]} ${c} ${signed(-b)}$, so **$${ineq(op, v)}$**.` };
    } });

  add({ id: "u4.in.flip", skill: "u4.ineq", level: L.I, type: "mcq", calc: false,
    make(r) {
      const op = r.pick(["<", ">", "<=", ">="]), a = r.intNot(-7, 7, [0, 1, -1]), b = r.int(-12, 12), v = r.int(-8, 9), c = a * v + b;
      const res = a < 0 ? FLIP[op] : op;
      const m = mcq(`$${ineq(res, v)}$`, [
        { text: `$${ineq(a < 0 ? op : FLIP[op], v)}$`, why: a < 0 ? "Dividing by a negative number flips the sign." : "Dividing by a positive number keeps the sign." },
        { text: `$${ineq(res, -v)}$`, why: "Check the sign of the answer when dividing." },
        { text: `$${ineq(res, (c + b) / a)}$`, why: `Undo $${signed(b)}$ by ${b >= 0 ? "subtracting" : "adding"}.` },
      ], r, [{ text: `$${ineq(STRICT[res], v)}$`, why: "Strict stays strict; \"or equal to\" stays \"or equal to\"." }]);
      return { key: [op, a, b, v], ...m,
        prompt: `Solve: $${lin(a, b)} ${OPS[op]} ${c}$`,
        hint: a < 0 ? "Careful: what happens when you divide by a negative?" : "Undo the adding, then the multiplying.",
        solution: `$${a}x ${OPS[op]} ${c - b}$. Divide by ${a}${a < 0 ? " and **flip the sign**" : ""}: **$${ineq(res, v)}$**.` };
    } });

  add({ id: "u4.in.is-solution", skill: "u4.ineq", level: L.I, type: "multi", calc: false,
    make(r) {
      const op = r.pick(["<", ">", "<=", ">="]), a = r.intNot(-5, 5, [0]), b = r.int(-9, 9), v = r.int(-5, 6), c = a * v + b;
      const cands = r.shuffle([v - 3, v - 1, v, v + 1, v + 2, v + 4, 0]).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 5);
      const items = cands.map((x) => ({ text: `$x = ${x}$`, ok: holds(op, a * x + b, c), why: `$${a}(${x}) ${signed(b)} = ${a * x + b}$` }));
      if (items.every((i) => i.ok) || !items.some((i) => i.ok)) return this.make(r);
      const m = multi(items, r);
      return { key: [op, a, b, v, cands], ...m,
        prompt: `Select **all** values of $x$ that make $${lin(a, b)} ${OPS[op]} ${c}$ true.`,
        hint: "Substitute each value and check.",
        solution: `Solving: $${ineq(a < 0 ? FLIP[op] : op, v)}$. ${items.map((i) => `${i.text}: ${i.why} ${i.ok ? "✓" : "✗"}`).join("; ")}.` };
    } });

  add({ id: "u4.in.both-sides", skill: "u4.ineq", level: L.H, type: "mcq", calc: false,
    make(r) {
      const op = r.pick(["<", ">", "<=", ">="]), a = r.intNot(-6, 6, [0]), c = r.intNot(-6, 6, [0, a]), v = r.int(-7, 8), b = r.int(-10, 10), d = (a - c) * v + b;
      const k = a - c, res = k < 0 ? FLIP[op] : op;
      const m = mcq(`$${ineq(res, v)}$`, [
        { text: `$${ineq(k < 0 ? op : FLIP[op], v)}$`, why: k < 0 ? `After collecting $x$-terms, you divide by ${k}, a negative, so the sign flips.` : `You divide by ${k}, a positive, so the sign stays.` },
        { text: `$${ineq(res, (d + b) / k)}$`, why: "Move the constant to the other side by doing the opposite operation." },
        { text: `$${ineq(res, -v)}$`, why: "Check the sign of the result." },
      ], r, [{ text: `$${ineq(STRICT[res], v)}$`, why: "Keep strict or non-strict as it was." }, { text: `$${ineq(res, v + k)}$`, why: `Divide by ${k} at the end.` }]);
      return { key: [op, a, b, c, v], ...m,
        prompt: `Solve: $${lin(a, b)} ${OPS[op]} ${lin(c, d)}$`,
        hint: "Collect the $x$-terms on one side. Watch for dividing by a negative.",
        solution: `$${lin(k, 0)} ${OPS[op]} ${d - b}$. Divide by ${k}${k < 0 ? " and flip the sign" : ""}: **$${ineq(res, v)}$**.` };
    } });

  add({ id: "u4.in.compound", skill: "u4.ineq", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([2, 3, 4, 5]), b = r.int(-9, 9), lo = r.int(-6, 2), hi = lo + r.int(2, 8), lOp = r.pick(["<", "<="]), rOp = r.pick(["<", "<="]);
      const L0 = a * lo + b, H0 = a * hi + b;
      const right = `$${lo} ${OPS[lOp]} x ${OPS[rOp]} ${hi}$`;
      const m = mcq(right, [
        { text: `$${tex((L0 + b) / a)} ${OPS[lOp]} x ${OPS[rOp]} ${tex((H0 + b) / a)}$`, why: `Undo $${signed(b)}$ in all three parts by ${b >= 0 ? "subtracting" : "adding"}.` },
        { text: `$${L0 - b} ${OPS[lOp]} x ${OPS[rOp]} ${H0 - b}$`, why: `Divide all three parts by ${a} too.` },
        { text: `$${lo} ${OPS[lOp === "<" ? "<=" : "<"]} x ${OPS[rOp === "<" ? "<=" : "<"]} ${hi}$`, why: "Keep each sign as it was." },
      ], r, [{ text: `$${hi} ${OPS[lOp]} x ${OPS[rOp]} ${lo}$`, why: "The smaller number stays on the left." }]);
      return { key: [a, b, lo, hi, lOp, rOp], ...m,
        prompt: `Solve: $${L0} ${OPS[lOp]} ${lin(a, b)} ${OPS[rOp]} ${H0}$`,
        hint: "Do the same thing to all three parts.",
        solution: `${b ? `${b > 0 ? "Subtract" : "Add"} ${Math.abs(b)}: $${L0 - b} ${OPS[lOp]} ${a}x ${OPS[rOp]} ${H0 - b}$. ` : ""}Divide by ${a}: **${right}**.` };
    } });

  add({ id: "u4.in.greatest-int", skill: "u4.ineq", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-7, 7, [0, 1, -1]), b = r.int(-15, 15), num = r.int(-40, 40), strict = r.chance(0.5);
      // a x + b  (< or <=)  num, ask for the greatest (if solution goes down) or least (if it goes up) integer
      const bound = (num - b) / a, upward = a < 0; // a<0 → x > bound (or >=)
      if (Number.isInteger(bound) && r.chance(0.3)) return this.make(r);
      const ans = upward ? (strict ? Math.floor(bound) + 1 : Math.ceil(bound)) : (strict ? Math.ceil(bound) - 1 : Math.floor(bound));
      return { key: [a, b, num, strict], answer: ans,
        prompt: `What is the ${upward ? "least" : "greatest"} integer that satisfies $${lin(a, b)} ${strict ? "<" : "\\le"} ${num}$?`,
        hint: "Solve the inequality first. Watch the sign if you divide by a negative.",
        solution: `$${a}x ${strict ? "<" : "\\le"} ${num - b}$, so $x ${upward ? (strict ? ">" : "\\ge") : (strict ? "<" : "\\le")} ${tex(bound)}${Number.isInteger(bound) ? "" : ` \\approx ${String(+bound.toFixed(2))}`}$. The ${upward ? "least" : "greatest"} integer is **${ans}**.` };
    } });

  add({ id: "u4.in.count-whole", skill: "u4.ineq", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([2, 3, 4, -2, -3]), b = r.int(-9, 9), lo = r.int(-20, 0), hi = lo + r.int(12, 30);
      // lo < a x + b <= hi; count integers x with that
      let n = 0; const xs = [];
      for (let x = -40; x <= 40; x++) { const v = a * x + b; if (v > lo && v <= hi) { n++; xs.push(x); } }
      if (!n) return this.make(r);
      return { key: [a, b, lo, hi], answer: n,
        prompt: `How many integers $x$ satisfy $${lo} < ${lin(a, b)} \\le ${hi}$?`,
        hint: "Solve the compound inequality, then count the integers in the interval.",
        solution: `Solving gives ${a > 0 ? `$${tex((lo - b) / a)} < x \\le ${tex((hi - b) / a)}$` : `$${tex((hi - b) / a)} \\le x < ${tex((lo - b) / a)}$`}${a < 0 ? " (the signs flip because you divide by a negative)" : ""}. The integers are ${xs[0]} through ${xs[xs.length - 1]}: **${n}**.` };
    } });

  // ───────────────────────── Writing equations and inequalities from context ─────────────────────────
  add({ id: "u4.mo.words", skill: "u4.model", level: L.B, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 9), b = r.intNot(1, 20, [a]), c = r.int(20, 80), kind = r.int(0, 2);
      const F = [
        [`${b} more than ${a} times a number is ${c}.`, `${a}n + ${b} = ${c}`, [`${a}(n + ${b}) = ${c}`, `${b}n + ${a} = ${c}`, `${a}n = ${b} + ${c}`]],
        [`${a} times the sum of a number and ${b} is ${c}.`, `${a}(n + ${b}) = ${c}`, [`${a}n + ${b} = ${c}`, `${a} + n + ${b} = ${c}`, `n + ${a * b} = ${c}`]],
        [`${b} less than ${a} times a number is ${c}.`, `${a}n - ${b} = ${c}`, [`${b} - ${a}n = ${c}`, `${a}(n - ${b}) = ${c}`, `${a}n + ${b} = ${c}`]],
      ][kind];
      const m = mcq(`$${F[1]}$`, F[2].map((t) => ({ text: `$${t}$`, why: "Read the words in order: what is multiplied, and what is added or subtracted?" })), r);
      return { key: [a, b, c, kind], ...m,
        prompt: `Which equation says: "${F[0]}"`,
        hint: "\"Times\" multiplies. \"More than\" adds. \"Less than\" subtracts from the thing after it.",
        solution: `**$${F[1]}$**` };
    } });

  add({ id: "u4.mo.cost", skill: "u4.model", level: L.I, type: "numeric", calc: false,
    make(r) {
      const c = r.pick([["A gym", "a sign-up fee", "per month", "months"], ["A taxi ride", "a starting fee", "per mile", "miles"], ["A bowling party", "a room fee", "per person", "people"]]);
      const fee = r.int(2, 10) * 5, rate = r.int(3, 15), n = r.int(3, 20);
      return { key: [c[0], fee, rate, n], answer: n,
        prompt: `${c[0]} costs \\$${fee} for ${c[1]} plus \\$${rate} ${c[2]}. The total cost was \\$${fee + rate * n}. How many ${c[3]}?`,
        hint: `Write $${fee} + ${rate}x = ${fee + rate * n}$.`,
        solution: `$${fee} + ${rate}x = ${fee + rate * n}$, so $${rate}x = ${rate * n}$ and $x = \\mathbf{${n}}$.` };
    } });

  add({ id: "u4.mo.budget", skill: "u4.model", level: L.H, type: "numeric", calc: false,
    make(r) {
      const item = r.pick(["movie tickets", "notebooks", "songs", "bracelets"]);
      const fixed = r.int(2, 12) * 5, per = r.int(3, 14), B = fixed + per * r.int(4, 20) + r.int(1, per - 1);
      const n = Math.floor((B - fixed) / per);
      return { key: [item, fixed, per, B], answer: n,
        prompt: `Jada has \\$${B}. She must pay a one-time \\$${fixed} fee and then \\$${per} for each of the ${item}. What is the greatest number of ${item} she can buy?`,
        hint: `Write $${fixed} + ${per}x \\le ${B}$.`,
        solution: `$${fixed} + ${per}x \\le ${B}$, so $${per}x \\le ${B - fixed}$ and $x \\le ${String(+((B - fixed) / per).toFixed(2))}$. She can buy at most **${n}**.` };
    } });

  add({ id: "u4.mo.which-ineq", skill: "u4.model", level: L.H, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 3), a = r.int(3, 12), b = r.int(2, 9) * 10, c = r.int(10, 50) * 10;
      const S = [
        [`A van can carry at most ${c} pounds. The driver weighs ${b} pounds, and each box weighs ${a} pounds. Which inequality shows the number of boxes $x$ the van can carry?`, "<="],
        [`A club needs at least \\$${c} for a trip. It already has \\$${b} and earns \\$${a} for each car washed. Which inequality shows the number of cars $x$ it must wash?`, ">="],
        [`A phone plan must cost less than \\$${c} this year. It costs \\$${b} to start and \\$${a} each month. Which inequality shows the number of months $x$?`, "<"],
        [`To win, a player needs more than ${c} points. She has ${b} points and earns ${a} points per level. Which inequality shows the number of levels $x$ she must finish?`, ">"],
      ][kind];
      const right = `$${b} + ${a}x ${OPS[S[1]]} ${c}$`;
      const m = mcq(right, [
        { text: `$${b} + ${a}x ${OPS[FLIP[S[1]]]} ${c}$`, why: "\"At most\" and \"less than\" mean $\\le$ or $<$. \"At least\" and \"more than\" mean $\\ge$ or $>$." },
        { text: `$${b} + ${a}x ${OPS[STRICT[S[1]]]} ${c}$`, why: "\"At least\" and \"at most\" include the number. \"More than\" and \"less than\" do not." },
        { text: `$${a} + ${b}x ${OPS[S[1]]} ${c}$`, why: `${b} happens once; ${a} is the amount for each one.` },
      ], r);
      return { key: [kind, a, b, c], ...m,
        prompt: S[0],
        hint: "The amount for each one multiplies $x$. Then decide on the sign from the words.",
        solution: `Start plus ${a} for each: $${b} + ${a}x$. The words call for $${OPS[S[1]]}$: **${right}**` };
    } });

  add({ id: "u4.mo.cheaper", skill: "u4.model", level: L.C, type: "numeric", calc: false,
    make(r) {
      const f1 = r.int(0, 6) * 10, p1 = r.int(8, 20), f2 = f1 + r.int(3, 12) * 10, p2 = r.int(3, p1 - 2);
      // plan B cheaper when f2 + p2 x < f1 + p1 x  =>  x > (f2 - f1)/(p1 - p2)
      const bound = (f2 - f1) / (p1 - p2), ans = Math.floor(bound) + 1;
      return { key: [f1, p1, f2, p2], answer: ans,
        prompt: `Plan A costs \\$${f1 ? f1 + " plus \\$" : ""}${p1} per class. Plan B costs \\$${f2} plus \\$${p2} per class. What is the least number of classes for which Plan B costs **less** than Plan A?`,
        hint: `Write $${lin(p2, f2)} < ${lin(p1, f1)}$ and solve.`,
        solution: `$${lin(p2, f2)} < ${lin(p1, f1)}$ gives $${f2 - f1} < ${p1 - p2}x$, so $x > ${tex(bound)}$. The least whole number is **${ans}**.` };
    } });

  add({ id: "u4.mo.interpret", skill: "u4.model", level: L.C, type: "mcq", calc: false,
    make(r) {
      const fee = r.int(2, 8) * 5, rate = r.int(8, 20), B = fee + rate * r.int(4, 15);
      const n = (B - fee) / rate;
      const right = `Ari can rent the kayak for at most ${n} hours and stay within the budget.`;
      const m = mcq(right, [
        { text: `Ari must rent the kayak for at least ${n} hours.`, why: "The inequality says the cost is at most the budget, so the hours have a maximum." },
        { text: `Each hour costs \\$${n}.`, why: `Each hour costs \\$${rate}. ${n} is a number of hours.` },
        { text: `Ari will spend exactly \\$${n}.`, why: `${n} is the number of hours, not dollars.` },
      ], r);
      return { key: [fee, rate, B], ...m,
        prompt: `Renting a kayak costs \\$${fee} plus \\$${rate} per hour. Ari has \\$${B}. Solving $${fee} + ${rate}h \\le ${B}$ gives $h \\le ${n}$. What does this mean?`,
        hint: "What does $h$ stand for? What does $\\le$ say about it?",
        solution: `$h$ is the number of hours, and $\\le$ means "no more than". **${right}**` };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  add({ id: "u4.th.find-error", skill: "u4.ineq", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = -r.int(2, 6), b = r.intNot(-9, 9, [0]), v = r.int(-6, 7), op = r.pick(["<", ">", "<=", ">="]), c = a * v + b, kind = r.int(0, 3);
      const s1 = kind === 0 ? `$${a}x ${OPS[op]} ${c + b}$` : `$${a}x ${OPS[op]} ${c - b}$`;
      const lhs = kind === 0 ? c + b : c - b;
      const op2 = kind === 1 ? op : FLIP[op], bound2 = lhs / a, up = op2 === ">" || op2 === ">=";
      const s2 = `$x ${OPS[op2]} ${tex(bound2)}$`;
      const good = up ? Math.floor(bound2) + 1 : Math.ceil(bound2) - 1, badT = up ? Math.floor(bound2) - 1 : Math.ceil(bound2) + 1;
      const s3 = `So $x = ${kind === 2 ? badT : good}$ is a solution.`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = [`To undo $${signed(b)}$, ${b > 0 ? "subtract" : "add"} ${Math.abs(b)} on both sides.`, `Dividing by ${a}, a negative number, flips the inequality sign.`, "That value does not make the inequality from Step 2 true."][Math.max(0, bad)];
      const f = findStep([s1, s2, s3], bad, whyWrong);
      return { key: [a, b, v, op, kind], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `Leo solved $${lin(a, b)} ${OPS[op]} ${c}$:<br>${f.stepsText}<br>Where is Leo's first mistake?`,
        hint: "Redo each step yourself.",
        solution: `$${a}x ${OPS[op]} ${c - b}$, then divide by ${a} and flip: $x ${OPS[FLIP[op]]} ${v}$.<br>` + (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  add({ id: "u4.th.make-true", skill: "u4.linear", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(2, 6), b = r.intNot(-6, 6, [0]), kind = r.chance(0.5) ? "none" : "one";
      const ab = a * b;
      return kind === "none"
        ? { key: [a, b, 0], answer: ab + 1, accept: { not: [ab] }, think: true,
          prompt: `Give **one** number $k$ that makes $${a}(x ${signed(b)}) = ${a}x + k$ have **no** solution.`,
          hint: "Distribute the left side. When can the two sides never be equal?",
          solution: `The left side is $${a}x ${signed(ab)}$. If $k = ${ab}$ the sides match for every $x$ (infinitely many solutions). **Any $k$ except ${ab}** gives no solution.` }
        : { key: [a, b, 1], answer: a + 1, accept: { not: [a] }, think: true,
          prompt: `Give **one** number $m$ that makes $${a}(x ${signed(b)}) = mx + ${Math.abs(ab) + 3}$ have **exactly one** solution.`,
          hint: "Exactly one solution means the $x$-terms are different.",
          solution: `The left side is $${a}x ${signed(ab)}$. If $m = ${a}$ the $x$-terms cancel and the equation has no solution. **Any $m$ except ${a}** gives exactly one solution.` };
    } });

  add({ id: "u4.th.reason", skill: "u4.ineq", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = -r.int(2, 5), b = r.int(-6, 6), v = r.int(-4, 5), c = a * v + b, op = r.pick(["<", ">"]);
      const t = r.pick([v - 2, v + 2]), ok = holds(op, a * t + b, c);
      const right = ok ? `Yes, because $${a}(${t}) ${signed(b)} = ${a * t + b}$, and $${a * t + b} ${OPS[op]} ${c}$ is true.` : `No, because $${a}(${t}) ${signed(b)} = ${a * t + b}$, and $${a * t + b} ${OPS[op]} ${c}$ is false.`;
      const m = mcq(right, [
        { text: ok ? `No, because $${t} ${OPS[op]} ${v}$ is false.` : `Yes, because $${t} ${OPS[op]} ${v}$ is true.`, why: `Solving gives $x ${OPS[FLIP[op]]} ${v}$: the sign flips when you divide by ${a}.` },
        { text: ok ? `No, because ${t} is ${t < 0 ? "negative" : "not negative"}.` : `Yes, because ${t} is ${t < 0 ? "negative" : "not negative"}.`, why: "The sign of $x$ alone does not decide it. Substitute." },
        { text: ok ? `Yes, because ${t} is close to ${v}.` : `No, because ${t} is close to ${v}.`, why: "Being close does not decide it. Substitute." },
      ], r);
      return { key: [a, b, v, op, t], ...m, think: true,
        prompt: `Is $x = ${t}$ a solution of $${lin(a, b)} ${OPS[op]} ${c}$? Pick the answer with the correct reason.`,
        hint: "Substitute the value, or solve and watch the sign.",
        solution: `**${right}** Solving gives $x ${OPS[FLIP[op]]} ${v}$, which agrees.` };
    } });

  const U4_ASN = [
    { s: "Multiplying both sides of an inequality by the same number keeps it true.",
      right: "Sometimes true: it works for positive numbers, but multiplying by a negative number flips the inequality.",
      wrong: ["Always true: you do the same thing to both sides.", "Never true: multiplying always flips the sign.", "Sometimes true: only for whole numbers."] },
    { s: "An equation of the form $ax + b = ax + c$ has exactly one solution.",
      right: "Never true: the $x$-terms cancel, leaving $b = c$, which is either always true or never true.",
      wrong: ["Always true: linear equations have one solution.", "Sometimes true: only when $a > 0$.", "Sometimes true: only when $b \\ne c$."] },
    { s: "If $x > 3$, then $-x > -3$.",
      right: "Never true: if $x > 3$ then $-x < -3$. Multiplying by $-1$ flips the sign.",
      wrong: ["Always true: you did the same thing to both sides.", "Sometimes true: only when $x$ is negative.", "Sometimes true: only for whole numbers."] },
    { s: "The solution of $2x + 6 = 2(x + 3)$ is $x = 0$.",
      right: "Sometimes true: $x = 0$ works, but so does every other number. The equation has infinitely many solutions.",
      wrong: ["Always true: $x = 0$ is the only solution.", "Never true: $x = 0$ does not work.", "Never true: the equation has no solution."] },
    { s: "If $a < b$, then $a + c < b + c$.",
      right: "Always true: adding the same number to both sides keeps the order.",
      wrong: ["Sometimes true: only when $c > 0$.", "Never true: adding changes the order.", "Sometimes true: only when $a$ and $b$ are positive."] },
    { s: "Solving a formula for a variable changes the relationship between the quantities.",
      right: "Never true: it is the same relationship written another way, so every set of values that fit before still fit.",
      wrong: ["Always true: the formula looks different.", "Sometimes true: only when you divide.", "Sometimes true: only when the variable is squared."] },
  ];
  add({ id: "u4.th.always", skill: "u4.linear", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U4_ASN.length - 1), it = U4_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Try a few examples, including negative numbers.",
        solution: `**${it.right}**` };
    } });

  M1.units.u4 = Object.assign(M1.units.u4 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
