// Checks the Cloudflare Worker's feedback logic: form checks (worker/feedback.js) and the private inbox page and sign-in (worker/inbox.js).
// Run: node tests/worker-tests.mjs
import { validate } from "../worker/feedback.js";
import { passwordOk, inboxPage } from "../worker/inbox.js";

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
check("FB-05", "Line breaks are removed from one-line fields and long text is cut", v.ok && !/[\r\n]/.test(v.data.name) && v.data.remarks.length === 2000, JSON.stringify(v.data.name));

const d = validate(form({ email: "parent@example.com", name: "Zoë <script>alert(1)</script>", tricky: "line one\nline two", flagged: [{ unit: "Unit 1", skill: "Geometric sequences", level: "Hard", prompt: "Find term 1 of $a_n$" }] })).data;
const page = inboxPage([{ id: "a1", created: "2026-11-10T10:00:00Z", data: d, seen: false }, { id: "b2", created: "2026-11-09T10:00:00Z", data: validate(form()).data, seen: true }]);
check("FB-06", "The inbox shows every field: name, reply email, unit, topics, tricky questions, remarks and flagged questions",
  ["Zoë", 'href="mailto:parent@example.com"', "Unit 2: Linear", "<li>Slope from two points</li>", "line one<br>line two", "Timer is great", "Geometric sequences · Hard", "Find term 1 of $a_n$"].every((x) => page.includes(x)), page.slice(0, 300));
check("FB-07", "Student text can't inject code into the inbox page", !page.includes("<script>alert") && page.includes("&lt;script&gt;"));
check("FB-08", "New messages are marked and counted", (page.match(/class="tag">New/g) || []).length === 1 && page.includes("2 messages · 1 new"));
check("FB-09", "Each message has its own Delete button", page.includes('name="id" value="a1"') && page.includes('name="id" value="b2"'));
const basic = (pw) => "Basic " + Buffer.from("teacher:" + pw).toString("base64");
check("FB-10", "The inbox opens only with the right password (and never when none is set)",
  passwordOk(basic("s3cret:x"), "s3cret:x") && !passwordOk(basic("wrong"), "s3cret:x") && !passwordOk(null, "s3cret:x") && !passwordOk(basic(""), "") && !passwordOk("Bearer abc", "s3cret:x"));
check("FB-14", "An empty inbox says so", inboxPage([]).includes("No feedback yet"));

console.log(`\n${pass} of ${pass + fail} worker cases passed.`);
process.exit(fail ? 1 : 0);
