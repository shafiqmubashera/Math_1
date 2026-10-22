---
name: generate-question-set
description: Assemble one 25-question practice set for a unit from the student's current skill levels, using generators and the reviewed bank, never repeating a seen question.
---

# Generate a question set

The app runs this procedure in code (`app/src/engine.js`, `buildSet`). Use this skill when changing that logic or producing a set by hand for review.

## Inputs
- Unit id (e.g. `u1`)
- Student state for the unit: each skill's focus level, achieved flag, and secured streaks
- The list of seen question fingerprints

## Steps
1. **Diagnostic or adaptive?** If the unit has no completed set since its last restart, it's a diagnostic.
2. **Diagnostic:** 3 basic, 7–8 intermediate, 14–15 hard/challenge (10/30/60). Spread the questions across every skill in the unit, round-robin.
3. **Adaptive:**
   - Drop achieved skills.
   - Give each remaining skill a weight: basic focus = 3, intermediate = 2, hard = 1.5. Hand out the 25 slots in proportion to weight, at least 2 per skill.
   - For each skill, about 70% of its slots are at its focus level and 30% are one level up.
4. **Pick each question:** choose a generator or bank item that matches the skill and level. Prefer types not yet used in this set, so the set stays mixed: mcq, numeric, plot, graph-mcq, multi.
5. **No repeats:** regenerate (new numbers) or pick another bank item if the fingerprint was seen before.
6. **Order:** shuffle, keeping roughly basic → challenge so the set ramps up.
7. Mark each question `calc: true/false`. About a third of a set is no-calculator, like the NC tests.

## Output
An array of 25 question objects (see `content/README` fields in `CLAUDE.md`).
