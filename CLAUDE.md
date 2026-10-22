# MATH-1: course rules

Read `../CLAUDE.md` first. This file adds the Math 1 rules.

## Course
- NC Math 1 as taught by WCPSS, built on the Open Up Resources NC Math 1 curriculum.
- Standards: NC.M1 Standard Course of Study (`curriculum/standards.json`).
- Units, lessons and skills: `curriculum/units.json`. WCPSS teaching order is 1, 2, 3, 4, 8, 5, 6, 7, 9.
- Test styles to imitate: NC Check-Ins 2.0 and the NC Math 1 EOC (multiple choice, numeric entry, technology-enhanced graphing; calculator-active and calculator-inactive), plus Digital SAT Algebra / Advanced Math / Problem Solving & Data Analysis for the hardest tier.

## Difficulty levels
| Level | Meaning | Example (Unit 1) |
|---|---|---|
| `basic` | One step, recall or recognize | Find the next term of 4, 7, 10, … |
| `intermediate` | Two or three steps, or switch between representations | Write the explicit equation from a table |
| `hard` | Multi-step, context, or reverse reasoning | Find term 1 of a geometric sequence given terms 3 and 6 |
| `challenge` | SAT / EOC style, unfamiliar framing, combined ideas | Which sequence passes another first; interpret parameters |

`hard` and `challenge` together make up the "hard to challenging" 60%.

## Set rules (also in `app/src/config.js`)
- 25 questions per set.
- First set in a unit (diagnostic): 10% basic, 30% intermediate, 60% hard/challenge.
- Later sets adapt per skill:
  - Each skill has a **focus level**, the lowest level not yet secured.
  - A level is secured after two sets in a row at 80% or better on that skill and level.
  - Weak skills get more questions. Most of a skill's questions are at its focus level, a few one level up.
  - A skill is **achieved** when it scores 100% on its hard/challenge questions (at least 3 in one set). Achieved skills stop appearing.
- A set scored 100% marks the unit **mastered**. The student can then restart the unit with fresh questions, and the assessment starts again from a new diagnostic.

## Question types
`mcq` (4 options), `multi` (choose all that apply), `numeric` (number entry, fractions allowed), `plot` (place points on a coordinate grid), `graph-mcq` (read a graph, choose an answer).

## How to add content
- Number-based questions: add a generator to `content/<unit>/generators.js` (see the `build-unit-bank` skill).
- Word problems and SAT-style items: add to `content/<unit>/bank.json`, then run the `answer-checker` agent.
- Run `node tests/run-tests.mjs` before every build. Then run `node tools/build.mjs` to produce `dist/index.html`.

## Keeping GitHub current
- The code lives at github.com/shafiqmubashera/Math_1 (branch `main`). After every change: run the tests, build, commit and push to `origin main`.
- Every push to `main` republishes the app to GitHub Pages (`.github/workflows/pages.yml`): https://shafiqmubashera.github.io/Math_1/
