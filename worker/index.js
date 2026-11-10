// Cloudflare Worker for the Math 1 Practice app. The app's files are served straight from dist/ (see wrangler.jsonc);
// requests that match no file come here. POST /api/feedback emails the student's feedback form to the teacher.
// Settings (Cloudflare dashboard > math-1 > Settings > Variables and Secrets):
//   FEEDBACK_TO     secret: the address feedback goes to
//   RESEND_API_KEY  secret: when set, mail goes out through Resend (resend.com), whose domain records sit on a
//                   subdomain, so the domain's own mailbox (e.g. Hostinger) is untouched. FEEDBACK_FROM must be on the
//                   domain verified in Resend.
//   Without it, mail goes through Cloudflare Email Routing (FEEDBACK_TO must then be a verified destination and
//   FEEDBACK_FROM on a domain with Email Routing on).
//   FEEDBACK_FROM   optional sender (default feedback@infralynxsystems.com)
import { EmailMessage } from "cloudflare:email";
import { validate, mimeOf, subjectOf, textOf } from "./feedback.js";

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/feedback") return new Response("Not found", { status: 404 });
    if (request.method !== "POST") return json(405, { error: "Use POST." });
    // Only the app's own pages may send (blocks other sites posting here from a browser).
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== url.host) return json(403, { error: "Not allowed." });
    if (Number(request.headers.get("content-length") || 0) > 20000) return json(413, { error: "The form is too long." });
    let body;
    try { body = await request.json(); } catch (e) { return json(400, { error: "The form could not be read." }); }
    const v = validate(body);
    if (!v.ok) return json(400, { error: v.error });
    if (v.spam) return json(200, { ok: true });
    const to = env.FEEDBACK_TO, from = env.FEEDBACK_FROM || "feedback@infralynxsystems.com";
    if (!to || !(env.RESEND_API_KEY || env.FEEDBACK_EMAIL)) return json(503, { error: "Feedback email is not set up yet." });
    try {
      if (env.RESEND_API_KEY) {
        const d = v.data;
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({ from: `Math 1 Practice <${from}>`, to: [to], subject: subjectOf(d), text: textOf(d), ...(d.email ? { reply_to: d.email } : {}) }),
        });
        if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
      } else {
        await env.FEEDBACK_EMAIL.send(new EmailMessage(from, to, mimeOf(v.data, { from, to })));
      }
    } catch (e) {
      console.error("feedback email failed:", e && e.message);
      return json(502, { error: "The email could not be sent. It will be tried again later." });
    }
    return json(200, { ok: true });
  },
};
