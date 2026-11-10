// Checks the feedback email built by worker/feedback.js (the Cloudflare Worker's logic). Run: node tests/worker-tests.mjs
import { validate, subjectOf, textOf, mimeOf } from "../worker/feedback.js";

let pass = 0, fail = 0;
const check = (id, title, ok, info = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${id.padEnd(6)} ${title}${ok ? "" : "\n          → " + info}`); };
const form = (extra = {}) => ({ name: "Sam", email: "", unit: "Unit 2: Linear & Exponential Functions", topics: ["Slope from two points"], tricky: "Question 7 about rate of change", remarks: "Timer is great", flagged: [], website: "", app: { url: "https://math-1.infralynxsystems.com/", built: "2026-11-10", testing: false }, sentAt: "2026-11-10T10:00:00Z", ...extra });

let v = validate(form());
check("FB-01", "A normal form is accepted", v.ok && !v.spam && v.data.topics.length === 1, JSON.stringify(v));
v = validate(form({ unit: "", topics: [], tricky: "", remarks: "" }));
check("FB-02", "An empty form is refused with a message", !v.ok && /choose a unit/.test(v.error), JSON.stringify(v));
v = validate(form({ email: "not-an-email" }));
check("FB-03", "A bad reply email is refused", !v.ok && /email/.test(v.error), JSON.stringify(v));
v = validate(form({ website: "http://spam" }));
check("FB-04", "The hidden spam field is silently dropped", v.ok && v.spam, JSON.stringify(v));
v = validate(form({ name: "Sam\r\nBcc: evil@example.com", remarks: "x".repeat(5000) }));
check("FB-05", "Line breaks can't sneak into headers and long text is cut", v.ok && !/[\r\n]/.test(v.data.name) && v.data.remarks.length === 2000, JSON.stringify(v.data.name));

const d = validate(form({ email: "parent@example.com", name: "Zoë", flagged: [{ unit: "Unit 1", skill: "Geometric sequences", level: "Hard", prompt: "Find term 1 of $a_n$" }] })).data;
const text = textOf(d);
check("FB-06", "The email lists name, unit, topics, tricky questions, remarks and flagged questions",
  ["Zoë", "parent@example.com", "Unit 2: Linear", "- Slope from two points", "Question 7 about rate", "Timer is great", "Geometric sequences · Hard: Find term 1"].every((s) => text.includes(s)), text);
check("FB-07", "The subject names the student and the unit", subjectOf(d) === "Math 1 feedback from Zoë · Unit 2", subjectOf(d));
const mime = mimeOf(d, { from: "feedback@infralynxsystems.com", to: "teacher@example.com", now: new Date("2026-11-10T10:00:00Z"), id: "abc" });
const [head, body] = mime.split("\r\n\r\n");
const decoded = Buffer.from(body.replace(/\r\n/g, ""), "base64").toString("utf8");
check("FB-08", "The MIME message has the right headers and its body decodes to the email text",
  /^From: Math 1 Practice <feedback@infralynxsystems.com>$/m.test(head) && /^To: <teacher@example.com>$/m.test(head) && /^Reply-To: =\?UTF-8\?B\?.+\?= <parent@example.com>$/m.test(head)
  && /^Subject: =\?UTF-8\?B\?/m.test(head) && /^Message-ID: <abc@infralynxsystems.com>$/m.test(head) && decoded === text, head);
const noReply = mimeOf(validate(form()).data, { from: "f@x.com", to: "t@x.com", id: "1" });
check("FB-09", "No Reply-To header when the student gave no email", !/Reply-To/.test(noReply));
check("FB-10", "Testing-copy feedback is marked in the subject", subjectOf(validate(form({ app: { testing: true } })).data).startsWith("[testing] "));

console.log(`\n${pass} of ${pass + fail} worker cases passed.`);
process.exit(fail ? 1 : 0);
