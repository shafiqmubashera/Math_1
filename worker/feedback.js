// Checks and cleans a feedback form sent by the app. No Cloudflare imports here, so tests can run it in Node.
const LIMIT = { name: 80, email: 120, unit: 160, topic: 160, tricky: 2000, remarks: 2000, flagged: 30, prompt: 400 };
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/[\r\n]+/g, " ");

// Returns { ok: true, data } or { ok: false, error } (error is shown to the student), or { ok: true, spam: true }.
export function validate(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "The form was empty." };
  if (body.website) return { ok: true, spam: true }; // hidden field only bots fill in
  const data = {
    name: oneLine(body.name, LIMIT.name),
    email: oneLine(body.email, LIMIT.email),
    unit: oneLine(body.unit, LIMIT.unit),
    topics: (Array.isArray(body.topics) ? body.topics : []).slice(0, 20).map((t) => oneLine(t, LIMIT.topic)).filter(Boolean),
    tricky: clean(body.tricky, LIMIT.tricky),
    remarks: clean(body.remarks, LIMIT.remarks),
    flagged: (Array.isArray(body.flagged) ? body.flagged : []).slice(0, LIMIT.flagged).map((f) => ({
      unit: oneLine(f && f.unit, 40), skill: oneLine(f && f.skill, LIMIT.topic), level: oneLine(f && f.level, 20), prompt: oneLine(f && f.prompt, LIMIT.prompt),
    })),
    app: { url: oneLine(body.app && body.app.url, 300), built: oneLine(body.app && body.app.built, 40), testing: !!(body.app && body.app.testing) },
    sentAt: oneLine(body.sentAt, 40),
  };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { ok: false, error: "That email address doesn't look right. Fix it or leave it empty." };
  if (!data.unit && !data.tricky && !data.remarks && !data.flagged.length) return { ok: false, error: "Please choose a unit or write something before sending." };
  return { ok: true, data };
}
