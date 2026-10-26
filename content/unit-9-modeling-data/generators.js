/* Unit 9 Modeling Data: question generators.
   Each generator: { id, skill, level, type, calc, make(r) } where make returns
   { key, prompt, ... } and every answer is computed here, never typed by hand. */
(function (G) {
  const M1 = G.M1;
  const { mcq, findStep, niceStep } = M1.qlib;
  // Statistics reads in decimals, so this unit formats numbers as decimals (not fractions).
  const fmt = (x) => { const v = Math.round(x * 1e4) / 1e4; return Object.is(v, -0) ? "0" : String(v); };
  const signed = (x) => (x < 0 ? `- ${fmt(-x)}` : `+ ${fmt(x)}`);
  const lin = (m, b) => `${m === 1 ? "" : m === -1 ? "-" : fmt(m)}x${b ? ` ${signed(b)}` : ""}`;
  const pt = (p) => `(${fmt(p[0])}, ${fmt(p[1])})`;

  const L = { B: "basic", I: "intermediate", H: "hard", C: "challenge" };
  const gens = [];
  const add = (g) => gens.push(g);

  // ── Statistics helpers ──
  const rd = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const mean = (a) => sum(a) / a.length;
  const sorted = (a) => a.slice().sort((x, y) => x - y);
  const median = (a) => { const s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  // Quartiles as on the TI-84: medians of the lower and upper halves, leaving out the median when n is odd.
  const five = (a) => { const s = sorted(a), n = s.length, h = Math.floor(n / 2);
    return { min: s[0], q1: median(s.slice(0, h)), med: median(s), q3: median(s.slice(n - h)), max: s[n - 1] }; };
  const sdPop = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
  function reg(pts) {
    const mx = mean(pts.map((p) => p[0])), my = mean(pts.map((p) => p[1]));
    let sxx = 0, sxy = 0, syy = 0;
    for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; }
    const m = sxy / sxx;
    return { m, b: my - m * mx, r: syy ? sxy / Math.sqrt(sxx * syy) : 0 };
  }
  const list = (a) => a.map(fmt).join(", ");
  const hat = (m, b) => `\\hat{y} = ${lin(m, b)}`;

  // Points scattered around y = mx + b; x values are distinct integers from xs.
  function scatter(r, xs, m, b, noise, dp = 1) {
    return xs.map((x) => [x, rd(m * x + b + noise * (2 * r.next() - 1), dp)]);
  }
  // A grid window that holds every point with a margin, about 8 to 10 grid lines each way.
  function win(pts, extraY = []) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]).concat(extraY);
    const ax = (lo, hi) => {
      const step = niceStep((hi - lo || 1) / 7);
      let a = Math.floor(lo / step) * step - step, b = Math.ceil(hi / step) * step + step;
      if (lo >= 0 && a < 0) a = 0;
      return [a, b, step];
    };
    const [xmin, xmax, xstep] = ax(Math.min(...xs), Math.max(...xs));
    const [ymin, ymax, ystep] = ax(Math.min(...ys), Math.max(...ys));
    return { xmin, xmax, xstep, ymin, ymax, ystep };
  }
  // Box plot drawn with paths at height y (box from y - 0.4 to y + 0.4).
  function boxPaths(f, y) {
    return [
      { pts: [[f.min, y], [f.q1, y]] },
      { pts: [[f.q1, y - 0.4], [f.q3, y - 0.4], [f.q3, y + 0.4], [f.q1, y + 0.4], [f.q1, y - 0.4]] },
      { pts: [[f.med, y - 0.4], [f.med, y + 0.4]] },
      { pts: [[f.q3, y], [f.max, y]] },
      { pts: [[f.min, y - 0.2], [f.min, y + 0.2]] },
      { pts: [[f.max, y - 0.2], [f.max, y + 0.2]] },
    ];
  }
  // Five numbers on a 0..50 scale (multiples of 1) with clear gaps, for reading off a box plot.
  function fiveNums(r, lo = 0, hi = 50) {
    const min = r.int(lo + 1, lo + 10), q1 = min + r.int(3, 9), med = q1 + r.int(2, 8), q3 = med + r.int(2, 8), max = Math.min(hi - 1, q3 + r.int(3, 12));
    return { min, q1, med, q3, max };
  }
  // Stack values into dot-plot points [value, height].
  function dots(vals) {
    const seen = {}; return vals.map((v) => { seen[v] = (seen[v] || 0) + 1; return [v, seen[v]]; });
  }

  // ───────────────────────── Correlation and causation ─────────────────────────
  add({ id: "u9.co.sign", skill: "u9.correlation", level: L.B, type: "graph-mcq", calc: false,
    make(r) {
      const kind = r.pick(["positive", "negative", "none"]);
      const xs = r.shuffle(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, 9).sort((a, b) => a - b);
      const pts = kind === "none" ? xs.map((x) => [x, r.int(1, 10)]) : scatter(r, xs, kind === "positive" ? 0.8 : -0.8, kind === "positive" ? 1 : 11, 1.2, 0);
      const R = reg(pts).r;
      if ((kind === "none" && Math.abs(R) > 0.3) || (kind !== "none" && Math.abs(R) < 0.7)) return this.make(r);
      const right = kind === "none" ? "No association" : `A ${kind} association`;
      const m = mcq(right, [
        { text: "A positive association", why: "In a positive association, $y$ tends to increase as $x$ increases." },
        { text: "A negative association", why: "In a negative association, $y$ tends to decrease as $x$ increases." },
        { text: "No association", why: "The points show a clear trend." },
        { text: "A nonlinear association", why: "The points follow a straight-line trend or no trend, not a curve." },
      ].filter((d) => d.text !== right), r);
      return { key: [pts], ...m, graph: { points: pts, window: win(pts, [0]) },
        prompt: "Which best describes the association in the scatter plot?",
        hint: "Read from left to right. Do the points tend to go up, go down, or neither?",
        solution: kind === "none" ? "The points show no up or down trend. **No association**." : `As $x$ increases, $y$ tends to ${kind === "positive" ? "increase" : "decrease"}. **${right}**.` };
    } });

  add({ id: "u9.co.match-r", skill: "u9.correlation", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const T = [-0.9, -0.5, 0.5, 0.9], target = r.pick(T);
      const xs = Array.from({ length: 10 }, (_, i) => i + 1);
      let pts, R, k = 0;
      do {
        const noise = Math.abs(target) > 0.7 ? 2.4 : 8;
        pts = scatter(r, xs, Math.sign(target), 12 - (target < 0 ? -12 : 0) - 6, noise, 0);
        R = reg(pts).r; k++;
      } while (Math.abs(R - target) > 0.1 && k < 200);
      if (Math.abs(R - target) > 0.1) { const fx = xs.map((x) => [x, Math.sign(target) * x + 10]); pts = fx; R = Math.sign(target); }
      const close = T.slice().sort((a, b) => Math.abs(a - R) - Math.abs(b - R))[0];
      const ds = T.filter((t) => t !== close).map((t) => ({ text: `$r = ${fmt(t)}$`,
        why: Math.sign(t) !== Math.sign(close) ? "Check the direction: the sign of $r$ matches the trend." : Math.abs(t) > Math.abs(close) ? "The points are too scattered for such a strong $r$." : "The points are closer to a line than that." }));
      const m = mcq(`$r = ${fmt(close)}$`, ds, r);
      return { key: [pts], ...m, graph: { points: pts, window: win(pts, [0]) },
        prompt: "Which value is closest to the correlation coefficient $r$ for this scatter plot?",
        hint: "The sign gives the direction. The closer the points are to a line, the closer $r$ is to 1 or $-1$.",
        solution: `The trend is ${R > 0 ? "positive" : "negative"} and the points are ${Math.abs(close) > 0.7 ? "close to a line" : "loosely scattered"}. (Technology gives $r \\approx ${fmt(rd(R))}$.) **$r = ${fmt(close)}$**` };
    } });

  add({ id: "u9.co.strongest", skill: "u9.correlation", level: L.H, type: "mcq", calc: false,
    make(r) {
      const pool = [-0.98, -0.87, -0.62, -0.35, -0.12, 0.08, 0.29, 0.55, 0.71, 0.93];
      let vs = r.shuffle(pool).slice(0, 4);
      const strong = r.chance(0.6);
      const by = vs.slice().sort((a, b) => Math.abs(b) - Math.abs(a));
      const pick = strong ? by[0] : by[3];
      const m = mcq(`$r = ${fmt(pick)}$`, vs.filter((v) => v !== pick).map((v) => ({ text: `$r = ${fmt(v)}$`,
        why: strong ? (v > pick ? "A larger number is not a stronger correlation. Compare the distance from 0." : "Strength is how close $|r|$ is to 1.") : "Weakest means $|r|$ closest to 0." })), r);
      return { key: [vs, strong], ...m,
        prompt: `Which correlation coefficient shows the ${strong ? "strongest" : "weakest"} linear relationship?`,
        hint: "Ignore the sign. Compare how far each value is from 0.",
        solution: `The absolute values are ${vs.map((v) => fmt(Math.abs(v))).join(", ")}. The ${strong ? "largest" : "smallest"} is ${fmt(Math.abs(pick))}. **$r = ${fmt(pick)}$**` };
    } });

  const U9_CAUSE = [
    { x: "ice cream sales", y: "sunburns", lurk: "Hot, sunny weather raises both." },
    { x: "shoe size", y: "reading level", lurk: "Older children have bigger feet and read better; age drives both." },
    { x: "the number of firefighters at a fire", y: "the damage done", lurk: "Bigger fires bring more firefighters and do more damage." },
    { x: "hours of TV watched", y: "weight", lurk: "Other habits, like diet and exercise, could explain both." },
    { x: "the number of libraries in a city", y: "the number of crimes", lurk: "Larger cities have more of both." },
    { x: "coffee drunk per day", y: "hours worked per week", lurk: "Busy jobs could lead to both." },
  ];
  add({ id: "u9.co.causation", skill: "u9.correlation", level: L.I, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_CAUSE.length - 1), c = U9_CAUSE[i], dir = r.pick(["positive", "strong positive"]);
      const right = `The two are associated, but the data do not show that ${c.x} causes ${c.y}.`;
      const m = mcq(right, [
        { text: `An increase in ${c.x} causes an increase in ${c.y}.`, why: `Correlation does not show causation. ${c.lurk}` },
        { text: `Reducing ${c.x} would reduce ${c.y}.`, why: `That claims cause and effect. ${c.lurk}` },
        { text: `There is no relationship between ${c.x} and ${c.y}.`, why: "A correlation is a relationship: the variables tend to move together." },
      ], r);
      return { key: [i, dir], ...m,
        prompt: `Data from many towns show a ${dir} correlation between ${c.x} and ${c.y}. Which conclusion is best supported?`,
        hint: "Does a correlation alone prove that one variable causes the other?",
        solution: `Correlation is not causation. ${c.lurk} **${right}**` };
    } });

  const U9_CAUSAL = ["the distance a car travels and the amount of gas it uses", "the number of hours a heater runs and the electricity used",
    "the force on a spring and how far it stretches", "the number of items bought and the total cost"];
  const U9_NONCAUSAL = ["a city's number of parks and its number of car crashes", "students' arm span and their math scores",
    "the number of umbrellas sold and the number of traffic delays", "a person's height and their salary",
    "the number of pools in a town and the number of drownings"];
  add({ id: "u9.co.causal", skill: "u9.correlation", level: L.H, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_CAUSAL.length - 1), ws = r.shuffle(U9_NONCAUSAL).slice(0, 3);
      const cap = (s) => s[0].toUpperCase() + s.slice(1);
      const m = mcq(cap(U9_CAUSAL[i]), ws.map((w) => ({ text: cap(w), why: "These are linked through a third variable, such as size, age or weather." })), r);
      return { key: [i, ws], ...m,
        prompt: "Each pair of variables has a strong positive correlation. For which pair is it most reasonable to say one variable **causes** the other?",
        hint: "Look for a pair where changing one directly changes the other, with no third variable in between.",
        solution: `Changing the first directly changes the second. **${cap(U9_CAUSAL[i])}**` };
    } });

  add({ id: "u9.co.reg-r", skill: "u9.correlation", level: L.C, type: "numeric", calc: true,
    make(r) {
      const xs = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 6).sort((a, b) => a - b);
      const pts = scatter(r, xs, r.pick([-3, -2, 2, 3]), r.int(20, 40), r.int(2, 6), 0);
      const R = reg(pts).r;
      if (Math.abs(R) > 0.995) return this.make(r);
      return { key: [pts], answer: rd(R), tol: 0.011,
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$y$", ...pts.map((p) => fmt(p[1]))]] },
        prompt: "Use technology to find the correlation coefficient $r$ for the data. Round to the nearest hundredth.",
        hint: "Enter the lists and run linear regression. Read $r$ from the output.",
        solution: `Linear regression gives $r \\approx ${fmt(rd(R, 4))}$. **${fmt(rd(R))}**` };
    } });

  // ───────────────────────── Lines of best fit ─────────────────────────
  const U9_CTX = [
    { x: "hours studied", y: "test score", xu: "hour", yu: "points", m: [3, 4, 5, 6], b: [48, 52, 55, 60] },
    { x: "age of a car, in years", y: "value, in thousands of dollars", xu: "year", yu: "thousand dollars", m: [-2.5, -2, -1.5, -3], b: [28, 30, 32, 35] },
    { x: "daily high temperature, in degrees", y: "cups of hot cocoa sold", xu: "degree", yu: "cups", m: [-1.5, -2, -2.5, -3], b: [150, 160, 180, 200] },
    { x: "weeks since planting", y: "plant height, in cm", xu: "week", yu: "cm", m: [1.5, 2, 2.5, 3], b: [4, 5, 6, 8] },
    { x: "minutes of exercise", y: "calories burned", xu: "minute", yu: "calories", m: [6, 7, 8, 9], b: [10, 15, 20, 25] },
  ];
  add({ id: "u9.lf.slope-meaning", skill: "u9.linefit", level: L.I, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_CTX.length - 1), c = U9_CTX[i], m0 = r.pick(c.m), b0 = r.pick(c.b);
      const ch = m0 > 0 ? "increases" : "decreases", M = fmt(Math.abs(m0));
      const right = `For each additional ${c.xu}, the predicted ${c.y.split(",")[0]} ${ch} by ${M} ${c.yu}.`;
      const m = mcq(right, [
        { text: `When the ${c.x.split(",")[0]} is 0, the predicted ${c.y.split(",")[0]} is ${fmt(m0)} ${c.yu}.`, why: "That describes the $y$-intercept, and it uses the wrong number." },
        { text: `For each additional ${c.xu}, the predicted ${c.y.split(",")[0]} ${ch} by ${fmt(b0)} ${c.yu}.`, why: `${fmt(b0)} is the $y$-intercept, not the rate of change.` },
        { text: `For each increase of 1 in the ${c.y.split(",")[0]}, the ${c.x.split(",")[0]} ${ch} by ${M}.`, why: "The slope is the change in $y$ for each 1-unit change in $x$, not the other way round." },
      ], r);
      return { key: [i, m0, b0], ...m,
        prompt: `A line of best fit relating ${c.x} ($x$) and ${c.y} ($y$) is $${hat(m0, b0)}$. What does the slope mean?`,
        hint: "Slope is the change in $y$ for each increase of 1 in $x$.",
        solution: `The slope is ${fmt(m0)}. **${right}**` };
    } });

  add({ id: "u9.lf.intercept-meaning", skill: "u9.linefit", level: L.I, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_CTX.length - 1), c = U9_CTX[i], m0 = r.pick(c.m), b0 = r.pick(c.b);
      const X = c.x.split(",")[0], Y = c.y.split(",")[0];
      const right = `When the ${X} is 0, the predicted ${Y} is ${fmt(b0)} ${c.yu}.`;
      const m = mcq(right, [
        { text: `For each additional ${c.xu}, the predicted ${Y} changes by ${fmt(b0)} ${c.yu}.`, why: "That is how you describe a slope, and the slope is the other number." },
        { text: `When the ${Y} is 0, the ${X} is ${fmt(b0)}.`, why: "The $y$-intercept is the value of $y$ when $x$ is 0." },
        { text: `The greatest possible ${Y} is ${fmt(b0)} ${c.yu}.`, why: "The intercept is a starting value, not a maximum." },
      ], r);
      return { key: [i, m0, b0], ...m,
        prompt: `A line of best fit relating ${c.x} ($x$) and ${c.y} ($y$) is $${hat(m0, b0)}$. What does the $y$-intercept mean?`,
        hint: "The $y$-intercept is the predicted $y$ when $x = 0$.",
        solution: `At $x = 0$, $\\hat{y} = ${fmt(b0)}$. **${right}**` };
    } });

  add({ id: "u9.lf.predict", skill: "u9.linefit", level: L.B, type: "numeric", calc: true,
    make(r) {
      const i = r.int(0, U9_CTX.length - 1), c = U9_CTX[i], m0 = r.pick(c.m), b0 = r.pick(c.b);
      const x = m0 < 0 ? r.int(2, Math.floor(b0 / -m0) - 1) : r.int(2, 12), y = rd(m0 * x + b0, 4);
      return { key: [i, m0, b0, x], answer: y,
        prompt: `The line of best fit relating ${c.x} ($x$) and ${c.y} ($y$) is $${hat(m0, b0)}$. What is the predicted ${c.y.split(",")[0]} when $x = ${x}$?`,
        hint: `Substitute $x = ${x}$.`,
        solution: `$\\hat{y} = ${paren(m0)}(${x}) ${signed(b0)} = \\mathbf{${fmt(y)}}$` };
    } });

  add({ id: "u9.lf.reverse", skill: "u9.linefit", level: L.H, type: "numeric", calc: true,
    make(r) {
      const i = r.int(0, U9_CTX.length - 1), c = U9_CTX[i], m0 = r.pick(c.m), b0 = r.pick(c.b);
      const x = m0 < 0 ? r.int(2, Math.floor(b0 / -m0) - 1) : r.int(3, 14), y = rd(m0 * x + b0, 4);
      return { key: [i, m0, b0, x], answer: x,
        prompt: `The line of best fit relating ${c.x} ($x$) and ${c.y} ($y$) is $${hat(m0, b0)}$. For what value of $x$ does the model predict ${fmt(y)} ${c.yu}?`,
        hint: `Set $${fmt(y)} = ${lin(m0, b0)}$ and solve for $x$.`,
        solution: `$${fmt(y)} ${signed(-b0)} = ${fmt(m0)}x$, so $x = ${fmt(rd(y - b0, 4))} \\div ${paren(m0)} = \\mathbf{${x}}$` };
    } });
  function paren(x) { return x < 0 ? `(${fmt(x)})` : fmt(x); }

  add({ id: "u9.lf.best-line", skill: "u9.linefit", level: L.H, type: "graph-mcq", calc: false,
    make(r) {
      const m0 = r.pick([-2, -1, -0.5, 0.5, 1, 2]), b0 = m0 < 0 ? r.int(14, 18) : r.int(1, 4);
      const xs = [1, 2, 3, 4, 5, 6, 7, 8];
      const pts = scatter(r, xs, m0, b0, 1, 1);
      const m = mcq(`$y = ${lin(m0, b0)}$`, [
        { text: `$y = ${lin(-m0, b0)}$`, why: "That line has the opposite direction to the trend." },
        { text: `$y = ${lin(m0, b0 + (m0 < 0 ? -6 : 6))}$`, why: `That line has the right slope but sits ${m0 < 0 ? "below" : "above"} the points.` },
        { text: `$y = ${lin(m0 * 3, b0)}$`, why: "That line is too steep. Check the rise over a few units." },
      ], r, [{ text: `$y = ${lin(m0 / 4, b0)}$`, why: "That line is too flat." }]);
      return { key: [pts], ...m, graph: { points: pts, window: win(pts, [0]) },
        prompt: "Which equation is the best model for the data in the scatter plot?",
        hint: "Estimate where the trend crosses the $y$-axis and how much $y$ changes when $x$ goes up by 1.",
        solution: `The points start near $y = ${b0}$ and change by about ${fmt(m0)} per unit. **$y = ${lin(m0, b0)}$**` };
    } });

  add({ id: "u9.lf.reg-eq", skill: "u9.linefit", level: L.C, type: "numeric", calc: true,
    make(r) {
      const xs = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 6).sort((a, b) => a - b);
      const pts = scatter(r, xs, r.pick([-4, -2.5, 1.5, 3, 5]), r.int(10, 30), 2.5, 0);
      const R = reg(pts), which = r.pick(["slope", "y-intercept"]), v = which === "slope" ? R.m : R.b;
      return { key: [pts, which], answer: rd(v), tol: 0.011,
        table: { headers: ["$x$", ...xs.map(String)], rows: [["$y$", ...pts.map((p) => fmt(p[1]))]] },
        prompt: `Use technology to find the line of best fit (linear regression) for the data. What is its ${which}? Round to the nearest hundredth.`,
        hint: "Run linear regression ($y = ax + b$). $a$ is the slope and $b$ is the $y$-intercept.",
        solution: `Linear regression gives $\\hat{y} \\approx ${fmt(rd(R.m, 3))}x ${signed(rd(R.b, 3))}$. The ${which} is **${fmt(rd(v))}**.` };
    } });

  add({ id: "u9.lf.extrapolate", skill: "u9.linefit", level: L.H, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_CTX.length - 1), c = U9_CTX[i], m0 = r.pick(c.m), b0 = r.pick(c.b);
      const lo = r.int(1, 3), hi = lo + r.int(5, 8), inside = r.chance(0.4);
      const x = inside ? r.int(lo + 1, hi - 1) : hi * r.int(4, 8), y = rd(m0 * x + b0, 2);
      const X = c.x.split(",")[0];
      const right = inside ? `Yes. $x = ${x}$ is inside the data, ${lo} to ${hi}, where the trend was measured.`
        : `No. $x = ${x}$ is far outside the data, ${lo} to ${hi}, so the trend may not continue.`;
      const m = mcq(right, [
        inside ? { text: `No. $x = ${x}$ is outside the data, so the trend may not continue.`, why: `${x} is between ${lo} and ${hi}.` }
          : { text: `Yes. $x = ${x}$ is inside the data, so the trend holds.`, why: `${x} is not between ${lo} and ${hi}.` },
        { text: "Yes. A line of best fit can predict any value of $x$.", why: "A model is only trustworthy near the data it was built from." },
        { text: `No. A model can only give values that appear in the data table.`, why: "Predicting between data values (interpolation) is the main use of a model." },
      ], r, [{ text: "No. The correlation would have to be exactly 1.", why: "Models with $r \\ne 1$ still make useful predictions near the data." }]);
      return { key: [i, m0, b0, lo, hi, x], ...m, think: true,
        prompt: `A model $${hat(m0, b0)}$ was built from data where the ${X} ($x$) ran from ${lo} to ${hi}. The model predicts $\\hat{y} = ${fmt(y)}$ at $x = ${x}$. Is that prediction reasonable? Choose the best reason.`,
        hint: "Compare the value of $x$ with the range of the data used to build the model.",
        solution: `**${right}**` };
    } });

  // ───────────────────────── Residuals ─────────────────────────
  add({ id: "u9.re.compute", skill: "u9.residuals", level: L.B, type: "numeric", calc: true,
    make(r) {
      const m0 = r.pick([1.5, 2, 2.5, 3, -1.5, -2]), b0 = r.int(10, 30), x = r.int(1, 8);
      const p = rd(m0 * x + b0, 4), y = rd(p + r.pick([-1, 1]) * r.int(1, 12) / 2, 4), res = rd(y - p, 4);
      return { key: [m0, b0, x, y], answer: res,
        prompt: `The line of best fit is $${hat(m0, b0)}$. The data point $${pt([x, y])}$ is in the data. What is its residual?`,
        hint: "Residual = actual $y$ − predicted $y$.",
        solution: `Predicted: $${paren(m0)}(${x}) ${signed(b0)} = ${fmt(p)}$. Residual: $${fmt(y)} - ${fmt(p)} = \\mathbf{${fmt(res)}}$` };
    } });

  add({ id: "u9.re.actual", skill: "u9.residuals", level: L.H, type: "numeric", calc: true,
    make(r) {
      const m0 = r.pick([1.5, 2, 2.5, 3, -1.5, -2]), b0 = r.int(10, 30), x = r.int(1, 8);
      const p = rd(m0 * x + b0, 4), res = rd(r.pick([-1, 1]) * r.int(1, 12) / 2, 4), y = rd(p + res, 4);
      return { key: [m0, b0, x, res], answer: y,
        prompt: `A line of best fit is $${hat(m0, b0)}$. The residual for the data point with $x = ${x}$ is $${fmt(res)}$. What is the actual $y$-value of that point?`,
        hint: "Actual = predicted + residual.",
        solution: `Predicted: $${fmt(p)}$. Actual $= ${fmt(p)} + ${paren(res)} = \\mathbf{${fmt(y)}}$` };
    } });

  add({ id: "u9.re.sign", skill: "u9.residuals", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const m0 = r.pick([0.5, 1, -1]), b0 = m0 < 0 ? 10 : 2, xs = [1, 2, 3, 4, 5, 6, 7, 8];
      const pts = scatter(r, xs, m0, b0, 0.8, 1), j = r.int(1, 6), up = r.chance(0.5);
      const sp = [xs[j], rd(m0 * xs[j] + b0 + (up ? 1 : -1) * r.int(2, 3), 1)];
      const others = pts.filter((_, k) => k !== j);
      const right = up ? "Positive, because the point is above the line." : "Negative, because the point is below the line.";
      const m = mcq(right, [
        { text: up ? "Negative, because the point is above the line." : "Positive, because the point is below the line.", why: "Residual = actual − predicted. Above the line, actual is bigger." },
        { text: "Zero, because the point is close to the line.", why: "Only a point exactly on the line has residual 0." },
        { text: m0 < 0 ? "Negative, because the line has a negative slope." : "Positive, because the line has a positive slope.", why: "The slope does not decide the sign of a residual." },
      ], r, [{ text: up ? "Negative, because the point is below the line." : "Positive, because the point is above the line.", why: "Look again at where the square point is." }]);
      const W = win(pts.concat([sp]), [0]);
      return { key: [pts, j, up], ...m,
        graph: { points: others, points2: [sp], names: ["Data", "Square point"], window: W, paths: [{ pts: [[W.xmin, m0 * W.xmin + b0], [W.xmax, m0 * W.xmax + b0]] }] },
        prompt: "The scatter plot shows a line of best fit. What is the sign of the residual for the **square** point?",
        hint: "Residual = actual $y$ − predicted $y$. Is the point above or below the line?",
        solution: `The square point is ${up ? "above" : "below"} the line, so actual ${up ? ">" : "<"} predicted. **${right}**` };
    } });

  add({ id: "u9.re.pattern", skill: "u9.residuals", level: L.H, type: "graph-mcq", calc: false,
    make(r) {
      const curved = r.chance(0.5), xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], c = r.pick([5, 5.5, 6]), a = r.pick([0.2, 0.25, 0.3]) * r.sign();
      const raw = xs.map((x) => (x - c) ** 2), mid = mean(raw), big = Math.max(...raw.map((v) => Math.abs(v - mid)));
      const res = xs.map((x, k) => [x, rd(curved ? Math.sign(a) * 2.3 * (raw[k] - mid) / big + 0.3 * (2 * r.next() - 1) : 1.8 * (2 * r.next() - 1), 1)]);
      const right = curved ? "No. The residuals form a curved pattern, so a nonlinear model would fit better." : "Yes. The residuals are scattered randomly around 0 with no pattern.";
      const m = mcq(right, [
        { text: curved ? "Yes. The residuals are scattered randomly around 0 with no pattern." : "No. The residuals form a curved pattern, so a nonlinear model would fit better.", why: curved ? "Look again: the residuals rise and fall in a clear U shape." : "There is no clear U shape or trend in the residuals." },
        { text: "No. Some residuals are negative, so the line is wrong.", why: "Every line of best fit has positive and negative residuals." },
        { text: "Yes. The residuals add up to about 0.", why: "Residuals of a regression line always add to about 0. That says nothing about the pattern." },
      ], r);
      return { key: [curved, res], ...m, think: true,
        graph: { points: res, window: { xmin: 0, xmax: 11, xstep: 1, ymin: -3, ymax: 3, ystep: 1 } },
        prompt: "This is the residual plot for a linear model. Is a linear model appropriate?",
        hint: "A good linear fit leaves residuals with no pattern.",
        solution: `**${right}**` };
    } });

  add({ id: "u9.re.best-model", skill: "u9.residuals", level: L.C, type: "mcq", calc: false,
    make(r) {
      const n = 5, good = Array.from({ length: n }, () => rd(r.int(-8, 8) / 10, 1));
      const bad = Array.from({ length: n }, (_, i) => (i % 2 ? -1 : 1) * r.int(2, 4));
      bad[n - 1] = -rd(sum(bad.slice(0, n - 1)), 1);
      if (Math.abs(bad[n - 1]) < 1.5) return this.make(r);
      const goodA = r.chance(0.5), A = goodA ? good : bad, B = goodA ? bad : good;
      const G1 = goodA ? "A" : "B", B1 = goodA ? "B" : "A";
      const right = `Model ${G1}, because its residuals are closer to 0.`;
      const m = mcq(right, [
        { text: `Model ${B1}, because its residuals add up to 0.`, why: "Large positive and negative residuals can cancel. Look at how big each residual is." },
        { text: `Model ${B1}, because its residuals are larger.`, why: "Larger residuals mean the predictions are further from the data." },
        { text: "They fit equally well, because both have positive and negative residuals.", why: "Compare the sizes of the residuals." },
      ], r);
      return { key: [good, bad, goodA], ...m, think: true,
        table: { headers: ["$x$", "1", "2", "3", "4", "5"], rows: [["Model A residual", ...A.map(fmt)], ["Model B residual", ...B.map(fmt)]] },
        prompt: "Two linear models were fit to the same data. The table shows each model's residuals. Which model fits the data better?",
        hint: "A good model makes small errors. Look at the size of each residual, not their sum.",
        solution: `Sum of squared residuals: A $= ${fmt(rd(sum(A.map((v) => v * v)), 2))}$, B $= ${fmt(rd(sum(B.map((v) => v * v)), 2))}$. **${right}**` };
    } });

  add({ id: "u9.th.find-error", skill: "u9.residuals", level: L.H, type: "mcq", calc: false,
    make(r) {
      const m0 = r.pick([2, 3, 4, -2]), b0 = r.int(5, 15), x = r.int(2, 6), p = m0 * x + b0, d = r.pick([-3, -2, 2, 3]), y = p + d;
      const bad = r.pick([-1, 0, 1, 1]);
      const p1 = bad === 0 ? m0 * x - b0 : p;
      const steps = [
        `Predicted: $\\hat{y} = ${m0}(${x}) ${signed(b0)} = ${p1}$`,
        bad === 1 ? `Residual = predicted − actual $= ${p1} - ${paren(y)} = ${p1 - y}$` : `Residual = actual − predicted $= ${y} - ${paren(p1)} = ${y - p1}$`,
        bad === 1 ? `The residual is $${p1 - y}$, so the point is ${p1 - y > 0 ? "above" : "below"} the line.` : `The residual is $${y - p1}$, so the point is ${y - p1 > 0 ? "above" : "below"} the line.`,
      ];
      const fs = findStep(steps, bad, bad === 0 ? `$${m0}(${x}) ${signed(b0)} = ${p}$, not ${p1}.` : "A residual is actual − predicted, not predicted − actual.");
      return { key: [m0, b0, x, d, bad], choices: fs.choices, answer: fs.answer, why: fs.why, think: true,
        prompt: `The model is $${hat(m0, b0)}$. Ravi found the residual for the point $${pt([x, y])}$:<br>${fs.stepsText}<br>Where is Ravi's first mistake?`,
        hint: "Check each step: substitute carefully, and remember residual = actual − predicted.",
        solution: `$\\hat{y} = ${p}$; residual $= ${y} - ${paren(p)} = ${d}$, so the point is ${d > 0 ? "above" : "below"} the line.<br>**${fs.choices[fs.answer]}**` };
    } });

  // ───────────────────────── One-variable data displays ─────────────────────────
  add({ id: "u9.ov.dot-read", skill: "u9.onevar", level: L.B, type: "numeric", calc: false,
    make(r) {
      const n = r.int(12, 18), vals = Array.from({ length: n }, () => r.int(1, 9));
      const t = r.int(3, 7), kind = r.pick(["more", "mode"]);
      const counts = Array.from({ length: 10 }, (_, v) => vals.filter((x) => x === v).length);
      const top = Math.max(...counts);
      if (kind === "mode" && counts.filter((c) => c === top).length > 1) return this.make(r);
      const ans = kind === "more" ? vals.filter((v) => v > t).length : counts.indexOf(top);
      const pts = dots(vals);
      return { key: [vals, t, kind], answer: ans,
        graph: { points: pts, window: { xmin: 0, xmax: 10, xstep: 1, ymin: 0, ymax: top + 1, ystep: 1 }, noY: true, xlabel: "goals scored" },
        prompt: kind === "more" ? `The dot plot shows the number of goals a team scored in each game. In how many games did the team score more than ${t} goals?`
          : "The dot plot shows the number of goals a team scored in each game. What is the mode?",
        hint: kind === "more" ? `Count the dots to the right of ${t}. Do not count ${t} itself.` : "The mode is the value with the tallest stack of dots.",
        solution: kind === "more" ? `Dots above ${t + 1} through 9: **${ans}** games.` : `The tallest stack is at ${ans}. **${ans}**` };
    } });

  add({ id: "u9.ov.median", skill: "u9.onevar", level: L.B, type: "numeric", calc: false,
    make(r) {
      const n = r.int(7, 10), vals = Array.from({ length: n }, () => r.int(2, 40));
      const md = median(vals);
      return { key: [vals], answer: md,
        prompt: `Find the median of the data: ${list(vals)}`,
        hint: "Put the values in order first. With an even count, average the middle two.",
        solution: `In order: ${list(sorted(vals))}. The median is **${fmt(md)}**.` };
    } });

  add({ id: "u9.ov.box-read", skill: "u9.onevar", level: L.I, type: "numeric", calc: false,
    make(r) {
      const f = fiveNums(r), ask = r.pick(["IQR", "range", "median", "Q3"]);
      const ans = ask === "IQR" ? f.q3 - f.q1 : ask === "range" ? f.max - f.min : ask === "median" ? f.med : f.q3;
      const what = { IQR: "the interquartile range (IQR)", range: "the range", median: "the median", Q3: "the third quartile ($Q_3$)" }[ask];
      return { key: [f, ask], answer: ans,
        graph: { window: { xmin: 0, xmax: 50, xstep: 5, ymin: 0, ymax: 2, ystep: 1 }, noY: true, paths: boxPaths(f, 1), xlabel: "minutes" },
        prompt: `The box plot shows how many minutes students spent on homework. What is ${what}? (Each part of the plot lands on a whole number.)`,
        hint: "The box runs from $Q_1$ to $Q_3$ with the median inside it. The whiskers reach the minimum and maximum.",
        solution: `Min ${f.min}, $Q_1$ ${f.q1}, median ${f.med}, $Q_3$ ${f.q3}, max ${f.max}. ${ask === "IQR" ? `IQR $= ${f.q3} - ${f.q1}$ = ` : ask === "range" ? `Range $= ${f.max} - ${f.min}$ = ` : ""}**${ans}**` };
    } });

  add({ id: "u9.ov.hist-shape", skill: "u9.onevar", level: L.I, type: "graph-mcq", calc: false,
    make(r) {
      const shape = r.pick(["right", "left", "symmetric", "uniform"]);
      const base = { right: [9, 7, 5, 3, 2, 1], left: [1, 2, 3, 5, 7, 9], symmetric: [1, 4, 8, 8, 4, 1], uniform: [5, 5, 5, 5, 5, 5] }[shape];
      const hs = base.map((h) => Math.max(1, h + (shape === "uniform" ? r.int(-1, 0) : r.int(-1, 1))));
      if (shape === "right" && !(hs[0] > hs[2] && hs[2] > hs[5])) return this.make(r);
      if (shape === "left" && !(hs[5] > hs[3] && hs[3] > hs[0])) return this.make(r);
      const bars = hs.map((h, i) => [[i * 10, 0], [i * 10 + 10, 0], [i * 10 + 10, h], [i * 10, h]]);
      const name = { right: "Skewed right", left: "Skewed left", symmetric: "Symmetric", uniform: "Uniform (flat)" };
      const m = mcq(name[shape], Object.keys(name).filter((k) => k !== shape).map((k) => ({ text: name[k],
        why: k === "right" ? "Skewed right means the long tail is on the right (high values)." : k === "left" ? "Skewed left means the long tail is on the left (low values)." : k === "symmetric" ? "A symmetric shape looks the same on both sides of the center." : "A uniform shape has bars of about the same height." })), r);
      return { key: [shape, hs], ...m,
        graph: { window: { xmin: 0, xmax: 60, xstep: 10, ymin: 0, ymax: 11, ystep: 1 }, shade: bars, paths: bars.map((b) => ({ pts: b.concat([b[0]]) })), xlabel: "age" },
        prompt: "Which best describes the shape of the distribution in the histogram?",
        hint: "Find where the data pile up and which side has the long tail.",
        solution: shape === "right" ? "Most data are low, with a long tail to the right. **Skewed right**" : shape === "left" ? "Most data are high, with a long tail to the left. **Skewed left**"
          : shape === "symmetric" ? "The two sides mirror each other around the center. **Symmetric**" : "All bars are about the same height. **Uniform (flat)**" };
    } });

  add({ id: "u9.ov.five-num", skill: "u9.onevar", level: L.H, type: "numeric", calc: false,
    make(r) {
      const n = r.int(8, 11), vals = Array.from({ length: n }, () => r.int(10, 60));
      const f = five(vals), ask = r.pick(["Q1", "Q3", "IQR"]);
      const ans = ask === "Q1" ? f.q1 : ask === "Q3" ? f.q3 : f.q3 - f.q1;
      const s = sorted(vals), h = Math.floor(n / 2);
      return { key: [vals, ask], answer: ans,
        prompt: `Find ${ask === "IQR" ? "the interquartile range (IQR)" : ask === "Q1" ? "the first quartile $Q_1$" : "the third quartile $Q_3$"} of the data: ${list(vals)}`,
        hint: "Order the data and find the median. $Q_1$ is the median of the lower half and $Q_3$ is the median of the upper half.",
        solution: `In order: ${list(s)}. ${n % 2 ? "Leave out the middle value. " : ""}Lower half: ${list(s.slice(0, h))}, so $Q_1 = ${fmt(f.q1)}$. Upper half: ${list(s.slice(n - h))}, so $Q_3 = ${fmt(f.q3)}$.${ask === "IQR" ? ` IQR $= ${fmt(f.q3)} - ${fmt(f.q1)}$.` : ""} **${fmt(ans)}**` };
    } });

  add({ id: "u9.ov.box-compare", skill: "u9.onevar", level: L.C, type: "graph-mcq", calc: false,
    make(r) {
      const A = fiveNums(r), B = fiveNums(r);
      const iA = A.q3 - A.q1, iB = B.q3 - B.q1, rA = A.max - A.min, rB = B.max - B.min;
      if (A.med === B.med || iA === iB || rA === rB) return this.make(r);
      const S = [
        { t: "Class A has the greater median.", ok: A.med > B.med }, { t: "Class B has the greater median.", ok: B.med > A.med },
        { t: "Class A has the greater interquartile range.", ok: iA > iB }, { t: "Class B has the greater interquartile range.", ok: iB > iA },
        { t: "Class A has the greater range.", ok: rA > rB }, { t: "Class B has the greater range.", ok: rB > rA },
      ];
      const truths = S.filter((s) => s.ok), lies = r.shuffle(S.filter((s) => !s.ok));
      const right = r.pick(truths);
      const m = mcq(right.t, lies.slice(0, 2).map((s) => ({ text: s.t, why: "Read both plots again and compare." })).concat([
        { text: "Class A has more students than class B.", why: "A box plot shows quartiles, not how many values there are." }]), r);
      return { key: [A, B, right.t], ...m,
        graph: { window: { xmin: 0, xmax: 50, xstep: 5, ymin: 0, ymax: 4, ystep: 1 }, noY: true, paths: boxPaths(A, 3).concat(boxPaths(B, 1)),
          labels: [{ at: [0, 3.4], text: "A" }, { at: [0, 1.4], text: "B" }], xlabel: "quiz score" },
        prompt: "The box plots compare quiz scores in class A (top) and class B (bottom). Which statement is true?",
        hint: "Median is the line in the box. IQR is the width of the box. Range is whisker end to whisker end.",
        solution: `A: median ${A.med}, IQR ${iA}, range ${rA}. B: median ${B.med}, IQR ${iB}, range ${rB}. **${right.t}**` };
    } });

  // ───────────────────────── Center, spread and outliers ─────────────────────────
  add({ id: "u9.sp.mean", skill: "u9.spread", level: L.B, type: "numeric", calc: true,
    make(r) {
      const n = r.pick([4, 5, 6, 8]), vals = Array.from({ length: n }, () => r.int(5, 50));
      const mu = mean(vals);
      if (Math.abs(mu * 2 - Math.round(mu * 2)) > 1e-9) return this.make(r);
      return { key: [vals], answer: mu,
        prompt: `What is the mean of the data: ${list(vals)}?`,
        hint: "Add the values and divide by how many there are.",
        solution: `$${sum(vals)} \\div ${n} = \\mathbf{${fmt(mu)}}$` };
    } });

  add({ id: "u9.sp.missing", skill: "u9.spread", level: L.C, type: "numeric", calc: true,
    make(r) {
      const n = r.int(5, 7), vals = Array.from({ length: n }, () => r.int(60, 99)), mu = mean(vals);
      if (mu !== Math.round(mu)) return this.make(r);
      const last = vals[n - 1];
      return { key: [vals], answer: last,
        prompt: `A student's mean score on ${n} tests is ${mu}. The first ${n - 1} scores are ${list(vals.slice(0, n - 1))}. What was the score on the last test?`,
        hint: `The total of all ${n} scores is ${n} × the mean.`,
        solution: `Total $= ${n} \\times ${mu} = ${n * mu}$. The first ${n - 1} add to ${sum(vals) - last}. Last score $= ${n * mu} - ${sum(vals) - last} = \\mathbf{${last}}$` };
    } });

  add({ id: "u9.sp.outlier", skill: "u9.spread", level: L.H, type: "mcq", calc: true,
    make(r) {
      const base = Array.from({ length: 9 }, () => r.int(20, 40)), hi = r.chance(0.7);
      const f0 = five(base), iqr = f0.q3 - f0.q1;
      const out = hi ? Math.ceil(f0.q3 + 1.5 * iqr) + r.int(3, 15) : Math.floor(f0.q1 - 1.5 * iqr) - r.int(3, 10);
      if (out <= 0) return this.make(r);
      const vals = base.concat([out]), f = five(vals), I = f.q3 - f.q1, lo = f.q1 - 1.5 * I, up = f.q3 + 1.5 * I;
      const isOut = (v) => v < lo || v > up;
      if (!isOut(out) || base.some(isOut)) return this.make(r);
      const s = sorted(base), cands = [s[0], s[s.length - 1], s[4]].filter((v, k, a) => a.indexOf(v) === k && v !== out);
      const m = mcq(`${out}`, cands.map((v) => ({ text: `${v}`, why: `${v} is between the fences ${fmt(lo)} and ${fmt(up)}.` })), r,
        [{ text: "There is no outlier.", why: `${out} is beyond the fence ${fmt(hi ? up : lo)}.` }, { text: `${s[1]}`, why: `${s[1]} is inside the fences.` }]);
      return { key: [vals], ...m,
        prompt: `Using the $1.5 \\times \\text{IQR}$ rule, which value in this data set is an outlier?<br>${list(vals)}`,
        hint: "Find $Q_1$, $Q_3$ and the IQR. Outliers are below $Q_1 - 1.5\\,\\text{IQR}$ or above $Q_3 + 1.5\\,\\text{IQR}$.",
        solution: `$Q_1 = ${fmt(f.q1)}$, $Q_3 = ${fmt(f.q3)}$, IQR $= ${fmt(I)}$. Fences: ${fmt(lo)} and ${fmt(up)}. **${out}**` };
    } });

  add({ id: "u9.sp.effect-outlier", skill: "u9.spread", level: L.H, type: "mcq", calc: true,
    make(r) {
      const base = Array.from({ length: r.int(6, 8) }, () => r.int(10, 30)), hi = r.chance(0.6);
      const out = hi ? r.int(80, 120) : r.int(0, 2);
      if (!hi && Math.min(...base) < 12) return this.make(r);
      const all = base.concat([out]);
      const dMean = mean(base) - mean(all), dMed = median(base) - median(all);
      if (Math.abs(dMean) <= Math.abs(dMed) + 1) return this.make(r);
      const dir = hi ? "decreases" : "increases";
      const right = `The mean ${dir} a lot; the median changes very little.`;
      const m = mcq(right, [
        { text: `The median ${dir} a lot; the mean changes very little.`, why: "The mean uses every value, so one extreme value pulls it far. The median only looks at the middle." },
        { text: "Both stay exactly the same.", why: "Removing a value changes the mean." },
        { text: `The mean ${hi ? "increases" : "decreases"} a lot; the median changes very little.`, why: `Removing a very ${hi ? "large" : "small"} value makes the mean ${hi ? "smaller" : "larger"}.` },
      ], r);
      return { key: [all], ...m, think: true,
        prompt: `The data are ${list(all)}. What happens to the mean and median if ${out} is removed?`,
        hint: "Which measure uses every value, and which only uses the middle?",
        solution: `Mean: ${fmt(rd(mean(all), 2))} → ${fmt(rd(mean(base), 2))}. Median: ${fmt(median(all))} → ${fmt(median(base))}. **${right}**` };
    } });

  add({ id: "u9.sp.shift-scale", skill: "u9.spread", level: L.C, type: "numeric", calc: false,
    make(r) {
      const mu = r.int(20, 80), sd = r.int(3, 12), op = r.pick(["add", "mul", "both"]), k = r.int(2, 5), c = r.int(3, 15), ask = r.pick(["mean", "standard deviation"]);
      const nm = op === "add" ? mu + c : op === "mul" ? mu * k : mu * k + c, ns = op === "add" ? sd : sd * k;
      const how = op === "add" ? `${c} is added to every value` : op === "mul" ? `every value is multiplied by ${k}` : `every value is multiplied by ${k} and then ${c} is added`;
      const ans = ask === "mean" ? nm : ns;
      return { key: [mu, sd, op, k, c, ask], answer: ans, think: true,
        prompt: `A data set has mean ${mu} and standard deviation ${sd}. If ${how}, what is the new ${ask}?`,
        hint: "Adding a constant moves every value (and the mean) but not the spread. Multiplying scales both the mean and the spread.",
        solution: ask === "mean" ? `The mean goes through the same change: **${ans}**.` : op === "add" ? "Adding shifts the data without changing the spread: **" + ans + "**." : `Multiplying by ${k} multiplies the spread by ${k}${op === "both" ? "; adding does not change it" : ""}: $${sd} \\times ${k} = \\mathbf{${ans}}$.` };
    } });

  add({ id: "u9.sp.compare-sd", skill: "u9.spread", level: L.I, type: "mcq", calc: false,
    make(r) {
      const c = r.int(5, 15), d = r.int(3, 5);
      const tight = [c - d, c - 1, c, c, c, c + 1, c + d], wide = [c - d, c - d + 1, c - 1, c, c + 1, c + d - 1, c + d];
      const tightA = r.chance(0.5), A = tightA ? tight : wide, B = tightA ? wide : tight, big = tightA ? "B" : "A";
      const right = `Set ${big}, because more of its values are far from the mean.`;
      const m = mcq(right, [
        { text: "They are equal, because the sets have the same mean and range.", why: "Same mean and range does not mean same spread. Look at where the middle values sit." },
        { text: `Set ${tightA ? "A" : "B"}, because more of its values are close to the mean.`, why: "Values close to the mean make the standard deviation smaller." },
        { text: "It cannot be found without the number of values.", why: "Both sets are shown in full, so you can compare them." },
      ], r);
      return { key: [c, d, tightA], ...m, think: true,
        graph: { points: dots(A).map(([x, y]) => [x, y + 5]), points2: dots(B), window: { xmin: c - d - 1, xmax: c + d + 1, xstep: 1, ymin: 0, ymax: 9, ystep: 1 }, noY: true,
          names: ["Set A", "Set B"], labels: [{ at: [c - d - 1, 8.4], text: "A" }, { at: [c - d - 1, 3.4], text: "B" }] },
        prompt: `Set A: ${list(A)}<br>Set B: ${list(B)}<br>Both sets have mean ${c}. Which set has the greater standard deviation?`,
        hint: "Standard deviation measures the typical distance from the mean.",
        solution: `Set ${tightA ? "A" : "B"} piles up at the mean; set ${big} spreads out. (SD: A $\\approx ${fmt(rd(sdPop(A)))}$, B $\\approx ${fmt(rd(sdPop(B)))}$.) **${right}**` };
    } });

  const U9_CENTER = [
    { ctx: "the yearly incomes of people in a town, where a few people earn millions", skew: true },
    { ctx: "home prices in a neighborhood that includes two mansions", skew: true },
    { ctx: "the times to finish a race, where a few runners walked most of the way", skew: true },
    { ctx: "the heights of adult women in a large city, which form a symmetric mound with no outliers", skew: false },
    { ctx: "test scores that are symmetric around the center with no outliers", skew: false },
  ];
  add({ id: "u9.sp.center-choice", skill: "u9.spread", level: L.H, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_CENTER.length - 1), c = U9_CENTER[i];
      const right = c.skew ? "The median, because it is not pulled by the extreme values." : "The mean, because the data are symmetric with no outliers.";
      const m = mcq(right, [
        c.skew ? { text: "The mean, because it uses every value.", why: "Using every value is why extreme values pull the mean away from the typical value." }
          : { text: "The median, because it is not pulled by the extreme values.", why: "There are no extreme values here; the mean and median are about equal and the mean is preferred." },
        { text: "The range, because it shows all the data.", why: "The range is a measure of spread, not center." },
        { text: "The maximum, because it is the most important value.", why: "The maximum is not a measure of center." },
      ], r, [{ text: "The standard deviation, because it is the most exact.", why: "The standard deviation measures spread, not center." }]);
      return { key: [i], ...m, think: true,
        prompt: `Which measure best describes the center of ${c.ctx}?`,
        hint: "Skewed data or outliers pull the mean. Symmetric data usually use the mean.",
        solution: `**${right}**` };
    } });

  add({ id: "u9.th.make-true", skill: "u9.spread", level: L.C, type: "numeric", calc: false,
    make(r) {
      const a = r.int(1, 5), b = a + r.int(2, 5), c = b + r.int(2, 5), d = c + r.int(2, 5), want = r.pick(["b", "c"]);
      const target = want === "b" ? b : c;
      return { key: [a, b, c, d, want], answer: target, accept: want === "b" ? { hi: b, int: true, lo: 0 } : { lo: c, int: true }, think: true,
        prompt: `The data are ${list(r.shuffle([a, b, c, d]))}. Give **one** whole number $x$ so that the median of the five values (with $x$ added) is ${target}.`,
        hint: "With five values, the median is the third value in order. Where can $x$ go so that the third value is " + target + "?",
        solution: want === "b" ? `In order: ${a}, ${b}, ${c}, ${d}. If $x \\le ${b}$, the third value is ${b}. So **any whole number $x \\le ${b}$** works.`
          : `In order: ${a}, ${b}, ${c}, ${d}. If $x \\ge ${c}$, the third value is ${c}. So **any whole number $x \\ge ${c}$** works.` };
    } });

  const U9_REASON = [
    { q: "Two data sets have the same mean. Must they have the same standard deviation?",
      right: "No. $\\{5, 5, 5\\}$ and $\\{0, 5, 10\\}$ both have mean 5, but the second is far more spread out.",
      wrong: ["Yes, because the standard deviation is computed from the mean.", "Yes, because both sets are centered in the same place.", "No, because the standard deviation is always larger than the mean."] },
    { q: "A scatter plot has $r = -0.95$. Is the relationship weak because $r$ is negative?",
      right: "No. The sign only gives the direction. $|r| = 0.95$ is close to 1, so the relationship is strong.",
      wrong: ["Yes, because negative values mean no relationship.", "Yes, because $r$ must be positive to be strong.", "No, because $-0.95$ is close to 0."] },
    { q: "A line of best fit has residuals that add up to 0. Does that prove the line is a good model?",
      right: "No. Large positive and negative residuals can cancel; a residual plot with a pattern shows a poor fit.",
      wrong: ["Yes, because a sum of 0 means every point is on the line.", "Yes, because the residuals are balanced.", "No, because the residuals should add to 1."] },
    { q: "Can a data set have a standard deviation of 0?",
      right: "Yes, when every value is the same, so no value is any distance from the mean.",
      wrong: ["No, because the standard deviation is always positive.", "Yes, when the mean is 0.", "No, because some value must differ from the mean."] },
    { q: "Two classes have the same median. Does that mean their box plots are the same?",
      right: "No. The quartiles, minimum and maximum can all differ even with the same median.",
      wrong: ["Yes, because the median sets the box.", "Yes, if they have the same number of students.", "No, because box plots do not show the median."] },
  ];
  add({ id: "u9.th.reason", skill: "u9.spread", level: L.H, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_REASON.length - 1), it = U9_REASON[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `${it.q} Pick the answer with the correct reason.`,
        hint: "Try a small example to test the claim.",
        solution: `**${it.right}**` };
    } });

  const U9_ASN = [
    { s: "If $r$ is close to 0, there is no relationship between the variables.",
      right: "Sometimes true: $r$ only measures a linear relationship. Points on a U-shaped curve can have $r$ near 0.",
      wrong: ["Always true: $r = 0$ means no relationship.", "Never true: every data set has some relationship.", "Sometimes true: only when there are fewer than 10 points."] },
    { s: "A strong correlation means one variable causes the other.",
      right: "Sometimes true: some strong correlations are causal, but many come from a third variable.",
      wrong: ["Always true: strong means causal.", "Never true: correlation and causation are never linked.", "Always true: if $|r| > 0.9$."] },
    { s: "Adding the same number to every value changes the standard deviation.",
      right: "Never true: every value moves the same amount, so the distances from the mean stay the same.",
      wrong: ["Always true: the values change.", "Sometimes true: when the number is negative.", "Sometimes true: when the number is large."] },
    { s: "The mean of a data set is one of the values in the data set.",
      right: "Sometimes true: the mean of 2, 4, 6 is 4, but the mean of 1 and 2 is 1.5.",
      wrong: ["Always true: it is the middle value.", "Never true: the mean is always a decimal.", "Always true: if the data are whole numbers."] },
    { s: "A data point with a residual of 0 lies on the line of best fit.",
      right: "Always true: actual = predicted, so the point is on the line.",
      wrong: ["Sometimes true: only if it is the first point.", "Never true: residuals are never 0.", "Sometimes true: only when $r = 1$."] },
    { s: "The interquartile range is greater than the range.",
      right: "Never true: the IQR covers only the middle half, which sits inside the full range.",
      wrong: ["Always true: it uses quartiles.", "Sometimes true: when there are outliers.", "Sometimes true: when the data are skewed."] },
  ];
  add({ id: "u9.th.always", skill: "u9.correlation", level: L.C, type: "mcq", calc: false,
    make(r) {
      const i = r.int(0, U9_ASN.length - 1), it = U9_ASN[i];
      const m = mcq(it.right, it.wrong.map((t) => ({ text: t, why: "Test it with examples. " + it.right })), r);
      return { key: [i], ...m, think: true,
        prompt: `Is this statement always true, sometimes true, or never true?<br>"${it.s}"`,
        hint: "Try a few examples, including special cases.",
        solution: `**${it.right}**` };
    } });

  M1.units.u9 = Object.assign(M1.units.u9 || {}, { generators: gens });
})(typeof window !== "undefined" ? window : globalThis);
