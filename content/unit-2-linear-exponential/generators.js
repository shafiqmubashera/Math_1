/* Unit 2 Linear & Exponential Functions: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { fmt, tex, signed, mcq, multi, gcd, windowFor } = M1.qlib;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);

  // Decimals as typed (1.05 stays 1.05, not 21/20).
  const dec = (x) => String(+(+x).toFixed(6));
  const commas = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const money = (x) => "\\$" + (Number.isInteger(x) ? commas(String(x)) : x.toFixed(2));
  // Linear expression mx + b in KaTeX: handles m = ±1, b = 0 and fractions.
  function lin(m, b, v = "x") {
    if (m === 0) return tex(b);
    const mt = m === 1 ? "" : m === -1 ? "-" : tex(m);
    return `${mt}${v}${b === 0 ? "" : " " + signed(b)}`;
  }
  // a·b^x with the base always in parentheses.
  // Unit fractions (1/2, 1/3, 1/4) show as fractions; other bases as decimals.
  const base = (b) => ([1 / 2, 1 / 3, 1 / 4].some((f) => Math.abs(f - b) < 1e-12) ? tex(b) : dec(b));
  const expo = (a, b, v = "x") => (a === 1 && Number.isInteger(b) ? `${b}^{${v}}` : `${a === 1 ? "" : tex(a)}\\left(${base(b)}\\right)^{${v}}`);
  const frac = (n, d) => { // n/d reduced, as KaTeX
    const g = gcd(n, d), s = (n < 0) !== (d < 0) ? "-" : "";
    const N = Math.abs(n) / g, D = Math.abs(d) / g;
    return D === 1 ? `${s}${N}` : `${s}\\frac{${N}}{${D}}`;
  };
  const pt = (p) => `(${fmt(p[0])}, ${fmt(p[1])})`;
  const setTex = (lo, hi) => (hi - lo <= 5 ? `\\{${Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).join(", ")}\\}` : `\\{${lo}, ${lo + 1}, ${lo + 2}, \\ldots, ${hi}\\}`);

  // ───────────────────────── Discrete vs continuous, domain ─────────────────────────
  const DISCRETE = [
    (r) => { const p = r.int(6, 15); return [`$C(n)$ is the cost of buying $n$ movie tickets at ${money(p)} each.`, p]; },
    (r) => { const k = r.int(8, 30); return [`$S(n)$ is the number of chairs in $n$ rows when each row has ${k} chairs.`, k]; },
    (r) => { const k = r.int(2, 9); return [`$P(w)$ is the number of push-ups done after $w$ workouts of ${k * 5} push-ups each.`, k]; },
    (r) => { const k = r.int(3, 12); return [`$T(b)$ is the number of tennis balls in $b$ cans that hold ${k} balls each.`, k]; },
    (r) => { const k = r.int(20, 60); return [`$M(s)$ is the money earned for working $s$ shifts at ${money(k * 2)} per shift.`, k]; },
    (r) => { const k = r.int(2, 6); return [`$B(n)$ is the number of bacteria colonies after $n$ full days when the number of colonies is multiplied by ${k} each day.`, k]; },
  ];
  const CONTINUOUS = [
    (r) => { const k = r.int(2, 8); return [`$h(t)$ is the height of a candle $t$ hours after it is lit, if it burns ${k} cm per hour.`, k]; },
    (r) => { const k = r.int(3, 15); return [`$V(t)$ is the water in a tank $t$ minutes after it starts filling at ${k} gallons per minute.`, k]; },
    (r) => { const k = r.int(35, 70); return [`$d(t)$ is the distance a car has traveled $t$ hours after leaving, at ${k} miles per hour.`, k]; },
    (r) => { const k = r.int(10, 40); return [`$A(t)$ is the altitude of a plane $t$ seconds after takeoff, climbing ${k} feet per second.`, k]; },
    (r) => { const k = r.int(2, 9); return [`$R(x)$ is the cost of $x$ pounds of rice scooped from a bulk bin at ${money(k)} per pound.`, k]; },
    (r) => { const k = r.int(5, 20); return [`$G(m)$ is the gas left in a tank after a car drives $m$ miles, using 1 gallon every ${k} miles.`, k]; },
  ];
  const situ = (r, discrete) => { const pool = discrete ? DISCRETE : CONTINUOUS, i = r.int(0, pool.length - 1); const [text, k] = pool[i](r); return { text, key: [discrete, i, k] }; };

  add({ id: "u2.di.classify", skill: "u2.discrete", level: L.B, type: "mcq", calc: false,
    make(r) {
      const disc = r.chance(0.5), s = situ(r, disc);
      const D = "Discrete: only whole-number inputs make sense.", C = "Continuous: every input in an interval makes sense.";
      const m = mcq(disc ? D : C, [
        { text: disc ? C : D, why: disc ? "You cannot have part of one of these inputs, so the inputs are whole numbers." : "The input is time or an amount that can be any value, not just whole numbers." },
        { text: "Discrete, because the outputs keep going up.", why: "Going up or down does not decide it. Ask which inputs make sense." },
        { text: "Continuous, because the outputs can be large numbers.", why: "The size of the outputs does not decide it. Ask which inputs make sense." },
      ], r);
      return { key: s.key, ...m,
        prompt: `${s.text} Is this function discrete or continuous?`,
        hint: "Look at the input. Does a value like 2.5 make sense for it?",
        solution: disc ? `The input counts whole things, so 2.5 of them makes no sense. The function is **discrete**.` : `The input can be any value in an interval, like 2.5. The function is **continuous**.` };
    } });

  add({ id: "u2.di.in-domain", skill: "u2.discrete", level: L.B, type: "mcq", calc: false,
    make(r) {
      const p = r.int(4, 15), n = r.int(2, 12), half = r.int(1, 9) + 0.5;
      const item = r.pick(["concert tickets", "pizzas", "notebooks", "bus passes"]);
      const m = mcq(String(n), [
        { text: dec(half), why: `You cannot buy ${dec(half)} ${item}.` },
        { text: String(-r.int(1, 5)), why: "You cannot buy a negative number of items." },
        { text: `\\$${p * n + p}`, why: "That is a cost, an output. The domain is the inputs: numbers of items." },
      ], r);
      return { key: [p, n, half, item], ...m,
        prompt: `$C(n) = ${p}n$ gives the cost, in dollars, of buying $n$ ${item}. Which value is in the domain of $C$?`,
        hint: "The domain is the set of inputs that make sense. Here the input is the number of items bought.",
        solution: `The input $n$ must be a whole number of ${item}, 0 or more. Only **${n}** works.` };
    } });

  add({ id: "u2.di.domain-cont", skill: "u2.discrete", level: L.I, type: "mcq", calc: false,
    make(r) {
      const rate = r.pick([5, 10, 15, 20, 25, 40]), T = r.int(6, 30), V0 = rate * T;
      const m = mcq(`$0 \\le t \\le ${T}$`, [
        { text: `$${setTex(0, T)}$`, why: "Time can be any value, like 2.5 minutes, so the domain is not just whole numbers." },
        { text: `$0 \\le t \\le ${V0}$`, why: `${V0} is the starting amount of water, an output, not a time.` },
        { text: "$t \\ge 0$", why: `The tank is empty after ${T} minutes, so the model stops there.` },
      ], r);
      return { key: [rate, T], ...m,
        prompt: `A tank holds ${V0} gallons of water. It drains at ${rate} gallons per minute until it is empty. $V(t) = ${V0} - ${rate}t$ is the water left after $t$ minutes. What is the domain of $V$?`,
        hint: "When does the tank become empty? Can $t$ be a decimal?",
        solution: `The tank is empty when $${V0} - ${rate}t = 0$, so $t = ${T}$. Time can be any value from 0 to ${T}: **$0 \\le t \\le ${T}$**.` };
    } });

  add({ id: "u2.di.select-discrete", skill: "u2.discrete", level: L.I, type: "multi", calc: false,
    make(r) {
      const nD = r.int(2, 3), nC = 5 - nD;
      const di = r.shuffle(DISCRETE.map((_, i) => i)).slice(0, nD), ci = r.shuffle(CONTINUOUS.map((_, i) => i)).slice(0, nC);
      const items = di.map((i) => ({ text: DISCRETE[i](r)[0], ok: true }))
        .concat(ci.map((i) => ({ text: CONTINUOUS[i](r)[0], ok: false, why: "The input can be any value in an interval, so this is continuous." })));
      const m = multi(items, r);
      return { key: m.choices, ...m,
        prompt: "Select **all** functions that are discrete.",
        hint: "For each one, ask: can the input be a value like 2.5?",
        solution: "A function is discrete when only whole-number inputs make sense (tickets, rows, cans, shifts, full days). Time, distance and amounts of liquid can be any value, so those are continuous." };
    } });

  add({ id: "u2.di.count-domain", skill: "u2.discrete", level: L.H, type: "numeric", calc: false,
    make(r) {
      const p = r.int(5, 15), B = r.int(4, 12) * p + r.int(0, p - 1);
      const k = Math.floor(B / p);
      const who = r.pick(["Jada", "Malik", "Priya", "Owen"]);
      return { key: [p, B],
        prompt: `${who} has ${money(B)} to spend on comic books that cost ${money(p)} each. $C(n) = ${p}n$ is the cost of buying $n$ comic books. ${who} could also buy none. How many values are in the domain of $C$?`,
        answer: k + 1,
        hint: `Find the greatest number of books ${who} can afford. Do not forget 0.`,
        solution: `$${B} \\div ${p} ${B % p ? "\\approx" : "="} ${dec(+(B / p).toFixed(2))}$, so the most books is ${k}. The domain is $${setTex(0, k)}$, which has $${k} + 1 = \\mathbf{${k + 1}}$ values.` };
    } });

  add({ id: "u2.di.domain-discrete", skill: "u2.discrete", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(10, 24), d = r.int(1, 4), R = r.int(15, 40);
      const m = mcq(`$${setTex(1, R)}$`, [
        { text: `$1 \\le n \\le ${R}$`, why: "There is no row 2.5. Only whole-number rows make sense." },
        { text: `$${setTex(0, R)}$`, why: "Row numbers start at 1. There is no row 0." },
        { text: `$\\{${a}, ${a + d}, ${a + 2 * d}, \\ldots, ${a + d * (R - 1)}\\}$`, why: "These are the numbers of seats, the outputs. That is the range." },
      ], r);
      return { key: [a, d, R], ...m,
        prompt: `A theater has ${R} rows. Row 1 has ${a} seats and each row has ${d} more seat${d > 1 ? "s" : ""} than the row before. $S(n)$ is the number of seats in row $n$. What is the domain of $S$?`,
        hint: "The input is the row number. Which row numbers exist?",
        solution: `The inputs are row numbers 1 through ${R}, whole numbers only: **$${setTex(1, R)}$**.` };
    } });

  add({ id: "u2.di.graph-domain", skill: "u2.discrete", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const k = r.int(3, 5), a = r.int(1, 6), d = r.int(1, 3);
      const pts = Array.from({ length: k + 1 }, (_, x) => [x, a + d * x]);
      const m = mcq(`$${setTex(0, k)}$`, [
        { text: `$0 \\le x \\le ${k}$`, why: "The graph is separate points, not a solid line, so only those x-values are in the domain." },
        { text: `$\\{${pts.map((p) => p[1]).join(", ")}\\}$`, why: "These are the y-values. That is the range." },
        { text: "All real numbers", why: "Only the x-values of the points shown are inputs." },
      ], r);
      return { key: [k, a, d], ...m,
        prompt: "The graph shows **all** the points of a function $f$. What is the domain of $f$?",
        graph: { points: pts, window: windowFor(pts) },
        hint: "The domain is the list of x-values. Is the graph separate points or a solid line?",
        solution: `The points have x-values ${pts.map((p) => p[0]).join(", ")}. The domain is **$${setTex(0, k)}$**.` };
    } });

  add({ id: "u2.di.range-min", skill: "u2.discrete", level: L.C, type: "numeric", calc: false,
    make(r) {
      const p = r.int(3, 9), B = r.int(5, 15) * p + r.int(1, p - 1);
      const k = Math.floor(B / p);
      return { key: [p, B],
        prompt: `A transit card has ${money(B)} on it. Each ride costs ${money(p)}. $R(n) = ${B} - ${p}n$ is the money left after $n$ rides. A ride is only allowed if the card has enough money for it. What is the **smallest** value in the range of $R$?`,
        answer: B - p * k,
        hint: "Find the greatest number of rides allowed. Then find the money left.",
        solution: `$${B} \\div ${p}$ is ${k} with some left over, so the most rides is ${k}. $R(${k}) = ${B} - ${p}(${k}) = \\mathbf{${B - p * k}}$ dollars.` };
    } });

  add({ id: "u2.di.domain-range", skill: "u2.discrete", level: L.C, type: "mcq", calc: false,
    make(r) {
      const rate = r.int(2, 6), T = r.int(4, 12), H = rate * T;
      const m = mcq(`Domain: $0 \\le t \\le ${T}$; range: $0 \\le h \\le ${H}$`, [
        { text: `Domain: $0 \\le t \\le ${H}$; range: $0 \\le h \\le ${T}$`, why: "This swaps the inputs (hours) and the outputs (height)." },
        { text: `Domain: $${setTex(0, T)}$; range: $\\{0, ${rate}, ${2 * rate}, \\ldots, ${H}\\}$`, why: "Time and height can be decimals. The candle keeps burning between whole hours." },
        { text: `Domain: $t \\ge 0$; range: $h \\le ${H}$`, why: "The candle is gone after the height reaches 0, and the height cannot be negative." },
      ], r);
      return { key: [rate, T], ...m,
        prompt: `A candle is ${H} cm tall. It burns down ${rate} cm each hour until it is gone. $h(t) = ${H} - ${rate}t$. Which gives the domain and range of $h$ for this situation?`,
        hint: "Find when the candle is gone. Then think about which inputs and outputs make sense.",
        solution: `$h(t) = 0$ when $t = ${H} \\div ${rate} = ${T}$. Time runs from 0 to ${T} hours and the height goes from ${H} down to 0, including every value in between: **domain $0 \\le t \\le ${T}$, range $0 \\le h \\le ${H}$**.` };
    } });

  // ───────────────────────── Linear vs exponential ─────────────────────────
  const TYPE3 = ["Linear", "Exponential", "Neither", "Both linear and exponential"];
  function tableOfKind(r, kind) {
    if (kind === 0) { const b = r.int(-5, 20), m = r.intNot(-6, 9, [0]); return { key: [kind, b, m], y: [0, 1, 2, 3].map((x) => b + m * x) }; }
    if (kind === 1) { const a = r.int(1, 8), g = r.pick([2, 3, 4, 1 / 2]); const a2 = g === 1 / 2 ? a * 8 : a; return { key: [kind, a2, g], y: [0, 1, 2, 3].map((x) => a2 * g ** x) }; }
    const a = r.int(0, 5), s = r.int(1, 3); return { key: [kind, a, s], y: [0, 1, 2, 3].map((x) => s * x * x + a) };
  }

  add({ id: "u2.le.table-type", skill: "u2.linexp", level: L.B, type: "mcq", calc: false,
    make(r) {
      const kind = r.int(0, 2), t = tableOfKind(r, kind);
      const why = ["Linear functions add the same amount each time x goes up by 1.", "Exponential functions multiply by the same factor each time x goes up by 1.",
        "Check both the differences and the ratios.", "Only a constant function changes by the same amount and the same factor."];
      const diffs = t.y.slice(1).map((v, i) => v - t.y[i]);
      const ratios = t.y.slice(1).map((v, i) => (t.y[i] === 0 ? "none (cannot divide by 0)" : `$${frac(v, t.y[i])}$`));
      return { key: t.key, choices: TYPE3, answer: kind, why: why.map((w, i) => (i === kind ? "Correct." : w)),
        prompt: "Is the function in the table linear, exponential, or neither?",
        table: { headers: ["$x$", "0", "1", "2", "3"], rows: [["$y$", ...t.y.map(fmt)]] },
        hint: "Find the differences between y-values. Then find the ratios.",
        solution: `Differences: ${diffs.map(fmt).join(", ")}. Ratios: ${ratios.join(", ")}.<br>**${TYPE3[kind]}**${kind === 2 ? ": neither the differences nor the ratios stay the same." : "."}` };
    } });

  const LIN_STORIES = [
    (r) => `A plant grows ${r.int(2, 6)} cm each week.`,
    (r) => `A pool drains ${r.int(2, 9) * 10} gallons each minute.`,
    (r) => `A savings account gets ${money(r.int(2, 9) * 5)} added each month.`,
    (r) => `A taxi charges ${money(r.int(2, 4))} plus ${money(r.int(2, 3))} for each mile.`,
    (r) => `A phone's battery loses ${r.int(2, 9)} percentage points of charge every hour.`,
  ];
  const EXP_STORIES = [
    (r) => `A town's population grows by ${r.int(2, 9)}% each year.`,
    (r) => `A car loses ${r.int(10, 25)}% of its value each year.`,
    (r) => `The number of views on a video triples every ${r.int(2, 6)} days.`,
    (r) => `A medicine in the body is cut in half every ${r.int(3, 8)} hours.`,
    (r) => `A bank account earns ${r.int(2, 6)}% interest on its balance each year.`,
  ];

  add({ id: "u2.le.story-type", skill: "u2.linexp", level: L.B, type: "mcq", calc: false,
    make(r) {
      const exp = r.chance(0.5), i = r.int(0, 4), text = (exp ? EXP_STORIES : LIN_STORIES)[i](r);
      const Lt = "Linear: it changes by the same amount each step.", Et = "Exponential: it changes by the same factor (percent) each step.";
      const m = mcq(exp ? Et : Lt, [
        { text: exp ? Lt : Et, why: exp ? "A percent of a changing amount is not the same amount each time." : "Adding or subtracting a fixed amount is linear." },
        { text: "Exponential, because the amount gets larger.", why: "Linear functions can get larger too. Ask: same amount, or same factor?" },
        { text: "Linear, because it happens at regular times.", why: "Both kinds can change at regular times. Ask: same amount, or same factor?" },
      ], r);
      return { key: [exp, i, text], ...m,
        prompt: `${text} Which kind of function models this?`,
        hint: "Is the same amount added each step, or is the amount multiplied by the same factor?",
        solution: exp ? "A percent (or a doubling, tripling, halving) multiplies by the same factor each step: **exponential**." : "The same amount is added or subtracted each step: **linear**." };
    } });

  add({ id: "u2.le.select-exp", skill: "u2.linexp", level: L.I, type: "multi", calc: false,
    make(r) {
      const nE = r.int(2, 3);
      const es = r.shuffle([0, 1, 2, 3, 4]).slice(0, nE).map((i) => ({ text: EXP_STORIES[i](r), ok: true }));
      const ls = r.shuffle([0, 1, 2, 3, 4]).slice(0, 5 - nE).map((i) => ({ text: LIN_STORIES[i](r), ok: false, why: "The same amount is added or taken away each step, so this is linear." }));
      const m = multi(es.concat(ls), r);
      return { key: m.choices, ...m,
        prompt: "Select **all** situations that an exponential function models.",
        hint: "Exponential means multiplying by the same factor each step. Percents, doubling and halving are factors.",
        solution: "Growing or shrinking by a percent, tripling, or halving multiplies by the same factor: **exponential**. Adding or taking away a fixed amount is linear." };
    } });

  add({ id: "u2.le.graph-type", skill: "u2.linexp", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const exp = r.chance(0.5);
      let pts, key;
      if (exp) { const a = r.int(1, 3), g = r.pick([2, 3]), n = g === 3 ? 3 : 4; pts = Array.from({ length: n + 1 }, (_, x) => [x, a * g ** x]); key = [1, a, g]; }
      else { const b = r.int(1, 6), m = r.int(2, 6); pts = Array.from({ length: 5 }, (_, x) => [x, b + m * x]); key = [0, b, m]; }
      const Lt = "Linear: the y-values go up by the same amount each step.", Et = "Exponential: the y-values are multiplied by the same factor each step.";
      const m = mcq(exp ? Et : Lt, [
        { text: exp ? Lt : Et, why: exp ? "Check the differences: they grow, so it is not linear." : "Check the ratios: they are not the same, so it is not exponential." },
        { text: "Linear, because the points go up from left to right.", why: "Both kinds can go up. Compare the differences and ratios." },
        { text: "Exponential, because every y-value is positive.", why: "Being positive does not decide it. Compare the differences and ratios." },
      ], r);
      const ys = pts.map((p) => p[1]);
      return { key, ...m,
        prompt: "The graph shows points of a function. Which describes the function?",
        graph: { points: pts, window: windowFor(pts) },
        hint: "Read the y-values. Find the differences and the ratios.",
        solution: `y-values: ${ys.join(", ")}. Differences: ${ys.slice(1).map((v, i) => v - ys[i]).join(", ")}. Ratios: ${ys.slice(1).map((v, i) => `$${frac(v, ys[i])}$`).join(", ")}.<br>**${exp ? "Exponential" : "Linear"}**.` };
    } });

  add({ id: "u2.le.overtake", skill: "u2.linexp", level: L.H, type: "numeric", calc: true,
    make(r) {
      for (;;) {
        const a = r.int(5, 20) * 10, m = r.int(2, 10) * 10, c = r.pick([1, 2, 3, 5]);
        let x = 0;
        while (c * 2 ** x <= a + m * x) x++;
        if (x < 4 || x > 14 || c * 2 ** x === a + m * x) continue;
        return { key: [a, m, c],
          prompt: `Plan A starts with ${money(a)} and adds ${money(m)} each day. Plan B starts with ${money(c)} on day 0 and doubles each day. On which day does Plan B first have more money than Plan A?`,
          answer: x,
          hint: "Make a table: day, Plan A $= " + a + " + " + m + "d$, Plan B $= " + c + " \\cdot 2^d$.",
          solution: `Day ${x - 1}: A $= ${a + m * (x - 1)}$, B $= ${c * 2 ** (x - 1)}$ (A is ahead).<br>Day ${x}: A $= ${a + m * x}$, B $= ${c * 2 ** x}$ (B is ahead). Answer: day **${x}**.` };
      }
    } });

  add({ id: "u2.le.factor-gap", skill: "u2.linexp", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(1, 5), g = r.pick([2, 3]), s = 2;
      const y = [0, 1, 2, 3].map((k) => a * g ** (s * k));
      const m = mcq(String(g), [
        { text: String(g * g), why: "That is the factor for 2 steps of x, not 1." },
        { text: String((y[1] - y[0]) / 2), why: "That divides a difference by 2, which is linear thinking." },
        { text: fmt((g * g) / 2), why: "Dividing the 2-step factor by 2 does not undo multiplying twice. Take the square root." },
      ], r, [{ text: String(g + 1), why: "Check: multiplying by this twice does not give the 2-step factor." },
        { text: String(2 * g * g), why: "That is more than the factor for 2 steps. Take the square root of the 2-step factor." }]);
      return { key: [a, g], ...m,
        prompt: "The table shows an exponential function. By what factor does $y$ change each time $x$ goes up by **1**?",
        table: { headers: ["$x$", "0", "2", "4", "6"], rows: [["$y$", ...y.map(fmt)]] },
        hint: "From $x = 0$ to $x = 2$ the y-value is multiplied by the factor twice.",
        solution: `From $x = 0$ to $x = 2$: $${y[1]} \\div ${y[0]} = ${g * g}$. That is two steps, so $b^2 = ${g * g}$ and $b = \\mathbf{${g}}$.` };
    } });

  add({ id: "u2.le.eventually", skill: "u2.linexp", level: L.C, type: "mcq", calc: false,
    make(r) {
      const m1 = r.int(5, 20) * 100, b1 = r.int(1, 9) * 1000, m2 = r.int(30, 90) * 100, c = r.pick([0.01, 0.1, 0.5, 1]), g = r.pick([1.02, 1.05, 1.1, 2]);
      const sq = r.int(10, 50);
      const kx = c === 1 ? (Number.isInteger(g) ? `${g}^{x}` : `\\left(${dec(g)}\\right)^{x}`) : `${dec(c)}\\left(${dec(g)}\\right)^{x}`;
      const m = mcq(`$k(x) = ${kx}$`, [
        { text: `$f(x) = ${m1}x + ${b1}$`, why: "A linear function adds the same amount forever. An exponential with factor above 1 passes it." },
        { text: `$g(x) = ${m2}x$`, why: "A big slope still only adds the same amount each step." },
        { text: `$h(x) = ${sq}x + ${b1 * 10}$`, why: "A large starting value does not matter for very large $x$." },
      ], r);
      return { key: [m1, b1, m2, c, g, sq], ...m,
        prompt: "Which function has the greatest value when $x$ is very large?",
        hint: "Compare adding a fixed amount with multiplying by a factor above 1.",
        solution: `The exponential function multiplies by ${dec(g)} each step. Its increases keep getting bigger, so it passes every linear function eventually: **$k(x) = ${kx}$**.` };
    } });

  add({ id: "u2.le.match-two", skill: "u2.linexp", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(1, 6), g = r.pick([2, 3]), n = r.int(3, 4);
      const lin4 = a + n * (a * g - a), exp4 = a * g ** n;
      return { key: [a, g, n],
        prompt: `$f$ is a linear function and $g$ is an exponential function. Both have the value ${a} at $x = 0$ and the value ${a * g} at $x = 1$. What is $g(${n}) - f(${n})$?`,
        answer: exp4 - lin4,
        hint: "f adds the same amount each step. g multiplies by the same factor each step.",
        solution: `$f$ adds $${a * g} - ${a} = ${a * g - a}$ each step: $f(${n}) = ${a} + ${n}(${a * g - a}) = ${lin4}$.<br>$g$ multiplies by ${g}: $g(${n}) = ${a} \\cdot ${g}^{${n}} = ${exp4}$.<br>$${exp4} - ${lin4} = \\mathbf{${exp4 - lin4}}$` };
    } });

  // ───────────────────────── Properties of exponents ─────────────────────────
  const xp = (v, e) => (e === 0 ? "1" : e === 1 ? v : `${v}^{${e}}`);

  add({ id: "u2.ex.negative", skill: "u2.exponents", level: L.B, type: "numeric", calc: false,
    make(r) {
      const [b, n] = r.pick([[2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [3, 1], [3, 2], [3, 3], [4, 2], [4, 3], [5, 2], [5, 3], [10, 2], [10, 3], [8, 2]]);
      const flip = r.chance(0.3);
      const val = flip ? b ** n : 1 / b ** n;
      return { key: [b, n, flip],
        prompt: flip ? `What is the value of $\\left(\\frac{1}{${b}}\\right)^{-${n}}$?` : `What is the value of $${b}^{-${n}}$? Enter a fraction or a decimal.`,
        answer: val,
        hint: "A negative exponent means take the reciprocal: $a^{-n} = \\frac{1}{a^n}$.",
        solution: flip ? `$\\left(\\frac{1}{${b}}\\right)^{-${n}} = ${b}^{${n}} = \\mathbf{${b ** n}}$` : `$${b}^{-${n}} = \\frac{1}{${b}^{${n}}} = \\mathbf{\\frac{1}{${b ** n}}}$` };
    } });

  add({ id: "u2.ex.product", skill: "u2.exponents", level: L.B, type: "mcq", calc: false,
    make(r) {
      const a = r.intNot(-5, 9, [0, 1]), b = r.intNot(-5, 9, [0, 1, -a]);
      const quot = r.chance(0.4);
      const right = quot ? a - b : a + b;
      const m = mcq(`$${xp("x", right)}$`, quot ? [
        { text: `$${xp("x", a / b)}$`, why: "When dividing powers with the same base, subtract the exponents. Do not divide them." },
        { text: `$${xp("x", a + b)}$`, why: "Add exponents when multiplying. Here you divide, so subtract." },
        { text: `$${xp("x", b - a)}$`, why: "Subtract in order: top exponent minus bottom exponent." },
      ] : [
        { text: `$${xp("x", a * b)}$`, why: "Multiply exponents only for a power of a power. Here you add them." },
        { text: `$${xp("x", a - b)}$`, why: "When multiplying powers with the same base, add the exponents." },
        { text: `$${xp("2x", a + b)}$`, why: "The base stays $x$. Nothing doubles." },
      ], r, [{ text: `$${xp("x", right + 1)}$`, why: "Check the arithmetic on the exponents." }, { text: `$${xp("x", right - 2)}$`, why: "Check the arithmetic on the exponents." }]);
      const expr = quot ? `\\dfrac{${xp("x", a)}}{${xp("x", b)}}` : `${xp("x", a)} \\cdot ${xp("x", b)}`;
      return { key: [a, b, quot], ...m,
        prompt: `For $x \\ne 0$, which expression is equivalent to $${expr}$?`,
        hint: quot ? "Same base, dividing: subtract the exponents." : "Same base, multiplying: add the exponents.",
        solution: quot ? `$x^{${a} - ${b < 0 ? "(" + b + ")" : b}} = \\mathbf{${xp("x", right)}}$` : `$x^{${a} + ${b < 0 ? "(" + b + ")" : b}} = \\mathbf{${xp("x", right)}}$` };
    } });

  add({ id: "u2.ex.power-quotient", skill: "u2.exponents", level: L.I, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 6), b = r.int(2, 4), c = r.intNot(-4, 9, [0, a * b, a + b]);
      const right = a * b - c;
      const m = mcq(`$${xp("x", right)}$`, [
        { text: `$${xp("x", a + b - c)}$`, why: "For a power of a power, multiply the exponents, not add." },
        { text: `$${xp("x", a * b + c)}$`, why: "Dividing means subtracting the bottom exponent." },
        { text: `$${xp("x", a ** b - c)}$`, why: `$(x^{${a}})^{${b}}$ means multiply the exponents: $${a} \\cdot ${b}$, not $${a}^{${b}}$.` },
      ], r, [{ text: `$${xp("x", right + 1)}$`, why: "Check the arithmetic on the exponents." }, { text: `$${xp("x", right - 1)}$`, why: "Check the arithmetic on the exponents." }]);
      return { key: [a, b, c], ...m,
        prompt: `For $x \\ne 0$, which expression is equivalent to $\\dfrac{\\left(x^{${a}}\\right)^{${b}}}{${xp("x", c)}}$?`,
        hint: "First multiply the exponents for the power of a power. Then subtract for the division.",
        solution: `$\\left(x^{${a}}\\right)^{${b}} = x^{${a * b}}$. Then $x^{${a * b} - ${c < 0 ? "(" + c + ")" : c}} = \\mathbf{${xp("x", right)}}$` };
    } });

  add({ id: "u2.ex.solve-n", skill: "u2.exponents", level: L.I, type: "numeric", calc: false,
    make(r) {
      const b = r.pick([2, 3, 5, 7, 10]), form = r.int(0, 2);
      if (form === 0) {
        const p = r.intNot(-6, 9, [0]), n = r.intNot(-6, 9, [0]), q = p + n;
        return { key: [b, form, p, q],
          prompt: `What value of $n$ makes $${b}^{${p}} \\cdot ${b}^{n} = ${b}^{${q}}$ true?`, answer: n,
          hint: "Multiplying powers with the same base adds the exponents.",
          solution: `$${p} + n = ${q}$, so $n = \\mathbf{${n}}$` };
      }
      if (form === 1) {
        const p = r.int(4, 12), n = r.intNot(-5, 9, [0, p]), q = p - n;
        return { key: [b, form, p, q],
          prompt: `What value of $n$ makes $\\dfrac{${b}^{${p}}}{${b}^{n}} = ${b}^{${q}}$ true?`, answer: n,
          hint: "Dividing powers with the same base subtracts the exponents.",
          solution: `$${p} - n = ${q}$, so $n = \\mathbf{${n}}$` };
      }
      const k = r.int(2, 5), n = r.intNot(-4, 6, [0, 1]);
      return { key: [b, form, k, n],
        prompt: `What value of $n$ makes $\\left(${b}^{n}\\right)^{${k}} = ${b}^{${n * k}}$ true?`, answer: n,
        hint: "A power of a power multiplies the exponents.",
        solution: `$${k}n = ${n * k}$, so $n = \\mathbf{${n}}$` };
    } });

  add({ id: "u2.ex.monomial", skill: "u2.exponents", level: L.H, type: "mcq", calc: false,
    make(r) {
      const c = r.pick([2, 3]), k = r.pick([2, 3]), a = r.int(1, 4), b = r.intNot(-3, 4, [0]), e = r.int(1, 5);
      const ck = c ** k, d = r.pick([1, c, ck].filter((v, i, arr) => arr.indexOf(v) === i));
      const C = ck / d, mE = a * k + b - e;
      const term = (coef, ex) => `$${coef === 1 ? "" : tex(coef)}${coef === 1 && ex === 0 ? "1" : ex === 0 ? "" : xp("x", ex)}$`;
      const m = mcq(term(C, mE), [
        { text: term((c * k) / d, mE), why: `$${c}^{${k}}$ means ${c} multiplied by itself ${k} times, not $${c} \\cdot ${k}$.` },
        { text: term(C, a + k + b - e), why: "For a power of a power, multiply the exponents, not add." },
        { text: term(C, a * k + b + e), why: "Dividing means subtracting the bottom exponent." },
      ], r, [{ text: term(c / d === Math.floor(c / d) ? c / d : ck * d, mE), why: "The coefficient must also be raised to the power." }, { text: term(C + 1, mE), why: "Check the coefficient." }]);
      const expr = `\\dfrac{\\left(${c}${xp("x", a)}\\right)^{${k}} \\cdot ${xp("x", b)}}{${d === 1 ? "" : d}${xp("x", e)}}`;
      return { key: [c, k, a, b, e, d], ...m,
        prompt: `For $x \\ne 0$, which expression is equivalent to $${expr}$?`,
        hint: "Raise both the number and the power of $x$ to the outside exponent first.",
        solution: `$\\left(${c}${xp("x", a)}\\right)^{${k}} = ${ck}${xp("x", a * k)}$. Multiply by $${xp("x", b)}$: $${ck}x^{${a * k + b}}$. Divide by $${d === 1 ? "" : d}${xp("x", e)}$: ${term(C, mE).replace(/^\$/, "$\\mathbf{").replace(/\$$/, "}$")}` };
    } });

  add({ id: "u2.ex.equal-to", skill: "u2.exponents", level: L.H, type: "multi", calc: false,
    make(r) {
      const [b, n] = r.pick([[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [5, 2], [10, 2]]);
      const v = b ** n, k = r.int(2, 5);
      const okPool = [
        `$${b}^{-${n}}$`, `$\\left(\\frac{1}{${b}}\\right)^{${n}}$`, `$${v}^{-1}$`,
        `$\\dfrac{${b}^{${k}}}{${b}^{${k + n}}}$`, `$${b}^{${k}} \\cdot ${b}^{-${k + n}}$`,
      ];
      const badPool = [
        { text: `$-${v}$`, why: "A negative exponent does not make the value negative." },
        { text: `$${b}^{${n}}$`, why: `This equals ${v}, not $\\frac{1}{${v}}$.` },
        { text: `$\\left(\\frac{1}{${b}}\\right)^{-${n}}$`, why: `This equals $${b}^{${n}} = ${v}$.` },
        { text: `$${b}^{-${n + 1}}$`, why: `This equals $\\frac{1}{${b ** (n + 1)}}$.` },
        { text: `$-${b}^{${n}}$`, why: `This equals $-${v}$.` },
      ];
      const nOk = r.int(2, 3);
      const items = r.shuffle(okPool).slice(0, nOk).map((t) => ({ text: t, ok: true })).concat(r.shuffle(badPool).slice(0, 5 - nOk).map((x) => ({ ...x, ok: false })));
      const m = multi(items, r);
      return { key: [b, n, k, m.choices.join("|")], ...m,
        prompt: `Select **all** expressions equal to $\\frac{1}{${v}}$.`,
        hint: "Rewrite each one as a fraction. Remember $a^{-n} = \\frac{1}{a^n}$.",
        solution: `$\\frac{1}{${v}} = ${b}^{-${n}}$. Any expression that simplifies to $${b}^{-${n}}$ (or $${v}^{-1}$) is correct.` };
    } });

  add({ id: "u2.ex.solve-exp", skill: "u2.exponents", level: L.C, type: "numeric", calc: false,
    make(r) {
      for (;;) {
        const [b, q] = r.pick([[2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [5, 2]]);
        const p = r.intNot(1, 6, [q]), c = r.intNot(-5, 5, [0]);
        const x = (q * c) / (q - p);
        if (!Number.isInteger(x) || x === 0 || Math.abs(x) > 20) continue;
        return { key: [b, q, p, c],
          prompt: `What value of $x$ makes $${b}^{${p === 1 ? "" : p}x} = ${b ** q}^{x ${signed(-c, false)}}$ true?`,
          answer: x,
          hint: `Write ${b ** q} as a power of ${b}.`,
          solution: `$${b ** q} = ${b}^{${q}}$, so the right side is $${b}^{${q}(x ${signed(-c, false)})}$.<br>Set exponents equal: $${p === 1 ? "" : p}x = ${q}x ${signed(-q * c, false)}$ → $${p - q === 1 ? "" : p - q === -1 ? "-" : p - q}x = ${-q * c}$ → $x = \\mathbf{${x}}$` };
      }
    } });

  add({ id: "u2.ex.two-vars", skill: "u2.exponents", level: L.C, type: "mcq", calc: false,
    make(r) {
      for (;;) {
        const a = r.int(1, 7), b = r.int(1, 7), c = r.int(1, 7), d = r.int(1, 7);
        const p = a - c, q = b - d;
        if (p === 0 || q === 0 || (p > 0) === (q > 0)) continue;
        const mono = (P, Q) => {
          const top = [P > 0 ? xp("x", P) : "", Q > 0 ? xp("y", Q) : ""].join("");
          const bot = [P < 0 ? xp("x", -P) : "", Q < 0 ? xp("y", -Q) : ""].join("");
          return bot ? `$\\dfrac{${top || "1"}}{${bot}}$` : `$${top || "1"}$`;
        };
        const m = mcq(mono(p, q), [
          { text: mono(-p, -q), why: "Subtract the bottom exponent from the top exponent, not the other way around." },
          { text: mono(a + c, b + d), why: "Dividing means subtracting exponents, not adding." },
          { text: mono(p, -q), why: `Check the $y$ exponent: $${b} - ${d} = ${q}$.` },
        ], r, [{ text: mono(-p, q), why: `Check the $x$ exponent: $${a} - ${c} = ${p}$.` }]);
        return { key: [a, b, c, d], ...m,
          prompt: `For $x > 0$ and $y > 0$, which expression is equivalent to $\\dfrac{${xp("x", a)}${xp("y", b)}}{${xp("x", c)}${xp("y", d)}}$?`,
          hint: "Handle $x$ and $y$ separately. A negative exponent moves the factor to the bottom.",
          solution: `$x^{${a} - ${c}} y^{${b} - ${d}} = ${xp("x", p)}${xp("y", q)}$, which is ${mono(p, q).replace(/^\$/, "$\\mathbf{").replace(/\$$/, "}$")} with positive exponents.` };
      }
    } });

  // ───────────────────────── Average rate of change ─────────────────────────
  add({ id: "u2.rc.table", skill: "u2.roc", level: L.B, type: "numeric", calc: false,
    make(r) {
      const xs = [0, 2, 4, 6];
      const y0 = r.int(-5, 20);
      const ys = [y0];
      for (let i = 1; i < 4; i++) ys.push(ys[i - 1] + 2 * r.intNot(-6, 9, [0]));
      const i = r.int(0, 2), j = r.int(i + 1, 3);
      const ans = (ys[j] - ys[i]) / (xs[j] - xs[i]);
      return { key: [ys.join(","), i, j],
        prompt: `The table shows some values of $f$. What is the average rate of change of $f$ from $x = ${xs[i]}$ to $x = ${xs[j]}$?`,
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$f(x)$", ...ys.map(String)]] },
        answer: ans,
        hint: "Average rate of change = (change in $f(x)$) ÷ (change in $x$).",
        solution: `$\\dfrac{f(${xs[j]}) - f(${xs[i]})}{${xs[j]} - ${xs[i]}} = \\dfrac{${ys[j]} - ${ys[i] < 0 ? "(" + ys[i] + ")" : ys[i]}}{${xs[j] - xs[i]}} = \\mathbf{${tex(ans)}}$` };
    } });

  add({ id: "u2.rc.units", skill: "u2.roc", level: L.B, type: "mcq", calc: false,
    make(r) {
      const t1 = r.int(1, 3), dt = r.int(2, 4), v = r.int(4, 13) * 5, d1 = v * t1 + r.int(1, 3) * 10, d2 = d1 + v * dt, t2 = t1 + dt;
      const m = mcq(`$${v}$ miles per hour`, [
        { text: `$${tex(d2 / t2)}$ miles per hour`, why: "That divides one distance by one time. Use the change in distance over the change in time." },
        { text: `$${d2 - d1}$ miles per hour`, why: `That is the change in distance. Divide it by the ${dt} hours.` },
        { text: `$${frac(dt, d2 - d1)}$ hour per mile`, why: "This divides time by distance. Put the change in distance on top." },
      ], r, [{ text: `$${v + 5}$ miles per hour`, why: "Check the subtraction." }]);
      return { key: [t1, dt, v, d1], ...m,
        prompt: `A car has traveled ${d1} miles after ${t1} hour${t1 > 1 ? "s" : ""} and ${d2} miles after ${t2} hours. What is its average rate of change over that time?`,
        hint: "Divide the change in distance by the change in time.",
        solution: `$\\dfrac{${d2} - ${d1}}{${t2} - ${t1}} = \\dfrac{${d2 - d1}}{${dt}} = \\mathbf{${v}}$ miles per hour` };
    } });

  add({ id: "u2.rc.function", skill: "u2.roc", level: L.I, type: "numeric", calc: false,
    make(r) {
      if (r.chance(0.5)) {
        const c = r.int(-9, 9), p = r.int(-4, 4), q = r.intNot(-3, 7, [p]);
        const [lo, hi] = [Math.min(p, q), Math.max(p, q)];
        const f = (x) => x * x + c;
        return { key: [0, c, lo, hi],
          prompt: `$f(x) = x^2 ${c === 0 ? "" : signed(c)}$. What is the average rate of change of $f$ from $x = ${lo}$ to $x = ${hi}$?`,
          answer: (f(hi) - f(lo)) / (hi - lo),
          hint: "Find $f$ at both ends. Then divide the change in $f$ by the change in $x$.",
          solution: `$f(${hi}) = ${f(hi)}$, $f(${lo}) = ${f(lo)}$.<br>$\\dfrac{${f(hi)} - ${f(lo) < 0 ? "(" + f(lo) + ")" : f(lo)}}{${hi} - ${lo < 0 ? "(" + lo + ")" : lo}} = \\dfrac{${f(hi) - f(lo)}}{${hi - lo}} = \\mathbf{${tex((f(hi) - f(lo)) / (hi - lo))}}$` };
      }
      const a = r.int(1, 5), g = r.pick([2, 3]), lo = r.int(0, 2), hi = lo + r.pick([1, 2]);
      const f = (x) => a * g ** x;
      const ans = (f(hi) - f(lo)) / (hi - lo);
      return { key: [1, a, g, lo, hi],
        prompt: `$f(x) = ${expo(a, g)}$. What is the average rate of change of $f$ from $x = ${lo}$ to $x = ${hi}$?`,
        answer: ans,
        hint: "Find $f$ at both ends. Then divide the change in $f$ by the change in $x$.",
        solution: `$f(${hi}) = ${f(hi)}$, $f(${lo}) = ${f(lo)}$.<br>$\\dfrac{${f(hi)} - ${f(lo)}}{${hi} - ${lo}} = \\dfrac{${f(hi) - f(lo)}}{${hi - lo}} = \\mathbf{${tex(ans)}}$` };
    } });

  add({ id: "u2.rc.graph", skill: "u2.roc", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const a = r.int(1, 2), g = 2, pts = Array.from({ length: 5 }, (_, x) => [x, a * g ** x]);
      const i = r.int(0, 2), j = r.int(i + 1, 4);
      const dy = pts[j][1] - pts[i][1], dx = j - i, ans = dy / dx;
      const m = mcq(`$${tex(ans)}$`, [
        { text: `$${frac(dx, dy)}$`, why: "This divides the change in $x$ by the change in $y$. Put the change in $y$ on top." },
        { text: `$${tex(dy)}$`, why: `That is the change in $y$. Divide it by the change in $x$, ${dx}.` },
        { text: `$${tex(pts[j][1] / j)}$`, why: "This divides one y-value by one x-value. Use the changes." },
      ], r, [{ text: `$${tex(-ans)}$`, why: "The function goes up, so the rate is positive." }, { text: `$${tex(ans + 1)}$`, why: "Check the subtraction." },
        { text: `$${tex(ans + 2)}$`, why: "Check the y-values you read from the graph." }, { text: `$${tex(2 * ans + 3)}$`, why: "Check the y-values you read from the graph." }]);
      return { key: [a, i, j], ...m,
        prompt: `The graph shows points of an exponential function $f$. What is the average rate of change of $f$ from $x = ${i}$ to $x = ${j}$?`,
        graph: { points: pts, window: windowFor(pts) },
        hint: "Read $f(" + i + ")$ and $f(" + j + ")$ from the graph.",
        solution: `$f(${j}) = ${pts[j][1]}$ and $f(${i}) = ${pts[i][1]}$. $\\dfrac{${pts[j][1]} - ${pts[i][1]}}{${j} - ${i}} = \\mathbf{${tex(ans)}}$` };
    } });

  add({ id: "u2.rc.context-exp", skill: "u2.roc", level: L.H, type: "numeric", calc: true,
    make(r) {
      const a = r.int(1, 12) * 100, lo = r.int(0, 3), hi = lo + r.pick([1, 2, 4]);
      const f = (t) => a * 2 ** t;
      const ans = (f(hi) - f(lo)) / (hi - lo);
      return { key: [a, lo, hi],
        prompt: `A lab starts with ${a} bacteria. The number doubles every hour, so $B(t) = ${expo(a, 2, "t")}$. What is the average rate of change of $B$ from hour ${lo} to hour ${hi}, in bacteria per hour?`,
        answer: ans,
        hint: `Find $B(${lo})$ and $B(${hi})$ first.`,
        solution: `$B(${hi}) = ${f(hi)}$ and $B(${lo}) = ${f(lo)}$.<br>$\\dfrac{${f(hi)} - ${f(lo)}}{${hi - lo}} = \\mathbf{${fmt(ans)}}$ bacteria per hour` };
    } });

  add({ id: "u2.rc.compare", skill: "u2.roc", level: L.H, type: "mcq", calc: false,
    make(r) {
      for (;;) {
        const a = r.int(1, 6), g = r.pick([2, 3]);
        const f = (x) => a * g ** x;
        const ivs = r.shuffle([[0, 1], [0, 2], [1, 2], [1, 3], [0, 3], [2, 3], [0, 4], [2, 4]]).slice(0, 4);
        const rates = ivs.map(([p, q]) => (f(q) - f(p)) / (q - p));
        const best = Math.max(...rates);
        if (rates.filter((v) => v === best).length > 1) continue;
        const k = rates.indexOf(best);
        return { key: [a, g, ivs.flat().join(",")],
          choices: ivs.map(([p, q]) => `From $x = ${p}$ to $x = ${q}$`), answer: k,
          why: ivs.map(([p, q], i) => (i === k ? "Correct." : `Here the rate is $${tex(rates[i])}$.`)),
          prompt: `$f(x) = ${expo(a, g)}$. Over which interval is the average rate of change of $f$ the greatest?`,
          hint: "Find the average rate of change for each interval.",
          solution: ivs.map(([p, q], i) => `$[${p}, ${q}]$: $\\frac{${f(q)} - ${f(p)}}{${q - p}} = ${tex(rates[i])}$`).join("<br>") + `<br>Greatest: **from $x = ${ivs[k][0]}$ to $x = ${ivs[k][1]}$**.` };
      }
    } });

  add({ id: "u2.rc.find-endpoint", skill: "u2.roc", level: L.C, type: "numeric", calc: false,
    make(r) {
      const s = r.pick([1, 2, 3]), p = r.int(-3, 4), t = r.intNot(p + 1, p + 9, [-p]);
      const k = s * (p + t);
      return { key: [s, p, t],
        prompt: `$f(x) = ${s === 1 ? "" : s}x^2$. The average rate of change of $f$ from $x = ${p}$ to $x = b$ is ${k}, and $b > ${p}$. What is $b$?`,
        answer: t,
        hint: `Write $\\dfrac{${s === 1 ? "" : s}b^2 - ${s === 1 ? "" : s}(${p})^2}{b - ${p < 0 ? "(" + p + ")" : p}}$ and factor the top.`,
        solution: `$\\dfrac{${s === 1 ? "" : s}(b^2 - ${p * p})}{b ${signed(-p, false)}} = ${s === 1 ? "" : s}(b ${signed(p, false)})$ because $b^2 - ${p * p} = (b ${signed(-p, false)})(b ${signed(p, false)})$.<br>$${s === 1 ? "" : s}(b ${signed(p, false)}) = ${k}$ → $b = \\mathbf{${t}}$` };
    } });

  add({ id: "u2.rc.exp-interval", skill: "u2.roc", level: L.C, type: "mcq", calc: false,
    make(r) {
      const a = r.int(1, 5), g = r.pick([2, 3]);
      const f = (x) => a * g ** x;
      const ans = (f(3) - f(1)) / 2;
      const m = mcq(fmt(ans), [
        { text: fmt(f(3) - f(1)), why: "Divide the change in $g$ by the change in $x$, which is 2." },
        { text: fmt(f(1) - f(0)), why: "That is the rate from $x = 0$ to $x = 1$." },
        { text: fmt((f(3) - f(2))), why: "That is the rate from $x = 2$ to $x = 3$ only." },
      ], r, [{ text: fmt(ans + a), why: "Check the arithmetic." }, { text: fmt(f(3) / 3), why: "This divides one value by one x-value." }]);
      return { key: [a, g], ...m,
        prompt: `$g$ is an exponential function with $g(0) = ${a}$ and $g(1) = ${a * g}$. What is the average rate of change of $g$ from $x = 1$ to $x = 3$?`,
        hint: "Find the growth factor first. Then find $g(3)$.",
        solution: `The factor is $${a * g} \\div ${a} = ${g}$, so $g(3) = ${a} \\cdot ${g}^3 = ${f(3)}$.<br>$\\dfrac{${f(3)} - ${f(1)}}{3 - 1} = \\mathbf{${fmt(ans)}}$` };
    } });

  // ───────────────────────── Writing linear equations ─────────────────────────
  add({ id: "u2.wl.slope", skill: "u2.writeline", level: L.B, type: "mcq", calc: false,
    make(r) {
      for (;;) {
        const x1 = r.int(-6, 6), y1 = r.int(-8, 8), x2 = r.intNot(-6, 8, [x1]), y2 = r.intNot(-8, 10, [y1]);
        const dy = y2 - y1, dx = x2 - x1;
        const s = (n, d) => `$${frac(n, d)}$`;
        try {
          const m = mcq(s(dy, dx), [
            { text: s(dx, dy), why: "Slope is change in $y$ over change in $x$. This is upside down." },
            { text: s(-dy, dx), why: "Subtract the coordinates in the same order on top and bottom." },
            { text: `$${dy}$`, why: `That is the change in $y$. Divide by the change in $x$, ${dx}.` },
          ], r, [{ text: s(dy + dx, dx), why: "Check the subtraction." }, { text: s(y2 + y1, x2 + x1 || 1), why: "Subtract the coordinates; do not add them." }]);
          return { key: [x1, y1, x2, y2], ...m,
            prompt: `What is the slope of the line through $${pt([x1, y1])}$ and $${pt([x2, y2])}$?`,
            hint: "Slope $= \\dfrac{y_2 - y_1}{x_2 - x_1}$.",
            solution: `$\\dfrac{${y2} - ${y1 < 0 ? "(" + y1 + ")" : y1}}{${x2} - ${x1 < 0 ? "(" + x1 + ")" : x1}} = \\dfrac{${dy}}{${dx}} = \\mathbf{${frac(dy, dx)}}$` };
        } catch (e) { continue; }
      }
    } });

  add({ id: "u2.wl.intercept", skill: "u2.writeline", level: L.B, type: "numeric", calc: false,
    make(r) {
      const m = r.intNot(-5, 6, [0]), x1 = r.intNot(-5, 6, [0]), b = r.int(-10, 12), y1 = m * x1 + b;
      return { key: [m, x1, b],
        prompt: `A line has slope ${m} and passes through $${pt([x1, y1])}$. Its equation is $y = ${m === 1 ? "" : m === -1 ? "-" : m}x + b$. What is $b$?`,
        answer: b,
        hint: `Put $x = ${x1}$ and $y = ${y1}$ into the equation and solve for $b$.`,
        solution: `$${y1} = ${m}(${x1}) + b$ → $${y1} = ${m * x1} + b$ → $b = \\mathbf{${b}}$` };
    } });

  add({ id: "u2.wl.table-eq", skill: "u2.writeline", level: L.I, type: "mcq", calc: false,
    make(r) {
      const step = r.pick([1, 2]), x0 = r.int(1, 3), m = r.intNot(-4, 6, [0]), b = r.intNot(-8, 10, [0]);
      const xs = [0, 1, 2, 3].map((k) => x0 + k * step), ys = xs.map((x) => m * x + b);
      const eq = (M, B) => `$y = ${lin(M, B)}$`;
      const mm = mcq(eq(m, b), [
        { text: eq(m, ys[0]), why: `${ys[0]} is $y$ when $x = ${x0}$, not when $x = 0$. Work back to $x = 0$.` },
        { text: eq(m * step === m ? m + 1 : m * step, b), why: step > 1 ? `$y$ changes by ${m * step} when $x$ goes up by ${step}. Divide to get the slope.` : "Check the change in $y$ for each step in $x$." },
        { text: eq(b, m), why: "This swaps the slope and the y-intercept." },
      ], r, [{ text: eq(-m, b), why: "Check the sign of the slope." }, { text: eq(m, b + m), why: "Check the y-intercept with one point from the table." }]);
      return { key: [step, x0, m, b], ...mm,
        prompt: "The table shows points on a line. Which equation describes the line?",
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$y$", ...ys.map(String)]] },
        hint: "Find the slope: change in $y$ ÷ change in $x$. Then find $y$ when $x = 0$.",
        solution: `Slope: $\\dfrac{${ys[1]} - ${ys[0] < 0 ? "(" + ys[0] + ")" : ys[0]}}{${step}} = ${m}$. Then $${ys[0]} = ${m}(${x0}) + b$, so $b = ${b}$.<br>**$y = ${lin(m, b)}$**` };
    } });

  add({ id: "u2.wl.point-slope", skill: "u2.writeline", level: L.I, type: "mcq", calc: false,
    make(r) {
      const h = r.intNot(-6, 6, [0]), k = r.intNot(-6, 6, [0, h, -h]), m = r.intNot(-5, 5, [0, 1]);
      const ps = (Y, X) => `$y ${signed(-Y, false)} = ${m}(x ${signed(-X, false)})$`;
      const mm = mcq(ps(k, h), [
        { text: ps(-k, -h), why: "In $y - y_1 = m(x - x_1)$ you subtract the coordinates. The signs are flipped here." },
        { text: ps(h, k), why: "This swaps the $x$- and $y$-coordinates of the point." },
        { text: `$y = ${lin(m, k)}$`, why: `This line has y-intercept ${k}; it does not pass through $${pt([h, k])}$.` },
      ], r);
      return { key: [h, k, m], ...mm,
        prompt: `Which equation describes the line with slope ${m} through the point $${pt([h, k])}$?`,
        hint: "Point-slope form: $y - y_1 = m(x - x_1)$.",
        solution: `Put $x_1 = ${h}$ and $y_1 = ${k}$ into $y - y_1 = m(x - x_1)$: ${ps(k, h).replace(/^\$/, "$\\mathbf{").replace(/\$$/, "}$")}` };
    } });

  const LIN_CTX = [
    { who: "A plumber", fee: "a service fee", per: "hour", unit: "hours", rate: [40, 90], base: [50, 120] },
    { who: "A taxi", fee: "a pickup fee", per: "mile", unit: "miles", rate: [2, 4], base: [3, 8] },
    { who: "A gym", fee: "a sign-up fee", per: "month", unit: "months", rate: [20, 45], base: [25, 99] },
    { who: "A bike rental shop", fee: "a fixed fee", per: "hour", unit: "hours", rate: [6, 15], base: [5, 20] },
  ];

  add({ id: "u2.wl.context", skill: "u2.writeline", level: L.H, type: "numeric", calc: true,
    make(r) {
      const c = r.int(0, LIN_CTX.length - 1), C = LIN_CTX[c];
      const m = r.int(...C.rate), b = r.int(...C.base), u1 = r.int(1, 4), u2 = u1 + r.int(2, 5), u3 = u2 + r.int(2, 8);
      const cost = (u) => b + m * u;
      return { key: [c, m, b, u1, u2, u3],
        prompt: `${C.who} charges ${C.fee} plus a set amount per ${C.per}. ${u1} ${u1 === 1 ? C.per : C.unit} costs ${money(cost(u1))} and ${u2} ${C.unit} costs ${money(cost(u2))}. How much, in dollars, do ${u3} ${C.unit} cost?`,
        answer: cost(u3),
        hint: `The extra cost for ${u2 - u1} more ${C.unit} gives the rate per ${C.per}.`,
        solution: `Rate: $\\dfrac{${cost(u2)} - ${cost(u1)}}{${u2} - ${u1}} = ${m}$ per ${C.per}. Fee: $${cost(u1)} - ${m}(${u1}) = ${b}$.<br>$C = ${b} + ${m}(${u3}) = \\mathbf{${cost(u3)}}$ dollars` };
    } });

  add({ id: "u2.wl.plot-line", skill: "u2.writeline", level: L.H, type: "plot", calc: false,
    make(r) {
      for (;;) {
        const q = r.pick([1, 2, 3]), p = r.intNot(-3, 3, [0]), b = r.int(-3, 3);
        if (gcd(p, q) !== 1) continue;
        const m = p / q, xs = [-q, 0, q], pts = xs.map((x) => [x, m * x + b]);
        if (pts.some((P) => Math.abs(P[1]) > 7)) continue;
        return { key: [p, q, b],
          prompt: `Plot the three points on the line $y = ${lin(m, b)}$ where $x = ${-q}$, $x = 0$ and $x = ${q}$. Tap the grid to place a point; tap it again to remove it.`,
          plot: { window: { xmin: -6, xmax: 6, ymin: -8, ymax: 8, xstep: 1, ystep: 1 } },
          answer: pts,
          hint: "Start at the y-intercept. Then use the slope: rise over run.",
          solution: `y-intercept $(0, ${b})$. Slope $${tex(m)}$: move ${q} right and ${Math.abs(p)} ${p > 0 ? "up" : "down"}, or ${q} left and ${Math.abs(p)} ${p > 0 ? "down" : "up"}.<br>Points: ${pts.map(pt).join(", ")}` };
      }
    } });

  add({ id: "u2.wl.x-intercept", skill: "u2.writeline", level: L.C, type: "numeric", calc: false,
    make(r) {
      for (;;) {
        const root = r.intNot(-8, 9, [0]), m = r.intNot(-4, 4, [0]) / r.pick([1, 1, 2]);
        const x1 = r.intNot(-6, 6, [root]), x2 = r.intNot(-6, 8, [root, x1]);
        const y1 = m * (x1 - root), y2 = m * (x2 - root);
        if (!Number.isInteger(y1) || !Number.isInteger(y2)) continue;
        return { key: [root, m, x1, x2],
          prompt: `A line passes through $${pt([x1, y1])}$ and $${pt([x2, y2])}$. At what $x$-value does it cross the $x$-axis?`,
          answer: root,
          hint: "Find the slope, write the equation, then set $y = 0$.",
          solution: `Slope: $\\dfrac{${y2} - ${y1 < 0 ? "(" + y1 + ")" : y1}}{${x2} - ${x1 < 0 ? "(" + x1 + ")" : x1}} = ${tex(m)}$. Equation: $y ${signed(-y1, false)} = ${m === 1 ? "" : m === -1 ? "-" : tex(m)}(x ${signed(-x1, false)})$.<br>Set $y = 0$: $${-y1} = ${m === 1 ? "" : m === -1 ? "-" : tex(m)}(x ${signed(-x1, false)})$ → $x ${signed(-x1, false)} = ${tex(-y1 / m)}$ → $x = \\mathbf{${root}}$` };
      }
    } });

  add({ id: "u2.wl.interpret", skill: "u2.writeline", level: L.C, type: "mcq", calc: false,
    make(r) {
      const c = r.int(0, LIN_CTX.length - 1), C = LIN_CTX[c];
      const m = r.int(...C.rate), b = r.intNot(C.base[0], C.base[1], [m]), askSlope = r.chance(0.5);
      const opts = [
        { text: `The cost for each ${C.per}`, slope: true },
        { text: `The ${C.fee.replace(/^an? /, "")}, paid once`, slope: false },
        { text: `The total cost for 1 ${C.per}`, why: `That is $${b} + ${m} = ${b + m}$.` },
        { text: `The number of ${C.unit}`, why: `The number of ${C.unit} is $x$.` },
      ];
      const right = askSlope ? opts[0] : opts[1], other = askSlope ? opts[1] : opts[0];
      const mm = mcq(right.text, [
        { text: other.text, why: askSlope ? `${b} is added once, no matter how many ${C.unit}.` : `${m} is multiplied by the number of ${C.unit}.` },
        { text: opts[2].text, why: opts[2].why }, { text: opts[3].text, why: opts[3].why },
      ], r);
      return { key: [c, m, b, askSlope], ...mm,
        prompt: `${C.who} uses $C(x) = ${m}x + ${b}$ for the total cost, in dollars, of $x$ ${C.unit}. What does ${askSlope ? m : b} represent?`,
        hint: "Which number is multiplied by $x$, and which is added once?",
        solution: askSlope ? `${m} is multiplied by $x$, so it is added for every ${C.per}: **the cost for each ${C.per}**.` : `${b} is added once, even when $x = 0$: **the ${C.fee.replace(/^an? /, "")}**.` };
    } });

  // ───────────────────────── Writing exponential equations ─────────────────────────
  add({ id: "u2.we.parts", skill: "u2.writeexp", level: L.B, type: "mcq", calc: false,
    make(r) {
      const a = r.int(2, 50) * r.pick([1, 10]), g = r.pick([1.02, 1.05, 1.1, 1.25, 1.5, 2, 3, 0.5, 0.8, 0.9, 0.75, 0.95]);
      const askStart = r.chance(0.5);
      const right = askStart ? String(a) : dec(g);
      const mm = mcq(right, [
        { text: askStart ? dec(g) : String(a), why: askStart ? "That is the growth or decay factor." : "That is the starting value." },
        { text: dec(+(a * g).toFixed(4)), why: "That is $f(1)$, the value after one step." },
        { text: dec(+(g - 1).toFixed(4)), why: "That is the percent change as a decimal, not the factor." },
      ], r, [{ text: "0", why: "The input when you start is 0, not the value." }, { text: String(a + 1), why: "Read the number in front of the base." }]);
      return { key: [a, g, askStart], ...mm,
        prompt: `$f(x) = ${a}\\left(${dec(g)}\\right)^{x}$. What is the ${askStart ? "starting value (the value when $x = 0$)" : "growth or decay factor"}?`,
        hint: "In $f(x) = a \\cdot b^x$, $a$ is the starting value and $b$ is the factor.",
        solution: askStart ? `$f(0) = ${a}(${dec(g)})^0 = ${a} \\cdot 1 = \\mathbf{${a}}$` : `The base, **${dec(g)}**, is the factor $f$ is multiplied by each step.` };
    } });

  add({ id: "u2.we.evaluate", skill: "u2.writeexp", level: L.B, type: "numeric", calc: false,
    make(r) {
      const g = r.pick([2, 3, 1 / 2]), x = r.int(0, g === 3 ? 3 : 4), a = g === 1 / 2 ? r.int(1, 5) * 16 : r.int(1, 9);
      return { key: [a, g, x],
        prompt: `$f(x) = ${expo(a, g)}$. What is $f(${x})$?`,
        answer: a * g ** x,
        hint: "Do the exponent first, then multiply.",
        solution: `$f(${x}) = ${a} \\cdot ${g === 0.5 ? "\\left(\\frac{1}{2}\\right)" : g}^{${x}} = ${a} \\cdot ${tex(g ** x)} = \\mathbf{${fmt(a * g ** x)}}$` };
    } });

  add({ id: "u2.we.table-eq", skill: "u2.writeexp", level: L.I, type: "mcq", calc: false,
    make(r) {
      const g = r.pick([2, 3, 4, 1 / 2]), a = g === 1 / 2 ? r.int(1, 6) * 16 : r.int(2, 9);
      const ys = [0, 1, 2, 3].map((x) => a * g ** x);
      const mm = mcq(`$y = ${expo(a, g)}$`, [
        { text: `$y = ${expo(g, a)}$`, why: "This swaps the starting value and the factor." },
        { text: `$y = ${lin(ys[1] - ys[0], a)}$`, why: "This is linear: it adds the same amount each time. The table multiplies by the same factor." },
        { text: `$y = ${expo(a, g, "x - 1")}$`, why: `Check $x = 0$: this gives $${tex(a / g)}$, not ${a}.` },
      ], r, [{ text: `$y = ${expo(ys[1], g)}$`, why: `$y = ${fmt(ys[1])}$ when $x = 1$, not when $x = 0$.` }]);
      return { key: [a, g], ...mm,
        prompt: "Which equation describes the exponential function in the table?",
        table: { headers: ["$x$", "0", "1", "2", "3"], rows: [["$y$", ...ys.map(fmt)]] },
        hint: "The starting value is $y$ when $x = 0$. The factor is any $y$ divided by the one before it.",
        solution: `Start: ${a}. Factor: $${fmt(ys[1])} \\div ${a} = ${fmt(g)}$.<br>**$y = ${expo(a, g)}$**` };
    } });

  add({ id: "u2.we.percent", skill: "u2.writeexp", level: L.I, type: "mcq", calc: false,
    make(r) {
      const grow = r.chance(0.5), p = grow ? r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15]) : r.pick([5, 8, 10, 12, 15, 20, 25]), A = r.int(5, 60) * 100;
      const fac = grow ? 1 + p / 100 : 1 - p / 100, other = grow ? 1 - p / 100 : 1 + p / 100;
      const thing = grow ? r.pick(["A town's population is", "An investment is worth", "A video's view count is"]) : r.pick(["A car is worth", "A lake's fish population is", "A laptop is worth"]);
      const v = (b) => `$f(t) = ${A}\\left(${dec(b)}\\right)^{t}$`;
      const mm = mcq(v(fac), [
        { text: v(p / 100), why: `Multiplying by ${dec(p / 100)} keeps only ${p}% each year.` },
        { text: v(other), why: grow ? "This shrinks by the percent. The amount grows, so the factor is above 1." : "This grows by the percent. The amount shrinks, so the factor is below 1." },
        { text: `$f(t) = ${A} ${grow ? "+" : "-"} ${dec(p / 100)}t$`, why: "Changing by a percent each year multiplies; it does not add a fixed amount." },
      ], r);
      return { key: [grow, p, A, thing], ...mm,
        prompt: `${thing} ${commas(String(A))} now. It ${grow ? "grows" : "goes down"} by ${p}% each year. Which function gives the amount after $t$ years?`,
        hint: grow ? "Growing by p% means keeping 100% and adding p%." : "Losing p% means keeping (100 − p)%.",
        solution: `The factor is $1 ${grow ? "+" : "-"} ${dec(p / 100)} = ${dec(fac)}$, so **$f(t) = ${A}(${dec(fac)})^t$**.` };
    } });

  add({ id: "u2.we.two-points", skill: "u2.writeexp", level: L.H, type: "mcq", calc: false,
    make(r) {
      const a = r.int(1, 8), g = r.pick([2, 3]);
      const y1 = a * g, y3 = a * g ** 3;
      const eq = (A, B) => `$f(x) = ${expo(A, B)}$`;
      const mm = mcq(eq(a, g), [
        { text: eq(a, g * g), why: `From $x = 1$ to $x = 3$ is 2 steps, so $${y3} \\div ${y1} = ${g * g}$ is $b^2$. Take the square root.` },
        { text: eq(y1, g), why: `$f(1) = ${y1}$, but the number in front is $f(0)$. Divide by the factor once more.` },
        { text: `$f(x) = ${lin((y3 - y1) / 2, y1 - (y3 - y1) / 2)}$`, why: "This is the line through the two points, not an exponential function." },
      ], r, [{ text: eq(y1, g * g), why: "Check both points in this equation." }]);
      return { key: [a, g], ...mm,
        prompt: `An exponential function $f$ has $f(1) = ${y1}$ and $f(3) = ${y3}$, and its factor is positive. Which equation describes $f$?`,
        hint: "From $x = 1$ to $x = 3$ you multiply by the factor twice.",
        solution: `$b^2 = ${y3} \\div ${y1} = ${g * g}$, so $b = ${g}$. $f(0) = ${y1} \\div ${g} = ${a}$.<br>**$f(x) = ${expo(a, g)}$**` };
    } });

  add({ id: "u2.we.decay-value", skill: "u2.writeexp", level: L.H, type: "numeric", calc: true,
    make(r) {
      const V = r.int(12, 40) * 1000, p = r.pick([8, 10, 12, 15, 18, 20]), t = r.int(2, 6);
      const ans = Math.round(V * (1 - p / 100) ** t);
      return { key: [V, p, t],
        prompt: `A new car costs ${money(V)}. Its value goes down by ${p}% each year. To the nearest dollar, what is it worth after ${t} years?`,
        answer: ans, tol: 1,
        hint: `Losing ${p}% means keeping ${100 - p}%. Multiply by ${dec(1 - p / 100)} once for each year.`,
        solution: `$V(t) = ${V}(${dec(1 - p / 100)})^t$.<br>$V(${t}) = ${V}(${dec(1 - p / 100)})^{${t}} \\approx \\mathbf{${ans}}$ dollars` };
    } });

  add({ id: "u2.we.plot", skill: "u2.writeexp", level: L.I, type: "plot", calc: false,
    make(r) {
      const [a, g, n] = r.pick([[1, 2, 4], [2, 2, 4], [16, 1 / 2, 4], [8, 1 / 2, 4], [1, 3, 3], [2, 3, 3], [9, 1 / 3, 3], [12, 1 / 2, 3]]);
      const story = r.chance(0.5);
      const pts = Array.from({ length: n }, (_, x) => [x, a * g ** x]);
      const ymax = Math.max(...pts.map((p) => p[1]));
      const word = g === 2 ? "doubles" : g === 3 ? "triples" : g === 1 / 2 ? "is cut in half" : "is divided by 3";
      return { key: [a, g, story],
        prompt: story ? `A function starts at ${a} when $x = 0$ and ${word} each time $x$ goes up by 1. Plot its points for $x = 0$ to $x = ${n - 1}$.` : `Plot the points of $f(x) = ${expo(a, g)}$ for $x = 0$ to $x = ${n - 1}$.`,
        plot: { window: { xmin: 0, xmax: 6, ymin: 0, ymax: ymax + 2, xstep: 1, ystep: 1 } },
        answer: pts,
        hint: "Start at the value for $x = 0$, then multiply by the factor for each next point.",
        solution: `Points: ${pts.map(pt).join(", ")}` };
    } });

  add({ id: "u2.we.find-initial", skill: "u2.writeexp", level: L.C, type: "numeric", calc: false,
    make(r) {
      const g = r.pick([2, 3, 1 / 2]), a = g === 1 / 2 ? r.int(1, 4) * 32 : r.int(1, 9);
      const [p, q] = r.pick([[2, 5], [1, 4], [2, 4], [1, 3]]);
      const yp = a * g ** p, yq = a * g ** q;
      return { key: [a, g, p, q],
        prompt: `An exponential function $f$ has $f(${p}) = ${fmt(yp)}$ and $f(${q}) = ${fmt(yq)}$. What is $f(0)$?`,
        answer: a,
        hint: `From $x = ${p}$ to $x = ${q}$ you multiply by the factor ${q - p} times.`,
        solution: `$b^{${q - p}} = ${fmt(yq)} \\div ${fmt(yp)} = ${tex(g ** (q - p))}$, so $b = ${tex(g)}$.<br>$f(0) = ${fmt(yp)} \\div ${Number.isInteger(g) ? g : `\\left(${tex(g)}\\right)`}^{${p}} = \\mathbf{${a}}$` };
    } });

  add({ id: "u2.we.interpret", skill: "u2.writeexp", level: L.C, type: "mcq", calc: false,
    make(r) {
      const grow = r.chance(0.5), p = grow ? r.pick([3, 5, 8, 10, 20, 25, 40]) : r.pick([5, 10, 15, 20, 25, 30, 40]);
      const g = grow ? 1 + p / 100 : 1 - p / 100, A = r.int(2, 90) * 50;
      const right = `It ${grow ? "increases" : "decreases"} by ${p}% each year.`;
      const mm = mcq(right, [
        { text: `It ${grow ? "increases" : "decreases"} by ${dec(g * 100)}% each year.`, why: `${dec(g)} is the factor. The percent change is the difference from 1.` },
        { text: `It ${grow ? "decreases" : "increases"} by ${p}% each year.`, why: grow ? "A factor above 1 means growth." : "A factor below 1 means decay." },
        { text: `It ${grow ? "increases" : "decreases"} by ${dec(g)} each year.`, why: "Exponential change multiplies; it does not add or subtract a fixed amount." },
      ], r);
      return { key: [grow, p, A], ...mm,
        prompt: `The value of an item $t$ years from now is $V(t) = ${A}\\left(${dec(g)}\\right)^{t}$. Which statement is true?`,
        hint: "Compare the factor with 1.",
        solution: `The factor is ${dec(g)} $= 1 ${grow ? "+" : "-"} ${dec(p / 100)}$. **${right}**` };
    } });

  // ───────────────────────── Thinking questions ─────────────────────────
  const paren = M1.qlib.paren;
  // Find the mistake: equation of a line through two points.
  add({ id: "u2.th.find-error", skill: "u2.writeline", level: L.H, type: "mcq", calc: false,
    make(r) {
      const m = r.intNot(-5, 5, [0]), x1 = r.int(-4, 3), dx = r.int(1, 4), b = r.int(-9, 9);
      const x2 = x1 + dx, y1 = m * x1 + b, y2 = m * x2 + b, kind0 = r.int(0, 3);
      const kind = Math.abs(m) === 1 && kind0 === 0 ? 1 : kind0; // a flipped slope of ±1 would still be right
      const mm = kind === 0 ? dx / (y2 - y1) : m;
      const s1 = kind === 0 ? `slope $= \\frac{${x2} - ${paren(x1)}}{${y2} - ${paren(y1)}} = ${tex(mm)}$` : `slope $= \\frac{${y2} - ${paren(y1)}}{${x2} - ${paren(x1)}} = ${m}$`;
      const bb = kind === 1 ? y1 + mm * x1 : y1 - mm * x1;
      const s2 = kind === 1 ? `$${y1} = ${m}(${x1}) + b$, so $b = ${y1} + ${paren(m * x1)} = ${bb}$` : `$${y1} = ${tex(mm)}(${x1}) + b$, so $b = ${y1} - ${paren(mm * x1)} = ${tex(bb)}$`;
      const shown = kind === 2 ? r.pick([-bb, bb + 1, bb - 1].filter((v) => v !== bb)) : bb;
      const s3 = `$y = ${lin(mm, shown)}$`;
      const bad = kind === 3 ? -1 : kind;
      const whyWrong = ["Slope is change in $y$ over change in $x$.", "To get $b$ alone, subtract the $mx$ part from both sides.", "Step 3 does not use the value of $b$ found in Step 2."][Math.max(0, bad)];
      const f = M1.qlib.findStep([s1, s2, s3], bad, whyWrong);
      return { key: [m, x1, dx, b, kind, shown], choices: f.choices, answer: f.answer, why: f.why, think: true,
        prompt: `Priya wrote the equation of the line through $${pt([x1, y1])}$ and $${pt([x2, y2])}$:<br>${f.stepsText}<br>Where is Priya's first mistake?`,
        hint: "Check each step on its own.",
        solution: `Slope $= \\frac{${y2 - y1}}{${dx}} = ${m}$. $b = ${y1} - ${paren(m * x1)} = ${b}$. The line is $y = ${lin(m, b)}$.<br>` +
          (bad < 0 ? "**There is no mistake.**" : `The first mistake is in **Step ${bad + 1}**. ${whyWrong}`) };
    } });

  // Compare average rates of change of an exponential on two intervals, with a reason.
  add({ id: "u2.th.roc-reason", skill: "u2.roc", level: L.H, type: "mcq", calc: true,
    make(r) {
      const a = r.int(1, 5), g = r.pick([2, 3]), w = r.int(1, 3), s = r.int(0, 2);
      const f = (x) => a * g ** x;
      const r1 = (f(s + w) - f(s)) / w, r2 = (f(s + 2 * w) - f(s + w)) / w;
      const right = `From $x = ${s + w}$ to $x = ${s + 2 * w}$, because the function grows by a larger amount over each later interval of the same length.`;
      const m = mcq(right, [
        { text: `From $x = ${s}$ to $x = ${s + w}$, because the function starts growing sooner.`, why: `Compute both: $${tex(r1)}$ and $${tex(r2)}$.` },
        { text: `They are equal, because both intervals have length ${w}.`, why: "Equal-length intervals give equal rates only for linear functions." },
        { text: `They are equal, because the growth factor is always ${g}.`, why: "The factor is constant, but the amount added grows." },
      ], r);
      return { key: [a, g, w, s], ...m, think: true,
        prompt: `$f(x) = ${expo(a, g)}$. Over which interval is the average rate of change of $f$ greater? Pick the answer with the correct reason.`,
        hint: "Average rate of change is (change in $f$) ÷ (change in $x$).",
        solution: `From ${s} to ${s + w}: $\\frac{${f(s + w)} - ${f(s)}}{${w}} = ${tex(r1)}$. From ${s + w} to ${s + 2 * w}: $\\frac{${f(s + 2 * w)} - ${f(s + w)}}{${w}} = ${tex(r2)}$.<br>**${right}**` };
    } });

  // What changes if: a linear cost model's rate goes up.
  add({ id: "u2.th.what-if", skill: "u2.writeline", level: L.H, type: "numeric", calc: false,
    make(r) {
      const job = r.pick([["a plumber", "hour", "hours", "the call-out fee"], ["a tutor", "session", "sessions", "the sign-up fee"], ["a gym", "month", "months", "the joining fee"]]);
      const rate = r.int(3, 12) * 5, fee = r.int(2, 9) * 10, up = r.pick([5, 10, 15]), n = r.int(3, 12);
      return { key: [job[0], rate, fee, up, n], answer: up * n, think: true,
        prompt: `The cost of ${job[0]} for $x$ ${job[2]} is $C(x) = ${rate}x + ${fee}$ dollars. The price per ${job[1]} goes up by \\$${up}, and ${job[3]} stays the same. How many more dollars do ${n} ${job[2]} cost now?`,
        hint: `Only the ${rate} changes.`,
        solution: `New cost: $C(x) = ${rate + up}x + ${fee}$. Each ${job[1]} costs \\$${up} more, so ${n} ${job[2]} cost $${up} \\times ${n} = \\mathbf{${up * n}}$ dollars more. The fee does not matter.` };
    } });

  // Make it true: a whole number where exponential beats linear.
  add({ id: "u2.th.make-true", skill: "u2.linexp", level: L.C, type: "numeric", calc: true,
    make(r) {
      const g = r.pick([2, 3]), k = g === 2 ? r.pick([10, 20, 50, 100]) : r.pick([20, 50, 100, 200]), c = r.pick([0, 100, 500]);
      let x0 = 1; while (!(g ** x0 > k * x0 + c)) x0++;
      return { key: [g, k, c], answer: x0, accept: { lo: x0, int: true }, think: true,
        prompt: `$f(x) = ${lin(k, c)}$ and $g(x) = ${g}^{x}$. Give **one** positive whole number $x$ for which $g(x) > f(x)$.`,
        hint: "Try a few values in a table.",
        solution: `$g(${x0 - 1}) = ${g ** (x0 - 1)}$ and $f(${x0 - 1}) = ${k * (x0 - 1) + c}$, so $g$ is not ahead yet. $g(${x0}) = ${g ** x0} > f(${x0}) = ${k * x0 + c}$. From then on $g$ stays ahead, so any whole number **${x0} or more** works.` };
    } });

  const U2_ASN = [
    { s: "An exponential function with a growth factor greater than 1 eventually passes any increasing linear function.",
      right: "Always true: growth that multiplies eventually beats growth that adds.",
      wrong: ["Sometimes true: only if the exponential starts higher.", "Never true: a steep line stays ahead.", "Sometimes true: only if the line's slope is less than the factor."] },
    { s: "Over equal intervals, a linear function changes by equal amounts.",
      right: "Always true: the slope is the same everywhere, so equal steps in $x$ give equal changes in $y$.",
      wrong: ["Sometimes true: only when the slope is positive.", "Never true: the outputs keep changing.", "Sometimes true: only for whole-number inputs."] },
    { s: "The function $f(x) = a(b)^x$ with $a > 0$ and $0 < b < 1$ has a negative output for some $x$.",
      right: "Never true: a positive number times a positive power stays positive. The outputs get close to 0.",
      wrong: ["Always true: decay makes the outputs negative eventually.", "Sometimes true: only when $b < \\frac{1}{2}$.", "Sometimes true: only when $x$ is negative."] },
    { s: "$2^x > x^2$ for every whole number $x \\ge 1$.",
      right: "Sometimes true: it holds for $x = 1$ and $x \\ge 5$, but $2^3 = 8 < 9$.",
      wrong: ["Always true: exponential grows faster.", "Never true: squaring is bigger than doubling.", "Sometimes true: only for even $x$."] },
    { s: "If the average rate of change of a function is the same over $[0, 2]$ and $[2, 4]$, the function is linear.",
      right: "Sometimes true: a linear function works, but so does a function that wiggles between those points.",
      wrong: ["Always true: equal rates mean a line.", "Never true: exponential functions do this too.", "Always true: two equal rates prove the slope is constant."] },
    { s: "$a^m \\cdot a^n = a^{mn}$ for whole numbers $m, n$ and $a > 1$.",
      right: "Sometimes true: the rule is $a^{m+n}$, and $m + n = mn$ only for special pairs like $m = n = 2$.",
      wrong: ["Always true: that is the product rule.", "Never true: you always add exponents.", "Sometimes true: only when $a = 2$."] },
  ];
  add({ id: "u2.th.always", skill: "u2.linexp", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U2_ASN.length - 1), it = U2_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with a few examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Try a few examples, including unusual ones.",
        solution: `**${it.right}**` };
    } });

  M1.units.u2 = Object.assign(M1.units.u2 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
