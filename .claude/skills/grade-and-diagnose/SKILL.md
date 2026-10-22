---
name: grade-and-diagnose
description: Score a submitted set, update each skill's level, streaks and achieved flags, and record the time taken.
---

# Grade a set and update the student's levels

The app runs this in `app/src/engine.js` (`gradeSet`, `updateState`). Use this skill when changing the rules.

1. **Score each question.**
   - mcq / graph-mcq: the chosen index matches.
   - multi: the chosen set equals the answer set.
   - numeric: within 0.01 of the answer (fractions like 3/4 are accepted).
   - plot: every required point is placed, with no extra points.
2. **Per skill × level:** correct / total.
3. **Update levels:**
   - At the focus level, 80% or better adds 1 to the streak. Under 80% resets it to 0.
   - A streak of 2 secures the level, and the focus moves up one level.
   - Hard/challenge at 100% with at least 3 questions makes the skill achieved.
4. **Unit mastered:** a set at 100% sets `mastered = true` and offers a fresh restart. A restart clears the skill levels but keeps the seen-question list and the history.
5. **Time:** store the start time, submit time, active seconds (time the tab was visible) and seconds per question.
6. **History entry:** date, unit, score, percent, active time, and a per-skill summary.
