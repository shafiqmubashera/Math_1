/* Renders question text: $…$ math (KaTeX → MathML, no stylesheet needed), \$ for a dollar sign,
   **bold**, and <br>. Content comes only from our own generators and bank. */
(function (G) {
  const M1 = G.M1;

  function mathToHtml(tex, display) {
    if (G.katex) {
      try {
        return G.katex.renderToString(tex, { output: "mathml", throwOnError: false, displayMode: !!display });
      } catch (e) { /* fall through */ }
    }
    return `<code>${escapeHtml(tex)}</code>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // Text pieces: escape, then allow **bold** and <br>.
  function textToHtml(t) {
    return escapeHtml(t.replace(/\\\$/g, "\u0000"))
      .replace(/&lt;br&gt;/g, "<br>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\u0000/g, "$");
  }

  function render(src) {
    const s = String(src == null ? "" : src);
    let out = "", i = 0, buf = "";
    while (i < s.length) {
      if (s[i] === "\\" && s[i + 1] === "$") { buf += "\\$"; i += 2; continue; }
      if (s[i] === "$") {
        const end = findClose(s, i + 1);
        if (end < 0) { buf += s.slice(i); break; }
        out += textToHtml(buf); buf = "";
        out += mathToHtml(s.slice(i + 1, end), false);
        i = end + 1;
        continue;
      }
      buf += s[i++];
    }
    return out + textToHtml(buf);
  }
  function findClose(s, from) {
    for (let j = from; j < s.length; j++) {
      if (s[j] === "\\") { j++; continue; }
      if (s[j] === "$") return j;
    }
    return -1;
  }

  M1.math = { render, escapeHtml };
})(typeof window !== "undefined" ? window : globalThis);
