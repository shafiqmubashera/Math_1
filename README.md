# MATH-1: Adaptive Math 1 Practice

A web app that gives the student 25-question practice sets for NC Math 1, adapts each new set to the skills they struggle with, and records how long every set takes.

## Use it
Public test link: https://shafiqmubashera.github.io/Math_1/ (anyone can open it; it updates on every push to `main`).
Testers need an up-to-date browser and internet only, with nothing to install and no account. Progress saves in that browser on that device.

### Host it on Cloudflare (optional, free)
The same app can also be published by Cloudflare. Nothing in the code changes; Cloudflare just builds from this repo.
1. Sign in at dash.cloudflare.com, then **Workers & Pages** → **Create** → import this GitHub repo. `wrangler.jsonc` tells Cloudflare to publish the `dist` folder.
2. Project name: `math-1`. Build command: `rm -rf dist && node tools/build.mjs` (this publishes only the student app: no `/test/` copy and no design previews). Deploy command: `npx wrangler deploy` (the default).
3. Click **Deploy**. The app is then at `https://math-1.<your-account>.workers.dev/`, and every push to `main` republishes it.
A custom domain can be added later under the project's **Custom domains** tab.

### Feedback emails (Cloudflare)
The **Feedback** tab emails each form to the teacher through `worker/index.js`. One-time setup in the Cloudflare dashboard:
1. **Email Routing on:** open the `infralynxsystems.com` domain → **Email** → **Email Routing** and turn it on (accept the DNS records it adds).
2. **Destination verified:** under **Destination addresses**, add the teacher's address and click the link in Cloudflare's email until it shows **Verified**.
3. **Where to send:** open **Workers & Pages** → **math-1** → **Settings** → **Variables and Secrets** → **Add**, type **Secret**, name `FEEDBACK_TO`, value = that verified address. Save and deploy.
4. Optional: a variable `FEEDBACK_FROM` for the sender (default `feedback@infralynxsystems.com`; it must be on a domain with Email Routing on).
Until this is done, forms wait in the student's browser and are sent once it works. The GitHub Pages copy has no server, so its form says to use the Cloudflare app.

### Install it like an app (iPad, iPhone, PC)
The student app (not the `/test/` copy) can be installed from that link. It then gets its own icon, opens full screen without browser bars, and works offline after the first visit. The colours stay the same in light and dark mode.
- **iPad / iPhone:** open the link in **Safari**, tap **Share** (square with an arrow), then **Add to Home Screen**, then **Add**.
- **Windows or Mac PC:** open the link in **Chrome** or **Edge** and click the install icon at the right end of the address bar (or menu → *Install Math 1 Practice*).
- **Android / Chromebook:** open the link in Chrome, menu → **Install app** (or *Add to Home screen*).

Progress saves on each device separately, so use the same device for one student. On iPhone/iPad the home-screen app keeps its own progress, apart from Safari: install first, then always open it from the icon. Deleting the icon also deletes that progress.

App link: https://claude.ai/artifact/CQNe1v8uGDqnB2UkTvKwHE (private until shared).

- Share it with the student from the page's **Share** menu as **Contributor** (can use the page). Then progress saves to their account and the owner sees it under **Progress** → "Showing progress for".
- If the student can only view the page, progress saves in their browser only. It still works, but the owner can't see it and it won't follow them to another device.

## What's live
- Unit 1 Sequences: 55 code generators + 15 written bank items across 9 skills and 4 levels (basic, intermediate, hard, challenge).
- Units 2–9 are mapped in `curriculum/units.json` and show as "Coming next".

## How a set works
1. Pick a unit. The first set is a diagnostic: 10% basic, 30% intermediate, 60% hard/challenge.
2. Answer all 25 questions. The tools panel has a graphing grid, a drawing pad and a calculator (hidden on "no calculator" questions).
3. Submit. The results show the score, the time taken, each skill's level, and a worked solution for every question.
4. Start the next set. It's built from brand-new questions aimed at the weakest skills.
5. A 100% set marks the unit mastered and unlocks a fresh restart.

## Folder layout
```
MATH-1/
├── README.md            you are here
├── CLAUDE.md            course rules for Claude (difficulty, set rules, content rules)
├── PLAN.md              the approved plan
├── .claude/
│   ├── settings.json    Claude Code settings for this project
│   ├── skills/          repeatable procedures (make a set, build a unit bank, grade, explain)
│   └── agents/          specialist roles (question writer, answer checker, tutor coach, curriculum mapper)
├── curriculum/          standards.json, units.json (units → lessons → skills), sources.md
├── content/             one folder per unit: generators.js (code-made questions) + bank.json (written questions)
├── app/src/             the app: engine, storage, tools, screens, styles (themes/desk.css = the Study Desk design it ships with; quilt.css, metro.css and studio.css are older designs kept as alternatives, build one with `node tools/build.mjs --theme quilt`)
├── tests/               checks every generator and bank question
├── tools/build.mjs      bundles everything into dist/index.html
└── dist/index.html      the published page
```

## Build and test
```
node tests/run-tests.mjs
node tools/build.mjs
```
