# MATH-1: Adaptive Math 1 Practice

A web app that gives the student 25-question practice sets for NC Math 1, adapts each new set to the skills they struggle with, and records how long every set takes.

## Use it
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
