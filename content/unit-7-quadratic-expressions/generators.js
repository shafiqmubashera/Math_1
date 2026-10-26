/* Unit 7 Structures of Quadratic Expressions: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, lin, pt, box, findStep, paren, fac, sample, gcd } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);
  const W = box(-8, 8);

  // Polynomials as coefficient arrays, lowest power first: [c, b, a] is ax^2 + bx + c.
  function P(cs, v = "x") {
    let s = "";
    for (let d = cs.length - 1; d >= 0; d--) {
      const c = cs[d];
      if (!c) continue;
      const mag = Math.abs(c), body = d === 0 ? tex(mag) : `${mag === 1 ? "" : tex(mag)}${v}${d > 1 ? `^${d}` : ""}`;
      s += s ? ` ${c < 0 ? "-" : "+"} ${body}` : `${c < 0 ? "-" : ""}${body}`;
    }
    return s || "0";
  }
  const mul = (A, B) => { const out = Array(A.length + B.length - 1).fill(0); A.forEach((a, i) => B.forEach((b, j) => (out[i + j] += a * b))); return out; };
  const addP = (A, B) => Array.from({ length: Math.max(A.length, B.length) }, (_, i) => (A[i] || 0) + (B[i] || 0));
  const neg = (A) => A.map((c) => -c);
  const bin = (a, b) => [b, a]; // ax + b
  const binT = (a, b, v = "x") => P([b, a], v);
  const eqP = (A, B) => { const n = Math.max(A.length, B.length); for (let i = 0; i < n; i++) if ((A[i] || 0) !== (B[i] || 0)) return false; return true; };

  // ───────────────────────── Adding, subtracting, multiplying ─────────────────────────
  add({ id: "u7.po.add", skill: "u7.polyops", level: L.B, type: "mcq", calc: false,
    make(r) {
      const A = [r.int(-9, 9), r.intNot(-6, 6, [0]), r.intNot(-4, 5, [0])], B = [r.int(-9, 9), r.intNot(-6, 6, [0]), r.intNot(-4, 5, [0])];
      const S = addP(A, B);
      if (!S[2]) return this.make(r);
      const m = mcq(`$${P(S)}$`, [
        { text: `$${P([S[0], S[1], S[2] * 0 + A[2] * B[2]])}$`, why: "Add the $x^2$ coefficients; do not multiply them." },
        { text: `$${P([S[0], S[2], S[1]])}$`, why: "Only like terms combine: $x^2$ with $x^2$, $x$ with $x$." },
        { text: `$${P([A[0] - B[0], S[1], S[2]])}$`, why: "Add the constants too." },
      ], r, [{ text: `$${P([S[0], S[1] + 1, S[2]])}$`, why: "Add the $x$-terms carefully." }, { text: `$${P([S[0] + 1, S[1], S[2]])}$`, why: "Add the constants carefully." }, { text: `$${P([S[0], S[1], S[2] + 1])}$`, why: "Add the $x^2$ coefficients carefully." }]);
      return { key: [A, B], ...m,
        prompt: `Simplify: $(${P(A)}) + (${P(B)})$`,
        hint: "Combine like terms.",
        solution: `$x^2$: $${A[2]} + ${paren(B[2])} = ${S[2]}$; $x$: $${A[1]} + ${paren(B[1])} = ${S[1]}$; constants: $${A[0]} + ${paren(B[0])} = ${S[0]}$. **$${P(S)}$**` };
    } });

  add({ id: "u7.po.subtract", skill: "u7.polyops", level: L.I, type: "mcq", calc: false,
    make(r) {
      const A = [r.int(-9, 9), r.intNot(-6, 6, [0]), r.intNot(-4, 5, [0])], B = [r.intNot(-9, 9, [0]), r.intNot(-6, 6, [0]), r.intNot(-4, 5, [0, A[2]])];
      const D = addP(A, neg(B));
      const m = mcq(`$${P(D)}$`, [
        { text: `$${P([A[0] + B[0], A[1] - B[1], A[2] - B[2]])}$`, why: "Subtract every term of the second polynomial, including the constant." },
        { text: `$${P([A[0] - B[0], A[1] + B[1], A[2] - B[2]])}$`, why: "Subtract the $x$-terms too." },
        { text: `$${P(addP(B, neg(A)))}$`, why: "That is the second minus the first." },
      ], r, [{ text: `$${P(addP(A, B))}$`, why: "This is subtraction: change every sign in the second polynomial." }]);
      return { key: [A, B], ...m,
        prompt: `Simplify: $(${P(A)}) - (${P(B)})$`,
        hint: "Distribute the minus sign to every term in the second parentheses.",
        solution: `$${P(A)} ${P(neg(B)).startsWith("-") ? "" : "+ "}${P(neg(B))} = \\mathbf{${P(D)}}$` };
    } });

  add({ id: "u7.po.foil", skill: "u7.polyops", level: L.I, type: "mcq", calc: false,
    make(r) {
      const p = r.intNot(-9, 9, [0]), q = r.intNot(-9, 9, [0, -p]);
      const R = mul(bin(1, p), bin(1, q));
      const m = mcq(`$${P(R)}$`, [
        { text: `$${P([p * q, 0, 1])}$`, why: "Multiply every term by every term: there are two $x$-terms to add." },
        { text: `$${P([p + q, p * q, 1])}$`, why: "The $x$-term is $(p + q)x$ and the constant is $pq$." },
        { text: `$${P([-p * q, p + q, 1])}$`, why: `$${paren(p)} \\cdot ${paren(q)} = ${p * q}$.` },
      ], r, [{ text: `$${P([p * q, p - q, 1])}$`, why: "Add the two middle products." }, { text: `$${P([p * q, p + q + 1, 1])}$`, why: "Recheck the middle term: it is $(p + q)x$." }, { text: `$${P([p * q + 1, p + q, 1])}$`, why: "The constant is $pq$." }]);
      return { key: [p, q], ...m,
        prompt: `Multiply: $(${binT(1, p)})(${binT(1, q)})$`,
        hint: "Multiply each term in the first by each term in the second.",
        solution: `$x \\cdot x + x \\cdot ${paren(q)} + ${paren(p)} \\cdot x + ${paren(p)}${paren(q)} = x^2 ${signed(p + q)}x ${signed(p * q)}$. **$${P(R)}$**` };
    } });

  add({ id: "u7.po.foil-a", skill: "u7.polyops", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 5), b = r.intNot(-7, 7, [0]), c = r.intNot(1, 4, []), d = r.intNot(-7, 7, [0]);
      const R = mul(bin(a, b), bin(c, d));
      if (!R[1]) return this.make(r);
      const m = mcq(`$${P(R)}$`, [
        { text: `$${P([b * d, 0, a * c])}$`, why: "Don't skip the outer and inner products." },
        { text: `$${P([b * d, a * d + b * c + 1, a * c])}$`, why: "Recheck the middle term." },
        { text: `$${P([b + d, a * d + b * c, a * c])}$`, why: "The constant is the product of the constants." },
      ], r, [{ text: `$${P([b * d, a * b + c * d, a * c])}$`, why: "The middle term is outer + inner: $ad + bc$." }, { text: `$${P([b * d, a * d + b * c - 1, a * c])}$`, why: "Recheck the middle term." }, { text: `$${P([b * d + 1, a * d + b * c, a * c])}$`, why: "The constant is the product of the constants." }]);
      return { key: [a, b, c, d], ...m,
        prompt: `Multiply: $(${binT(a, b)})(${binT(c, d)})$`,
        hint: "First, outer, inner, last, or use an area model.",
        solution: `$${a * c}x^2 + ${paren(a * d)}x + ${paren(b * c)}x + ${paren(b * d)} = \\mathbf{${P(R)}}$` };
    } });

  add({ id: "u7.po.square", skill: "u7.polyops", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3]), b = r.intNot(-8, 8, [0]);
      const R = mul(bin(a, b), bin(a, b));
      const m = mcq(`$${P(R)}$`, [
        { text: `$${P([b * b, 0, a * a])}$`, why: "$(u + v)^2 \\ne u^2 + v^2$. The middle term $2uv$ is missing." },
        { text: `$${P([b * b, a * b, a * a])}$`, why: "The middle term is doubled: $2 \\cdot (" + a + "x)(" + b + ")$." },
        { text: `$${P([2 * b, 2 * a * b, a * a])}$`, why: "Square the constant; do not double it." },
      ], r, [{ text: `$${P([-b * b, 2 * a * b, a * a])}$`, why: "A square of a number is positive." }]);
      return { key: [a, b], ...m,
        prompt: `Expand: $(${binT(a, b)})^2$`,
        hint: "Write it as $(" + binT(a, b) + ")(" + binT(a, b) + ")$.",
        solution: `$(${binT(a, b)})(${binT(a, b)}) = ${P(R)}$. **$${P(R)}$**` };
    } });

  add({ id: "u7.po.coeff-cubic", skill: "u7.polyops", level: L.C, type: "numeric", calc: false,
    make(r) {
      const p = r.intNot(-5, 5, [0]), A = [r.int(-6, 6), r.intNot(-6, 6, [0]), 1], k = r.pick([0, 1, 2]);
      const R = mul(bin(1, p), A);
      return { key: [p, A, k], answer: R[k],
        prompt: `When $(${binT(1, p)})(${P(A)})$ is multiplied out and simplified, what is the coefficient of ${k === 0 ? "the constant term" : k === 1 ? "$x$" : "$x^2$"}?`,
        hint: `Only some products give ${k === 0 ? "a constant" : k === 1 ? "an $x$-term" : "an $x^2$-term"}. Find them and add.`,
        solution: `The full product is $${P(R)}$. The coefficient is **${R[k]}**.` };
    } });

  add({ id: "u7.po.difference", skill: "u7.polyops", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(2, 4), b = r.intNot(-5, 5, [0]), c = 1, d = r.intNot(-5, 5, [0]), k = r.pick([1, 0]);
      const R = addP(mul(bin(a, b), bin(a, b)), neg(mul(bin(c, d), bin(c, d))));
      return { key: [a, b, d, k], answer: R[k], think: true,
        prompt: `Simplify $(${binT(a, b)})^2 - (${binT(c, d)})^2$. What is the ${k === 1 ? "coefficient of $x$" : "constant term"}?`,
        hint: "Expand each square, then subtract every term of the second.",
        solution: `$(${P(mul(bin(a, b), bin(a, b)))}) - (${P(mul(bin(c, d), bin(c, d)))}) = ${P(R)}$. The ${k === 1 ? "coefficient of $x$" : "constant term"} is **${R[k]}**.` };
    } });

  // ───────────────────────── Factoring ─────────────────────────
  add({ id: "u7.fa.gcf", skill: "u7.factor", level: L.B, type: "mcq", calc: false,
    make(r) {
      const g = r.int(2, 6), a = r.intNot(1, 5, []), b = r.intNot(-7, 7, [0]);
      if (gcd(a, b) !== 1) return this.make(r);
      const full = `${g * a}x^2 ${signed(g * b)}x`;
      const m = mcq(`$${g}x(${binT(a, b)})$`, [
        { text: `$${g}(${a}x^2 ${signed(b)}x)$`, why: "Both terms also share a factor of $x$." },
        { text: `$x(${binT(g * a, g * b)})$`, why: `Both terms also share a factor of ${g}.` },
        { text: `$${g}x(${binT(a, g * b)})$`, why: `Divide **both** terms by $${g}x$.` },
      ], r, [{ text: `$${g}x(${a}x ${signed(-b)})$`, why: "Check the sign of the second term." }]);
      return { key: [g, a, b], ...m,
        prompt: `Factor completely: $${full}$`,
        hint: "Find the greatest factor both terms share, including $x$.",
        solution: `Both terms share $${g}x$: $${full} = \\mathbf{${g}x(${binT(a, b)})}$` };
    } });

  add({ id: "u7.fa.trinomial", skill: "u7.factor", level: L.I, type: "mcq", calc: false,
    make(r) {
      const p = r.intNot(-9, 9, [0]), q = r.intNot(-9, 9, [0, -p, p]);
      const R = mul(bin(1, p), bin(1, q));
      const right = `$(${binT(1, p)})(${binT(1, q)})$`;
      const m = mcq(right, [
        { text: `$(${binT(1, -p)})(${binT(1, -q)})$`, why: "Check the signs: multiply out to test." },
        { text: `$(${binT(1, p * q)})(x + 1)$`, why: `The numbers must multiply to ${p * q} **and** add to ${p + q}.` },
        { text: `$(${binT(1, -p)})(${binT(1, q)})$`, why: "Multiply it out: the middle term does not match." },
      ], r, [{ text: `$(${binT(1, p)})(${binT(1, -q)})$`, why: "Multiply it out: the middle term does not match." }]);
      return { key: [p, q], ...m,
        prompt: `Factor: $${P(R)}$`,
        hint: `Find two numbers that multiply to ${R[0]} and add to ${R[1]}.`,
        solution: `$${p} \\cdot ${paren(q)} = ${p * q}$ and $${p} + ${paren(q)} = ${p + q}$. **${right}**` };
    } });

  add({ id: "u7.fa.squares", skill: "u7.factor", level: L.I, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([1, 1, 2, 3, 4, 5]), b = r.int(1, 10);
      const right = `$(${binT(a, b)})(${binT(a, -b)})$`;
      const m = mcq(right, [
        { text: `$(${binT(a, -b)})^2$`, why: `That gives $-${2 * a * b}x$ in the middle.` },
        { text: `$(${binT(a, b)})^2$`, why: `That gives $+${2 * a * b}x$ in the middle.` },
        { text: a === 1 ? `$x(x - ${b * b})$` : `$(${binT(a * a, b)})(x - ${b})$`, why: "Multiply it out to check: it does not give the original." },
      ], r, [{ text: "It cannot be factored.", why: "A difference of two squares always factors." }]);
      return { key: [a, b], ...m,
        prompt: `Factor: $${a * a === 1 ? "" : a * a}x^2 - ${b * b}$`,
        hint: "This is a difference of two squares: $u^2 - v^2 = (u + v)(u - v)$.",
        solution: `$${a * a === 1 ? "" : a * a}x^2 = (${a === 1 ? "" : a}x)^2$ and ${b * b} $= ${b}^2$. **${right}**` };
    } });

  add({ id: "u7.fa.a-not-1", skill: "u7.factor", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([2, 3, 5]), p = r.intNot(-6, 6, [0]), q = r.intNot(-6, 6, [0]);
      if (gcd(a, Math.abs(p)) !== 1) return this.make(r);
      const R = mul(bin(a, p), bin(1, q));
      if (!R[1]) return this.make(r);
      const right = `$(${binT(a, p)})(${binT(1, q)})$`;
      const m = mcq(right, [
        { text: `$(${binT(a, q)})(${binT(1, p)})$`, why: "Multiply out to check: the middle term differs." },
        { text: `$(${binT(a, -p)})(${binT(1, -q)})$`, why: "Check the signs." },
        { text: `$${a}(${binT(1, p)})(${binT(1, q)})$`, why: "Multiply out: the constant would be wrong." },
      ], r, [{ text: `$(${binT(a, p)})(${binT(1, -q)})$`, why: "Check the signs." }]);
      return { key: [a, p, q], ...m,
        prompt: `Factor: $${P(R)}$`,
        hint: "Test each choice by multiplying it out.",
        solution: `$(${binT(a, p)})(${binT(1, q)}) = ${a}x^2 ${signed(a * q)}x ${signed(p)}x ${signed(p * q)} = ${P(R)}$. **${right}**` };
    } });

  add({ id: "u7.fa.which-factors", skill: "u7.factor", level: L.H, type: "multi", calc: false,
    make(r) {
      const p = r.intNot(-7, 7, [0]), q = r.intNot(-7, 7, [0, p, -p]), g = r.pick([1, 2, 3]);
      const R = mul([g], mul(bin(1, p), bin(1, q)));
      const items = [
        { text: `$${binT(1, p)}$`, ok: true }, { text: `$${binT(1, q)}$`, ok: true },
        { text: `$${binT(1, -p)}$`, ok: false, why: `Substitute $x = ${p}$: the expression is not 0.` },
        { text: `$${binT(1, -q)}$`, ok: false, why: `Substitute $x = ${q}$: the expression is not 0.` },
        { text: `$${binT(1, p + q)}$`, ok: false, why: "That is not one of the factors." },
      ];
      if (g > 1) items.push({ text: `$${g}$`, ok: true });
      if (new Set(items.map((i) => i.text)).size < items.length) return this.make(r);
      const m = multi(items, r);
      return { key: [p, q, g], ...m,
        prompt: `Select **all** factors of $${P(R)}$.`,
        hint: "Factor completely first.",
        solution: `$${P(R)} = ${g > 1 ? g : ""}(${binT(1, p)})(${binT(1, q)})$.` };
    } });

  add({ id: "u7.fa.count-k", skill: "u7.factor", level: L.C, type: "numeric", calc: false,
    make(r) {
      const c = r.pick([12, 18, 20, 24, 30, 36, 16, -12, -20]);
      const ks = new Set(); for (let p = -Math.abs(c); p <= Math.abs(c); p++) if (p && c % p === 0) ks.add(p + c / p);
      return { key: [c], answer: ks.size, think: true,
        prompt: `For how many integers $k$ can $x^2 + kx ${signed(c)}$ be factored as $(x + m)(x + n)$ with integers $m$ and $n$?`,
        hint: `$mn = ${c}$ and $m + n = k$. List the factor pairs of ${c}, including negative ones.`,
        solution: `Factor pairs of ${c} give these sums $k$: ${[...ks].sort((a, b) => a - b).join(", ")}. That is **${ks.size}** values.` };
    } });

  add({ id: "u7.fa.perfect-square", skill: "u7.factor", level: L.C, type: "numeric", calc: false,
    make(r) {
      const n = r.int(2, 12), ask = r.chance(0.5);
      return ask
        ? { key: [n, 0], answer: 2 * n,
          prompt: `$x^2 + bx + ${n * n}$ is a perfect square, and $b > 0$. What is $b$?`,
          hint: `$(x + n)^2 = x^2 + 2nx + n^2$.`,
          solution: `$${n * n} = ${n}^2$, so it is $(x + ${n})^2 = x^2 + ${2 * n}x + ${n * n}$. $b = \\mathbf{${2 * n}}$.` }
        : { key: [n, 1], answer: n * n,
          prompt: `$x^2 - ${2 * n}x + c$ is a perfect square. What is $c$?`,
          hint: "Half of the $x$-coefficient, squared.",
          solution: `Half of $-${2 * n}$ is $-${n}$; $(-${n})^2 = ${n * n}$. So $c = \\mathbf{${n * n}}$ and it is $(x - ${n})^2$.` };
    } });

  // ───────────────────────── Graphing from factored form ─────────────────────────
  add({ id: "u7.ff.zeros", skill: "u7.factoredform", level: L.B, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([1, 2, -1, 3, -2]), p = r.intNot(-8, 8, [0]), q = r.intNot(-8, 8, [0, p, -p]);
      const right = `$x = ${p}$ and $x = ${q}$`;
      const m = mcq(right, [
        { text: `$x = ${-p}$ and $x = ${-q}$`, why: `$x ${p > 0 ? "-" : "+"} ${Math.abs(p)} = 0$ when $x = ${p}$.` },
        { text: `$x = ${a}$, $x = ${p}$ and $x = ${q}$`, why: `${a} is a constant factor; it is never 0.` },
        { text: `$x = ${a * p * q}$`, why: "That is the $y$-intercept." },
      ], r, [{ text: `$x = ${p}$ and $x = ${-q}$`, why: "Set each factor equal to 0." }]);
      return { key: [a, p, q], ...m,
        prompt: `What are the zeros of $f(x) = ${a === 1 ? "" : a === -1 ? "-" : a}(${fac(p)})(${fac(q)})$?`,
        hint: "A product is 0 when one of its factors is 0.",
        solution: `$${fac(p)} = 0$ gives $x = ${p}$; $${fac(q)} = 0$ gives $x = ${q}$. **${right}**` };
    } });

  add({ id: "u7.ff.y-int", skill: "u7.factoredform", level: L.I, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2, -1, 3, -2, 0.5]), p = r.intNot(-8, 8, [0]), q = r.intNot(-8, 8, [0]);
      if (!Number.isInteger(a * p * q)) return this.make(r);
      return { key: [a, p, q], answer: a * p * q,
        prompt: `What is the $y$-intercept of $y = ${a === 1 ? "" : a === -1 ? "-" : tex(a)}(${fac(p)})(${fac(q)})$?`,
        hint: "Set $x = 0$.",
        solution: `$y = ${tex(a)}(0 ${signed(-p)})(0 ${signed(-q)}) = ${tex(a)}(${-p})(${-q}) = \\mathbf{${a * p * q}}$` };
    } });

  add({ id: "u7.ff.plot", skill: "u7.factoredform", level: L.I, type: "plot", calc: false,
    make(r) {
      const a = r.pick([1, -1, 2, 0.5]), p = r.int(-7, 3), q = p + 2 * r.int(1, 4), h = (p + q) / 2, k = a * (h - p) * (h - q);
      if (q > 7 || Math.abs(k) > 8 || !Number.isInteger(k)) return this.make(r);
      return { key: [a, p, q], answer: [[p, 0], [q, 0], [h, k]],
        plot: { window: W },
        prompt: `Plot the two $x$-intercepts and the vertex of $y = ${a === 1 ? "" : a === -1 ? "-" : tex(a)}(${fac(p)})(${fac(q)})$.`,
        hint: "Zeros from the factors. The vertex is halfway between them.",
        solution: `Zeros: $(${p}, 0)$ and $(${q}, 0)$. Vertex: $x = ${h}$, $y = ${tex(a)}(${h - p})(${h - q}) = ${k}$. Plot **$(${p}, 0)$, $(${q}, 0)$ and $(${h}, ${k})$**.` };
    } });

  add({ id: "u7.ff.match-graph", skill: "u7.factoredform", level: L.H, type: "graph-mcq", calc: false,
    make(r) {
      const a = r.pick([1, -1, 0.5, -0.5]), p = r.int(-6, 2), q = p + 2 * r.int(1, 4);
      if (q > 7) return this.make(r);
      const f = (x) => a * (x - p) * (x - q), A = (s) => (s === 1 ? "" : s === -1 ? "-" : tex(s));
      const right = `$y = ${A(a)}(${fac(p)})(${fac(q)})$`;
      const m = mcq(right, [
        { text: `$y = ${A(a)}(${fac(-p)})(${fac(-q)})$`, why: "Zeros at $x = p$ come from the factor $(x - p)$." },
        { text: `$y = ${A(-a)}(${fac(p)})(${fac(q)})$`, why: `The graph opens ${a > 0 ? "up" : "down"}, so $a$ is ${a > 0 ? "positive" : "negative"}.` },
        { text: `$y = ${A(-a)}(${fac(-p)})(${fac(-q)})$`, why: "Check both the zeros and the direction." },
      ], r);
      return { key: [a, p, q], ...m,
        graph: { window: W, paths: [{ pts: sample(f, -8.5, 8.5, 120).filter((Q) => Math.abs(Q[1]) < 40) }] },
        prompt: "Which equation matches the graph?",
        hint: "Read the zeros. Then decide whether the parabola opens up or down.",
        solution: `Zeros $${p}$ and $${q}$, opens ${a > 0 ? "up" : "down"}${Math.abs(a) !== 1 ? ` (check the vertex: $y = ${f((p + q) / 2)}$)` : ""}. **${right}**` };
    } });

  add({ id: "u7.ff.from-zeros", skill: "u7.factoredform", level: L.H, type: "mcq", calc: false,
    make(r) {
      const p = r.intNot(-6, 6, [0]), q = r.intNot(-6, 6, [0, p]), a = r.pick([1, 2, -1, -2, 3]), x0 = r.intNot(-4, 4, [p, q]);
      const y0 = a * (x0 - p) * (x0 - q), A = (s) => (s === 1 ? "" : s === -1 ? "-" : s);
      const right = `$y = ${A(a)}(${fac(p)})(${fac(q)})$`;
      const m = mcq(right, [
        { text: `$y = ${A(a)}(${fac(-p)})(${fac(-q)})$`, why: "A zero at $x = p$ comes from $(x - p)$." },
        { text: `$y = ${A(-a)}(${fac(p)})(${fac(q)})$`, why: `Substitute $${pt([x0, y0])}$ to check the value of $a$.` },
        { text: a === 1 ? `$y = (${fac(p)})(${fac(q)}) + 1$` : `$y = (${fac(p)})(${fac(q)})$`, why: `Substitute $${pt([x0, y0])}$: it does not fit.` },
      ], r, [{ text: `$y = ${A(a + 1 || 2)}(${fac(p)})(${fac(q)})$`, why: `Substitute $${pt([x0, y0])}$ to check the value of $a$.` }]);
      return { key: [p, q, a, x0], ...m,
        prompt: `A parabola has zeros at $x = ${p}$ and $x = ${q}$ and passes through $${pt([x0, y0])}$. Which is its equation?`,
        hint: "Write $y = a(x - p)(x - q)$, then use the point to find $a$.",
        solution: `$y = a(${fac(p)})(${fac(q)})$. At $x = ${x0}$: $${y0} = a(${x0 - p})(${x0 - q})$, so $a = ${a}$. **${right}**` };
    } });

  add({ id: "u7.ff.vertex-std", skill: "u7.factoredform", level: L.C, type: "numeric", calc: false,
    make(r) {
      const p = r.int(-8, 6), q = p + 2 * r.int(1, 5), a = r.pick([1, -1, 2]), askY = r.chance(0.5);
      const R = mul([a], mul(bin(1, -p), bin(1, -q))), h = (p + q) / 2, k = a * (h - p) * (h - q);
      return { key: [p, q, a, askY], answer: askY ? k : h,
        prompt: `$f(x) = ${P(R)}$. What is the ${askY ? "$y$" : "$x$"}-coordinate of the vertex?`,
        hint: "Factor to find the zeros. The vertex is halfway between them.",
        solution: `$f(x) = ${a === 1 ? "" : a === -1 ? "-" : a}(${fac(p)})(${fac(q)})$, zeros ${p} and ${q}. Vertex $x = ${h}$, $f(${h}) = ${k}$. **${askY ? k : h}**` };
    } });

  // ───────────────────────── Solving quadratic equations ─────────────────────────
  add({ id: "u7.so.zero-product", skill: "u7.solve", level: L.B, type: "multi", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3]), p = r.intNot(-9, 9, [0]), q = r.intNot(-9, 9, [0, p, -p]);
      const qx = q / a;
      const items = [
        { text: `$x = ${p}$`, ok: true }, { text: `$x = ${tex(qx)}$`, ok: true },
        { text: `$x = ${-p}$`, ok: false, why: `$x = ${-p}$ makes $${fac(p)} = ${-2 * p}$, not 0.` },
        { text: `$x = ${tex(-qx)}$`, ok: false, why: "Check the sign." },
        { text: `$x = ${q}$`, ok: a === 1, why: a === 1 ? "" : `$${a}(${q}) ${signed(-q)} \\ne 0$.` },
      ];
      const uniq = []; for (const it of items) if (!uniq.some((u) => u.text === it.text)) uniq.push(it);
      const m = multi(uniq, r);
      return { key: [a, p, q], ...m,
        prompt: `Select **all** solutions of $(${fac(p)})(${binT(a, -q)}) = 0$.`,
        hint: "Set each factor equal to 0.",
        solution: `$${fac(p)} = 0$ gives $x = ${p}$. $${binT(a, -q)} = 0$ gives $x = ${tex(qx)}$.` };
    } });

  add({ id: "u7.so.square-root", skill: "u7.solve", level: L.I, type: "multi", calc: false,
    make(r) {
      const n = r.int(2, 12), a = r.pick([1, 2, 3]), c = r.int(0, 20), k = a * n * n + c;
      const items = [
        { text: `$x = ${n}$`, ok: true }, { text: `$x = ${-n}$`, ok: true },
        { text: `$x = ${n * n}$`, ok: false, why: "Take the square root." },
        { text: `$x = ${k / 2 === Math.floor(k / 2) ? k / 2 : k}$`, ok: false, why: "Undo the operations in order, then take the square root." },
        { text: `$x = ${n + 1}$`, ok: false, why: `$${n + 1}^2 = ${(n + 1) ** 2}$, not ${n * n}.` },
      ];
      const uniq = []; for (const it of items) if (!uniq.some((u) => u.text === it.text)) uniq.push(it);
      const m = multi(uniq, r);
      return { key: [n, a, c], ...m,
        prompt: `Select **all** solutions of $${a === 1 ? "" : a}x^2 ${c ? `+ ${c} ` : ""}= ${k}$.`,
        hint: "Get $x^2$ alone, then take the square root. Don't forget the negative root.",
        solution: `$${a === 1 ? "" : a}x^2 = ${k - c}$, so $x^2 = ${n * n}$ and $x = \\pm ${n}$.` };
    } });

  add({ id: "u7.so.factor-solve", skill: "u7.solve", level: L.I, type: "multi", calc: false,
    make(r) {
      const p = r.intNot(-9, 9, [0]), q = r.intNot(-9, 9, [0, p, -p]);
      const R = mul(bin(1, -p), bin(1, -q));
      const items = [
        { text: `$x = ${p}$`, ok: true }, { text: `$x = ${q}$`, ok: true },
        { text: `$x = ${-p}$`, ok: false, why: `Substitute: $${(-p) ** 2} ${signed(R[1] * -p)} ${signed(R[0])} \\ne 0$.` },
        { text: `$x = ${-q}$`, ok: false, why: "Check the sign." },
        { text: `$x = ${R[0]}$`, ok: false, why: "That is the constant term, not a solution." },
      ];
      const uniq = []; for (const it of items) if (!uniq.some((u) => u.text === it.text)) uniq.push(it);
      const m = multi(uniq, r);
      return { key: [p, q], ...m,
        prompt: `Select **all** solutions of $${P(R)} = 0$.`,
        hint: "Factor, then set each factor equal to 0.",
        solution: `$${P(R)} = (${fac(p)})(${fac(q)}) = 0$, so $x = ${p}$ or $x = ${q}$.` };
    } });

  add({ id: "u7.so.rearrange", skill: "u7.solve", level: L.H, type: "numeric", calc: false,
    make(r) {
      const p = r.int(1, 12), q = -r.int(1, 12);
      if (p === -q) return this.make(r);
      // x^2 + bx = c  where (x - p)(x - q) = x^2 - (p+q)x + pq
      const b = -(p + q), c = -p * q;
      return { key: [p, q], answer: p,
        prompt: `What is the positive solution of $${P([0, b, 1])} = ${c}$?`,
        hint: "Move everything to one side so it equals 0, then factor.",
        solution: `$${P([-c, b, 1])} = 0$, so $(${fac(p)})(${fac(q)}) = 0$ and $x = ${p}$ or $x = ${q}$. The positive solution is **${p}**.` };
    } });

  add({ id: "u7.so.intersect", skill: "u7.solve", level: L.H, type: "plot", calc: false,
    make(r) {
      const p = r.int(-4, 1), q = p + r.int(2, 5), m = r.intNot(-2, 2, [0]), b0 = r.int(-3, 3);
      // f(x) = (x - p)(x - q) + m x + b0  and g(x) = m x + b0 meet where (x - p)(x - q) = 0
      const f = (x) => (x - p) * (x - q) + m * x + b0, g = (x) => m * x + b0;
      const A = [p, g(p)], B = [q, g(q)];
      if (![A, B].every((Q) => Math.abs(Q[1]) <= 8) || q > 7) return this.make(r);
      const R = addP(mul(bin(1, -p), bin(1, -q)), [b0, m]);
      return { key: [p, q, m, b0], answer: [A, B],
        plot: { window: W, paths: [{ pts: sample(f, -8.5, 8.5, 120).filter((Q) => Math.abs(Q[1]) < 40) }, { pts: [[-9, g(-9)], [9, g(9)]], dashed: true, alt: true }] },
        prompt: `The graphs of $f(x) = ${P(R)}$ and $g(x) = ${lin(m, b0)}$ (dashed) are shown. Plot every point where $f(x) = g(x)$.`,
        hint: "Set the expressions equal, move everything to one side, and factor. Then find the $y$-values.",
        solution: `$${P(R)} = ${lin(m, b0)}$ gives $${P(mul(bin(1, -p), bin(1, -q)))} = 0$, so $x = ${p}$ or $x = ${q}$. Points: **$${pt(A)}$ and $${pt(B)}$**.` };
    } });

  add({ id: "u7.so.area", skill: "u7.solve", level: L.C, type: "numeric", calc: false,
    make(r) {
      const w = r.int(3, 15), d = r.int(2, 8), A = w * (w + d), ask = r.chance(0.5);
      return { key: [w, d, ask], answer: ask ? w + d : w,
        prompt: `A rectangular poster is ${d} inches longer than it is wide. Its area is ${A} square inches. What is its ${ask ? "length" : "width"}, in inches?`,
        hint: `Write $w(w + ${d}) = ${A}$, move ${A} to the left side, and factor.`,
        solution: `$w^2 + ${d}w - ${A} = 0$, so $(w - ${w})(w + ${w + d}) = 0$. A width cannot be negative, so $w = ${w}$ and the length is ${w + d}. **${ask ? w + d : w}**` };
    } });

  add({ id: "u7.so.sum", skill: "u7.solve", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3]), p = r.intNot(-8, 8, [0]), q = r.intNot(-8, 8, [0]), ask = r.pick(["sum", "product", "diff"]);
      if (ask === "diff" && p === q) return this.make(r);
      const R = mul([a], mul(bin(1, -p), bin(1, -q))), ans = ask === "sum" ? p + q : ask === "product" ? p * q : Math.abs(p - q);
      return { key: [a, p, q, ask], answer: ans, think: true,
        prompt: `What is the ${ask === "sum" ? "sum" : ask === "product" ? "product" : "positive difference"} of the solutions of $${P(R)} = 0$?`,
        hint: `Factor${a > 1 ? ` out ${a} first` : ""}, then find both solutions.`,
        solution: `$${P(R)} = ${a > 1 ? a : ""}(${fac(p)})(${fac(q)})$, so the solutions are ${p} and ${q}. The ${ask === "sum" ? "sum" : ask === "product" ? "product" : "positive difference"} is **${ans}**.` };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  add({ id: "u7.th.find-error", skill: "u7.solve", level: L.H, type: "mcq", calc: false,
    make(r) {
      const p = r.int(2, 9), kind = r.int(0, 3);
      // solve x^2 = p x  (divide-by-x mistake) or x(x - p) = 0 correct
      const s1 = kind === 0 ? `Divide both sides by $x$: $x = ${p}$` : `Subtract $${p}x$: $x^2 - ${p}x = 0$`;
      const s2 = kind === 0 ? `Check: $${p}^2 = ${p * p}$ and $${p}(${p}) = ${p * p}$ ✓` : kind === 1 ? `Factor: $x(x + ${p}) = 0$` : `Factor: $x(x - ${p}) = 0$`;
      const s3 = kind === 0 ? `So the only solution is $x = ${p}$.` : kind === 1 ? `So $x = 0$ or $x = -${p}$.` : kind === 2 ? `So $x = ${p}$ is the only solution.` : `So $x = 0$ or $x = ${p}$.`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = ["Dividing by $x$ throws away the solution $x = 0$ (you cannot divide by $x$ if $x$ might be 0).", `$x(x + ${p}) = x^2 + ${p}x$, not $x^2 - ${p}x$.`, "$x = 0$ also makes $x(x - " + p + ") = 0$."][Math.max(0, bad)];
      const f = findStep([s1, s2, s3], bad, whyWrong);
      return { key: [p, kind], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `Ella solved $x^2 = ${p}x$:<br>${f.stepsText}<br>Where is Ella's first mistake?`,
        hint: "Move everything to one side and factor. How many solutions are there?",
        solution: `$x^2 - ${p}x = 0$, so $x(x - ${p}) = 0$: $x = 0$ or $x = ${p}$.<br>` + (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  add({ id: "u7.th.make-true", skill: "u7.factor", level: L.C, type: "numeric", calc: false,
    make(r) {
      const b = r.pick([7, 8, 9, 10, 11, 12, 13]);
      const cs = []; for (let m = 1; m < b; m++) { const c = m * (b - m); if (!cs.includes(c)) cs.push(c); }
      return { key: [b], answer: cs[0], accept: { in: cs }, think: true,
        prompt: `Give **one** positive whole number $c$ so that $x^2 + ${b}x + c$ can be factored as $(x + m)(x + n)$ with positive whole numbers $m$ and $n$.`,
        hint: `You need $m + n = ${b}$. Then $c = mn$.`,
        solution: `Pairs with $m + n = ${b}$: ${Array.from({ length: Math.floor(b / 2) }, (_, i) => `${i + 1} and ${b - i - 1}`).join(", ")}. So $c$ can be **${cs.join(", ")}**.` };
    } });

  add({ id: "u7.th.reason", skill: "u7.polyops", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 9), b = r.int(2, 9);
      const right = `No. $(x + ${a})^2 = x^2 + ${2 * a}x + ${a * a}$, so it has an extra $${2 * a}x$ term.`;
      const m = mcq(right, [
        { text: "Yes, because you square each term.", why: "Squaring a sum is not squaring each term. Multiply it out." },
        { text: `Yes, because $(x + ${a})^2$ and $x^2 + ${a * a}$ both equal ${a * a} when $x = 0$.`, why: "Matching at one value does not make them equal everywhere. Try $x = 1$." },
        { text: `No, because $(x + ${a})^2 = x^2 + ${a * a}x$.`, why: `Multiply it out: $(x + ${a})(x + ${a})$.` },
      ], r);
      return { key: [a, b], ...m, think: true,
        prompt: `Is $(x + ${a})^2$ equal to $x^2 + ${a * a}$ for every $x$? Pick the answer with the correct reason.`,
        hint: `Write $(x + ${a})^2$ as $(x + ${a})(x + ${a})$ and multiply.`,
        solution: `$(x + ${a})(x + ${a}) = x^2 + ${a}x + ${a}x + ${a * a} = x^2 + ${2 * a}x + ${a * a}$. At $x = 1$: $${(1 + a) ** 2} \\ne ${1 + a * a}$. **${right}**` };
    } });

  const U7_ASN = [
    { s: "The product of two binomials is a trinomial.",
      right: "Sometimes true: $(x + 2)(x + 3) = x^2 + 5x + 6$, but $(x + 2)(x - 2) = x^2 - 4$ has only two terms.",
      wrong: ["Always true: two terms times two terms makes three.", "Never true: it makes four terms.", "Sometimes true: only when both constants are positive."] },
    { s: "$x^2 + 9$ can be factored as $(x + 3)(x + 3)$.",
      right: "Never true: $(x + 3)(x + 3) = x^2 + 6x + 9$.",
      wrong: ["Always true: $3 \\cdot 3 = 9$.", "Sometimes true: when $x$ is positive.", "Always true: it is a perfect square."] },
    { s: "If $ab = 0$, then $a = 0$ or $b = 0$.",
      right: "Always true: this is the zero product property, the reason factoring solves equations.",
      wrong: ["Sometimes true: only when $a$ and $b$ are whole numbers.", "Never true: both must be 0.", "Sometimes true: only when $a = b$."] },
    { s: "If $ab = 6$, then $a = 6$ or $b = 6$.",
      right: "Sometimes true: $a = 2$, $b = 3$ works with neither equal to 6. Only 0 has the zero product property.",
      wrong: ["Always true: it works like $ab = 0$.", "Never true: 6 is not prime.", "Always true: one factor must be the product."] },
    { s: "A quadratic equation has two different solutions.",
      right: "Sometimes true: $x^2 = 4$ has two, $(x - 1)^2 = 0$ has one, and $x^2 = -1$ has no real solutions.",
      wrong: ["Always true: squares give two answers.", "Never true: a parabola touches the axis once.", "Sometimes true: only when it factors."] },
  ];
  add({ id: "u7.th.always", skill: "u7.solve", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U7_ASN.length - 1), it = U7_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Try a few examples, including special cases.",
        solution: `**${it.right}**` };
    } });

  M1.units.u7 = Object.assign(M1.units.u7 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
