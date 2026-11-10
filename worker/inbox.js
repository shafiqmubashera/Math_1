// The private Feedback inbox page (/inbox) and its password check. No Cloudflare imports, so tests can run it in Node.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const para = (s) => esc(s).replace(/\n/g, "<br>");

// HTTP Basic sign-in: any user name, the INBOX_PASSWORD secret as password. Returns true when it matches.
export function passwordOk(header, password) {
  if (!password || !header || !header.startsWith("Basic ")) return false;
  let given = "";
  try { given = atob(header.slice(6)).split(":").slice(1).join(":"); } catch (e) { return false; }
  const a = new TextEncoder().encode(given), b = new TextEncoder().encode(password);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] || 0) ^ (b[i] || 0);
  return diff === 0;
}

const when = (iso) => { const d = new Date(iso); return isNaN(d) ? esc(iso) : d.toUTCString().replace(/:\d\d GMT$/, " UTC"); };

function card(row) {
  const d = row.data;
  const field = (label, html) => `<div class="f"><div class="l">${label}</div><div class="v">${html}</div></div>`;
  return `<article class="card${row.seen ? "" : " new"}">
    <header><strong>${esc(d.name || "No name given")}</strong>${row.seen ? "" : ' <span class="tag">New</span>'}<span class="when">${when(row.created)}</span></header>
    ${d.email ? field("Reply email", `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`) : ""}
    ${field("Unit found hard", esc(d.unit) || "<em>none chosen</em>")}
    ${d.topics.length ? field("Topics found hard", `<ul>${d.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`) : ""}
    ${field("Questions found tricky", d.tricky ? para(d.tricky) : "<em>nothing written</em>")}
    ${field("Remarks, questions or problems", d.remarks ? para(d.remarks) : "<em>nothing written</em>")}
    ${d.flagged.length ? field(`Flagged questions (${d.flagged.length})`, `<ul>${d.flagged.map((f) => `<li><span class="muted">${esc(f.unit)} · ${esc(f.skill)} · ${esc(f.level)}</span><br>${esc(f.prompt)}</li>`).join("")}</ul>`) : ""}
    <footer><span class="muted">${d.app.testing ? "Testing copy · " : ""}${esc(d.app.url)}</span>
      <form method="post" action="/inbox/delete" onsubmit="return confirm('Delete this feedback?')"><input type="hidden" name="id" value="${esc(row.id)}"><button type="submit">Delete</button></form></footer>
  </article>`;
}

export function inboxPage(rows) {
  const fresh = rows.filter((r) => !r.seen).length;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><meta name="color-scheme" content="light only"><title>Feedback inbox · Math 1 Practice</title>
<style>
:root { --bg: #2E5E4E; --paper: #FFFDF6; --ink: #1F2430; --muted: #5A5F6A; --line: #D8D2C2; --accent: #2E4A7A; --mark: #FFE45C; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { color: #F2F0EA; margin: 0 0 4px; } .sub { color: #DCE6E0; margin: 0 0 20px; }
.card { background: var(--paper); border-radius: 6px; padding: 16px; margin: 0 0 14px; box-shadow: 0 6px 12px rgba(0,0,0,.25); }
.card.new { border-left: 6px solid var(--mark); }
.card header { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; margin-bottom: 8px; }
.when { margin-left: auto; color: var(--muted); font-size: .9rem; }
.tag { background: var(--mark); border-radius: 4px; padding: 0 6px; font-size: .8rem; font-weight: 700; }
.f { padding: 6px 0; border-top: 1px solid var(--line); } .l { font-size: .8rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; }
.v ul { margin: 2px 0; padding-left: 20px; } .muted { color: var(--muted); font-size: .85rem; } a { color: var(--accent); }
.card footer { display: flex; gap: 12px; align-items: center; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px; margin-top: 4px; overflow-wrap: anywhere; }
button { font: inherit; border: 1px solid #C8243A; color: #C8243A; background: #fff; border-radius: 6px; padding: 4px 12px; cursor: pointer; }
.empty { background: var(--paper); border-radius: 6px; padding: 24px; }
</style>
<main><h1>Feedback inbox</h1><p class="sub">${rows.length} message${rows.length === 1 ? "" : "s"}${fresh ? ` · ${fresh} new` : ""} · newest first</p>
${rows.length ? rows.map(card).join("") : '<div class="empty">No feedback yet.</div>'}
</main></html>`;
}
