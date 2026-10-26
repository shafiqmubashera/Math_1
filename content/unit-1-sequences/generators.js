/* Unit 1 Sequences: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, arith, geom, terms, list, texList, paren,
    eqArithExplicit, eqGeomExplicit, eqArithRecursive, eqGeomRecursive, windowFor } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);
  const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));

  // ───────────────────────── Growing patterns and expressions ─────────────────────────
  add({ id: "u1.pat.evaluate", skill: "u1.patterns", level: L.B, type: "numeric", calc: false,
    make(r) {
      const d = r.int(2, 6), c = r.int(1, 9), n = r.int(5, 12);
      return { key: [d, c, n],
        prompt: `A tile pattern has $${d}n + ${c}$ tiles in figure $n$. How many tiles are in figure ${n}?`,
        answer: d * n + c,
        hint: `Replace $n$ with ${n}.`,
        solution: `$${d}(${n}) + ${c} = ${d * n} + ${c} = \\mathbf{${d * n + c}}$` };
    } });

  add({ id: "u1.pat.table-expr", skill: "u1.patterns", level: L.I, type: "mcq", calc: false,
    make(r) {
      const d = r.int(2, 9), a = r.intNot(1, 15, [d]);
      const t = terms((n) => arith(a, d, n), 4);
      const c = a - d; // f(n) = dn + c
      const ex = (k) => (k === 0 ? `$${d}n$` : `$${d}n ${signed(k)}$`);
      const m = mcq(ex(c), [
        { text: ex(a), why: `This gives figure 1 = ${d + a}. The constant must make figure 1 equal ${a}.` },
        { text: `$${a}n ${signed(d)}$`, why: "This swaps the starting amount and the amount added each time." },
        { text: `$n ${signed(d)}$`, why: `The pattern grows by ${d} each figure, so the coefficient of $n$ is ${d}.` },
      ], r, [{ text: `$${d + 1}n ${signed(c - 1)}$`, why: `Check figure 2: this does not give ${t[1]}.` }]);
      return { key: [a, d], ...m,
        prompt: `The table shows the number of tiles in each figure of a pattern. Which expression gives the number of tiles in figure $n$?`,
        table: { headers: ["Figure n", "1", "2", "3", "4"], rows: [["Tiles", ...t.map(fmt)]] },
        hint: "How many tiles are added each time? That number multiplies $n$.",
        solution: `Tiles go up by ${d} each figure, so start with $${d}n$. For figure 1, $${d}(1) = ${d}$ but we need ${a}, so add ${c}.<br>Expression: $\\mathbf{${d}n ${c === 0 ? "" : signed(c)}}$` };
    } });

  add({ id: "u1.pat.border-multi", skill: "u1.patterns", level: L.H, type: "multi", calc: false,
    make(r) {
      const n = r.int(4, 9);
      const items = [
        { text: "$4n + 4$", ok: true },
        { text: "$4(n + 1)$", ok: true },
        { text: "$(n + 2)^2 - n^2$", ok: true },
        { text: "$2n + 2(n + 2)$", ok: true },
        { text: "$4n$", ok: false, why: "This misses the 4 corner tiles." },
        { text: "$(n + 2)^2$", ok: false, why: "This counts the inside squares too." },
        { text: "$4(n + 2)$", ok: false, why: "This counts each corner twice." },
      ];
      const pick = r.shuffle(items.filter((i) => i.ok)).slice(0, r.int(2, 3)).concat(r.shuffle(items.filter((i) => !i.ok)).slice(0, 2));
      const m = multi(pick, r);
      return { key: [n, m.choices.join("|")], ...m,
        prompt: `A square garden is $n$ by $n$ tiles. One row of border tiles goes all the way around it, including the corners. Select **all** expressions that give the number of border tiles.`,
        hint: `Try it with $n = ${n}$: draw it or count. Then test each expression.`,
        solution: `For $n = ${n}$ there are $4(${n}) + 4 = ${4 * n + 4}$ border tiles (4 sides of ${n} plus 4 corners). Each correct expression simplifies to $4n + 4$: $4(n+1)$, $(n+2)^2 - n^2 = 4n + 4$, $2n + 2(n+2) = 4n + 4$.` };
    } });

  add({ id: "u1.pat.which-figure", skill: "u1.patterns", level: L.C, type: "numeric", calc: false,
    make(r) {
      const d = r.int(3, 7), a = r.int(2, 10), k = r.int(15, 40);
      const f5 = arith(a, d, 5), target = arith(a, d, k);
      return { key: [a, d, k],
        prompt: `Figure 1 of a pattern has ${a} squares and figure 5 has ${f5} squares. The same number of squares is added each time. Which figure has exactly ${target} squares?`,
        answer: k,
        hint: "First find how many squares are added each time.",
        solution: `From figure 1 to figure 5 is 4 steps: $(${f5} - ${a}) \\div 4 = ${d}$ per step.<br>$${a} + ${d}(n - 1) = ${target}$ → $${d}(n-1) = ${target - a}$ → $n - 1 = ${k - 1}$ → $n = \\mathbf{${k}}$` };
    } });

  // ───────────────────────── Arithmetic sequences ─────────────────────────
  add({ id: "u1.ar.next", skill: "u1.arith", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-10, 25), d = r.intNot(-9, 12, [0]);
      const t = terms((n) => arith(a, d, n), 5);
      return { key: [a, d],
        prompt: `What is the next term of this arithmetic sequence? $${texList(t.slice(0, 4))},\\ \\ldots$`,
        answer: t[4],
        hint: "Subtract any term from the one after it.",
        solution: `Common difference: $${t[1]} - ${t[0] < 0 ? "(" + t[0] + ")" : t[0]} = ${d}$. Next term: $${t[3]} ${signed(d)} = \\mathbf{${t[4]}}$` };
    } });

  add({ id: "u1.ar.diff", skill: "u1.arith", level: L.B, type: "mcq", calc: false,
    make(r) {
      const a = r.int(-5, 30), d = r.intNot(-8, 9, [0, 1, -1]);
      const t = terms((n) => arith(a, d, n), 4);
      const m = mcq(fmt(d), [
        { text: fmt(-d), why: "Subtract an earlier term from a later one, not the other way around." },
        { text: fmt(t[1]), why: "That is the second term, not the change between terms." },
        { text: fmt(t[3] - t[0]), why: "That is the change over 3 steps. Divide by 3." },
      ], r, [{ text: fmt(d + 1), why: "Check the subtraction again." }]);
      return { key: [a, d], ...m,
        prompt: `What is the common difference of the sequence $${texList(t)},\\ \\ldots$?`,
        hint: "Common difference = (a term) − (the term before it).",
        solution: `$${t[1]} - ${paren(t[0])} = \\mathbf{${d}}$` };
    } });

  add({ id: "u1.ar.nth", skill: "u1.arith", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-12, 20), d = r.intNot(-7, 9, [0]), n = r.pick([15, 20, 25, 30, 40, 50]);
      const t = terms((k) => arith(a, d, k), 4);
      return { key: [a, d, n],
        prompt: `Find the ${ordinal(n)} term of the arithmetic sequence $${texList(t)},\\ \\ldots$`,
        answer: arith(a, d, n),
        hint: `Use $f(n) = f(1) + d(n - 1)$.`,
        solution: `$f(1) = ${a}$, $d = ${d}$.<br>$f(${n}) = ${a} ${signed(d)}(${n} - 1) = ${a} ${signed(d * (n - 1))} = \\mathbf{${arith(a, d, n)}}$` };
    } });

  add({ id: "u1.ar.which-term", skill: "u1.arith", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-15, 15), d = r.intNot(-6, 8, [0]), k = r.int(18, 60);
      const v = arith(a, d, k);
      return { key: [a, d, k],
        prompt: `The arithmetic sequence ${list(terms((n) => arith(a, d, n), 4))}, … continues. Which term number is ${fmt(v)}?`,
        answer: k,
        hint: `Set $${a} ${signed(d)}(n - 1)$ equal to ${v} and solve for $n$.`,
        solution: `$${a} ${signed(d)}(n - 1) = ${v}$<br>$${d}(n - 1) = ${v - a}$<br>$n - 1 = ${k - 1}$, so $n = \\mathbf{${k}}$` };
    } });

  add({ id: "u1.ar.meet", skill: "u1.arith", level: L.C, type: "numeric", calc: false,
    make(r) {
      // f(n) = a1 + d1(n-1), g(n) = a2 + d2(n-1), equal at n = k
      const k = r.int(6, 20), d1 = r.int(2, 9), d2 = r.intNot(-4, 1, [0]);
      const v = r.int(20, 120), a1 = v - d1 * (k - 1), a2 = v - d2 * (k - 1);
      return { key: [a1, d1, a2, d2],
        prompt: `Sequence A: $${eqArithExplicit(a1, d1, "f")}$<br>Sequence B: $${eqArithExplicit(a2, d2, "g")}$<br>For which term number $n$ are the two sequences equal?`,
        answer: k,
        hint: "Set $f(n) = g(n)$ and solve.",
        solution: `$${a1} ${signed(d1)}(n-1) = ${a2} ${signed(d2)}(n-1)$<br>$${d1 - d2}(n - 1) = ${a2 - a1}$<br>$n - 1 = ${k - 1}$, so $n = \\mathbf{${k}}$ (both equal ${v}).` };
    } });

  // ───────────────────────── Geometric sequences ─────────────────────────
  add({ id: "u1.ge.next", skill: "u1.geom", level: L.B, type: "numeric", calc: false,
    make(r) {
      const rr = r.pick([2, 3, 4, -2, 5, -3, 10]), a = r.int(1, 9) * r.pick([1, 1, -1]);
      const t = terms((n) => geom(a, rr, n), 5);
      return { key: [a, rr],
        prompt: `What is the next term of this geometric sequence? $${texList(t.slice(0, 4))},\\ \\ldots$`,
        answer: t[4],
        hint: "Divide any term by the one before it to find the ratio.",
        solution: `Ratio: $${t[1]} \\div ${paren(t[0])} = ${rr}$. Next: $${t[3]} \\cdot ${paren(rr)} = \\mathbf{${t[4]}}$` };
    } });

  add({ id: "u1.ge.ratio", skill: "u1.geom", level: L.B, type: "mcq", calc: false,
    make(r) {
      const rr = r.pick([2, 3, 4, 5, 1 / 2, 1 / 3, -2, -3]);
      const a = rr === 1 / 2 ? r.pick([32, 64, 128, 256]) : rr === 1 / 3 ? r.pick([81, 162, 243]) : r.int(1, 5);
      const t = terms((n) => geom(a, rr, n), 4);
      const m = mcq(`$${tex(rr)}$`, [
        { text: `$${tex(t[1] - t[0])}$`, why: "That is a difference. Geometric sequences multiply by the same number." },
        { text: `$${tex(1 / rr)}$`, why: "Divide a term by the one before it, not the other way around." },
        { text: `$${tex(-rr)}$`, why: "Check the sign of the terms." },
      ], r, [{ text: `$${tex(rr * 2)}$`, why: "Check the division again." }]);
      return { key: [a, rr], ...m,
        prompt: `What is the common ratio of the geometric sequence $${texList(t)},\\ \\ldots$?`,
        hint: "Common ratio = (a term) ÷ (the term before it).",
        solution: `$${tex(t[1])} \\div ${paren(t[0])} = \\mathbf{${tex(rr)}}$` };
    } });

  add({ id: "u1.ge.nth", skill: "u1.geom", level: L.I, type: "numeric", calc: true,
    make(r) {
      const rr = r.pick([2, 3, 1.5, -2]), a = rr === 1.5 ? r.pick([16, 32, 64]) : r.int(2, 7), n = rr === 3 ? r.int(6, 8) : r.int(7, 10);
      const t = terms((k) => geom(a, rr, k), 3);
      return { key: [a, rr, n],
        prompt: `Find the ${ordinal(n)} term of the geometric sequence $${texList(t)},\\ \\ldots$`,
        answer: geom(a, rr, n),
        hint: `Use $f(n) = f(1) \\cdot r^{n-1}$.`,
        solution: `$f(1) = ${a}$, $r = ${tex(rr)}$.<br>$f(${n}) = ${a} \\cdot ${paren(rr)}^{${n - 1}} = \\mathbf{${tex(geom(a, rr, n))}}$` };
    } });

  add({ id: "u1.ge.fraction", skill: "u1.geom", level: L.H, type: "numeric", calc: false,
    make(r) {
      const [num, den] = r.pick([[1, 2], [-1, 2], [1, 3], [-1, 3], [2, 3], [-2, 3], [3, 2], [-3, 2]]);
      const rr = num / den, n = r.pick([5, 6]), a = den ** (n - 1) * r.int(1, 3);
      const t = terms((k) => geom(a, rr, k), 3);
      return { key: [a, rr, n],
        prompt: `Find the ${ordinal(n)} term of the geometric sequence $${texList(t)},\\ \\ldots$ (A fraction like 3/4 is fine.)`,
        answer: geom(a, rr, n),
        hint: "Find the ratio first. It may be negative or a fraction.",
        solution: `$r = ${tex(t[1])} \\div ${paren(t[0])} = ${tex(rr)}$.<br>$f(${n}) = ${a} \\cdot ${paren(rr)}^{${n - 1}} = \\mathbf{${tex(geom(a, rr, n))}}$` };
    } });

  add({ id: "u1.ge.exceed", skill: "u1.geom", level: L.C, type: "numeric", calc: true,
    make(r) {
      const rr = r.pick([2, 3, 1.5]), a = r.int(2, 9), X = r.pick([500, 1000, 2000, 5000]);
      let n = 1; while (geom(a, rr, n) <= X) n++;
      return { key: [a, rr, X],
        prompt: `A geometric sequence has $f(1) = ${a}$ and common ratio ${fmt(rr)}. What is the first term number $n$ where $f(n)$ is greater than ${X}?`,
        answer: n,
        hint: "Make a table of terms, or test values of n in $f(n) = f(1) \\cdot r^{n-1}$.",
        solution: `$f(${n - 1}) = ${a} \\cdot ${paren(rr)}^{${n - 2}} = ${fmt(geom(a, rr, n - 1))}$ (not yet over ${X})<br>$f(${n}) = ${a} \\cdot ${paren(rr)}^{${n - 1}} = ${fmt(geom(a, rr, n))}$ > ${X}, so $n = \\mathbf{${n}}$` };
    } });

  // ───────────────────────── Explicit and recursive equations ─────────────────────────
  add({ id: "u1.fo.recursive-eval", skill: "u1.forms", level: L.B, type: "numeric", calc: false,
    make(r) {
      const geo = r.chance(0.4);
      const a = r.int(2, 9), d = geo ? r.pick([2, 3]) : r.intNot(-6, 8, [0]);
      const f = (n) => (geo ? geom(a, d, n) : arith(a, d, n));
      const eq = geo ? eqGeomRecursive(a, d) : eqArithRecursive(a, d);
      return { key: [geo, a, d],
        prompt: `A sequence is defined by $${eq}$. What is $f(4)$?`,
        answer: f(4),
        hint: "Start at $f(1)$ and apply the rule three times.",
        solution: `$f(1) = ${a}$, $f(2) = ${f(2)}$, $f(3) = ${f(3)}$, $f(4) = \\mathbf{${f(4)}}$` };
    } });

  add({ id: "u1.fo.table-explicit", skill: "u1.forms", level: L.I, type: "mcq", calc: false,
    make(r) {
      const d = r.intNot(-7, 8, [0, 1]), a = r.intNot(-6, 15, [d, 0]);
      const t = terms((n) => arith(a, d, n), 4);
      const m = mcq(`$${eqArithExplicit(a, d)}$`, [
        { text: `$f(n) = ${tex(a)} ${signed(d)}n$`, why: `Check n = 1: this gives ${a + d}, not ${a}. Use $(n - 1)$.` },
        { text: `$${eqArithExplicit(d, a)}$`, why: "The first term and the common difference are swapped." },
        { text: `$${eqGeomExplicit(a, d)}$`, why: "This is geometric (multiplies). The table adds the same amount each time." },
      ], r);
      return { key: [a, d], ...m,
        prompt: "Which explicit equation matches the table?",
        table: { headers: ["n", "1", "2", "3", "4"], rows: [["f(n)", ...t.map(fmt)]] },
        hint: "Find the first term and the common difference.",
        solution: `$f(1) = ${a}$ and the terms change by ${d}, so $\\mathbf{${eqArithExplicit(a, d)}}$` };
    } });

  add({ id: "u1.fo.geo-recursive", skill: "u1.forms", level: L.I, type: "mcq", calc: false,
    make(r) {
      const rr = r.pick([2, 3, 4, 5, -2]), a = r.intNot(2, 8, [rr]);
      const t = terms((n) => geom(a, rr, n), 4);
      const m = mcq(`$${eqGeomRecursive(a, rr)}$`, [
        { text: `$f(1) = ${a},\\ f(n) = f(n - 1) ${signed(rr)}$`, why: "This adds the ratio. A geometric sequence multiplies." },
        { text: `$f(1) = ${rr},\\ f(n) = ${paren(a)} \\cdot f(n - 1)$`, why: "The first term and the ratio are swapped." },
        { text: `$f(1) = ${a},\\ f(n) = ${paren(rr)} \\cdot f(n + 1)$`, why: "A recursive rule builds each term from the one *before* it, $f(n - 1)$." },
      ], r);
      return { key: [a, rr], ...m,
        prompt: `Which recursive equation describes the sequence $${texList(t)},\\ \\ldots$?`,
        hint: "Is the sequence adding or multiplying each time?",
        solution: `Each term is ${rr} times the one before, starting at ${a}: $\\mathbf{${eqGeomRecursive(a, rr)}}$` };
    } });

  add({ id: "u1.fo.explicit-to-recursive", skill: "u1.forms", level: L.H, type: "mcq", calc: false,
    make(r) {
      const geo = r.chance(0.5);
      const d = geo ? r.pick([2, 3, 4, 1 / 2]) : r.intNot(-9, 9, [0, 1]), a = r.intNot(2, 12, [d, Math.abs(d)]);
      const given = geo ? eqGeomExplicit(a, d) : eqArithExplicit(a, d);
      const correct = geo ? eqGeomRecursive(a, d) : eqArithRecursive(a, d);
      const dis = geo
        ? [{ text: `$f(1) = ${a},\\ f(n) = f(n - 1) ${signed(d)}$`, why: "The explicit form multiplies by the ratio, so the recursive form must multiply too." },
           { text: `$f(1) = ${tex(a * d)},\\ f(n) = ${paren(d)} \\cdot f(n - 1)$`, why: `$f(1) = ${a} \\cdot ${paren(d)}^0 = ${a}$, not ${tex(a * d)}.` },
           { text: `$f(0) = ${a},\\ f(n) = ${paren(d)} \\cdot f(n - 1)$`, why: "The sequence starts at $n = 1$." }]
        : [{ text: `$f(1) = ${a},\\ f(n) = ${paren(d)} \\cdot f(n - 1)$`, why: "The explicit form adds the difference, so the recursive form must add too." },
           { text: `$f(1) = ${a + d},\\ f(n) = f(n - 1) ${signed(d)}$`, why: `$f(1) = ${a} ${signed(d)}(0) = ${a}$.` },
           { text: `$f(1) = ${d},\\ f(n) = f(n - 1) ${signed(a)}$`, why: "The first term and the difference are swapped." }];
      const m = mcq(`$${correct}$`, dis, r);
      return { key: [geo, a, d], ...m,
        prompt: `Which recursive equation describes the same sequence as $${given}$?`,
        hint: "Find $f(1)$ from the explicit equation, then decide whether you add or multiply each step.",
        solution: `$f(1) = ${a}$, and each term ${geo ? "is multiplied by " + tex(d) : "changes by " + d}. So $\\mathbf{${correct}}$` };
    } });

  add({ id: "u1.fo.two-terms-explicit", skill: "u1.forms", level: L.C, type: "mcq", calc: false,
    make(r) {
      const a = r.int(-10, 20), d = r.intNot(-6, 9, [0, 1]), p = r.int(2, 4), q = p + r.int(3, 6);
      const fp = arith(a, d, p), fq = arith(a, d, q);
      const m = mcq(`$${eqArithExplicit(a, d)}$`, [
        { text: `$${eqArithExplicit(fp, d)}$`, why: `This makes $f(1) = ${fp}$, but ${fp} is the ${ordinal(p)} term.` },
        { text: `$${eqArithExplicit(a, fq - fp)}$`, why: `${fq - fp} is the change over ${q - p} steps, not one step.` },
        { text: `$f(n) = ${tex(a)} ${signed(d)}n$`, why: `Check: this gives $f(${p}) = ${a + d * p}$, not ${fp}.` },
      ], r);
      return { key: [a, d, p, q], ...m,
        prompt: `An arithmetic sequence has $f(${p}) = ${fp}$ and $f(${q}) = ${fq}$. Which explicit equation defines it?`,
        hint: `From term ${p} to term ${q} is ${q - p} steps.`,
        solution: `$d = (${fq} - ${paren(fp)}) \\div ${q - p} = ${d}$. Go back ${p - 1} step${p > 2 ? "s" : ""} from $f(${p})$: $f(1) = ${fp} - ${paren(d)}(${p - 1}) = ${a}$.<br>$\\mathbf{${eqArithExplicit(a, d)}}$` };
    } });

  // ───────────────────────── Arithmetic, geometric or neither ─────────────────────────
  const KINDS = ["Arithmetic", "Geometric", "Neither"];
  function seqOfKind(r, kind) {
    if (kind === 0) { for (;;) { const a = r.int(-10, 20), d = r.intNot(-7, 9, [0]); const t = terms((n) => arith(a, d, n), 5); if (!t.includes(0)) return t; } }
    if (kind === 1) { const a = r.int(1, 6), rr = r.pick([2, 3, -2, -3, 4]); return terms((n) => geom(a, rr, n), 5); }
    const s = r.pick(["sq", "tri", "plus2", "fib"]);
    if (s === "sq") { const k = r.int(0, 3); return terms((n) => (n + k) ** 2, 5); }
    if (s === "tri") return terms((n) => (n * (n + 1)) / 2, 5);
    if (s === "plus2") { const a = r.int(1, 4); const out = [a]; for (let i = 1; i < 5; i++) out.push(2 * out[i - 1] + 1); return out; }
    const a = r.int(1, 3), b = r.int(2, 5); const out = [a, b]; for (let i = 2; i < 5; i++) out.push(out[i - 1] + out[i - 2]); return out;
  }

  add({ id: "u1.cl.basic", skill: "u1.classify", level: L.B, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 2), t = seqOfKind(r, kind);
      const choices = ["Arithmetic", "Geometric", "Neither", "Both arithmetic and geometric"];
      const why = ["Arithmetic sequences add the same amount each time.", "Geometric sequences multiply by the same amount each time.",
        "Check both the differences and the ratios.", "Only a constant sequence (like 5, 5, 5) is both."];
      return { key: [kind, t.join(",")], choices, answer: kind, why: why.map((w, i) => (i === kind ? "Correct." : w)),
        prompt: `Is the sequence $${texList(t)},\\ \\ldots$ arithmetic, geometric, or neither?`,
        hint: "Check the differences between terms, then check the ratios.",
        solution: `Differences: ${list(t.slice(1).map((x, i) => x - t[i]))}. Ratios: ${list(t.slice(1).map((x, i) => x / t[i]))}.<br>**${KINDS[kind]}**${kind === 2 ? ": neither the differences nor the ratios stay the same." : "."}` };
    } });

  add({ id: "u1.cl.select-geometric", skill: "u1.classify", level: L.I, type: "multi", calc: false,
    make(r) {
      const target = r.int(0, 1); // select all arithmetic or all geometric
      const kinds = r.shuffle([target, target, (target + 1) % 2, 2, r.int(0, 2)]);
      const used = new Set();
      const uniqueSeq = (k) => { for (;;) { const t = texList(seqOfKind(r, k).slice(0, 4)); if (!used.has(t)) { used.add(t); return t; } } };
      const items = kinds.map((k) => ({ text: `$${uniqueSeq(k)},\\ \\ldots$`, ok: k === target,
        why: k === target ? "" : `This sequence is ${KINDS[k].toLowerCase()}.` }));
      const m = multi(items, r);
      if (m.answer.length === 0) throw new Error("no answer");
      return { key: [target, m.choices.join("|")], ...m,
        prompt: `Select **all** the ${KINDS[target].toLowerCase()} sequences.`,
        hint: target === 0 ? "Look for the same difference between every pair of terms." : "Look for the same ratio between every pair of terms.",
        solution: `The ${KINDS[target].toLowerCase()} sequences are the ones that ${target === 0 ? "add the same number" : "multiply by the same number"} each time.` };
    } });

  add({ id: "u1.cl.description", skill: "u1.classify", level: L.H, type: "mcq", calc: false,
    make(r) {
      const k = r.int(2, 5), c = r.int(1, 6);
      const opts = [
        { d: `Each term is ${k} more than the term before it.`, kind: 0 },
        { d: `Each term is ${k} times the term before it.`, kind: 1 },
        { d: `Each term is ${c} more than ${k} times the term before it.`, kind: 2 },
        { d: `Each term is the term number squared.`, kind: 2 },
        { d: `Each term is half of the term before it.`, kind: 1 },
        { d: `Each term is ${k} less than the term before it.`, kind: 0 },
      ];
      const o = r.pick(opts);
      const choices = ["Arithmetic", "Geometric", "Neither", "Not enough information"];
      const start = r.int(2, 9);
      return { key: [o.d, start], choices, answer: o.kind,
        why: ["Arithmetic means adding (or subtracting) the same amount.", "Geometric means multiplying by the same amount.", "Write out a few terms and check.", "The rule is enough to decide."].map((w, i) => (i === o.kind ? "Correct." : w)),
        prompt: `A sequence starts at ${start}. ${o.d} What type of sequence is it?`,
        hint: "Write the first four terms and check differences and ratios.",
        solution: o.kind === 2 ? "Write out terms: neither the differences nor the ratios stay the same, so it is **Neither**." : `The rule ${o.kind === 0 ? "adds the same amount" : "multiplies by the same amount"} each time, so it is **${KINDS[o.kind]}**.` };
    } });

  add({ id: "u1.cl.equations", skill: "u1.classify", level: L.C, type: "multi", calc: false,
    make(r) {
      const target = r.int(0, 1);
      const a = r.int(2, 9), b = r.int(2, 5);
      const pool = [
        { text: `$f(n) = ${b}n + ${a}$`, kind: 0 },
        { text: `$f(n) = ${a} - ${b}n$`, kind: 0 },
        { text: `$f(n) = ${a}\\cdot ${b}^{n}$`, kind: 1 },
        { text: `$f(n) = ${a}\\left(\\frac{1}{${b}}\\right)^{n-1}$`, kind: 1 },
        { text: `$f(n) = n^2 + ${a}$`, kind: 2 },
        { text: `$f(n) = ${b}^{n} + ${a}$`, kind: 2 },
        { text: `$f(1) = ${a},\\ f(n) = f(n-1) - ${b}$`, kind: 0 },
        { text: `$f(1) = ${a},\\ f(n) = ${b}\\cdot f(n-1)$`, kind: 1 },
        { text: `$f(1) = ${a},\\ f(n) = ${b}\\cdot f(n-1) + 1$`, kind: 2 },
      ];
      const pickT = r.shuffle(pool.filter((p) => p.kind === target)).slice(0, 2);
      const pickO = r.shuffle(pool.filter((p) => p.kind !== target)).slice(0, 3);
      const m = multi(pickT.concat(pickO).map((p) => ({ text: p.text, ok: p.kind === target,
        why: p.kind === target ? "" : `This one is ${KINDS[p.kind].toLowerCase()}.` })), r);
      return { key: [target, a, b, m.choices.join("|")], ...m,
        prompt: `Select **all** the equations that define ${target === 0 ? "an arithmetic" : "a geometric"} sequence.`,
        hint: "Compute $f(1), f(2), f(3)$ for each one if you are unsure.",
        solution: target === 0 ? "Arithmetic: the rule adds or subtracts a constant (a linear expression in $n$, or $f(n-1) \\pm$ constant)." : "Geometric: the rule multiplies by a constant (a constant times $b^n$, or a constant times $f(n-1)$). Adding a number after multiplying makes it neither." };
    } });

  // ───────────────────────── Tables and graphs ─────────────────────────
  add({ id: "u1.gr.plot-arith", skill: "u1.graphs", level: L.B, type: "plot", calc: false,
    make(r) {
      const a = r.int(2, 6), d = r.intNot(-2, 3, [0, 1]);
      const pts = terms((n) => arith(a, d, n), 4).map((y, i) => [i + 1, y]);
      return { key: [a, d],
        prompt: `Plot the first 4 terms of the sequence $${eqArithExplicit(a, d)}$ as points $(n, f(n))$. Tap the grid to place a point; tap it again to remove it.`,
        plot: { window: { xmin: 0, xmax: 6, ymin: Math.min(0, a + 3 * d) - 2, ymax: Math.max(a, a + 3 * d) + 3, xstep: 1, ystep: 1 } },
        answer: pts,
        hint: "Find f(1), f(2), f(3) and f(4). Each gives one point.",
        solution: `Points: ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(", ")}` };
    } });

  add({ id: "u1.gr.points-equation", skill: "u1.graphs", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const geo = r.chance(0.5);
      const a = geo ? r.int(1, 3) : r.int(1, 8), d = geo ? 2 : r.intNot(-3, 4, [0]);
      const pts = terms((n) => (geo ? geom(a, d, n) : arith(a, d, n)), 5).map((y, i) => [i + 1, y]);
      const correct = geo ? eqGeomExplicit(a, d) : eqArithExplicit(a, d);
      const dis = geo
        ? [{ text: `$${eqArithExplicit(a, a)}$`, why: "These points curve upward, so the sequence multiplies." },
           { text: `$${eqGeomExplicit(d, a === d ? a + 1 : a)}$`, why: "First term and ratio are swapped." },
           { text: `$f(n) = ${a}\\cdot 2^{n}$`, why: `Check n = 1: this gives ${2 * a}, but the first point is (1, ${a}).` }]
        : [{ text: `$${eqGeomExplicit(a, Math.abs(d) + 1)}$`, why: "The points lie on a line, so the sequence adds the same amount." },
           { text: `$f(n) = ${a} ${signed(d)}n$`, why: `Check n = 1: this gives ${a + d}, but the first point is (1, ${a}).` },
           { text: `$${eqArithExplicit(a, -d)}$`, why: "Check whether the points go up or down." }];
      const m = mcq(`$${correct}$`, dis, r);
      return { key: [geo, a, d], ...m,
        prompt: "The graph shows the first five terms of a sequence. Which equation matches the graph?",
        graph: { points: pts, window: windowFor(pts) },
        hint: "Read the points. Do they go up by the same amount or by the same factor?",
        solution: `Points: ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(", ")}. ${geo ? "Each y-value doubles" : `Each y-value changes by ${d}`}, starting at ${a}: $\\mathbf{${correct}}$` };
    } });

  add({ id: "u1.gr.plot-geom", skill: "u1.graphs", level: L.H, type: "plot", calc: false,
    make(r) {
      const opt = r.pick([[16, 1 / 2], [1, 2], [2, 2], [27, 1 / 3], [1, 3]]);
      const [a, rr] = opt;
      const pts = terms((n) => geom(a, rr, n), 4).map((y, i) => [i + 1, y]);
      const ymax = Math.max(...pts.map((p) => p[1]));
      return { key: [a, rr],
        prompt: `Plot the first 4 terms of $${eqGeomRecursive(a, rr)}$ as points $(n, f(n))$.`,
        plot: { window: { xmin: 0, xmax: 6, ymin: 0, ymax: ymax + 2, xstep: 1, ystep: ymax > 20 ? 2 : 1 } },
        answer: pts,
        hint: "Start at f(1) and multiply by the ratio to get each next term.",
        solution: `Points: ${pts.map((p) => `(${p[0]}, ${fmt(p[1])})`).join(", ")}` };
    } });

  add({ id: "u1.gr.extend", skill: "u1.graphs", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-4, 8), d = r.intNot(-3, 4, [0]), n = r.int(9, 15);
      const pts = terms((k) => arith(a, d, k), 4).map((y, i) => [i + 1, y]);
      return { key: [a, d, n],
        prompt: `The graph shows the first four terms of an arithmetic sequence. What is $f(${n})$?`,
        graph: { points: pts, window: windowFor(pts) },
        answer: arith(a, d, n),
        hint: "Read f(1) and the change from one point to the next.",
        solution: `$f(1) = ${a}$, $d = ${d}$. $f(${n}) = ${a} ${signed(d)}(${n - 1}) = \\mathbf{${arith(a, d, n)}}$` };
    } });

  add({ id: "u1.gr.cross", skill: "u1.graphs", level: L.C, type: "numeric", calc: true,
    make(r) {
      const a1 = r.int(15, 30), d1 = r.int(3, 6), a2 = r.int(1, 3);
      let n = 1; while (geom(a2, 2, n) <= arith(a1, d1, n)) n++;
      const N = Math.max(5, n - 1);
      const A = terms((k) => arith(a1, d1, k), Math.min(N, 5)).map((y, i) => [i + 1, y]);
      const B = terms((k) => geom(a2, 2, k), Math.min(N, 5)).map((y, i) => [i + 1, y]);
      return { key: [a1, d1, a2],
        prompt: `Sequence A (circles) is arithmetic and sequence B (squares) is geometric. The graph shows their first terms. If both patterns continue, what is the first term number where B is greater than A?`,
        graph: { points: A, points2: B, window: windowFor(A.concat(B)) },
        answer: n,
        hint: "Write a rule for each sequence, then make a table until B passes A.",
        solution: `A: $f(n) = ${a1} + ${d1}(n-1)$. B: $g(n) = ${a2}\\cdot 2^{n-1}$.<br>At $n = ${n - 1}$: A = ${arith(a1, d1, n - 1)}, B = ${geom(a2, 2, n - 1)}. At $n = ${n}$: A = ${arith(a1, d1, n)}, B = ${geom(a2, 2, n)}.<br>First term: $\\mathbf{${n}}$` };
    } });

  // ───────────────────────── Decreasing sequences ─────────────────────────
  add({ id: "u1.de.next", skill: "u1.decrease", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.int(40, 120), d = -r.int(3, 12);
      const t = terms((n) => arith(a, d, n), 5);
      return { key: [a, d],
        prompt: `What is the next term? $${texList(t.slice(0, 4))},\\ \\ldots$`,
        answer: t[4],
        hint: "How much does it go down each time?",
        solution: `It goes down by ${-d} each time: $${t[3]} - ${-d} = \\mathbf{${t[4]}}$` };
    } });

  add({ id: "u1.de.half", skill: "u1.decrease", level: L.I, type: "numeric", calc: false,
    make(r) {
      const rr = r.pick([1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 10]), den = Math.round(1 / rr), a = den ** 4 * r.int(1, 5);
      const t = terms((n) => geom(a, rr, n), 3);
      return { key: [a, rr],
        prompt: `Find the 5th term of the geometric sequence $${texList(t)},\\ \\ldots$`,
        answer: geom(a, rr, 5),
        hint: "Each term is a fraction of the one before.",
        solution: `$r = ${tex(rr)}$. $f(5) = ${a} \\cdot \\left(${tex(rr)}\\right)^4 = \\mathbf{${tex(geom(a, rr, 5))}}$` };
    } });

  add({ id: "u1.de.which-ratio", skill: "u1.decrease", level: L.H, type: "multi", calc: false,
    make(r) {
      const pool = [
        { v: 0.5, ok: true }, { v: 2 / 3, ok: true }, { v: 0.9, ok: true }, { v: 1 / 4, ok: true },
        { v: 1.2, ok: false, why: "A ratio greater than 1 makes positive terms grow." },
        { v: 3, ok: false, why: "A ratio greater than 1 makes positive terms grow." },
        { v: 1, ok: false, why: "A ratio of 1 keeps every term the same." },
        { v: -0.5, ok: false, why: "A negative ratio makes the terms switch between positive and negative." },
      ];
      const pick = r.shuffle(pool.filter((p) => p.ok)).slice(0, 2).concat(r.shuffle(pool.filter((p) => !p.ok)).slice(0, 3));
      const m = multi(pick.map((p) => ({ text: `$r = ${tex(p.v)}$`, ok: p.ok, why: p.why })), r);
      return { key: [m.choices.join("|")], ...m,
        prompt: `A geometric sequence starts with $f(1) = ${r.int(50, 200)}$. Select **all** the common ratios that make every term smaller than the term before it, while staying positive.`,
        hint: "Try multiplying 100 by each ratio a couple of times.",
        solution: "Positive terms get smaller every step only when $0 < r < 1$." };
    } });

  add({ id: "u1.de.depreciation", skill: "u1.decrease", level: L.C, type: "mcq", calc: true,
    make(r) {
      const P = r.pick([15000, 18000, 20000, 22000, 24000, 26000, 28000, 30000, 32000, 35000]), pct = r.pick([5, 8, 10, 12, 15, 20]);
      const keep = (100 - pct) / 100;
      const m = mcq(`$V(n) = ${P}\\cdot(${keep})^{n-1}$`, [
        { text: `$V(n) = ${P}\\cdot(${pct / 100})^{n-1}$`, why: `Multiplying by ${pct / 100} keeps only ${pct}%. Losing ${pct}% keeps ${100 - pct}%.` },
        { text: `$V(n) = ${P} - ${pct}(n-1)$`, why: `This subtracts \\$${pct} a year, not ${pct}%.` },
        { text: `$V(n) = ${P}\\cdot(${1 + pct / 100})^{n-1}$`, why: "This makes the value grow." },
      ], r);
      return { key: [P, pct], ...m,
        prompt: `A car is worth \\$${P} in year 1. Each year after that it is worth ${pct}% less than the year before. Which equation gives the car's value in year $n$?`,
        hint: `If it loses ${pct}%, what percent of its value does it keep?`,
        solution: `Losing ${pct}% means keeping ${100 - pct}% = ${keep} each year. Geometric, starting at ${P}: $\\mathbf{V(n) = ${P}\\cdot(${keep})^{n-1}}$` };
    } });

  // ───────────────────────── Missing terms ─────────────────────────
  add({ id: "u1.mi.middle-arith", skill: "u1.missing", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-10, 30), d = r.intNot(-9, 12, [0]);
      return { key: [a, d],
        prompt: `Fill in the missing term of the arithmetic sequence: $${a},\\ \\underline{\\quad ? \\quad},\\ ${a + 2 * d}$`,
        answer: a + d,
        hint: "The missing term is halfway between the two given terms.",
        solution: `$(${a} + ${paren(a + 2 * d)}) \\div 2 = \\mathbf{${a + d}}$` };
    } });

  add({ id: "u1.mi.diff-from-two", skill: "u1.missing", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-10, 20), d = r.intNot(-8, 9, [0]), p = r.int(2, 5), q = p + r.int(3, 7);
      return { key: [a, d, p, q],
        prompt: `In an arithmetic sequence, $f(${p}) = ${arith(a, d, p)}$ and $f(${q}) = ${arith(a, d, q)}$. What is the common difference?`,
        answer: d,
        hint: `How many steps from term ${p} to term ${q}?`,
        solution: `$d = \\dfrac{${arith(a, d, q)} - ${paren(arith(a, d, p))}}{${q} - ${p}} = \\dfrac{${d * (q - p)}}{${q - p}} = \\mathbf{${d}}$` };
    } });

  add({ id: "u1.mi.middle-geom", skill: "u1.missing", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.int(1, 6), rr = r.pick([2, 3, 4, 5]);
      return { key: [a, rr],
        prompt: `Fill in the missing term of the geometric sequence (all terms are positive): $${a},\\ \\underline{\\quad ? \\quad},\\ ${a * rr * rr}$`,
        answer: a * rr,
        hint: "Two steps of multiplying by $r$ take you from the first term to the last.",
        solution: `$r^2 = ${a * rr * rr} \\div ${a} = ${rr * rr}$, so $r = ${rr}$. Missing term: $${a} \\cdot ${rr} = \\mathbf{${a * rr}}$` };
    } });

  add({ id: "u1.mi.first-from-two", skill: "u1.missing", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-20, 20), d = r.intNot(-7, 8, [0]), p = r.int(3, 6), q = p + r.int(4, 8);
      return { key: [a, d, p, q],
        prompt: `In an arithmetic sequence, $f(${p}) = ${arith(a, d, p)}$ and $f(${q}) = ${arith(a, d, q)}$. What is $f(1)$?`,
        answer: a,
        hint: "Find the common difference, then work backward to term 1.",
        solution: `$d = ${d * (q - p)} \\div ${q - p} = ${d}$.<br>$f(1) = f(${p}) - ${p - 1}d = ${arith(a, d, p)} - ${paren(d * (p - 1))} = \\mathbf{${a}}$` };
    } });

  add({ id: "u1.mi.ratio-from-two", skill: "u1.missing", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.int(1, 5) * r.pick([1, -1]), rr = r.pick([2, 3, -2]), p = 2, q = 5;
      return { key: [a, rr],
        prompt: `In a geometric sequence, $f(2) = ${geom(a, rr, 2)}$ and $f(5) = ${geom(a, rr, 5)}$. What is the common ratio?`,
        answer: rr,
        hint: "From term 2 to term 5 you multiply by $r$ three times.",
        solution: `$r^3 = ${geom(a, rr, 5)} \\div ${paren(geom(a, rr, 2))} = ${rr ** 3}$, so $r = \\mathbf{${rr}}$` };
    } });

  add({ id: "u1.mi.geom-even-gap", skill: "u1.missing", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(1, 6), rr = r.pick([2, 3, -2, -3, 4, -4]);
      const f3 = geom(a, rr, 3), f7 = geom(a, rr, 7), f5 = geom(a, rr, 5);
      return { key: [a, rr],
        prompt: `A geometric sequence has $f(3) = ${f3}$ and $f(7) = ${f7}$. What is $f(5)$?`,
        answer: f5,
        hint: "From term 3 to term 5 you multiply by $r^2$. From term 3 to term 7 you multiply by $r^4$.",
        solution: `$r^4 = ${f7} \\div ${f3} = ${rr ** 4}$, so $r^2 = ${rr * rr}$ (a square is never negative).<br>$f(5) = f(3)\\cdot r^2 = ${f3} \\cdot ${rr * rr} = \\mathbf{${f5}}$. This works whether $r = ${Math.abs(rr)}$ or $r = ${-Math.abs(rr)}$.` };
    } });

  // ───────────────────────── Sequences in context ─────────────────────────
  add({ id: "u1.cx.seats", skill: "u1.context", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.int(12, 24), d = r.int(2, 4), n = r.int(8, 20);
      return { key: [a, d, n],
        prompt: `A theater has ${a} seats in row 1. Each row has ${d} more seats than the row in front of it. How many seats are in row ${n}?`,
        answer: arith(a, d, n),
        hint: `Row ${n} is ${n - 1} rows after row 1.`,
        solution: `$${a} + ${d}(${n} - 1) = ${a} + ${d * (n - 1)} = \\mathbf{${arith(a, d, n)}}$ seats` };
    } });

  add({ id: "u1.cx.savings-eq", skill: "u1.context", level: L.I, type: "mcq", calc: false,
    make(r) {
      const d = r.int(2, 8) * 5, A = r.intNot(3, 15, [d / 5]) * 5;
      const m = mcq(`$S(n) = ${A} + ${d}(n - 1)$`, [
        { text: `$S(n) = ${d} + ${A}(n - 1)$`, why: "The starting amount and the weekly amount are swapped." },
        { text: `$S(n) = ${A}\\cdot ${d}^{n-1}$`, why: "Adding the same amount each week is arithmetic, not geometric." },
        { text: `$S(n) = ${A} + ${d}n$`, why: `Week 1 should be \\$${A}. This gives \\$${A + d} in week 1.` },
      ], r);
      return { key: [A, d], ...m,
        prompt: `Maya has \\$${A} saved in week 1. She adds \\$${d} every week after that. Which equation gives her savings in week $n$?`,
        hint: "What is the amount in week 1, and how much is added each week?",
        solution: `Start at ${A} and add ${d} for each week after week 1: $\\mathbf{S(n) = ${A} + ${d}(n - 1)}$` };
    } });

  add({ id: "u1.cx.workout", skill: "u1.context", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.int(8, 20), d = r.int(2, 5), N = r.int(60, 150);
      const day = Math.ceil((N - a) / d) + 1;
      return { key: [a, d, N],
        prompt: `Scott does ${a} push-ups on day 1 and adds ${d} more each day. On which day does he first do at least ${N} push-ups?`,
        answer: day,
        hint: `Solve $${a} + ${d}(n - 1) \\ge ${N}$ and round up.`,
        solution: `$${a} + ${d}(n - 1) \\ge ${N}$ → $n - 1 \\ge ${fmt((N - a) / d)}$ → $n \\ge ${fmt((N - a) / d + 1)}$.<br>Day $\\mathbf{${day}}$ (${arith(a, d, day)} push-ups; day ${day - 1} has only ${arith(a, d, day - 1)}).` };
    } });

  add({ id: "u1.cx.bacteria", skill: "u1.context", level: L.H, type: "numeric", calc: true,
    make(r) {
      const B = r.pick([50, 100, 200, 250, 300]), m = r.pick([2, 3]), h = r.int(4, 8);
      return { key: [B, m, h],
        prompt: `A lab starts with ${B} bacteria at hour 0. The number ${m === 2 ? "doubles" : "triples"} every hour. How many bacteria are there after ${h} hours?`,
        answer: B * m ** h,
        hint: `After 1 hour there are ${B * m}. How many times do you multiply by ${m}?`,
        solution: `$${B}\\cdot ${m}^{${h}} = ${B}\\cdot ${m ** h} = \\mathbf{${B * m ** h}}$` };
    } });

  add({ id: "u1.cx.interpret", skill: "u1.context", level: L.C, type: "mcq", calc: false,
    make(r) {
      const P = r.pick([120, 240, 360, 500]), k = r.pick([0.8, 0.75, 0.9]), unit = r.pick(["bounce", "day"]);
      const thing = unit === "bounce" ? `the height in centimeters of a ball after bounce $n$` : `the number of milligrams of medicine in a patient's body on day $n$`;
      const m = mcq(`Each ${unit} the amount is ${Math.round(k * 100)}% of the amount before.`, [
        { text: `Each ${unit} the amount goes down by ${Math.round(k * 100)}%.`, why: `Multiplying by ${k} keeps ${Math.round(k * 100)}%, so it goes down by ${Math.round((1 - k) * 100)}%.` },
        { text: `Each ${unit} the amount goes down by ${k}.`, why: `${k} is multiplied, not subtracted.` },
        { text: `The amount at the start is ${k}.`, why: `The starting amount is ${P}.` },
      ], r);
      return { key: [P, k, unit], ...m,
        prompt: `The equation $f(n) = ${P}(${k})^{n-1}$ models ${thing}. What does ${k} mean in this situation?`,
        hint: `What happens to ${P} when you multiply by ${k}?`,
        solution: `${k} is the common ratio. Multiplying by ${k} keeps ${Math.round(k * 100)}% each ${unit} (a ${Math.round((1 - k) * 100)}% decrease).` };
    } });

  add({ id: "u1.cx.plans", skill: "u1.context", level: L.C, type: "numeric", calc: true,
    make(r) {
      const a = r.int(20, 60), d = r.int(10, 30), b = r.pick([1, 2, 3]);
      let n = 1; while (geom(b, 2, n) <= arith(a, d, n)) n++;
      return { key: [a, d, b],
        prompt: `Two allowance plans start in week 1. Plan A pays \\$${a} in week 1 and \\$${d} more each week after. Plan B pays \\$${b} in week 1 and doubles every week. In which week does Plan B first pay more than Plan A?`,
        answer: n,
        hint: "Write both rules and make a table of weeks.",
        solution: `A: $${a} + ${d}(n-1)$. B: $${b}\\cdot 2^{n-1}$.<br>Week ${n - 1}: A = ${arith(a, d, n - 1)}, B = ${geom(b, 2, n - 1)}. Week ${n}: A = ${arith(a, d, n)}, B = ${geom(b, 2, n)}.<br>Week $\\mathbf{${n}}$` };
    } });

  // ───────────────────────── More graph questions (keeps every set visual) ─────────────────────────
  add({ id: "u1.cl.graph", skill: "u1.classify", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const kind = r.int(0, 2);
      let t;
      if (kind === 0) { const a = r.int(1, 8), d = r.int(1, 3); t = terms((n) => arith(a, d, n), 5); }
      else if (kind === 1) { const a = r.pick([1, 2]), rr = r.pick([2, 1 / 2]); t = terms((n) => geom(rr === 2 ? a : 32, rr, n), 5); }
      else { const k = r.int(0, 1); t = terms((n) => n * n + k, 5); }
      const pts = t.map((y, i) => [i + 1, y]);
      const choices = ["Arithmetic", "Geometric", "Neither", "Both arithmetic and geometric"];
      return { key: [kind, t.join(",")], choices, answer: kind,
        why: ["Arithmetic points lie on a straight line (same change each step).", "Geometric points multiply by the same factor each step.", "Check the change and the factor between points.", "Only a constant sequence is both."].map((w, i) => (i === kind ? "Correct." : w)),
        prompt: "The graph shows the first five terms of a sequence. What type of sequence is it?",
        graph: { points: pts, window: windowFor(pts) },
        hint: "Read the y-values. Check the differences, then the ratios.",
        solution: `y-values: ${list(t)}. Differences: ${list(t.slice(1).map((x, i) => x - t[i]))}. Ratios: ${list(t.slice(1).map((x, i) => x / t[i]))}. **${KINDS[kind]}**.` };
    } });

  add({ id: "u1.ge.graph-ratio", skill: "u1.geom", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const [a, rr] = r.pick([[1, 2], [2, 2], [1, 3], [64, 1 / 2], [81, 1 / 3], [48, 1 / 2]]);
      const pts = terms((n) => geom(a, rr, n), 4).map((y, i) => [i + 1, y]);
      const m = mcq(`$${tex(rr)}$`, [
        { text: `$${tex(pts[1][1] - pts[0][1])}$`, why: "That is the difference between the first two points, not the ratio." },
        { text: `$${tex(1 / rr)}$`, why: "Divide a later term by the one before it." },
        { text: `$${tex(a)}$`, why: "That is the first term." },
      ], r, [{ text: `$${tex(rr + 1)}$`, why: "Check the division." }, { text: `$${tex(-rr)}$`, why: "The points go the same direction each time, so the ratio is positive." }, { text: `$${tex(rr * 2)}$`, why: "Check the division." }]);
      return { key: [a, rr], ...m,
        prompt: "The graph shows the first four terms of a geometric sequence. What is the common ratio?",
        graph: { points: pts, window: windowFor(pts) },
        hint: "Divide the second y-value by the first.",
        solution: `$${tex(pts[1][1])} \\div ${tex(pts[0][1])} = \\mathbf{${tex(rr)}}$` };
    } });

  add({ id: "u1.de.plot", skill: "u1.decrease", level: L.I, type: "plot", calc: false,
    make(r) {
      const d = -r.int(1, 3), a = r.int(3 * -d + 2, 12);
      const pts = terms((n) => arith(a, d, n), 4).map((y, i) => [i + 1, y]);
      return { key: [a, d],
        prompt: `A candle is ${a} cm tall at hour 1 and burns down ${-d} cm each hour. Plot its height for hours 1 to 4 as points (hour, height).`,
        plot: { window: { xmin: 0, xmax: 6, ymin: 0, ymax: a + 2, xstep: 1, ystep: 1 } },
        answer: pts,
        hint: `Start at (1, ${a}) and go down ${-d} for each hour.`,
        solution: `Points: ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(", ")}` };
    } });

  add({ id: "u1.cx.plot-savings", skill: "u1.context", level: L.H, type: "plot", calc: false,
    make(r) {
      const a = r.pick([10, 15, 20, 25]), d = r.pick([5, 10, 15]);
      const pts = terms((n) => arith(a, d, n), 4).map((y, i) => [i + 1, y]);
      return { key: [a, d],
        prompt: `Jordan's savings follow $S(n) = ${a} + ${d}(n - 1)$, where $n$ is the week number. Plot weeks 1 to 4 as points $(n, S(n))$.`,
        plot: { window: { xmin: 0, xmax: 6, ymin: 0, ymax: a + 3 * d + 10, xstep: 1, ystep: 5 } },
        answer: pts,
        hint: "Each grid line on the y-axis is 5 dollars.",
        solution: `Points: ${pts.map((p) => `(${p[0]}, ${p[1]})`).join(", ")}` };
    } });

  add({ id: "u1.mi.graph-gap", skill: "u1.missing", level: L.I, type: "numeric", calc: false,
    make(r) {
      const geo = r.chance(0.5);
      const a = geo ? r.pick([1, 2, 3]) : r.int(1, 6), d = geo ? 2 : r.intNot(-2, 4, [0]);
      const all = terms((n) => (geo ? geom(a, d, n) : arith(a, d, n)), 5).map((y, i) => [i + 1, y]);
      const pts = all.filter((p) => p[0] !== 4);
      return { key: [geo, a, d],
        prompt: `The graph shows terms 1, 2, 3 and 5 of ${geo ? "a geometric" : "an arithmetic"} sequence. Term 4 is missing. What is $f(4)$?`,
        graph: { points: pts, window: windowFor(all) },
        answer: all[3][1],
        hint: geo ? "Find the ratio from the first two points." : "Find the change from one point to the next.",
        solution: geo ? `Ratio $= ${all[1][1]} \\div ${all[0][1]} = 2$. $f(4) = ${all[2][1]} \\cdot 2 = \\mathbf{${all[3][1]}}$` : `Change per step $= ${d}$. $f(4) = ${all[2][1]} ${signed(d)} = \\mathbf{${all[3][1]}}$` };
    } });

  // ───────────────────────── Extra pools so a weak skill never runs out ─────────────────────────
  add({ id: "u1.ge.which-term", skill: "u1.geom", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.int(1, 9), rr = r.pick([2, 3, 4]), n = rr === 2 ? r.int(5, 10) : rr === 3 ? r.int(4, 7) : r.int(4, 6);
      const v = geom(a, rr, n);
      return { key: [a, rr, n],
        prompt: `The geometric sequence ${list(terms((k) => geom(a, rr, k), 3))}, … continues. Which term number is ${v}?`,
        answer: n,
        hint: `Keep multiplying by ${rr} and count the terms, or solve $${a} \\cdot ${rr}^{n-1} = ${v}$.`,
        solution: `$${v} \\div ${a} = ${v / a} = ${rr}^{${n - 1}}$, so $n - 1 = ${n - 1}$ and $n = \\mathbf{${n}}$` };
    } });

  add({ id: "u1.gr.read", skill: "u1.graphs", level: L.B, type: "numeric", calc: false,
    make(r) {
      const geo = r.chance(0.35);
      const a = geo ? r.int(1, 3) : r.int(-3, 9), d = geo ? 2 : r.intNot(-3, 4, [0]), k = r.int(2, 5);
      const pts = terms((n) => (geo ? geom(a, d, n) : arith(a, d, n)), 5).map((y, i) => [i + 1, y]);
      return { key: [geo, a, d, k],
        prompt: `The graph shows the first five terms of a sequence as points $(n, f(n))$. What is $f(${k})$?`,
        graph: { points: pts, window: windowFor(pts) },
        answer: pts[k - 1][1],
        hint: `Find the point with $n = ${k}$ and read its height.`,
        solution: `The point above $n = ${k}$ is $(${k}, ${pts[k - 1][1]})$, so $f(${k}) = \\mathbf{${pts[k - 1][1]}}$` };
    } });

  add({ id: "u1.gr.next-points", skill: "u1.graphs", level: L.I, type: "plot", calc: false,
    make(r) {
      const a = r.int(0, 6), d = r.int(1, 3);
      const all = terms((n) => arith(a, d, n), 6).map((y, i) => [i + 1, y]);
      return { key: [a, d],
        prompt: `The first four terms of an arithmetic sequence are $${list(all.slice(0, 4).map((p) => p[1]))}$. Plot terms 5 and 6 as points $(n, f(n))$.`,
        plot: { window: { xmin: 0, xmax: 7, ymin: 0, ymax: all[5][1] + 2, xstep: 1, ystep: 1 } },
        answer: all.slice(4),
        hint: `The terms go up by ${d} each time.`,
        solution: `$f(5) = ${all[4][1]}$ and $f(6) = ${all[5][1]}$, so plot $(5, ${all[4][1]})$ and $(6, ${all[5][1]})$.` };
    } });

  add({ id: "u1.de.recursive", skill: "u1.decrease", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.int(60, 200), d = r.int(3, 9), n = r.int(8, 15);
      return { key: [a, d, n],
        prompt: `A sequence is defined by $f(1) = ${a},\\ f(n) = f(n - 1) - ${d}$. What is $f(${n})$?`,
        answer: arith(a, -d, n),
        hint: `Each step subtracts ${d}. How many steps from term 1 to term ${n}?`,
        solution: `$f(${n}) = ${a} - ${d}(${n} - 1) = ${a} - ${d * (n - 1)} = \\mathbf{${arith(a, -d, n)}}$` };
    } });

  add({ id: "u1.de.halving", skill: "u1.decrease", level: L.C, type: "numeric", calc: true,
    make(r) {
      const start = r.pick([400, 800, 1600, 3200, 640, 960]), period = r.pick([2, 3, 4, 6, 8]), limit = r.pick([10, 25, 50, 100]);
      let k = 0, amt = start; while (amt >= limit) { amt /= 2; k++; }
      return { key: [start, period, limit],
        prompt: `A patient has ${start} mg of a medicine in their body. The amount is cut in half every ${period} hours. After how many hours is the amount first below ${limit} mg?`,
        answer: k * period,
        hint: "Halve the amount again and again, counting the halvings. Then multiply by the hours per halving.",
        solution: `Halvings: ${Array.from({ length: k + 1 }, (_, i) => String(+(start / 2 ** i).toFixed(3))).join(" → ")} mg. That's ${k} halvings, so $${k} \\times ${period} = \\mathbf{${k * period}}$ hours.` };
    } });

  add({ id: "u1.mi.insert-means", skill: "u1.missing", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(-20, 30), d = r.intNot(-9, 12, [0]), gaps = r.int(3, 5), ask = r.int(2, gaps);
      const last = arith(a, d, gaps + 1);
      return { key: [a, d, gaps, ask],
        prompt: `Write ${gaps - 1} numbers between ${a} and ${last} so that all ${gaps + 1} numbers form an arithmetic sequence. What is the ${ordinal(ask)} number of the sequence?`,
        answer: arith(a, d, ask),
        hint: `There are ${gaps} equal steps from ${a} to ${last}.`,
        solution: `$d = (${last} - ${paren(a)}) \\div ${gaps} = ${d}$. Term ${ask}: $${a} ${signed(d)}(${ask - 1}) = \\mathbf{${arith(a, d, ask)}}$` };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  // Find the mistake: a worked solution for a term of an arithmetic sequence.
  add({ id: "u1.th.find-error", skill: "u1.arith", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(-9, 15), d = r.intNot(-6, 9, [0, 1, -1]), N = r.int(12, 40), kind = r.int(0, 3);
      const t2 = a + d, t3 = a + 2 * d, right = arith(a, d, N);
      const dd = kind === 0 ? -d : d;
      const s1 = `$d = ${paren(kind === 0 ? a : t2)} - ${paren(kind === 0 ? t2 : a)} = ${dd}$`;
      const s2 = kind === 1 ? `$f(n) = ${a} ${signed(d)}n$` : `$f(n) = ${a} ${signed(dd)}(n - 1)$`;
      const val = kind === 0 ? arith(a, -d, N) : kind === 1 ? a + d * N : kind === 2 ? right + r.pick([-10, 10, d * 2]) : right;
      const s3 = kind === 1 ? `$f(${N}) = ${a} ${signed(d)}(${N}) = ${val}$` : `$f(${N}) = ${a} ${signed(dd)}(${N - 1}) = ${val}$`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = ["The difference is the later term minus the earlier term.", "The explicit form uses $(n - 1)$, because term 1 adds no differences.", "The arithmetic in the last step is off."][Math.max(0, bad)];
      const f = M1.qlib.findStep([s1, s2, s3], bad, whyWrong);
      return { key: [a, d, N, kind, val], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `Jordan found the ${ordinal(N)} term of $${a}, ${t2}, ${t3}, \\ldots$ like this:<br>${f.stepsText}<br>Where is Jordan's first mistake?`,
        hint: "Check each step on its own.",
        solution: `$d = ${t2} - ${paren(a)} = ${d}$, $f(n) = ${a} ${signed(d)}(n - 1)$, so $f(${N}) = ${a} ${signed(d)}(${N - 1}) = ${right}$.<br>` +
          (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  // Is a number a term? Pick the answer with the right reason.
  add({ id: "u1.th.is-term", skill: "u1.missing", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 12), d = r.int(3, 9), T = r.int(80, 400);
      if (T <= a) throw new Error("retry");
      const yes = (T - a) % d === 0, gap = T - a;
      const Y = `Yes, because $${T} - ${a} = ${gap}$ is a multiple of ${d}.`;
      const N = `No, because $${T} - ${a} = ${gap}$ is not a multiple of ${d}.`;
      const m = mcq(yes ? Y : N, [
        { text: yes ? N : Y, why: `$${gap} \\div ${d} = ${fmt(gap / d)}$, ${yes ? "a whole number" : "not a whole number"}.` },
        { text: `Yes, because ${T} is greater than ${a}.`, why: "Being bigger than the first term is not enough. The sequence skips numbers." },
        { text: `No, because ${T} is not one of the first ten terms.`, why: "A term can come much later. Check the gap from the first term." },
        { text: T % d ? `Yes, because ${T} is a multiple of ${d}.`.replace("is a", "is close to a") : `No, because the sequence starts at ${a}, not 0.`, why: `The test is whether $${T} - ${a}$ is a multiple of ${d}.` },
      ], r);
      return { key: [a, d, T], ...m, think: true,
        prompt: `Is ${T} a term of the sequence $${a}, ${a + d}, ${a + 2 * d}, \\ldots$? Pick the answer with the correct reason.`,
        hint: "Every term is the first term plus some number of steps.",
        solution: `Each term is ${a} plus a whole number of ${d}s. $${T} - ${a} = ${gap}$, and $${gap} \\div ${d} = ${fmt(gap / d)}$. ${yes ? `That is a whole number, so ${T} **is** a term (term ${gap / d + 1}).` : `That is not a whole number, so ${T} is **not** a term.`}` };
    } });

  // What changes if the first term is scaled?
  add({ id: "u1.th.what-if", skill: "u1.geom", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 9), g = r.pick([2, 3, -2]), k = r.pick([2, 3, 4, 5, 10]), N = r.int(5, 9);
      const m = mcq(`It is multiplied by ${k}.`, [
        { text: `It increases by ${k}.`, why: `Every term is multiplied by ${k}, so the change is not a fixed amount.` },
        { text: `It is multiplied by $${k}^{${N - 1}}$.`, why: `The ratio stays ${g}. Only the starting value is ${k} times as big.` },
        { text: `It is multiplied by ${k * N}.`, why: "Each term is the first term times the same power of the ratio as before." },
      ], r, [{ text: "It stays the same.", why: "The first term is a factor of every term." }]);
      return { key: [a, g, k, N], ...m, think: true,
        prompt: `A geometric sequence has $f(n) = ${a} \\cdot ${paren(g)}^{n - 1}$. The first term is changed from ${a} to ${a * k}, and the ratio stays the same. What happens to the ${ordinal(N)} term?`,
        hint: "Write the term before and after the change.",
        solution: `Before: $${a} \\cdot ${paren(g)}^{${N - 1}}$. After: $${a * k} \\cdot ${paren(g)}^{${N - 1}} = ${k} \\cdot \\left(${a} \\cdot ${paren(g)}^{${N - 1}}\\right)$. The term is **multiplied by ${k}**.` };
    } });

  // Make it true: choose a common difference that lands on a target.
  add({ id: "u1.th.make-true", skill: "u1.arith", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(1, 15), gap = r.pick([24, 30, 36, 40, 42, 48, 60, 72, 84, 90]), T = a + gap;
      const ds = []; for (let d = 2; d <= gap; d++) if (gap % d === 0) ds.push(d);
      return { key: [a, gap], answer: ds[0], accept: { in: ds }, think: true,
        prompt: `An arithmetic sequence starts at ${a} and has a common difference $d$ that is a whole number greater than 1. Give **one** value of $d$ that makes ${T} a term of the sequence.`,
        hint: `How far is ${T} from ${a}?`,
        solution: `${T} must be ${a} plus a whole number of steps: $${T} - ${a} = ${gap}$ must be a multiple of $d$. Any factor of ${gap} greater than 1 works: **${ds.join(", ")}**.` };
    } });

  // Always, sometimes or never: answer with a reason.
  const U1_ASN = [
    { s: "An arithmetic sequence with a positive common difference eventually has a term greater than 1,000.",
      right: "Always true: adding the same positive amount again and again passes any number.",
      wrong: ["Sometimes true: only if the first term is positive.", "Never true: the terms grow by the same amount, so they stay small.", "Sometimes true: only if the difference is at least 10."] },
    { s: "A geometric sequence with a negative common ratio has only negative terms.",
      right: "Never true: the signs switch back and forth, as in $1, -2, 4, -8$.",
      wrong: ["Always true: multiplying by a negative makes the terms negative.", "Sometimes true: only when the first term is negative.", "Always true: the ratio is negative, so every term is too."] },
    { s: "A sequence can be both arithmetic and geometric.",
      right: "Sometimes true: $5, 5, 5, \\ldots$ has difference 0 and ratio 1.",
      wrong: ["Never true: one adds and the other multiplies.", "Always true: every sequence has a difference and a ratio.", "Never true: a ratio of 1 is not allowed."] },
    { s: "If the first term and the common difference of an arithmetic sequence are both odd, every term is odd.",
      right: "Never true: the second term is odd + odd, which is even.",
      wrong: ["Always true: odd numbers stay odd.", "Sometimes true: only when the difference is 1.", "Sometimes true: only for the first few terms."] },
    { s: "A geometric sequence with a positive first term and a ratio between 0 and 1 eventually has a negative term.",
      right: "Never true: multiplying a positive number by a positive ratio stays positive. The terms get closer to 0.",
      wrong: ["Always true: the terms keep shrinking, so they pass 0.", "Sometimes true: only if the ratio is less than $\\frac{1}{2}$.", "Sometimes true: only after many terms."] },
    { s: "The terms of an arithmetic sequence with common difference 3 are all multiples of 3.",
      right: "Sometimes true: $3, 6, 9, \\ldots$ works, but $1, 4, 7, \\ldots$ does not.",
      wrong: ["Always true: you keep adding 3.", "Never true: adding 3 changes the remainder.", "Always true: the difference is a multiple of 3."] },
    { s: "If the first two terms of a geometric sequence are whole numbers, the common ratio is a whole number.",
      right: "Sometimes true: $2, 6, \\ldots$ has ratio 3, but $4, 6, \\ldots$ has ratio $\\frac{3}{2}$.",
      wrong: ["Always true: whole numbers divide to whole numbers.", "Never true: a ratio is always a fraction.", "Always true: the second term is the first term times the ratio."] },
  ];
  add({ id: "u1.th.always", skill: "u1.classify", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U1_ASN.length - 1), it = U1_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with a few examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Try a few examples, including unusual ones.",
        solution: `**${it.right}**` };
    } });

  M1.units.u1 = Object.assign(M1.units.u1 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
