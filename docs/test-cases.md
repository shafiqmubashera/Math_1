# Math 1 Practice: test cases

The full case list, with steps and expected results, is the shared doc "Math 1 Practice: test cases" (https://claude.ai/artifact/PfRxsjS2jScrup6xfDhQP8). This file lists every automated case by id so the test code and the doc stay matched.

## How to run

```
node tests/run-tests.mjs      # CT-01..CT-04: every question generator and written problem
node tests/engine-tests.mjs   # AD-*, AN-03..05, AN-12, SB-07: adaptive rules and grading
node tools/build.mjs && node tests/app-tests.mjs   # everything else, in a real browser (Playwright + Chromium)
```

All three run on every push to main before the app is published (.github/workflows/pages.yml). A failing case stops the publish.

## Automated cases

| ID | Case | Suite |
| --- | --- | --- |
| AD-01 | First set of each unit is a 25-question check with 3 basic, 7 intermediate and 15 hard/challenge | engine |
| AD-02 | Questions in a set run from easier to harder | engine |
| AD-03 | First-check placement: weak basics start a skill at Basic, strong answers start it at Hard | engine |
| AD-04 | A level moves up after two sets in a row at 80% or better | engine |
| AD-05 | A set below 80% in between resets the run | engine |
| AD-06 | Under 50% at a level (with at least 2 questions) steps the skill back one level | engine |
| AD-07 | A skill is achieved after 3 hard/challenge answers in a row, all right in that set | engine |
| AD-08 | Achieved skills stop appearing in later sets | engine |
| AD-09 | When every skill is achieved, sets still build (hard practice continues) | engine |
| AD-10 | Weaker skills get more questions than stronger ones, and every active skill gets its minimum | engine |
| AD-11 | 100% marks the unit mastered; 24 of 25 does not | engine |
| AD-12 | Restarting a mastered unit starts round 2 with a fresh first check | engine |
| AD-13 | 40 sets in a row never repeat a question (no repeats within or across sets) | engine |
| AN-01 | Multiple choice: one choice at a time; changing the answer replaces it | browser |
| AN-02 | Select all that apply: choices toggle on and off; none selected counts as unanswered | browser |
| AN-03 | Number entry accepts integers, negatives, decimals and fractions, and rejects non-numbers | engine |
| AN-03b | Number entry: a non-number shows a warning and does not count as answered; a fraction does | browser |
| AN-04 | Rounded answers are accepted within the stated tolerance | engine |
| AN-05 | "Give a value that works" questions accept every valid value and nothing else | engine |
| AN-06 | Plot points: clicking places a point, clicking it again removes it, Clear removes all | browser |
| AN-07 | Answers stay put when moving between questions and after closing and reopening the page | browser |
| AN-08 | Pressing Enter in a number box moves to the next question | browser |
| AN-09 | Previous is disabled on question 1 and Next is disabled on the last question | browser |
| AN-10 | The calculator is blocked on 'No calculator' questions and usable on 'Calculator allowed' ones | browser |
| AN-11 | No hints appear anywhere: during the set or in the review | browser |
| AN-12 | Select-all questions need exactly the right choices; plot questions need exactly the right points in any order | engine |
| AN-13 | Tapping a grid point places exactly that point, in every design (including tilted cards) and on a phone | browser |
| CT-05 | Math shows as formatted math, even with no internet, on every question of a first set in every unit (no raw code, no stray $) | browser |
| PG-01 | The Progress page shows each started unit's skill ladder and every set | browser |
| PG-02 | 'Open all units' opens every unit; turning it off locks unworked units again | browser |
| PG-03/04 | Download a backup, wipe the browser, load the backup: progress comes back exactly | browser |
| PG-05 | Loading a file that isn't a backup (or is broken) shows an error and changes nothing | browser |
| RS-01 | Leaving mid-set and coming back later resumes the same set with answers and time kept | browser |
| RS-02 | Damaged saved data does not crash the app; it starts fresh | browser |
| RS-03 | Saved data from an older version (missing newer fields) still loads | browser |
| RS-04 | If the browser blocks storage, the app still runs a full set (it just can't save) | browser |
| RS-05 | Saved data naming a unit that no longer exists is cleaned up instead of breaking | browser |
| RS-06 | No script errors on any screen in all four designs (Study Desk, Quilt, Metro, Studio) | browser |
| RS-07 | Phone screen (390 px wide): no sideways scrolling on home, question and results screens | browser |
| RS-08 | Seen-question memory is capped so storage can't fill up after months of use | browser |
| RS-09 | The app works with no internet: the only outside request is optional web fonts, and blocking it changes nothing | browser |
| RS-10 | Text is readable in phone dark mode and light mode, in all four designs, on home, question and results screens | browser |
| RV-01 | The review lists every question with the student's answer, the correct answer and a worked solution | browser |
| RV-02 | A wrong multiple-choice answer shows why that choice is wrong | browser |
| RV-03 | 'Missed only' hides the questions answered right; 'All' brings them back | browser |
| RV-05 | Flagging a question shows it under 'For grown-ups'; flagging again removes it | browser |
| RV-06 | An old set can be reopened from the history table | browser |
| RV-07 | A set whose details were cleared from the device shows a clear message instead of breaking | browser |
| SB-01 | Every unit's first set has 25 questions marked 'first check', with no repeats | browser |
| SB-06 | Spaced review: none in Unit 1; 3 marked 'Review · Unit 1' questions in Unit 2 after Unit 1 is finished | browser |
| SB-07 | Spaced review takes 3 questions only from the units given, never basic, and scores separately | engine |
| SB-08 | Review questions come only from finished earlier units, never from later or unfinished ones | browser |
| SC-01 | Submit stays disabled until every question is answered; the counter shows how many are left | browser |
| SC-02 | Submit needs a second tap; changing an answer cancels the first tap | browser |
| SC-03 | Scores are exact: all right gives 25/25 (100%), all wrong gives 0/25 (0%), 13 right gives 52% | browser |
| SC-04 | Review questions are scored separately and never change the unit score or mastery | browser |
| SC-05 | 100% marks the unit Mastered with a Restart button, on the results and on the home card | browser |
| SC-06 | Restart gives brand-new questions (none from the earlier round) and keeps the history | browser |
| SC-07 | After mastering, 'Keep practising' continues the same round without resetting | browser |
| SC-08 | The timer runs only while the set is on screen and pauses when the student leaves | browser |
| SC-09 | Each finished set adds a history row with date, unit, score and time | browser |
| UN-01 | First visit: only Unit 1 is open; every other unit shows Locked and names the unit to finish | browser |
| UN-02 | Finishing a Unit 1 set with every answer wrong still opens Unit 2 | browser |
| UN-03 | Going back to Unit 1 for more practice keeps Unit 2 open (during and after the new set) | browser |
| UN-04 | Restarting a mastered Unit 1 keeps Unit 2 open | browser |
| UN-05 | Units open in WCPSS teaching order 1, 2, 3, 4, 8, 5, 6, 7, 9 | browser |
| UN-06 | A unit the student already worked in stays open even if the parent turns 'open all' off again | browser |
| UN-07 | Only one set at a time: other units can't start while a set is in progress, and a Continue banner shows | browser |
| UN-08 | The unlock message shows only after the first finished set in a unit | browser |
| UN-09 | Finishing the last unit (Unit 9) works with no unlock message and no errors | browser |
| CT-01..CT-04 | Every generator built 300 times; written problems re-solved; shuffled choices; plot answers placeable | content |

## Checked by hand

- RV-04: the review draws your points and the correct points on plot questions.
- A school Chromebook, a phone and an iPad in Safari: finish one set by tapping.
