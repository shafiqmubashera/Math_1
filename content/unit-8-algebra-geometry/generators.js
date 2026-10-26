/* Unit 8 Connecting Algebra & Geometry: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, lin, pt, box, findStep, paren, gcd } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);
  const W = box(-8, 8);
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [12, 5, 13], [9, 12, 15], [12, 9, 15]];
  const dist = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);
  const inW = (P, w = W) => P[0] >= w.xmin && P[0] <= w.xmax && P[1] >= w.ymin && P[1] <= w.ymax;
  const r1 = (x) => Math.round(x * 10) / 10;
  // √n in simplest radical form, as KaTeX
  function root(n) {
    let out = 1, inn = n;
    for (let k = 2; k * k <= inn; k++) while (inn % (k * k) === 0) { inn /= k * k; out *= k; }
    return inn === 1 ? String(out) : `${out === 1 ? "" : out}\\sqrt{${inn}}`;
  }
  const slopeTex = (dy, dx) => (dx === 0 ? "\\text{undefined}" : tex(dy / dx));
  const labelPts = (pts, names) => pts.map((p, i) => ({ at: p, text: names[i] }));
  const poly = (pts) => pts.concat([pts[0]]);
  const sg = (v) => (v < 0 ? "−" : "+") + Math.abs(v); // a change written +3 or −3
  const randPt = (r, lo = -6, hi = 6) => [r.int(lo, hi), r.int(lo, hi)];

  // ───────────────────────── Distance and perimeter ─────────────────────────
  add({ id: "u8.di.axis", skill: "u8.distance", level: L.B, type: "numeric", calc: false,
    make(r) {
      const A = randPt(r, -8, 8), d = r.intNot(-12, 12, [0, -1, 1]), horiz = r.chance(0.5);
      const B = horiz ? [A[0] + d, A[1]] : [A[0], A[1] + d];
      return { key: [A, d, horiz], answer: Math.abs(d),
        prompt: `What is the distance between $${pt(A)}$ and $${pt(B)}$?`,
        hint: `The points share the same ${horiz ? "$y$" : "$x$"}-coordinate.`,
        solution: `Only the ${horiz ? "$x$" : "$y$"}-coordinates change: $|${horiz ? B[0] : B[1]} - ${paren(horiz ? A[0] : A[1])}| = \\mathbf{${Math.abs(d)}}$.` };
    } });

  add({ id: "u8.di.triple", skill: "u8.distance", level: L.B, type: "numeric", calc: true,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES), A = randPt(r, -6, 4), B = [A[0] + r.sign() * a, A[1] + r.sign() * b];
      return { key: [A, B], answer: c,
        prompt: `What is the distance between $${pt(A)}$ and $${pt(B)}$?`,
        hint: "Use $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.",
        solution: `$d = \\sqrt{(${B[0]} - ${paren(A[0])})^2 + (${B[1]} - ${paren(A[1])})^2} = \\sqrt{${a * a} + ${b * b}} = \\sqrt{${c * c}} = \\mathbf{${c}}$` };
    } });

  add({ id: "u8.di.radical", skill: "u8.distance", level: L.I, type: "mcq", calc: false,
    make(r) {
      const A = randPt(r), dx = r.intNot(-6, 6, [0]), dy = r.intNot(-6, 6, [0]), B = [A[0] + dx, A[1] + dy];
      const s = dx * dx + dy * dy;
      if (Number.isInteger(Math.sqrt(s)) || s < 5) return this.make(r);
      const m = mcq(`$${root(s)}$`, [
        { text: `$${Math.abs(dx) + Math.abs(dy)}$`, why: "That walks along the grid. The distance is the straight line: use the Pythagorean theorem." },
        { text: `$\\sqrt{${Math.abs(dx) + Math.abs(dy)}}$`, why: "Square each change before adding." },
        { text: `$${root(Math.abs(dx * dx - dy * dy) || 2)}$`, why: "Add the squares; do not subtract." },
      ], r, [{ text: `$${s}$`, why: `Take the square root of ${s}.` }, { text: `$\\sqrt{${s + 2}}$`, why: "Square each change carefully." }]);
      return { key: [A, dx, dy], ...m,
        prompt: `What is the exact distance between $${pt(A)}$ and $${pt(B)}$?`,
        hint: "Find the change in $x$ and the change in $y$, square them, add, then take the square root.",
        solution: `$\\sqrt{${paren(dx)}^2 + ${paren(dy)}^2} = \\sqrt{${dx * dx} + ${dy * dy}} = ${root(s) === `\\sqrt{${s}}` ? `\\mathbf{\\sqrt{${s}}}` : `\\sqrt{${s}} = \\mathbf{${root(s)}}`}$` };
    } });

  add({ id: "u8.di.graph", skill: "u8.distance", level: L.I, type: "numeric", calc: true,
    make(r) {
      const A = randPt(r, -7, 7), B = randPt(r, -7, 7);
      if (A[0] === B[0] || A[1] === B[1]) return this.make(r);
      const d = dist(A, B);
      return { key: [A, B], answer: r1(d), tol: 0.051,
        graph: { window: W, points: [A, B], paths: [{ pts: [A, B], dashed: true }], labels: labelPts([A, B], ["A", "B"]) },
        prompt: "What is the distance from $A$ to $B$? Round to the nearest tenth.",
        hint: "Count the horizontal and vertical change, then use the Pythagorean theorem.",
        solution: `$A = ${pt(A)}$, $B = ${pt(B)}$. $d = \\sqrt{${(B[0] - A[0]) ** 2} + ${(B[1] - A[1]) ** 2}} = \\sqrt{${(B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2}} \\approx \\mathbf{${r1(d)}}$` };
    } });

  add({ id: "u8.di.perimeter-right", skill: "u8.distance", level: L.H, type: "numeric", calc: true,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES.filter((t) => t[2] <= 13)), A = randPt(r, -6, -1);
      const sx = r.sign(), sy = r.sign();
      const B = [A[0] + sx * a, A[1]], C = [A[0] + sx * a, A[1] + sy * b];
      if (![A, B, C].every((P) => inW(P))) return this.make(r);
      const vs = r.shuffle([A, B, C]);
      return { key: [A, a, b, sx, sy], answer: a + b + c,
        graph: { window: W, points: vs, paths: [{ pts: poly(vs) }] },
        prompt: `A triangle has vertices $${pt(vs[0])}$, $${pt(vs[1])}$ and $${pt(vs[2])}$. What is its perimeter?`,
        hint: "Two sides are horizontal or vertical. Use the distance formula for the third.",
        solution: `Legs: ${a} and ${b}. The slanted side is $\\sqrt{${a * a} + ${b * b}} = ${c}$. Perimeter $= ${a} + ${b} + ${c} = \\mathbf{${a + b + c}}$.` };
    } });

  add({ id: "u8.di.perimeter-any", skill: "u8.distance", level: L.H, type: "numeric", calc: true,
    make(r) {
      const P = [randPt(r), randPt(r), randPt(r)];
      const area2 = Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]));
      if (area2 < 8) return this.make(r);
      const sides = [dist(P[0], P[1]), dist(P[1], P[2]), dist(P[2], P[0])], per = sides.reduce((s, x) => s + x, 0);
      return { key: P, answer: r1(per), tol: 0.051,
        graph: { window: W, points: P, paths: [{ pts: poly(P) }], labels: labelPts(P, ["A", "B", "C"]) },
        prompt: `Triangle $ABC$ has $A${pt(P[0])}$, $B${pt(P[1])}$ and $C${pt(P[2])}$. What is its perimeter? Round to the nearest tenth.`,
        hint: "Find each side length with the distance formula, then add. Round only at the end.",
        solution: `$AB \\approx ${r1(sides[0])}$, $BC \\approx ${r1(sides[1])}$, $CA \\approx ${r1(sides[2])}$. Perimeter $\\approx \\mathbf{${r1(per)}}$.` };
    } });

  add({ id: "u8.di.missing-coord", skill: "u8.distance", level: L.C, type: "numeric", calc: false,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES), A = randPt(r, -5, 5), right = r.chance(0.5), up = r.sign();
      const k = A[0] + (right ? a : -a);
      return { key: [A, a, b, right, up], answer: k,
        prompt: `The point $(k, ${A[1] + up * b})$ is ${c} units from $${pt(A)}$, and $k ${right ? ">" : "<"} ${A[0]}$. What is $k$?`,
        hint: "The vertical change is known. Use the Pythagorean theorem to find the horizontal change.",
        solution: `Vertical change: $|${A[1] + up * b} - ${paren(A[1])}| = ${b}$. Horizontal change: $\\sqrt{${c * c} - ${b * b}} = ${a}$. Since $k ${right ? ">" : "<"} ${A[0]}$, $k = ${A[0]} ${right ? "+" : "-"} ${a} = \\mathbf{${k}}$.` };
    } });

  add({ id: "u8.di.diameter", skill: "u8.distance", level: L.C, type: "numeric", calc: false,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES.filter((t) => t[2] % 2 === 0)), A = randPt(r, -6, 0), B = [A[0] + a, A[1] + r.sign() * b];
      return { key: [A, B], answer: c / 2,
        prompt: `$${pt(A)}$ and $${pt(B)}$ are the ends of a diameter of a circle. What is the radius of the circle?`,
        hint: "Find the length of the diameter first.",
        solution: `Diameter $= \\sqrt{${a * a} + ${b * b}} = ${c}$. Radius $= ${c} \\div 2 = \\mathbf{${c / 2}}$.` };
    } });

  // ───────────────────────── Midpoint and partitioning ─────────────────────────
  add({ id: "u8.mi.midpoint", skill: "u8.midpoint", level: L.B, type: "mcq", calc: false,
    make(r) {
      const A = randPt(r, -9, 9), B = [A[0] + 2 * r.intNot(-5, 5, [0]), A[1] + 2 * r.intNot(-5, 5, [0])];
      const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      const m = mcq(`$${pt(M)}$`, [
        { text: `$${pt([A[0] + B[0], A[1] + B[1]])}$`, why: "Divide the sums by 2." },
        { text: `$${pt([(B[0] - A[0]) / 2, (B[1] - A[1]) / 2])}$`, why: "Add the coordinates; do not subtract." },
        { text: `$${pt([M[1], M[0]])}$`, why: "Keep $x$ first and $y$ second." },
      ], r, [{ text: `$${pt([M[0] + 1, M[1]])}$`, why: "Average the $x$-coordinates carefully." }, { text: `$${pt([M[0], M[1] - 1])}$`, why: "Average the $y$-coordinates carefully." }]);
      return { key: [A, B], ...m,
        prompt: `What is the midpoint of the segment from $${pt(A)}$ to $${pt(B)}$?`,
        hint: "Average the $x$-coordinates and average the $y$-coordinates.",
        solution: `$\\left(\\frac{${A[0]} + ${paren(B[0])}}{2}, \\frac{${A[1]} + ${paren(B[1])}}{2}\\right) = \\mathbf{${pt(M)}}$` };
    } });

  add({ id: "u8.mi.endpoint", skill: "u8.midpoint", level: L.I, type: "plot", calc: false,
    make(r) {
      const A = randPt(r, -7, 7), M = randPt(r, -4, 4), B = [2 * M[0] - A[0], 2 * M[1] - A[1]];
      if (!inW(B) || (A[0] === M[0] && A[1] === M[1])) return this.make(r);
      return { key: [A, M], answer: [B],
        plot: { window: W, points2: [A, M], labels: labelPts([A, M], ["A", "M"]) },
        prompt: `$M${pt(M)}$ is the midpoint of $\\overline{AB}$, and $A = ${pt(A)}$. Plot point $B$.`,
        hint: "Whatever it takes to get from A to M, do it again from M.",
        solution: `From $A$ to $M$: ${sg(M[0] - A[0])} in $x$, ${sg(M[1] - A[1])} in $y$. Do it again from $M$: $B = \\mathbf{${pt(B)}}$.` };
    } });

  add({ id: "u8.mi.partition", skill: "u8.midpoint", level: L.H, type: "plot", calc: false,
    make(r) {
      const [m, n] = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [1, 1], [2, 3], [3, 2]]), s = m + n;
      const A = randPt(r, -7, 7), ux = r.intNot(-3, 3, [0]), uy = r.intNot(-3, 3, [0]);
      const B = [A[0] + ux * s, A[1] + uy * s], P = [A[0] + ux * m, A[1] + uy * m];
      if (!inW(B)) return this.make(r);
      return { key: [A, ux, uy, m, n], answer: [P],
        plot: { window: W, points2: [A, B], paths: [{ pts: [A, B], dashed: true }], labels: labelPts([A, B], ["A", "B"]) },
        prompt: `Plot point $P$ on $\\overline{AB}$ so that $AP : PB = ${m} : ${n}$.`,
        hint: `$P$ is $\\frac{${m}}{${s}}$ of the way from $A$ to $B$.`,
        solution: `From $A$ to $B$ is ${sg(ux * s)} in $x$ and ${sg(uy * s)} in $y$. $\\frac{${m}}{${s}}$ of that is ${sg(ux * m)} and ${sg(uy * m)}. $P = \\mathbf{${pt(P)}}$.` };
    } });

  add({ id: "u8.mi.partition-coords", skill: "u8.midpoint", level: L.H, type: "mcq", calc: false,
    make(r) {
      const [m, n] = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [1, 4], [2, 3], [3, 2]]), s = m + n;
      const A = randPt(r, -10, 10), ux = r.intNot(-4, 4, [0]), uy = r.intNot(-4, 4, [0]);
      const B = [A[0] + ux * s, A[1] + uy * s], P = [A[0] + ux * m, A[1] + uy * m], Q = [A[0] + ux * n, A[1] + uy * n];
      const mm = mcq(`$${pt(P)}$`, [
        { text: `$${pt(Q)}$`, why: `That point is $\\frac{${n}}{${s}}$ of the way, so the ratio is backwards.` },
        { text: `$${pt([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2])}$`, why: "That is the midpoint, the ratio 1 : 1." },
        { text: `$${pt([A[0] + ux * m, A[1] + uy * n])}$`, why: "Move the same fraction of the way in $x$ and in $y$." },
      ], r, [{ text: `$${pt([P[0] + ux, P[1]])}$`, why: "Move the same fraction in both $x$ and $y$." }]);
      return { key: [A, ux, uy, m, n], ...mm,
        prompt: `$A = ${pt(A)}$ and $B = ${pt(B)}$. Point $P$ is on $\\overline{AB}$ with $AP : PB = ${m} : ${n}$. What are the coordinates of $P$?`,
        hint: `$P$ is $\\frac{${m}}{${m} + ${n}}$ of the way from $A$ to $B$.`,
        solution: `$\\frac{${m}}{${s}}$ of the change $(${ux * s}, ${uy * s})$ is $(${ux * m}, ${uy * m})$. $P = (${A[0]} + ${paren(ux * m)}, ${A[1]} + ${paren(uy * m)}) = \\mathbf{${pt(P)}}$.` };
    } });

  add({ id: "u8.mi.ratio-back", skill: "u8.midpoint", level: L.C, type: "mcq", calc: false,
    make(r) {
      const [m, n] = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 4], [4, 1]]), s = m + n;
      const A = randPt(r, -9, 9), ux = r.intNot(-3, 3, [0]), uy = r.intNot(-3, 3, [0]);
      const B = [A[0] + ux * s, A[1] + uy * s], P = [A[0] + ux * m, A[1] + uy * m];
      const g = gcd(m, n);
      const opts = [[m, n], [n, m], [m, s], [s, m], [m, s - 2 * m || 5]].map(([p, q]) => `$${p} : ${q}$`);
      const mm = mcq(opts[0], opts.slice(1).map((t, i) => ({ text: t, why: ["That is $PB : AP$.", "That compares a part to the whole.", "That compares the whole to a part.", "Compare $AP$ with $PB$."][i] })), r);
      return { key: [A, ux, uy, m, n], ...mm, think: true,
        prompt: `$A = ${pt(A)}$, $B = ${pt(B)}$, and $P = ${pt(P)}$ is on $\\overline{AB}$. What is the ratio $AP : PB$?`,
        hint: "Compare how far P is from A with how far it is from B. The x-coordinates are enough.",
        solution: `In $x$: $A$ to $P$ is ${Math.abs(ux * m)}, $P$ to $B$ is ${Math.abs(ux * n)}. $AP : PB = ${Math.abs(ux * m)} : ${Math.abs(ux * n)} = \\mathbf{${m / g} : ${n / g}}$.` };
    } });

  add({ id: "u8.mi.center", skill: "u8.midpoint", level: L.C, type: "numeric", calc: false,
    make(r) {
      const C = randPt(r, -5, 5), dx = r.intNot(-6, 6, [0]), dy = r.intNot(-6, 6, [0]);
      const A = [C[0] - dx, C[1] - dy], B = [C[0] + dx, C[1] + dy], ask = r.pick(["sum", "x", "y"]);
      const ans = ask === "sum" ? C[0] + C[1] : ask === "x" ? C[0] : C[1];
      return { key: [C, dx, dy, ask], answer: ans,
        prompt: `$${pt(A)}$ and $${pt(B)}$ are the ends of a diameter of a circle with center $(h, k)$. What is ${ask === "sum" ? "$h + k$" : ask === "x" ? "$h$" : "$k$"}?`,
        hint: "The center of a circle is the midpoint of any diameter.",
        solution: `Center $= \\left(\\frac{${A[0]} + ${paren(B[0])}}{2}, \\frac{${A[1]} + ${paren(B[1])}}{2}\\right) = ${pt(C)}$. ${ask === "sum" ? `$h + k = ${C[0]} + ${paren(C[1])} = ` : ask === "x" ? "$h = " : "$k = "}\\mathbf{${ans}}$` };
    } });

  // ───────────────────────── Parallel and perpendicular lines ─────────────────────────
  const SL = [[1, 2], [2, 1], [3, 1], [1, 3], [2, 3], [3, 2], [3, 4], [4, 3], [1, 4], [4, 1], [5, 2], [1, 1]];
  const randSlope = (r) => { const [p, q] = r.pick(SL); return (r.sign() * p) / q; };

  add({ id: "u8.sl.parallel", skill: "u8.slopes", level: L.B, type: "numeric", calc: false,
    make(r) {
      const m = randSlope(r), b = r.int(-9, 9), perp = r.chance(0.5);
      const ans = perp ? -1 / m : m;
      return { key: [m, b, perp], answer: ans,
        prompt: `What is the slope of a line ${perp ? "perpendicular" : "parallel"} to $y = ${lin(m, b)}$?`,
        hint: perp ? "Perpendicular slopes are opposite reciprocals." : "Parallel lines have the same slope.",
        solution: perp ? `Flip $${tex(m)}$ and change its sign: $\\mathbf{${tex(ans)}}$.` : `Parallel lines have equal slopes: $\\mathbf{${tex(m)}}$.` };
    } });

  add({ id: "u8.sl.classify", skill: "u8.slopes", level: L.I, type: "mcq", calc: false,
    make(r) {
      const m = randSlope(r), kind = r.int(0, 2), b1 = r.int(-8, 8), b2 = r.intNot(-8, 8, [b1]);
      const m2 = kind === 0 ? m : kind === 1 ? -1 / m : r.pick([1 / m, -m, m + 1].filter((v) => Math.abs(v * m + 1) > 1e-9 && Math.abs(v - m) > 1e-9));
      const names = ["Parallel", "Perpendicular", "Neither"];
      const choices = ["Parallel", "Perpendicular", "Neither", "The same line"];
      const why = ["The slopes would have to be equal.", "The slopes would have to multiply to $-1$.", "", "The equations would have to be identical."];
      return { key: [m, kind, b1, b2, m2], choices, answer: kind, why: why.map((w, i) => (i === kind ? "Correct." : w || "Check the slopes: equal means parallel, product $-1$ means perpendicular.")),
        prompt: `Are the lines $y = ${lin(m, b1)}$ and $y = ${lin(m2, b2)}$ parallel, perpendicular, or neither?`,
        hint: "Compare the slopes.",
        solution: `Slopes: $${tex(m)}$ and $${tex(m2)}$. ${kind === 0 ? "Equal slopes, different intercepts" : kind === 1 ? `Product $${tex(m)} \\cdot ${paren(m2)} = -1$` : "Not equal, and the product is not $-1$"}: **${names[kind]}**.` };
    } });

  add({ id: "u8.sl.std-form", skill: "u8.slopes", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.intNot(-6, 6, [0]), b = r.intNot(-6, 6, [0]), c = r.int(-12, 12), perp = r.chance(0.5);
      const m = -a / b, ans = perp ? b / a : m;
      return { key: [a, b, c, perp], answer: ans,
        prompt: `What is the slope of a line ${perp ? "perpendicular" : "parallel"} to $${M1.qlib.terms2(a, b)} = ${c}$?`,
        hint: "Solve for $y$ to find the slope of the given line first.",
        solution: `$${b}y = ${lin(-a, c)}$, so the slope is $${tex(m)}$. ${perp ? `Perpendicular: $\\mathbf{${tex(ans)}}$.` : `Parallel: $\\mathbf{${tex(ans)}}$.`}` };
    } });

  add({ id: "u8.sl.through-point", skill: "u8.slopes", level: L.H, type: "mcq", calc: false,
    make(r) {
      const m = randSlope(r), b = r.int(-6, 6), perp = r.chance(0.5), P = randPt(r, -4, 4);
      const m2 = perp ? -1 / m : m, b2 = P[1] - m2 * P[0];
      if (!Number.isInteger(b2) || (!perp && b2 === b)) return this.make(r);
      const right = `$y = ${lin(m2, b2)}$`;
      const mm = mcq(right, [
        { text: `$y = ${lin(perp ? m : -1 / m, P[1] - (perp ? m : -1 / m) * P[0])}$`, why: perp ? "That line is parallel, not perpendicular." : "That line is perpendicular, not parallel." },
        { text: `$y = ${lin(m2, b)}$`, why: `That keeps the old $y$-intercept, so it does not pass through $${pt(P)}$.` },
        { text: `$y = ${lin(m2, P[1] + m2 * P[0])}$`, why: "Check the sign when you solve for $b$." },
      ], r, [{ text: `$y = ${lin(perp ? 1 / m : -m, b2)}$`, why: "Perpendicular slopes are opposite reciprocals: flip and change the sign." },
        { text: `$y = ${lin(m2, b2 + 2)}$`, why: `Substitute $${pt(P)}$ to check: it must make the equation true.` },
        { text: `$y = ${lin(-m2, b2)}$`, why: "Check the sign of the slope." }]);
      return { key: [m, b, perp, P], ...mm,
        prompt: `Which line passes through $${pt(P)}$ and is ${perp ? "perpendicular" : "parallel"} to $y = ${lin(m, b)}$?`,
        hint: "Find the new slope first, then use the point to find $b$.",
        solution: `New slope: $${tex(m2)}$. $${P[1]} = ${tex(m2)}(${P[0]}) + b$ gives $b = ${tex(b2)}$. **${right}**` };
    } });

  add({ id: "u8.sl.find-k", skill: "u8.slopes", level: L.C, type: "numeric", calc: false,
    make(r) {
      const m = randSlope(r), b = r.int(-6, 6), perp = r.chance(0.6), A = randPt(r, -5, 5), dx = r.pick([2, 3, 4, 6, -2, -3]);
      const target = perp ? -1 / m : m, k = A[1] + target * dx;
      if (!Number.isInteger(k)) return this.make(r);
      return { key: [m, b, perp, A, dx], answer: k,
        prompt: `The line through $${pt(A)}$ and $(${A[0] + dx}, k)$ is ${perp ? "perpendicular" : "parallel"} to $y = ${lin(m, b)}$. What is $k$?`,
        hint: "Set the slope between the two points equal to the slope it needs.",
        solution: `The slope must be $${tex(target)}$. $\\frac{k - ${paren(A[1])}}{${A[0] + dx} - ${paren(A[0])}} = ${tex(target)}$, so $k - ${paren(A[1])} = ${tex(target * dx)}$ and $k = \\mathbf{${k}}$.` };
    } });

  add({ id: "u8.sl.right-angle", skill: "u8.slopes", level: L.C, type: "mcq", calc: false,
    make(r) {
      // triangle with a right angle at one vertex (or none)
      const B = randPt(r, -3, 3), [p, q] = r.pick([[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 1]]), k = r.int(1, 2), right = r.int(0, 3);
      const A = [B[0] + q, B[1] + p], C0 = [B[0] - k * p, B[1] + k * q];
      const C = right === 3 ? [C0[0] + 1, C0[1]] : C0;
      // which vertex has the right angle? relabel so the right angle lands at the chosen one
      const names = ["A", "B", "C"];
      const at = right === 3 ? -1 : right;
      const verts = at === 0 ? [B, A, C] : at === 1 ? [A, B, C] : at === 2 ? [A, C, B] : [A, B, C];
      if (!verts.every((P) => inW(P))) return this.make(r);
      const sl = (P, Q) => (Q[0] === P[0] ? null : (Q[1] - P[1]) / (Q[0] - P[0]));
      const perpAt = verts.map((V, i) => { const P = verts[(i + 1) % 3], Q = verts[(i + 2) % 3]; const v1 = [P[0] - V[0], P[1] - V[1]], v2 = [Q[0] - V[0], Q[1] - V[1]]; return v1[0] * v2[0] + v1[1] * v2[1] === 0; });
      const ans = perpAt.indexOf(true);
      const choices = ["Angle $A$", "Angle $B$", "Angle $C$", "None of the angles"];
      const sAB = sl(verts[0], verts[1]), sBC = sl(verts[1], verts[2]), sCA = sl(verts[2], verts[0]);
      const st = (s) => (s === null ? "\\text{undefined}" : tex(s));
      return { key: [verts], choices, answer: ans < 0 ? 3 : ans, why: choices.map((_, i) => (i === (ans < 0 ? 3 : ans) ? "Correct." : "Compare the slopes of the two sides that meet at that angle.")), think: true,
        graph: { window: W, points: verts, paths: [{ pts: poly(verts) }], labels: labelPts(verts, names) },
        prompt: `Triangle $ABC$ has $A${pt(verts[0])}$, $B${pt(verts[1])}$, $C${pt(verts[2])}$. Which angle is a right angle?`,
        hint: "Two sides meet at a right angle if their slopes multiply to $-1$.",
        solution: `Slopes: $AB = ${st(sAB)}$, $BC = ${st(sBC)}$, $CA = ${st(sCA)}$. ${ans < 0 ? "No pair multiplies to $-1$: **none of the angles** is a right angle." : `The sides meeting at $${names[ans]}$ have slopes that multiply to $-1$: **angle $${names[ans]}$**.`}` };
    } });

  // ───────────────────────── Classifying polygons with coordinates ─────────────────────────
  add({ id: "u8.po.slopes-parallel", skill: "u8.polygons", level: L.B, type: "mcq", calc: false,
    make(r) {
      const A = randPt(r, -6, 0), u = [r.int(2, 5), r.int(-2, 3)], v = [r.int(-3, 1), r.int(2, 5)];
      if (u[0] * v[1] - u[1] * v[0] === 0) return this.make(r);
      const B = [A[0] + u[0], A[1] + u[1]], C = [B[0] + v[0], B[1] + v[1]], D = [A[0] + v[0], A[1] + v[1]];
      if (![A, B, C, D].every((P) => inW(P))) return this.make(r);
      const s = (P, Q) => slopeTex(Q[1] - P[1], Q[0] - P[0]);
      const right = `Yes, because $\\overline{AB} \\parallel \\overline{DC}$ (slope $${s(A, B)}$) and $\\overline{AD} \\parallel \\overline{BC}$ (slope $${s(A, D)}$).`;
      const mm = mcq(right, [
        { text: "No, because none of its angles are right angles.", why: "A parallelogram does not need right angles." },
        { text: "Yes, because all four sides have the same length.", why: "Check the lengths: they are not all equal, and that is not what makes a parallelogram." },
        { text: `No, because $\\overline{AB}$ and $\\overline{AD}$ have different slopes.`, why: "Sides that meet at a corner are not supposed to be parallel. Compare opposite sides." },
      ], r);
      return { key: [A, u, v], ...mm,
        graph: { window: W, points: [A, B, C, D], paths: [{ pts: poly([A, B, C, D]) }], labels: labelPts([A, B, C, D], ["A", "B", "C", "D"]) },
        prompt: `Is $ABCD$ with $A${pt(A)}$, $B${pt(B)}$, $C${pt(C)}$, $D${pt(D)}$ a parallelogram?`,
        hint: "A parallelogram has both pairs of opposite sides parallel.",
        solution: `Slopes: $AB$ and $DC$ are both $${s(A, B)}$; $AD$ and $BC$ are both $${s(A, D)}$. **${right}**` };
    } });

  const QUAD_NAMES = ["Square", "Rectangle that is not a square", "Rhombus that is not a square", "Parallelogram that is not a rectangle or rhombus"];
  function quad(r, kind) {
    for (let t = 0; t < 400; t++) {
      const A = randPt(r, -7, 2);
      let u = [r.int(1, 4), r.int(-3, 3)], v;
      if (kind === 0) v = [-u[1], u[0]];
      else if (kind === 1) { const k = r.pick([2, 3]); v = [-u[1] * k, u[0] * k]; if (Math.abs(u[1]) > 1) continue; }
      else if (kind === 2) { const opts = [[u[1], u[0]], [-u[1], -u[0]], [u[0], -u[1]]].filter((w) => w[1] > 0 && (w[0] * u[0] + w[1] * u[1]) !== 0 && (u[0] * w[1] - u[1] * w[0]) !== 0); if (!opts.length) continue; v = r.pick(opts); }
      else { v = [r.int(-3, 2), r.int(2, 5)]; if (v[0] * u[0] + v[1] * u[1] === 0 || v[0] ** 2 + v[1] ** 2 === u[0] ** 2 + u[1] ** 2) continue; }
      if (u[0] * v[1] - u[1] * v[0] === 0) continue;
      const B = [A[0] + u[0], A[1] + u[1]], C = [B[0] + v[0], B[1] + v[1]], D = [A[0] + v[0], A[1] + v[1]];
      if ([A, B, C, D].every((P) => inW(P))) return { A, B, C, D, u, v };
    }
    throw new Error("quad: none found");
  }
  add({ id: "u8.po.name-quad", skill: "u8.polygons", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const kind = r.int(0, 3), Q = quad(r, kind), V = [Q.A, Q.B, Q.C, Q.D];
      const len2 = (w) => w[0] ** 2 + w[1] ** 2;
      return { key: [kind, V], choices: QUAD_NAMES, answer: kind,
        why: QUAD_NAMES.map((_, i) => (i === kind ? "Correct." : ["A square needs 4 equal sides and right angles.", "A rectangle needs right angles: adjacent slopes multiply to $-1$.", "A rhombus needs 4 equal sides.", "This shape has more special features than a plain parallelogram."][i])),
        graph: { window: W, points: V, paths: [{ pts: poly(V) }], labels: labelPts(V, ["A", "B", "C", "D"]) },
        prompt: "Which is the most specific name for quadrilateral $ABCD$?",
        hint: "Check the side lengths (distance formula) and whether adjacent sides are perpendicular (slopes).",
        solution: `$AB = \\sqrt{${len2(Q.u)}}$, $BC = \\sqrt{${len2(Q.v)}}$. Adjacent sides ${Q.u[0] * Q.v[0] + Q.u[1] * Q.v[1] === 0 ? "are" : "are not"} perpendicular, and the sides ${len2(Q.u) === len2(Q.v) ? "are" : "are not"} all equal. **${QUAD_NAMES[kind]}**.` };
    } });

  add({ id: "u8.po.triangle", skill: "u8.polygons", level: L.H, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 3), A = randPt(r, -5, 1);
      let B, C;
      const u = [r.int(1, 4), r.int(-2, 3)];
      if (kind === 0) { B = [A[0] + u[0], A[1] + u[1]]; C = [A[0] - u[1], A[1] + u[0]]; } // right isosceles at A
      else if (kind === 1) { const k = r.pick([2, 3]); B = [A[0] + u[0], A[1] + u[1]]; C = [A[0] - k * u[1], A[1] + k * u[0]]; } // right scalene
      else if (kind === 2) { B = [A[0] + u[0], A[1] + u[1]]; C = [A[0] + u[1], A[1] + u[0]]; } // isosceles (mirror), not right unless u special
      else { B = [A[0] + r.int(2, 6), A[1] + r.int(-1, 1)]; C = [A[0] + r.int(-2, 3), A[1] + r.int(3, 6)]; }
      const V = [A, B, C], d2 = (P, Q) => (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2;
      const s = [d2(A, B), d2(B, C), d2(C, A)].sort((a, b) => a - b);
      const isRight = s[0] + s[1] === s[2], isIso = s[0] === s[1] || s[1] === s[2];
      const area2 = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]));
      if (!V.every((P) => inW(P)) || area2 === 0) return this.make(r);
      const ans = isRight ? (isIso ? 0 : 1) : isIso ? 2 : 3;
      const choices = ["Right and isosceles", "Right and scalene", "Isosceles but not right", "Scalene and not right"];
      return { key: [V], choices, answer: ans, why: choices.map((_, i) => (i === ans ? "Correct." : "Compare the squared side lengths: equal pairs mean isosceles, and $a^2 + b^2 = c^2$ means right.")),
        prompt: `Triangle $ABC$ has $A${pt(A)}$, $B${pt(B)}$ and $C${pt(C)}$. Which describes the triangle?`,
        hint: "Find all three side lengths squared. Check for equal sides, then check the Pythagorean theorem.",
        solution: `Squared side lengths: $AB^2 = ${d2(A, B)}$, $BC^2 = ${d2(B, C)}$, $CA^2 = ${d2(C, A)}$. ${isIso ? "Two are equal, so it is isosceles." : "No two are equal, so it is scalene."} ${isRight ? `$${s[0]} + ${s[1]} = ${s[2]}$, so it is right.` : `$${s[0]} + ${s[1]} \\ne ${s[2]}$, so it is not right.`} **${choices[ans]}**.` };
    } });

  add({ id: "u8.po.fourth-vertex", skill: "u8.polygons", level: L.H, type: "plot", calc: false,
    make(r) {
      const Q = quad(r, r.int(0, 3));
      return { key: [Q.A, Q.u, Q.v], answer: [Q.D],
        plot: { window: W, points2: [Q.A, Q.B, Q.C], paths: [{ pts: [Q.A, Q.B, Q.C], dashed: true }], labels: labelPts([Q.A, Q.B, Q.C], ["A", "B", "C"]) },
        prompt: "$A$, $B$ and $C$ are three vertices of parallelogram $ABCD$. Plot vertex $D$.",
        hint: "$\\overline{AD}$ must match $\\overline{BC}$: same change in $x$ and in $y$.",
        solution: `From $B$ to $C$ is ${sg(Q.v[0])} in $x$ and ${sg(Q.v[1])} in $y$. Do the same from $A$: $D = \\mathbf{${pt(Q.D)}}$.` };
    } });

  add({ id: "u8.po.area-tilted", skill: "u8.polygons", level: L.C, type: "numeric", calc: true,
    make(r) {
      const Q = quad(r, r.pick([0, 1])), V = [Q.A, Q.B, Q.C, Q.D];
      const a2 = Q.u[0] ** 2 + Q.u[1] ** 2, b2 = Q.v[0] ** 2 + Q.v[1] ** 2, area = Math.sqrt(a2 * b2);
      if (!Number.isInteger(Math.round(area * 1e9) / 1e9)) return this.make(r);
      return { key: [V], answer: Math.round(area),
        graph: { window: W, points: V, paths: [{ pts: poly(V) }], labels: labelPts(V, ["A", "B", "C", "D"]) },
        prompt: `$ABCD$ is a rectangle with $A${pt(Q.A)}$, $B${pt(Q.B)}$, $C${pt(Q.C)}$ and $D${pt(Q.D)}$. What is its area?`,
        hint: "Find the length and the width with the distance formula.",
        solution: `$AB = \\sqrt{${a2}} = ${root(a2)}$ and $BC = \\sqrt{${b2}} = ${root(b2)}$. Area $= ${root(a2)} \\cdot ${root(b2)} = \\mathbf{${Math.round(area)}}$.` };
    } });

  add({ id: "u8.po.select-true", skill: "u8.polygons", level: L.C, type: "multi", calc: false,
    make(r) {
      const kind = r.int(0, 3), Q = quad(r, kind), V = [Q.A, Q.B, Q.C, Q.D];
      const isRect = kind <= 1, isRhom = kind === 0 || kind === 2;
      const diagMid = [(Q.A[0] + Q.C[0]) / 2, (Q.A[1] + Q.C[1]) / 2];
      const items = [
        { text: "Both pairs of opposite sides are parallel.", ok: true },
        { text: "All four sides have the same length.", ok: isRhom, why: isRhom ? "" : "Adjacent sides have different lengths." },
        { text: "$\\overline{AB} \\perp \\overline{BC}$", ok: isRect, why: isRect ? "" : "Their slopes do not multiply to $-1$." },
        { text: `The diagonals cross at $${pt(diagMid)}$.`, ok: true },
        { text: "The diagonals are perpendicular.", ok: isRhom, why: isRhom ? "" : "That happens only when all sides are equal." },
        { text: "$\\overline{AB} \\parallel \\overline{BC}$", ok: false, why: "Sides that share a corner cannot be parallel." },
      ];
      const m = multi(items, r);
      return { key: [kind, V], ...m,
        graph: { window: W, points: V, paths: [{ pts: poly(V) }, { pts: [Q.A, Q.C], dashed: true, alt: true }, { pts: [Q.B, Q.D], dashed: true, alt: true }], labels: labelPts(V, ["A", "B", "C", "D"]) },
        prompt: `$A${pt(Q.A)}$, $B${pt(Q.B)}$, $C${pt(Q.C)}$, $D${pt(Q.D)}$. Select **all** true statements about $ABCD$.`,
        hint: "Use slopes for parallel and perpendicular, the distance formula for lengths, and midpoints for the diagonals.",
        solution: `$ABCD$ is a ${QUAD_NAMES[kind].toLowerCase()}. The diagonals of any parallelogram bisect each other at the shared midpoint $${pt(diagMid)}$. True: ${m.answer.map((i) => m.choices[i]).join(" · ")}` };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  add({ id: "u8.th.find-error", skill: "u8.distance", level: L.H, type: "mcq", calc: false,
    make(r) {
      const A = randPt(r, -6, 6), dx = r.intNot(-6, 6, [0]), dy = r.intNot(-6, 6, [0]), B = [A[0] + dx, A[1] + dy], kind = r.int(0, 3);
      const s = dx * dx + dy * dy;
      const s1 = kind === 0 ? `Change in $x$: $${B[0]} + ${paren(A[0])} = ${B[0] + A[0]}$; change in $y$: $${B[1]} - ${paren(A[1])} = ${dy}$` : `Change in $x$: $${B[0]} - ${paren(A[0])} = ${dx}$; change in $y$: $${B[1]} - ${paren(A[1])} = ${dy}$`;
      const DX = kind === 0 ? B[0] + A[0] : dx;
      if (kind === 0 && Math.abs(DX) === Math.abs(dx)) return this.make(r);
      const S = kind === 1 ? Math.abs(DX) + Math.abs(dy) : DX * DX + dy * dy;
      const s2 = kind === 1 ? `$${Math.abs(DX)} + ${Math.abs(dy)} = ${S}$` : `$${paren(DX)}^2 + ${paren(dy)}^2 = ${S}$`;
      const s3 = kind === 2 ? `Distance $= ${S}$` : `Distance $= \\sqrt{${S}} = ${root(S)}$`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = ["Subtract the coordinates to find the change.", "Square each change before adding.", "Take the square root at the end."][Math.max(0, bad)];
      const f = findStep([s1, s2, s3], bad, whyWrong);
      return { key: [A, dx, dy, kind], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `Kai found the distance from $${pt(A)}$ to $${pt(B)}$:<br>${f.stepsText}<br>Where is Kai's first mistake?`,
        hint: "Redo each step.",
        solution: `$\\sqrt{${paren(dx)}^2 + ${paren(dy)}^2} = \\sqrt{${s}} = ${root(s)}$.<br>` + (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  add({ id: "u8.th.make-true", skill: "u8.distance", level: L.C, type: "numeric", calc: true,
    make(r) {
      const [a, b, c] = r.pick(TRIPLES), A = randPt(r, -3, 3), more = r.chance(0.5);
      return { key: [a, b, c, A, more], answer: more ? A[1] + b + 1 : A[1] + b - 1, accept: more ? { lo: A[1] + b, loOpen: true } : { lo: A[1], loOpen: true, hi: A[1] + b, hiOpen: true }, think: true,
        prompt: `Give **one** number $k$ with $k > ${A[1]}$ so that the point $(${A[0] + a}, k)$ is ${more ? "**more** than" : "**less** than"} ${c} units from $${pt(A)}$.`,
        hint: `Find the value of $k$ that makes the distance exactly ${c} first.`,
        solution: `The horizontal change is ${a}. The distance is exactly ${c} when the vertical change is $\\sqrt{${c * c} - ${a * a}} = ${b}$, so at $k = ${A[1] + b}$. ${more ? `Any $k > ${A[1] + b}$ works.` : `Any $k$ with $${A[1]} < k < ${A[1] + b}$ works.`}` };
    } });

  add({ id: "u8.th.rhombus", skill: "u8.polygons", level: L.H, type: "mcq", calc: false,
    make(r) {
      const kind = r.pick([0, 2, 3, 1]), Q = quad(r, kind), V = [Q.A, Q.B, Q.C, Q.D];
      const a2 = Q.u[0] ** 2 + Q.u[1] ** 2, b2 = Q.v[0] ** 2 + Q.v[1] ** 2, yes = a2 === b2;
      const right = yes ? `Yes, because $AB = BC = \\sqrt{${a2}}$ and opposite sides are parallel, so all four sides are equal.` : `No, because $AB = \\sqrt{${a2}}$ but $BC = \\sqrt{${b2}}$.`;
      const mm = mcq(right, [
        { text: yes ? "No, because it has no right angles." : "Yes, because opposite sides are parallel.", why: yes ? "A rhombus does not need right angles." : "Every parallelogram has that. A rhombus also needs equal sides." },
        { text: yes ? "No, because its diagonals have different lengths." : "Yes, because its diagonals bisect each other.", why: yes ? "A rhombus's diagonals can have different lengths." : "That is true of every parallelogram." },
        { text: yes ? "Yes, because it has four sides." : "No, because it has no right angles.", why: yes ? "Every quadrilateral has four sides." : "A rhombus does not need right angles. Check the side lengths." },
      ], r);
      return { key: [kind, V], ...mm, think: true,
        graph: { window: W, points: V, paths: [{ pts: poly(V) }], labels: labelPts(V, ["A", "B", "C", "D"]) },
        prompt: `Parallelogram $ABCD$ has $A${pt(Q.A)}$, $B${pt(Q.B)}$, $C${pt(Q.C)}$, $D${pt(Q.D)}$. Is it a rhombus? Pick the answer with the correct reason.`,
        hint: "A rhombus has four equal sides.",
        solution: `$AB^2 = ${a2}$ and $BC^2 = ${b2}$. **${right}**` };
    } });

  const U8_ASN = [
    { s: "Two lines with negative slopes can be perpendicular.",
      right: "Never true: perpendicular slopes multiply to $-1$, so one must be positive and one negative.",
      wrong: ["Always true: any two lines can cross at a right angle.", "Sometimes true: when the slopes are opposite reciprocals.", "Sometimes true: when one slope is $-1$."] },
    { s: "The midpoint of a segment with whole-number endpoints has whole-number coordinates.",
      right: "Sometimes true: $(0, 0)$ and $(2, 4)$ give $(1, 2)$, but $(0, 0)$ and $(1, 4)$ give $(0.5, 2)$.",
      wrong: ["Always true: averages of whole numbers are whole numbers.", "Never true: you always divide by 2.", "Sometimes true: only when both endpoints are positive."] },
    { s: "A quadrilateral with four equal sides is a square.",
      right: "Sometimes true: it is a rhombus, and it is a square only if it also has right angles.",
      wrong: ["Always true: equal sides make a square.", "Never true: a square needs equal diagonals too.", "Always true: four equal sides force right angles."] },
    { s: "The distance between two points is less than the sum of their horizontal and vertical changes.",
      right: "Sometimes true: it is less when both changes are nonzero, but equal when one of them is 0.",
      wrong: ["Always true: the diagonal is the shortcut.", "Never true: the distance is the sum.", "Sometimes true: only for points in the first quadrant."] },
    { s: "A line perpendicular to a horizontal line has slope 0.",
      right: "Never true: it is a vertical line, and a vertical line has no slope (its slope is not a number).",
      wrong: ["Always true: the opposite reciprocal of 0 is 0.", "Sometimes true: when it passes through the origin.", "Always true: perpendicular lines share the slope 0."] },
    { s: "The diagonals of a rectangle are perpendicular.",
      right: "Sometimes true: only when the rectangle is a square.",
      wrong: ["Always true: rectangles have right angles.", "Never true: diagonals of rectangles never meet at right angles.", "Always true: the diagonals bisect each other."] },
  ];
  add({ id: "u8.th.always", skill: "u8.slopes", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U8_ASN.length - 1), it = U8_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Try a few examples on a grid.",
        solution: `**${it.right}**` };
    } });

  M1.units.u8 = Object.assign(M1.units.u8 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
