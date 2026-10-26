/* Student tools: coordinate grid (display, plotting answers, scratch graphing),
   drawing pad, and calculator. Mouse and touch both work. */
(function (G) {
  const M1 = G.M1;
  const NS = "http://www.w3.org/2000/svg";
  const fmt = (x) => M1.qlib.fmt(x);

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ───────────── Coordinate grid ─────────────
  // opts: { window:{xmin,xmax,ymin,ymax,xstep,ystep}, points, points2, interactive, onChange, lines, mode,
  //         paths:[{pts, dashed, label}], shade:[[x,y]...polygon...], open:[[x,y]], closed:[[x,y]], labels:[{at:[x,y], text}] }
  function GraphGrid(container, opts) {
    const W = 360, H = 300, pad = { l: 40, r: 14, t: 14, b: 30 };
    const w = Object.assign({ xstep: 1, ystep: 1 }, opts.window);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "grid-svg", role: "img", "aria-label": "Coordinate grid" });
    container.appendChild(svg);
    const sx = (x) => pad.l + ((x - w.xmin) / (w.xmax - w.xmin)) * (W - pad.l - pad.r);
    const sy = (y) => H - pad.b - ((y - w.ymin) / (w.ymax - w.ymin)) * (H - pad.t - pad.b);
    const ix = (px) => w.xmin + ((px - pad.l) / (W - pad.l - pad.r)) * (w.xmax - w.xmin);
    const iy = (py) => w.ymin + ((H - pad.b - py) / (H - pad.t - pad.b)) * (w.ymax - w.ymin);

    const gGrid = el("g", { class: "grid-lines" }, svg);
    const ylabelEvery = Math.max(1, Math.ceil((w.ymax - w.ymin) / w.ystep / 10));
    let k = 0;
    for (let y = Math.ceil(w.ymin / w.ystep) * w.ystep; y <= w.ymax + 1e-9; y += w.ystep, k++) {
      if (!opts.noY) el("line", { x1: pad.l, x2: W - pad.r, y1: sy(y), y2: sy(y), class: Math.abs(y) < 1e-9 ? "axis" : "minor" }, gGrid);
      if (!opts.noY && k % ylabelEvery === 0) el("text", { x: pad.l - 6, y: sy(y) + 4, class: "tick", "text-anchor": "end" }, gGrid).textContent = fmt(Math.round(y * 1e6) / 1e6);
    }
    for (let x = Math.ceil(w.xmin / w.xstep) * w.xstep; x <= w.xmax + 1e-9; x += w.xstep) {
      el("line", { y1: pad.t, y2: H - pad.b, x1: sx(x), x2: sx(x), class: Math.abs(x) < 1e-9 ? "axis" : "minor" }, gGrid);
      el("text", { x: sx(x), y: H - pad.b + 16, class: "tick", "text-anchor": "middle" }, gGrid).textContent = fmt(x);
    }
    if (opts.xlabel) el("text", { x: W - pad.r, y: H - 4, class: "axis-label", "text-anchor": "end" }, svg).textContent = opts.xlabel;

    const clip = "gc" + Math.random().toString(36).slice(2, 8);
    const cp = el("clipPath", { id: clip }, el("defs", {}, svg));
    el("rect", { x: pad.l, y: pad.t, width: W - pad.l - pad.r, height: H - pad.t - pad.b }, cp);
    const gFixed = el("g", { "clip-path": `url(#${clip})` }, svg);
    for (const poly of opts.shade || []) el("polygon", { points: poly.map((p) => `${sx(p[0])},${sy(p[1])}`).join(" "), class: "shade" }, gFixed);
    for (const P of opts.paths || []) {
      el("polyline", { points: P.pts.map((p) => `${sx(p[0])},${sy(p[1])}`).join(" "), class: "curve" + (P.dashed ? " dashed" : "") + (P.alt ? " alt" : "") }, gFixed);
    }
    for (const p of opts.closed || []) el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 4.5, class: "end-closed" }, gFixed);
    for (const p of opts.open || []) el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 4.5, class: "end-open" }, gFixed);
    for (const L of opts.labels || []) el("text", { x: sx(L.at[0]) + 6, y: sy(L.at[1]) - 6, class: "curve-label" }, svg).textContent = L.text;
    const gLines = el("g", {}, svg);
    const gPts = el("g", {}, svg);
    let pts = (opts.points || []).map((p) => p.slice());
    const lines = opts.lines || [];

    function draw() {
      gLines.innerHTML = ""; gPts.innerHTML = "";
      for (const L of lines) drawLine(L);
      for (const p of opts.points2 || []) el("rect", { x: sx(p[0]) - 5, y: sy(p[1]) - 5, width: 10, height: 10, class: "pt pt2" }, gPts);
      for (const p of pts) el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 6, class: "pt" + (opts.interactive ? " pt-user" : "") }, gPts);
    }
    function drawLine([a, b]) {
      if (a[0] === b[0]) { el("line", { x1: sx(a[0]), x2: sx(a[0]), y1: sy(w.ymin), y2: sy(w.ymax), class: "user-line" }, gLines); return; }
      const m = (b[1] - a[1]) / (b[0] - a[0]);
      const y = (x) => a[1] + m * (x - a[0]);
      el("line", { x1: sx(w.xmin), y1: sy(y(w.xmin)), x2: sx(w.xmax), y2: sy(y(w.xmax)), class: "user-line" }, gLines);
    }
    draw();

    if (opts.interactive) {
      svg.classList.add("interactive");
      const hover = el("circle", { r: 5, class: "pt-hover", cx: -10, cy: -10 }, svg);
      const snap = (evt) => {
        const r = svg.getBoundingClientRect();
        const px = ((evt.clientX - r.left) / r.width) * W, py = ((evt.clientY - r.top) / r.height) * H;
        const x = Math.round(ix(px) / w.xstep) * w.xstep, y = Math.round(iy(py) / w.ystep) * w.ystep;
        if (x < w.xmin || x > w.xmax || y < w.ymin || y > w.ymax) return null;
        return [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6];
      };
      svg.addEventListener("pointermove", (e) => {
        const p = snap(e);
        if (!p) return hover.setAttribute("cx", -10);
        hover.setAttribute("cx", sx(p[0])); hover.setAttribute("cy", sy(p[1]));
      });
      svg.addEventListener("pointerleave", () => hover.setAttribute("cx", -10));
      let pending = null;
      svg.addEventListener("click", (e) => {
        const p = snap(e);
        if (!p) return;
        if (opts.mode && opts.mode() === "line") {
          if (!pending) { pending = p; pts.push(p); }
          else { lines.push([pending, p]); pts.push(p); pending = null; }
        } else {
          const i = pts.findIndex((q) => Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9);
          if (i >= 0) pts.splice(i, 1); else pts.push(p);
        }
        draw();
        opts.onChange && opts.onChange(pts.map((q) => q.slice()));
      });
    }
    return {
      clear() { pts = []; lines.length = 0; draw(); opts.onChange && opts.onChange([]); },
      get points() { return pts.map((q) => q.slice()); },
      showAnswer(answer) { for (const p of answer) el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 9, class: "pt-answer" }, gPts); },
    };
  }

  // ───────────── Scratch graph tool ─────────────
  function ScratchGraph(container) {
    container.innerHTML = `
      <div class="tool-row">
        <div class="seg" role="group" aria-label="Graph mode">
          <button type="button" class="seg-btn on" data-mode="point">Points</button>
          <button type="button" class="seg-btn" data-mode="line">Line through 2 points</button>
        </div>
        <button type="button" class="btn-quiet" data-act="clear">Clear</button>
      </div>
      <div class="tool-row small">
        <label>x from <input id="sg-xmin" type="number" value="-10"></label>
        <label>to <input id="sg-xmax" type="number" value="10"></label>
        <label>y from <input id="sg-ymin" type="number" value="-10"></label>
        <label>to <input id="sg-ymax" type="number" value="10"></label>
        <label>y step <input id="sg-ystep" type="number" value="1" min="0.1" step="any"></label>
      </div>
      <div class="sg-host"></div>`;
    let mode = "point", grid;
    const host = container.querySelector(".sg-host");
    const val = (id) => Number(container.querySelector("#" + id).value);
    function build() {
      host.innerHTML = "";
      const xmin = val("sg-xmin"), xmax = val("sg-xmax"), ymin = val("sg-ymin"), ymax = val("sg-ymax");
      let ystep = val("sg-ystep") || 1;
      if (!(xmax > xmin && ymax > ymin)) return;
      if ((ymax - ymin) / ystep > 60) ystep = M1.qlib.niceStep((ymax - ymin) / 20);
      const xstep = (xmax - xmin) > 40 ? M1.qlib.niceStep((xmax - xmin) / 20) : 1;
      grid = GraphGrid(host, { window: { xmin, xmax, ymin, ymax, xstep, ystep }, interactive: true, mode: () => mode });
    }
    container.querySelectorAll("input").forEach((i) => i.addEventListener("change", build));
    container.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => {
      mode = b.dataset.mode;
      container.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("on", x === b));
    }));
    container.querySelector('[data-act="clear"]').addEventListener("click", () => grid && grid.clear());
    build();
  }

  // ───────────── Drawing pad ─────────────
  function DrawPad(container) {
    container.innerHTML = `
      <div class="tool-row">
        <div class="seg" role="group" aria-label="Drawing tool">
          <button type="button" class="seg-btn on" data-tool="pen">Pen</button>
          <button type="button" class="seg-btn" data-tool="line">Straight line</button>
          <button type="button" class="seg-btn" data-tool="eraser">Eraser</button>
        </div>
        <label class="check"><input type="checkbox" id="dp-grid" checked> Grid</label>
        <button type="button" class="btn-quiet" data-act="undo">Undo</button>
        <button type="button" class="btn-quiet" data-act="clear">Clear</button>
      </div>
      <canvas class="pad" width="720" height="560" aria-label="Drawing pad"></canvas>`;
    const cv = container.querySelector("canvas"), ctx = cv.getContext("2d");
    let tool = "pen", strokes = [], cur = null;
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#333";
    function pos(e) {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * cv.width, ((e.clientY - r.top) / r.height) * cv.height];
    }
    function redraw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (container.querySelector("#dp-grid").checked) {
        ctx.strokeStyle = css("--grid"); ctx.lineWidth = 1;
        for (let x = 0; x <= cv.width; x += 40) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, cv.height); ctx.stroke(); }
        for (let y = 0; y <= cv.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(cv.width, y + 0.5); ctx.stroke(); }
      }
      for (const s of strokes) drawStroke(s);
    }
    function drawStroke(s) {
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = css("--ink"); ctx.lineWidth = s.tool === "eraser" ? 22 : 3;
      ctx.beginPath();
      const p = s.tool === "line" ? [s.pts[0], s.pts[s.pts.length - 1]] : s.pts;
      ctx.moveTo(p[0][0], p[0][1]);
      for (const q of p) ctx.lineTo(q[0], q[1]);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); cur = { tool, pts: [pos(e)] }; strokes.push(cur); redraw(); });
    cv.addEventListener("pointermove", (e) => { if (!cur) return; const p = pos(e); if (cur.tool === "line") cur.pts[1] = p; else cur.pts.push(p); redraw(); });
    const end = () => { cur = null; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    container.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => {
      tool = b.dataset.tool;
      container.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("on", x === b));
    }));
    container.querySelector("#dp-grid").addEventListener("change", redraw);
    container.querySelector('[data-act="undo"]').addEventListener("click", () => { strokes.pop(); redraw(); });
    container.querySelector('[data-act="clear"]').addEventListener("click", () => { strokes = []; redraw(); });
    redraw();
    return { clear() { strokes = []; redraw(); }, redraw };
  }

  // ───────────── Calculator ─────────────
  // Safe expression evaluator: numbers, + - * / ^, parentheses, sqrt, pi, ans. No eval().
  function evaluate(src, ans) {
    const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/√/g, "sqrt").replace(/π/g, "pi").replace(/\s+/g, "");
    let i = 0;
    const peek = () => s[i];
    function expr() { let v = term(); while (peek() === "+" || peek() === "-") { const op = s[i++]; const r = term(); v = op === "+" ? v + r : v - r; } return v; }
    function term() {
      let v = factor();
      for (;;) {
        if (peek() === "*" || peek() === "/") { const op = s[i++]; const r = factor(); v = op === "*" ? v * r : v / r; }
        else if (peek() === "(" || /[a-z\d.]/.test(peek() || "")) { v = v * factor(); } // implicit multiply: 2(3), 2pi
        else return v;
      }
    }
    function factor() { const b = unary(); if (peek() === "^") { i++; return Math.pow(b, factor()); } return b; }
    function unary() { if (peek() === "-") { i++; return -unary(); } if (peek() === "+") { i++; return unary(); } return primary(); }
    function primary() {
      if (peek() === "(") { i++; const v = expr(); if (peek() !== ")") throw new Error("Missing )"); i++; return v; }
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e-?\d+)?/);
      if (m) { i += m[0].length; return Number(m[0]); }
      const w = s.slice(i).match(/^[a-z]+/);
      if (w) {
        i += w[0].length;
        if (w[0] === "pi") return Math.PI;
        if (w[0] === "ans") return ans;
        if (w[0] === "sqrt") { const v = peek() === "(" ? primary() : unary(); return Math.sqrt(v); }
        throw new Error("Unknown: " + w[0]);
      }
      throw new Error("Check the expression");
    }
    const v = expr();
    if (i < s.length) throw new Error("Check the expression");
    return v;
  }

  function Calculator(container) {
    const keys = ["7", "8", "9", "÷", "(", "4", "5", "6", "×", ")", "1", "2", "3", "−", "^", "0", ".", "ans", "+", "√", "C", "⌫", "π", "="];
    container.innerHTML = `
      <div class="calc-blocked" hidden>No calculator on this question. Work it out by hand or on the drawing pad.</div>
      <div class="calc-body">
        <input class="calc-input" id="calc-input" type="text" inputmode="decimal" autocomplete="off" placeholder="Type or tap, e.g. 5*3^7" aria-label="Calculator input">
        <div class="calc-out" aria-live="polite">&nbsp;</div>
        <div class="calc-keys">${keys.map((k) => `<button type="button" class="ck${k === "=" ? " ck-eq" : ""}${"÷×−+^".includes(k) ? " ck-op" : ""}" data-k="${k}">${k}</button>`).join("")}</div>
        <ol class="calc-tape"></ol>
      </div>`;
    const inp = container.querySelector(".calc-input"), out = container.querySelector(".calc-out"), tape = container.querySelector(".calc-tape");
    let ans = 0;
    function run() {
      if (!inp.value.trim()) return;
      try {
        const v = evaluate(inp.value, ans);
        if (!Number.isFinite(v)) throw new Error("Undefined");
        ans = Math.round(v * 1e10) / 1e10;
        out.textContent = "= " + ans;
        const li = document.createElement("li"); li.textContent = `${inp.value} = ${ans}`; tape.prepend(li);
        while (tape.children.length > 6) tape.lastChild.remove();
        inp.value = "";
      } catch (e) { out.textContent = e.message; }
    }
    container.querySelector(".calc-keys").addEventListener("click", (e) => {
      const k = e.target.dataset && e.target.dataset.k; if (!k) return;
      if (k === "=") return run();
      if (k === "C") { inp.value = ""; out.innerHTML = "&nbsp;"; return; }
      if (k === "⌫") { inp.value = inp.value.slice(0, -1); return; }
      inp.value += k === "√" ? "√(" : k;
      inp.focus();
    });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); run(); } });
    return {
      setAllowed(ok) {
        container.querySelector(".calc-blocked").hidden = ok;
        container.querySelector(".calc-body").hidden = !ok;
      },
    };
  }

  M1.tools = { GraphGrid, ScratchGraph, DrawPad, Calculator, evaluate };
})(typeof window !== "undefined" ? window : globalThis);
