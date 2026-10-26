/* Unit 6 Quadratic Functions: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, lin, pt, box, findStep, paren, quad, fac, sample } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);
  const W = box(-8, 8);
  const inW = (P) => P[0] >= -8 && P[0] <= 8 && P[1] >= -8 && P[1] <= 8;
  // y = a(x - p)(x - q): integer zeros of the same parity give a whole-number vertex x.
  function parab(r, { opensUp = r.chance(0.5) } = {}) {
    for (let t = 0; t < 500; t++) {
      const p = r.int(-7, 5), q = p + 2 * r.int(1, 4), a = (opensUp ? 1 : -1) * r.pick([1, 1, 0.5, 2]);
      const h = (p + q) / 2, k = a * (h - p) * (h - q);
      if (!Number.isInteger(k) || Math.abs(k) > 8 || q > 7) continue;
      const f = (x) => a * (x - p) * (x - q), c = a * p * q;
      return { a, p, q, h, k, f, b: -a * (p + q), c };
    }
    throw new Error("parab: none");
  }
  const curve = (f) => ({ pts: sample(f, -8.5, 8.5, 120).filter((P) => Math.abs(P[1]) < 40) });
  const vertexForm = (a, h, k) => `${a === 1 ? "" : a === -1 ? "-" : tex(a)}${h === 0 ? "x^2" : `(${fac(h)})^2`} ${k ? signed(k) : ""}`.trim();
  const diffs = (ys) => ys.slice(1).map((v, i) => v - ys[i]);

  // ───────────────────────── Modeling quadratic patterns ─────────────────────────
  add({ id: "u6.mo.tiles", skill: "u6.model", level: L.B, type: "numeric", calc: false,
    make(r) {
      const k = r.int(1, 9), extra = r.pick([0, 1, 2]), n = r.int(5, 15);
      const expr = extra === 0 ? `n^2 + ${k}` : extra === 1 ? `n^2 + n + ${k}` : `2n^2 + ${k}`;
      const v = extra === 0 ? n * n + k : extra === 1 ? n * n + n + k : 2 * n * n + k;
      return { key: [k, extra, n], answer: v,
        prompt: `Figure $n$ of a tile pattern has $${expr}$ tiles. How many tiles are in figure ${n}?`,
        hint: `Replace $n$ with ${n}. Square first.`,
        solution: `$${expr.replace(/n/g, `(${n})`)} = \\mathbf{${v}}$` };
    } });

  add({ id: "u6.mo.table-eq", skill: "u6.model", level: L.I, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 2), c = r.int(-5, 6), a = r.pick([1, 2, 3]);
      const F = [
        [(n) => a * n * n + c, `${a === 1 ? "" : a}n^2 ${signed(c)}`],
        [(n) => n * (n + c + 7), `n(n + ${c + 7})`],
        [(n) => a * n * n + n, `${a === 1 ? "" : a}n^2 + n`],
      ][kind];
      const ns = [1, 2, 3, 4, 5], ys = ns.map(F[0]);
      const wrong = [
        { text: `$${lin(ys[1] - ys[0], ys[0] - (ys[1] - ys[0]), "n")}$`, why: "That linear rule fits the first two rows but not the rest. The differences are not constant." },
        { text: `$${a + 1 === 1 ? "" : a + 1}n^2 ${signed(c)}$`, why: "Check $n = 1$ in this rule." },
        { text: `$${ys[0] || 1} \\cdot ${ys[0] && ys[1] / ys[0] > 0 ? paren(ys[1] / ys[0]) : 2}^{n - 1}$`, why: "The ratios are not constant, so it is not exponential." },
      ].filter((w) => w.text.replace(/\$/g, "") !== F[1]);
      const m = mcq(`$${F[1]}$`, wrong, r, [{ text: `$n^2 ${signed(c + 2)}$`, why: "Check $n = 1$ in this rule." }, { text: `$${a + 2}n^2$`, why: "Check $n = 1$ in this rule." }]);
      return { key: [kind, c, a], ...m,
        table: { headers: ["$n$", ...ns.map(String)], rows: [["tiles", ...ys.map(String)]] },
        prompt: "Which rule gives the number of tiles in figure $n$?",
        hint: "Test each rule with $n = 1, 2, 3$.",
        solution: `Second differences are constant (${diffs(diffs(ys)).join(", ")}), so the rule is quadratic. $${F[1]}$ matches every column: **$${F[1]}$**.` };
    } });

  add({ id: "u6.mo.fence", skill: "u6.model", level: L.H, type: "numeric", calc: false,
    make(r) {
      const half = r.int(10, 30) * 2, P = 2 * half, ask = r.chance(0.5), x = r.int(3, half - 3);
      return ask
        ? { key: [P, 0], answer: (half / 2) ** 2,
          prompt: `A rectangle has a perimeter of ${P} meters. Its area is $A(x) = x(${half} - x)$, where $x$ is the width. What is the greatest possible area, in square meters?`,
          hint: "The graph of $A$ is a parabola that opens down. The vertex is halfway between the zeros.",
          solution: `Zeros: $x = 0$ and $x = ${half}$, so the vertex is at $x = ${half / 2}$. $A(${half / 2}) = ${half / 2} \\cdot ${half / 2} = \\mathbf{${(half / 2) ** 2}}$.` }
        : { key: [P, x], answer: x * (half - x),
          prompt: `A rectangle has a perimeter of ${P} meters and a width of ${x} meters. Its area is $A(x) = x(${half} - x)$. What is its area, in square meters?`,
          hint: "Substitute the width.",
          solution: `$A(${x}) = ${x}(${half} - ${x}) = ${x} \\cdot ${half - x} = \\mathbf{${x * (half - x)}}$` };
    } });

  add({ id: "u6.mo.projectile", skill: "u6.model", level: L.H, type: "numeric", calc: true,
    make(r) {
      const v = r.pick([32, 48, 64, 80, 96]), h0 = r.int(0, 12) * 2, t = r.pick([0.5, 1, 1.5, 2, 2.5, 3]);
      const h = -16 * t * t + v * t + h0;
      if (h < 0) return this.make(r);
      return { key: [v, h0, t], answer: h,
        prompt: `A ball is thrown up. Its height, in feet, after $t$ seconds is $h(t) = -16t^2 + ${v}t${h0 ? ` + ${h0}` : ""}$. What is its height after ${fmt(t) === String(t) ? t : String(t)} seconds?`,
        hint: "Square $t$ first, then multiply by $-16$.",
        solution: `$h(${t}) = -16(${t})^2 + ${v}(${t})${h0 ? ` + ${h0}` : ""} = ${-16 * t * t} + ${v * t}${h0 ? ` + ${h0}` : ""} = \\mathbf{${h}}$ feet.` };
    } });

  add({ id: "u6.mo.figure-10", skill: "u6.model", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2]), b = r.int(-2, 4), c = r.int(0, 6), N = r.pick([8, 10, 12, 15]);
      const f = (n) => a * n * n + b * n + c, ys = [1, 2, 3, 4].map(f);
      if (ys[0] <= 0) return this.make(r);
      return { key: [a, b, c, N], answer: f(N), think: true,
        table: { headers: ["Figure", "1", "2", "3", "4"], rows: [["Tiles", ...ys.map(String)]] },
        prompt: `The table shows a pattern whose second differences are constant. How many tiles are in figure ${N}?`,
        hint: "The second difference is $2a$. Find $a$, then $b$ and $c$.",
        solution: `First differences: ${diffs(ys).join(", ")}. Second difference: ${2 * a}, so $a = ${a}$. Then $${a === 1 ? "" : a}n^2$ gives ${[1, 2, 3, 4].map((n) => a * n * n).join(", ")}; what is left is ${[1, 2, 3, 4].map((n) => ys[n - 1] - a * n * n).join(", ")} $= ${lin(b, c, "n")}$. So $f(n) = ${quad(a, b, c, "n")}$ and $f(${N}) = \\mathbf{${f(N)}}$.` };
    } });

  add({ id: "u6.mo.border", skill: "u6.model", level: L.C, type: "mcq", calc: false,
    make(r) {
      const w = r.int(2, 5), extra = r.int(2, 6);
      const right = `$(x + ${2 * w})(x + ${extra + 2 * w})$`;
      const m = mcq(right, [
        { text: `$(x + ${w})(x + ${extra + w})$`, why: `The path adds ${w} m on **both** sides, so each dimension grows by ${2 * w}.` },
        { text: `$x(x + ${extra}) + ${w}$`, why: "Find the outer dimensions, then multiply." },
        { text: `$(x + ${2 * w})(x + ${extra})$`, why: "Both dimensions grow by the path." },
      ], r);
      return { key: [w, extra], ...m,
        prompt: `A garden is $x$ m wide and $x + ${extra}$ m long. A path ${w} m wide goes all the way around it. Which expression is the total area of the garden and path?`,
        hint: "Draw it. How much wider is the whole rectangle?",
        solution: `Width: $x + ${w} + ${w} = x + ${2 * w}$. Length: $x + ${extra} + ${2 * w}$. Area: **${right}**.` };
    } });

  // ───────────────────────── First and second differences ─────────────────────────
  add({ id: "u6.di.second", skill: "u6.diffs", level: L.B, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3, -1, -2]), b = r.int(-4, 4), c = r.int(-5, 9), xs = [0, 1, 2, 3, 4], ys = xs.map((x) => a * x * x + b * x + c);
      return { key: [a, b, c], answer: 2 * a,
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$y$", ...ys.map(String)]] },
        prompt: "What is the second difference of the $y$-values in the table?",
        hint: "Find the differences between the $y$-values, then the differences of those.",
        solution: `First differences: ${diffs(ys).join(", ")}. Second differences: ${diffs(diffs(ys)).join(", ")}. The second difference is **${2 * a}**.` };
    } });

  add({ id: "u6.di.classify", skill: "u6.diffs", level: L.I, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 3), xs = [0, 1, 2, 3, 4];
      const a = r.int(1, 3), b = r.int(-3, 5), c = r.int(1, 6), g = r.pick([2, 3]);
      const ys = kind === 0 ? xs.map((x) => b * x + c + (b === 0 ? x : 0))
        : kind === 1 ? xs.map((x) => a * x * x + b * x + c)
          : kind === 2 ? xs.map((x) => c * g ** x)
            : xs.map((x) => x ** 3 + c);
      const names = ["Linear", "Quadratic", "Exponential", "None of these"];
      return { key: [kind, a, b, c, g], choices: names, answer: kind, why: names.map((_, i) => (i === kind ? "Correct." : ["Linear needs constant first differences.", "Quadratic needs constant second differences.", "Exponential needs a constant ratio.", "One of the tests works here."][i])),
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$y$", ...ys.map(String)]] },
        prompt: "Which type of function fits the table?",
        hint: "Check first differences, second differences and ratios.",
        solution: `First differences: ${diffs(ys).join(", ")}. Second differences: ${diffs(diffs(ys)).join(", ")}. ${kind === 2 ? `Ratios are all ${g}. ` : ""}**${names[kind]}**.` };
    } });

  add({ id: "u6.di.next", skill: "u6.diffs", level: L.H, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3, -1, -2, 0.5]), b = r.int(-4, 4), c = r.int(-6, 9), x0 = r.int(-2, 2), xs = [0, 1, 2, 3].map((k) => x0 + k), f = (x) => a * x * x + b * x + c;
      const ys = xs.map(f), next = f(x0 + 5);
      if (ys.some((v) => !Number.isInteger(v)) || !Number.isInteger(next)) return this.make(r);
      return { key: [a, b, c, x0], answer: next,
        table: { headers: ["$x$", ...xs.map(String), String(x0 + 4), String(x0 + 5)], rows: [["$y$", ...ys.map(String), "?", "?"]] },
        prompt: `The table shows a quadratic function. What is $y$ when $x = ${x0 + 5}$?`,
        hint: "The second differences are constant. Extend the first differences.",
        solution: `First differences: ${diffs(ys).join(", ")}; second difference ${2 * a}. Next first differences: ${diffs(ys)[2] + 2 * a}, ${diffs(ys)[2] + 4 * a}. So $y = ${ys[3]} + ${paren(diffs(ys)[2] + 2 * a)} + ${paren(diffs(ys)[2] + 4 * a)} = \\mathbf{${next}}$.` };
    } });

  add({ id: "u6.di.find-abc", skill: "u6.diffs", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3, -1, -2, -3]), b = r.int(-6, 6), c = r.int(-9, 9), xs = [0, 1, 2, 3], ys = xs.map((x) => a * x * x + b * x + c), ask = r.pick(["a", "b", "c"]);
      return { key: [a, b, c, ask], answer: ask === "a" ? a : ask === "b" ? b : c,
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$y$", ...ys.map(String)]] },
        prompt: `The table fits $y = ax^2 + bx + c$. What is $${ask}$?`,
        hint: "At $x = 0$, $y = c$. The second difference is $2a$. The first difference from $x = 0$ to $x = 1$ is $a + b$.",
        solution: `$c = ${c}$ (the value at $x = 0$). Second difference ${2 * a} $= 2a$, so $a = ${a}$. First difference ${ys[1] - ys[0]} $= a + b$, so $b = ${b}$. $${ask} = \\mathbf{${ask === "a" ? a : ask === "b" ? b : c}}$` };
    } });

  add({ id: "u6.di.select", skill: "u6.diffs", level: L.C, type: "multi", calc: false,
    make(r) {
      const xs = [1, 2, 3, 4];
      const make = (kind) => {
        const a = r.pick([1, 2, -1, 3]), b = r.int(-3, 4), c = r.int(0, 6);
        if (kind === "q") return xs.map((x) => a * x * x + b * x + c);
        if (kind === "l") { const m = r.intNot(-4, 5, [0]); return xs.map((x) => m * x + c); }
        if (kind === "e") return xs.map((x) => (c + 1) * 2 ** x);
        return xs.map((x) => x ** 3 - c);
      };
      const kinds = r.shuffle(["q", "q", "l", "e", "c"]).slice(0, 5);
      if (!kinds.includes("q")) return this.make(r);
      const items = kinds.map((k) => { const ys = make(k); return { text: ys.join(", "), ok: k === "q", why: k === "q" ? "" : `Second differences: ${diffs(diffs(ys)).join(", ")}${k === "l" ? " (first differences are constant, so it is linear)" : ""}.` }; });
      if (new Set(items.map((i) => i.text)).size < items.length) return this.make(r);
      const m = multi(items, r);
      return { key: items.map((i) => i.text), ...m,
        prompt: "Each list shows $y$ for $x = 1, 2, 3, 4$. Select **all** lists that come from a quadratic function.",
        hint: "Quadratic: the second differences are constant and not zero.",
        solution: items.map((i) => `${i.text}: second differences ${diffs(diffs(i.text.split(", ").map(Number))).join(", ")}`).join("; ") + ". The quadratic ones have a constant, nonzero second difference." };
    } });

  // ───────────────────────── Quadratic key features ─────────────────────────
  add({ id: "u6.fe.plot-vertex", skill: "u6.features", level: L.B, type: "plot", calc: false,
    make(r) {
      const P = parab(r);
      return { key: [P.a, P.p, P.q], answer: [[P.h, P.k]],
        plot: { window: W, paths: [curve(P.f)] },
        prompt: "The graph of a quadratic function is shown. Plot its vertex.",
        hint: `The vertex is the ${P.a > 0 ? "lowest" : "highest"} point, where the graph turns.`,
        solution: `The graph turns at $${pt([P.h, P.k])}$. The vertex is **$${pt([P.h, P.k])}$**.` };
    } });

  add({ id: "u6.fe.zeros", skill: "u6.features", level: L.B, type: "graph-mcq", calc: false,
    make(r) {
      const P = parab(r);
      const m = mcq(`$x = ${P.p}$ and $x = ${P.q}$`, [
        { text: `$x = ${P.h}$`, why: "That is the axis of symmetry, not the zeros." },
        { text: `$x = ${P.c}$`, why: "That is where the graph crosses the $y$-axis, the $y$-intercept." },
        { text: `$x = ${-P.p}$ and $x = ${-P.q}$`, why: "Read the crossing points directly from the graph." },
      ], r, [{ text: `$x = ${P.p - 1}$ and $x = ${P.q + 1}$`, why: "Read the crossing points carefully." }]);
      return { key: [P.a, P.p, P.q], ...m,
        graph: { window: W, paths: [curve(P.f)] },
        prompt: "What are the zeros ($x$-intercepts) of the function graphed?",
        hint: "Zeros are where the graph crosses the $x$-axis.",
        solution: `The graph crosses the $x$-axis at $x = ${P.p}$ and $x = ${P.q}$.` };
    } });

  add({ id: "u6.fe.axis", skill: "u6.features", level: L.I, type: "numeric", calc: false,
    make(r) {
      const p = r.int(-9, 6), q = p + r.int(1, 10), a = r.pick([1, -1, 2, -3]);
      return { key: [p, q, a], answer: (p + q) / 2,
        prompt: `$f(x) = ${a === 1 ? "" : a === -1 ? "-" : a}(${fac(p)})(${fac(q)})$. What is the equation of the axis of symmetry? Enter the $x$-value.`,
        hint: "The axis of symmetry is halfway between the zeros.",
        solution: `Zeros: $${p}$ and $${q}$. Halfway: $\\frac{${p} + ${paren(q)}}{2} = ${tex((p + q) / 2)}$. The axis is $x = \\mathbf{${tex((p + q) / 2)}}$.` };
    } });

  add({ id: "u6.fe.open-maxmin", skill: "u6.features", level: L.I, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3, -1, -2, 0.5, -0.5, -4]), h = r.int(-6, 6), k = r.intNot(-9, 9, [h, -h]);
      const up = a > 0;
      const right = `It opens ${up ? "up" : "down"} and has a ${up ? "minimum" : "maximum"} value of ${k}.`;
      const m = mcq(right, [
        { text: `It opens ${up ? "down" : "up"} and has a ${up ? "maximum" : "minimum"} value of ${k}.`, why: `$a = ${tex(a)}$ is ${up ? "positive" : "negative"}, so it opens ${up ? "up" : "down"}.` },
        { text: `It opens ${up ? "up" : "down"} and has a ${up ? "minimum" : "maximum"} value of ${h}.`, why: `${h} is where it happens (the $x$-value). The value is the $y$-value, ${k}.` },
        { text: `It opens ${up ? "up" : "down"} and has a ${up ? "minimum" : "maximum"} value of ${-h}.`, why: "In vertex form $a(x - h)^2 + k$, the vertex is $(h, k)$; the value is $k$." },
      ], r, [{ text: `It opens ${up ? "down" : "up"} and has a ${up ? "maximum" : "minimum"} value of ${h}.`, why: "Check the sign of $a$ and use the $y$-value." }]);
      return { key: [a, h, k], ...m,
        prompt: `Which describes the graph of $f(x) = ${vertexForm(a, h, k)}$?`,
        hint: "In $a(x - h)^2 + k$, the sign of $a$ tells the direction and the vertex is $(h, k)$.",
        solution: `$a = ${tex(a)}$ ${up ? "> 0" : "< 0"}, so it opens ${up ? "up" : "down"}. Vertex $(${h}, ${k})$. **${right}**` };
    } });

  add({ id: "u6.fe.vertex-factored", skill: "u6.features", level: L.H, type: "numeric", calc: false,
    make(r) {
      const P = parab(r), askY = r.chance(0.6);
      return { key: [P.a, P.p, P.q, askY], answer: askY ? P.k : P.h,
        prompt: `$f(x) = ${P.a === 1 ? "" : P.a === -1 ? "-" : tex(P.a)}(${fac(P.p)})(${fac(P.q)})$. What is the ${askY ? `${P.a > 0 ? "minimum" : "maximum"} value of $f$` : "$x$-coordinate of the vertex"}?`,
        hint: "The vertex is halfway between the zeros. Then substitute that $x$.",
        solution: `Zeros ${P.p} and ${P.q}, so the vertex is at $x = ${P.h}$. $f(${P.h}) = ${tex(P.a)}(${P.h - P.p})(${P.h - P.q}) = ${P.k}$. ${askY ? `The ${P.a > 0 ? "minimum" : "maximum"} value is **${P.k}**.` : `$x = \\mathbf{${P.h}}$`}` };
    } });

  add({ id: "u6.fe.range", skill: "u6.features", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([1, 2, -1, -3, 0.5]), h = r.int(-6, 6), k = r.intNot(-9, 9, [h, -h]);
      const up = a > 0, right = up ? `$y \\ge ${k}$` : `$y \\le ${k}$`;
      const m = mcq(right, [
        { text: up ? `$y \\le ${k}$` : `$y \\ge ${k}$`, why: `The parabola opens ${up ? "up" : "down"}, so the outputs go ${up ? "up" : "down"} from ${k}.` },
        { text: up ? `$y \\ge ${h}$` : `$y \\le ${h}$`, why: `${h} is the $x$-coordinate of the vertex.` },
        { text: "All real numbers", why: "A parabola has a highest or lowest point, so its range is cut off." },
      ], r);
      return { key: [a, h, k], ...m,
        prompt: `What is the range of $f(x) = ${vertexForm(a, h, k)}$?`,
        hint: "Find the vertex and which way the parabola opens.",
        solution: `Vertex $(${h}, ${k})$, opens ${up ? "up" : "down"}. Range: **${right}**.` };
    } });

  add({ id: "u6.fe.max-height", skill: "u6.features", level: L.C, type: "numeric", calc: true,
    make(r) {
      const v = r.pick([32, 48, 64, 80, 96, 112, 128]), h0 = r.int(0, 20), askT = r.chance(0.35);
      const t = v / 32, H = -16 * t * t + v * t + h0;
      return { key: [v, h0, askT], answer: askT ? t : H,
        prompt: `A rocket's height, in feet, after $t$ seconds is $h(t) = -16t^2 + ${v}t${h0 ? ` + ${h0}` : ""}$. ${askT ? "After how many seconds does it reach its greatest height?" : "What is its greatest height, in feet?"}`,
        hint: "The vertex of $at^2 + bt + c$ is at $t = -\\frac{b}{2a}$.",
        solution: `$t = -\\frac{${v}}{2(-16)} = ${tex(t)}$. ${askT ? `**${tex(t)}** seconds.` : `$h(${tex(t)}) = -16(${tex(t)})^2 + ${v}(${tex(t)})${h0 ? ` + ${h0}` : ""} = \\mathbf{${H}}$ feet.`}` };
    } });

  add({ id: "u6.fe.select", skill: "u6.features", level: L.C, type: "multi", calc: false,
    make(r) {
      const P = parab(r), up = P.a > 0;
      const items = [
        { text: `The vertex is $${pt([P.h, P.k])}$.`, ok: true },
        { text: `The axis of symmetry is $x = ${P.h}$.`, ok: true },
        { text: `The $y$-intercept is $${P.c}$.`, ok: true },
        { text: `$f$ is increasing for $x ${up ? ">" : "<"} ${P.h}$.`, ok: true },
        { text: `The ${up ? "maximum" : "minimum"} value is ${P.k}.`, ok: false, why: `The parabola opens ${up ? "up" : "down"}, so ${P.k} is the ${up ? "minimum" : "maximum"}.` },
        { text: `The zeros are $${-P.p}$ and $${-P.q}$.`, ok: false, why: `The zeros are $${P.p}$ and $${P.q}$.` },
      ];
      const keep = r.shuffle(items).slice(0, 5);
      if (!keep.some((i) => !i.ok) || new Set(keep.map((i) => i.text)).size < 5) return this.make(r);
      const m = multi(keep, r);
      return { key: [P.a, P.p, P.q, keep.map((i) => i.text)], ...m,
        prompt: `$f(x) = ${quad(P.a, P.b, P.c)}$, which is also $${P.a === 1 ? "" : P.a === -1 ? "-" : tex(P.a)}(${fac(P.p)})(${fac(P.q)})$. Select **all** true statements.`,
        hint: "Use the factored form for the zeros and the vertex; use the standard form for the $y$-intercept.",
        solution: `Zeros ${P.p}, ${P.q}; vertex $${pt([P.h, P.k])}$; $y$-intercept $${P.c}$; opens ${up ? "up" : "down"}, so it increases for $x ${up ? ">" : "<"} ${P.h}$. True: ${m.answer.map((i) => m.choices[i]).join(" · ")}` };
    } });

  // ───────────────────────── Comparing growth ─────────────────────────
  add({ id: "u6.cg.eventually", skill: "u6.compare", level: L.B, type: "mcq", calc: false,
    make(r) {
      const m = r.int(20, 200), a = r.pick([1, 2, 0.5]);
      const right = `$g$, because a quadratic eventually grows faster than any linear function.`;
      const mm = mcq(right, [
        { text: "$f$, because its slope is much bigger.", why: "A bigger slope only keeps $f$ ahead for a while." },
        { text: "They grow at the same rate.", why: "$f$ adds the same amount each step; $g$ adds more and more." },
        { text: "$f$, because it starts out larger.", why: "Starting larger does not decide which is larger eventually." },
      ], r);
      return { key: [m, a], ...mm,
        prompt: `$f(x) = ${m}x$ and $g(x) = ${tex(a)}x^2$. For very large $x$, which function is greater?`,
        hint: "Compare how much each adds when $x$ goes up by 1.",
        solution: `$g$ grows by more each step (its first differences keep increasing), so it passes $f$ once $x > ${fmt(m / a)}$. **${right}**` };
    } });

  add({ id: "u6.cg.when-pass", skill: "u6.compare", level: L.I, type: "numeric", calc: true,
    make(r) {
      const m = r.int(3, 30), b = r.int(0, 50), a = r.pick([1, 2]);
      let x = 1; while (!(a * x * x > m * x + b)) x++;
      return { key: [m, b, a], answer: x,
        prompt: `$f(x) = ${lin(m, b)}$ and $g(x) = ${a === 1 ? "" : a}x^2$. What is the smallest whole number $x$ for which $g(x) > f(x)$?`,
        hint: "Make a table of both functions.",
        solution: `$g(${x - 1}) = ${a * (x - 1) ** 2} \\le f(${x - 1}) = ${m * (x - 1) + b}$, but $g(${x}) = ${a * x * x} > f(${x}) = ${m * x + b}$. **${x}**` };
    } });

  add({ id: "u6.cg.compare-max", skill: "u6.compare", level: L.H, type: "mcq", calc: false,
    make(r) {
      const P = parab(r, { opensUp: false }), a2 = -r.pick([1, 2]), h2 = r.int(-5, 5), k2 = r.intNot(-6, 8, [P.k]);
      const right = P.k > k2 ? `$f$ has the greater maximum, ${P.k}.` : `$g$ has the greater maximum, ${k2}.`;
      const m = mcq(right, [
        { text: P.k > k2 ? `$g$ has the greater maximum, ${k2}.` : `$f$ has the greater maximum, ${P.k}.`, why: `Compare ${P.k} and ${k2}.` },
        { text: `$${P.h > h2 ? "f" : "g"}$ has the greater maximum, ${Math.max(P.h, h2)}.`, why: "That compares the $x$-coordinates of the vertices. Compare the $y$-values." },
        { text: "They have the same maximum.", why: `The maximums are ${P.k} and ${k2}.` },
      ], r, [{ text: `$${P.h > h2 ? "g" : "f"}$ has the greater maximum, ${Math.min(P.h, h2)}.`, why: "Compare the $y$-values of the vertices." }, { text: "Neither has a maximum.", why: "Both parabolas open down, so both have a highest point." }]);
      return { key: [P.a, P.p, P.q, a2, h2, k2], ...m,
        graph: { window: W, paths: [curve(P.f)] },
        prompt: `The graph of $f$ is shown. $g(x) = ${vertexForm(a2, h2, k2)}$. Which function has the greater maximum value?`,
        hint: "Read the vertex of $f$ from the graph. Read the vertex of $g$ from its equation.",
        solution: `$f$: vertex $${pt([P.h, P.k])}$, maximum ${P.k}. $g$: vertex $(${h2}, ${k2})$, maximum ${k2}. **${right}**` };
    } });

  add({ id: "u6.cg.exp-quad", skill: "u6.compare", level: L.C, type: "numeric", calc: true,
    make(r) {
      const k = r.pick([1, 2, 5, 10]), g = 2;
      let x = 5; while (!(g ** x > k * x * x)) x++;
      return { key: [k], answer: x, think: true,
        prompt: `$p(x) = 2^x$ and $q(x) = ${k === 1 ? "" : k}x^2$. For $x \\ge 5$, what is the first whole number $x$ where $p(x) > q(x)$?`,
        hint: "Make a table of both, starting at $x = 5$.",
        solution: `$p(${x - 1}) = ${2 ** (x - 1)}$ and $q(${x - 1}) = ${k * (x - 1) ** 2}$, so $q$ is still ahead or equal. $p(${x}) = ${2 ** x} > q(${x}) = ${k * x * x}$. **${x}**. Exponential growth eventually passes quadratic growth.` };
    } });

  add({ id: "u6.cg.roc", skill: "u6.compare", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2, 3]), m = r.int(2, 12), x1 = r.int(0, 3), x2 = x1 + r.int(2, 5);
      const q = (x) => a * x * x, rq = (q(x2) - q(x1)) / (x2 - x1);
      return { key: [a, m, x1, x2], answer: rq - m,
        prompt: `$f(x) = ${a === 1 ? "" : a}x^2$ and $g(x) = ${m}x$. On the interval from $x = ${x1}$ to $x = ${x2}$, how much greater is the average rate of change of $f$ than that of $g$? (A negative answer means it is less.)`,
        hint: "Average rate of change $= \\frac{f(x_2) - f(x_1)}{x_2 - x_1}$.",
        solution: `$f$: $\\frac{${q(x2)} - ${q(x1)}}{${x2 - x1}} = ${tex(rq)}$. $g$: ${m} (the slope). Difference: $${tex(rq)} - ${m} = \\mathbf{${tex(rq - m)}}$.` };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  add({ id: "u6.th.find-error", skill: "u6.features", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.pick([1, 2, -1, -2, 3]), h = r.intNot(-5, 5, [0]), k = r.int(-9, 9), b = -2 * a * h, c = a * h * h + k, kind = r.int(0, 3);
      const H = kind === 0 ? -h : h;
      const s1 = kind === 0 ? `$x = \\frac{${b}}{2(${a})} = ${-h}$` : `$x = -\\frac{${b}}{2(${a})} = ${h}$`;
      const Kc = a * H * H + b * H + c;
      const K = kind === 1 ? Kc + r.pick([-2, 2, 4]) : Kc;
      const s2 = `$f(${H}) = ${a}(${H})^2 ${signed(b)}(${H}) ${signed(c)} = ${K}$`;
      const s3 = kind === 2 ? `The vertex is $${pt([K, H])}$.` : `The vertex is $${pt([H, K])}$.`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = ["The formula is $x = -\\frac{b}{2a}$: the minus sign is missing.", "Recompute $f$ at that $x$.", "The vertex is written $(x, y)$."][Math.max(0, bad)];
      if (kind === 2 && H === K) return this.make(r);
      const f = findStep([s1, s2, s3], bad, whyWrong);
      return { key: [a, h, k, kind, K], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `Noah found the vertex of $f(x) = ${quad(a, b, c)}$:<br>${f.stepsText}<br>Where is Noah's first mistake?`,
        hint: "The vertex is at $x = -\\frac{b}{2a}$.",
        solution: `$x = -\\frac{${b}}{${2 * a}} = ${h}$ and $f(${h}) = ${k}$, so the vertex is $(${h}, ${k})$.<br>` + (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  add({ id: "u6.th.make-true", skill: "u6.features", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.pick([1, 2, -1, -2]), h = r.int(-4, 4), up = a > 0;
      return { key: [a, h], answer: up ? 3 : -3, accept: up ? { lo: 0, loOpen: true } : { hi: 0, hiOpen: true }, think: true,
        prompt: `Give **one** value of $k$ so that the graph of $f(x) = ${vertexForm(a, h, 0).trim()} + k$ never crosses or touches the $x$-axis.`,
        hint: "Where is the vertex? Which way does the parabola open?",
        solution: `The vertex is $(${h}, k)$ and the parabola opens ${up ? "up" : "down"}. It misses the $x$-axis when the vertex is ${up ? "above" : "below"} it: **any $k ${up ? ">" : "<"} 0$** works.` };
    } });

  add({ id: "u6.th.reason", skill: "u6.diffs", level: L.H, type: "mcq", calc: false,
    make(r) {
      const quadratic = r.chance(0.5), xs = [0, 1, 2, 3, 4], a = r.pick([1, 2, 3]), b = r.int(-3, 3), c = r.int(0, 5);
      const ys = quadratic ? xs.map((x) => a * x * x + b * x + c) : xs.map((x) => c + 1 + (2 ** x - 1) * a);
      const d1 = diffs(ys), d2 = diffs(d1);
      const right = quadratic ? `Yes, because the second differences are all ${2 * a}.` : `No, because the second differences (${d2.join(", ")}) are not constant.`;
      const m = mcq(right, [
        { text: quadratic ? "No, because the first differences are not constant." : "Yes, because the first differences keep increasing.", why: quadratic ? "Changing first differences rule out linear, not quadratic." : "Increasing first differences happen in exponential functions too. Check the second differences." },
        { text: quadratic ? "No, because the values are not perfect squares." : "Yes, because the graph would curve upward.", why: "Use differences, not the look of the numbers or a guess about the graph." },
        { text: quadratic ? `Yes, because the values go up by more than ${a} each time.` : "No, because the values are not perfect squares.", why: "That is not the test. Check the second differences." },
      ], r);
      return { key: [quadratic, a, b, c], ...m, think: true,
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$y$", ...ys.map(String)]] },
        prompt: "Could the table come from a quadratic function? Pick the answer with the correct reason.",
        hint: "Find the first and second differences.",
        solution: `First differences: ${d1.join(", ")}. Second differences: ${d2.join(", ")}. **${right}**` };
    } });

  const U6_ASN = [
    { s: "A quadratic function has two zeros.",
      right: "Sometimes true: $x^2 - 4$ has two, $x^2$ has one, and $x^2 + 1$ has none.",
      wrong: ["Always true: the $x^2$ makes two answers.", "Never true: parabolas touch the axis once.", "Sometimes true: only when $a > 0$."] },
    { s: "The vertex of a parabola is halfway between its two zeros.",
      right: "Always true (when there are two zeros): a parabola is symmetric about the vertical line through its vertex.",
      wrong: ["Sometimes true: only when it opens up.", "Never true: the vertex is on the $y$-axis.", "Sometimes true: only when the zeros are positive."] },
    { s: "If $a < 0$ in $f(x) = ax^2 + bx + c$, then $f$ has a maximum value.",
      right: "Always true: the parabola opens down, so the vertex is the highest point.",
      wrong: ["Never true: negative $a$ gives a minimum.", "Sometimes true: only when $c > 0$.", "Sometimes true: only when $b = 0$."] },
    { s: "A quadratic function eventually becomes greater than any linear function with a positive slope.",
      right: "Sometimes true: it is true when $a > 0$, but a parabola that opens down goes below every line eventually.",
      wrong: ["Always true: squares grow faster.", "Never true: lines go on forever.", "Always true: quadratic means faster growth."] },
    { s: "The second differences of a quadratic function's table (equal steps in $x$) are constant.",
      right: "Always true: equal steps in $x$ give a constant second difference, $2a$ when the step is 1.",
      wrong: ["Sometimes true: only when $b = 0$.", "Never true: the first differences are constant.", "Sometimes true: only for positive $x$."] },
  ];
  add({ id: "u6.th.always", skill: "u6.features", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U6_ASN.length - 1), it = U6_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Sketch a few parabolas.",
        solution: `**${it.right}**` };
    } });

  M1.units.u6 = Object.assign(M1.units.u6 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
