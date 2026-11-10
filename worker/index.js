// Cloudflare Worker for the Math 1 Practice app. The app's files are served straight from dist/ (see wrangler.jsonc);
// requests that match no file come here.
//   POST /api/feedback   saves a student's feedback form in this Worker's own storage (a Durable Object with SQLite).
//   GET  /inbox          the teacher's private page listing all feedback. Sign in with any name and the INBOX_PASSWORD
//                        secret (Cloudflare dashboard > math-1 > Settings > Variables and Secrets).
import { DurableObject } from "cloudflare:workers";
import { validate } from "./feedback.js";
import { passwordOk, inboxPage } from "./inbox.js";

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const PRIVATE = { "cache-control": "no-store", "x-robots-tag": "noindex", "x-frame-options": "DENY", "referrer-policy": "no-referrer" };

// All feedback lives in one small SQLite database inside this object.
export class FeedbackStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, created TEXT NOT NULL, data TEXT NOT NULL, seen INTEGER NOT NULL DEFAULT 0)");
  }
  add(data) {
    const count = this.sql.exec("SELECT COUNT(*) AS n FROM feedback").one().n;
    if (count >= 5000) return false; // a safety cap against flooding
    this.sql.exec("INSERT INTO feedback (id, created, data) VALUES (?, ?, ?)", crypto.randomUUID(), new Date().toISOString(), JSON.stringify(data));
    return true;
  }
  // Returns every message, newest first, then marks them all as seen.
  list() {
    const rows = this.sql.exec("SELECT id, created, data, seen FROM feedback ORDER BY created DESC").toArray().map((r) => ({ ...r, data: JSON.parse(r.data), seen: !!r.seen }));
    this.sql.exec("UPDATE feedback SET seen = 1 WHERE seen = 0");
    return rows;
  }
  remove(id) { this.sql.exec("DELETE FROM feedback WHERE id = ?", String(id)); }
}

const store = (env) => env.FEEDBACK_DB.get(env.FEEDBACK_DB.idFromName("all"));
const sameSite = (request, url) => { const o = request.headers.get("origin"); return !o || new URL(o).host === url.host; };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/feedback") {
      if (request.method !== "POST") return json(405, { error: "Use POST." });
      if (!sameSite(request, url)) return json(403, { error: "Not allowed." });
      if (Number(request.headers.get("content-length") || 0) > 20000) return json(413, { error: "The form is too long." });
      let body;
      try { body = await request.json(); } catch (e) { return json(400, { error: "The form could not be read." }); }
      const v = validate(body);
      if (!v.ok) return json(400, { error: v.error });
      if (v.spam) return json(200, { ok: true });
      if (!(await store(env).add(v.data))) return json(503, { error: "The feedback box is full. Please try again later." });
      return json(200, { ok: true });
    }

    if (url.pathname === "/inbox" || url.pathname === "/inbox/delete") {
      if (!env.INBOX_PASSWORD) return new Response("The inbox password is not set yet. Add the INBOX_PASSWORD secret in Cloudflare.", { status: 503, headers: PRIVATE });
      if (!passwordOk(request.headers.get("authorization"), env.INBOX_PASSWORD)) {
        return new Response("Sign in to see the feedback inbox.", { status: 401, headers: { ...PRIVATE, "www-authenticate": 'Basic realm="Math 1 feedback inbox", charset="UTF-8"' } });
      }
      if (url.pathname === "/inbox/delete") {
        if (request.method !== "POST" || !sameSite(request, url)) return new Response("Not allowed.", { status: 403, headers: PRIVATE });
        const id = (await request.formData()).get("id");
        if (id) await store(env).remove(id);
        return new Response(null, { status: 303, headers: { ...PRIVATE, location: "/inbox" } });
      }
      const rows = await store(env).list();
      return new Response(inboxPage(rows), { headers: { ...PRIVATE, "content-type": "text/html; charset=utf-8" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
