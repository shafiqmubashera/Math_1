---
name: build-unit-bank
description: Build the question content for one Math 1 unit, covering code generators for number problems and a reviewed bank of word, graph and SAT-style problems, tagged by skill, level and standard.
---

# Build a unit's question content

## Before you start
- Read `CLAUDE.md` (course rules) and the unit's entry in `curriculum/units.json` (lessons, skills, standards).
- Read the unit's Open Up NC Math 1 family page and practice ("Ready, Set, Go") for the style of problems the class uses. Links are in `curriculum/sources.md`.

## 1. Generators (`content/<unit>/generators.js`)
For every skill, write at least one generator per level (basic, intermediate, hard, challenge).
A generator is `{ id, skill, level, types, make(rng) }`, and `make` returns a question:
```
{ type, prompt, choices?, answer, solution, hint, calc, graph?, plot?, why? }
```
- Use `rng` for every random choice, so a question can be rebuilt from its seed.
- Compute the answer in code. Never type an answer by hand.
- Build wrong choices from named mistakes (off-by-one term index, using d instead of r, sign errors) and record each in `why`.
- Keep numbers friendly for no-calculator questions.

## 2. Bank (`content/<unit>/bank.json`)
For context and SAT-style items that don't fit a template. Each needs the same fields plus `id`, `lesson`, `standard`.
Write at least 15 per skill at the hard/challenge level.

## 3. Check
- Run the `answer-checker` agent on every new bank item.
- Run `node tests/run-tests.mjs`. It builds each generator 300 times and checks answers, choices and fingerprints.
