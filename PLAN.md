# GRADE-8 / MATH-1: Adaptive Practice App Plan

Status: **draft, waiting for your approval**. Nothing will be built until you confirm.

---

## 1. What I checked

| Source | Access | What it gives the app |
|---|---|---|
| WCPSS Math 1 site (Overview Summaries) | Public. The summaries are Open Up Resources "Family Materials" pages shown inside the WCPSS site | 9 units, **66 lessons**, with a learning focus and summary for each lesson |
| Open Up NC Math 1 (the curriculum WCPSS uses) | Public | Every lesson, "Ready, Set, Go" practice for each lesson, unit self-assessments, glossary |
| NC Math 1 Standard Course of Study (NCDPI, Common Core based) | Public | ~50 standards (NC.M1.N-RN, A-SSE, A-APR, A-CED, A-REI, F-IF, F-BF, F-LE, G-GPE, S-ID) |
| NC Check-Ins 2.0, Math 1 (NCDPI) | Public specification only. Actual items are not released | 2 check-ins with 26 items each. Item types: 4-option multiple choice, numeric entry, and technology-enhanced (graphing, etc.). Each has a calculator-inactive and a calculator-active part |
| NC Math 1 EOC test specs (NCDPI) | Public | Weights: Number, Quantity & Algebra 36–40%, Functions 32–36%, Geometry 8–12%, Statistics 18–20% |
| SAT (Digital SAT, College Board) | Public; from my knowledge, not re-checked today | Algebra and Advanced Math, Problem Solving & Data Analysis. Formats: 4-option multiple choice plus student-entered answers (about 25%), with a Desmos calculator built in. Used for the "hard / challenging" tier |

Not reachable: the WCPSS Vocabulary, Extra Practice and Overview Video pages, which I haven't confirmed yet. The Open Up glossary and practice sets cover the same material.

### Units (WCPSS teaching order) and main standards
1. **Sequences** (10 lessons): F-IF.3, F-BF.2, F-BF.1a, F-LE.1
2. **Linear & Exponential Functions** (9): F-LE.1/3/5, F-IF.6, N-RN.2, F-BF.1a
3. **Features of Functions** (5): F-IF.1/2/4/5/7, F-BF.1b
4. **Equations & Inequalities** (6): A-REI.1/3, A-CED.1/4
5. **Connecting Algebra & Geometry** (4, Unit 8 in the book): G-GPE.4/5/6
6. **Systems of Equations & Inequalities** (10): A-CED.3, A-REI.5/6/10/12
7. **Quadratic Functions** (6): F-IF.4/7/9, F-LE.3
8. **Structures of Quadratic Expressions** (8): A-SSE.1/3, A-APR.1/3, A-REI.4/11, F-IF.8a
9. **Modeling Data** (8): S-ID.1/2/3/6/7/8/9

Each unit is broken into **skills** (about 4–8 per unit), and every question is tagged with its skill and standard.

---

## 2. Question sets

- **25 questions per set** by default (adjustable).
- **Difficulty mix for a first set:** 10% basic (3 questions), 30% intermediate (7–8), 60% hard to challenging (15). The hard tier includes SAT-style and Check-In-style questions.
- **Question types**
  - Multiple choice (4 options, wrong answers built from common mistakes)
  - Numeric or expression entry
  - Multi-select
  - **Graph it:** the student plots points, lines, parabolas or inequality regions on a coordinate grid
  - **Read the graph:** the question shows a graph, scatter plot, box plot or histogram
  - Matching / drag-and-drop (e.g., match a table to an equation)
- **Every question stores:** unit, lesson, skill, standard, difficulty, type, calculator on or off, answer, worked solution, hint, and an explanation of the mistake behind each wrong option.

## 3. Adaptive engine ("what to give next")

1. **Diagnostic set:** the first 25-question set for a unit uses the 10/30/60 mix spread across the unit's skills.
2. **Scoring:** after the student submits *all* answers, the engine scores each **skill × level** (basic, intermediate, hard).
3. **Next set:** a completely new set, never repeating a question the student has already seen.
   - If **basic** on a skill is under 80%, most of the next set targets basic questions on that skill. The student stays there until they score 80% or better twice in a row.
   - Then the skill moves up to intermediate and then hard, with the same rule.
   - Strong skills still get a few questions so they don't fade.
4. **Achieved:** a skill answered at 100% on hard questions is marked *achieved* and stops appearing in new sets.
5. **Unit reset:** when the student scores 100% on a full unit set, the unit is marked complete. They can then start a **fresh set**, and the assessment for that unit restarts from a new diagnostic.
6. **Progress screen:** shows each unit and skill as weak, building, strong or achieved, plus the history of past sets.

## 4. Where the questions come from (and staying correct)

- **A. Number generators** (code): templates that create endless numeric variants for sequences, slope, systems, factoring, distance and midpoint, residuals, and more. Answers are calculated by code, so they are always correct.
- **B. Question bank written by Claude:** word problems, SAT-style and graph-reading questions, about 150+ per unit. Each one is checked by a second "answer-checker" pass that re-solves it before it goes into the bank.
- **C. (Optional, later) Live AI generation:** the app asks Claude for brand-new questions on the student's weak skills while they practice. This needs an Anthropic API key and a small server. Estimated cost is roughly $0.25–0.40 per 25-question set on Claude Opus 5.5.

Version 1 uses A + B. C can be added later without changing anything else.

## 5. Built-in tools
- **Graphing grid** (open-source JSXGraph): plot points, draw lines and curves, shade regions, zoom
- **Drawing pad:** freehand sketching, straight lines, eraser, and grid snapping for drawing figures
- **Calculator:** scientific plus graphing. It is turned off for "calculator inactive" questions, like the NC tests
- **Math display** (KaTeX) so fractions, exponents and roots look right

## 6. Folder structure (laid out like a Claude Code project)

```
GRADE-8/
├── README.md                 # what this is, how subjects are added
├── CLAUDE.md                 # rules shared by every subject (tone, grade level, accessibility)
└── MATH-1/
    ├── README.md             # how to run the app, how the engine works
    ├── CLAUDE.md             # Math 1 rules: standards, 10/30/60 mix, question style, answer checking
    ├── PLAN.md               # this file
    ├── .claude/
    │   ├── settings.json     # permissions + defaults (model, set size, mix)
    │   ├── skills/
    │   │   ├── generate-question-set/SKILL.md
    │   │   ├── build-unit-bank/SKILL.md
    │   │   ├── grade-and-diagnose/SKILL.md
    │   │   └── write-explanations/SKILL.md
    │   └── agents/
    │       ├── question-writer.md
    │       ├── answer-checker.md
    │       ├── tutor-coach.md
    │       └── curriculum-mapper.md
    ├── curriculum/
    │   ├── standards.json    # NC.M1 standards
    │   ├── units.json        # 9 units → 66 lessons → skills → standards
    │   └── sources.md        # links to every source
    ├── question-bank/unit-1-sequences/ … unit-9-modeling-data/
    ├── generators/           # number-variant templates per skill
    ├── app/                  # the web app: engine, tools, screens
    └── tests/                # checks that every answer is correct
```
Adding another subject later means adding a folder next to MATH-1 (for example `GRADE-8/SCIENCE/`) with the same layout.

## 7. How the student uses it
A private web page link (works on a laptop or tablet). Progress is saved with the app, so it carries over between sessions. All the files also live in this project folder, and can go to a GitHub repo if you want one.

## 8. Build order
1. Curriculum map (`units.json`, `standards.json`) and the folder skeleton with the CLAUDE.md, skills and agents files
2. App shell: question player, graphing grid, drawing pad, calculator, adaptive engine
3. **Unit 1 Sequences** fully built, then **you review it**
4. Units 2–9
5. (Optional) live AI generation

## 9. Questions for you
1. Is my reading of "achieved" right? A skill answered at 100% stops appearing; a unit at 100% unlocks a fresh restart.
2. Is a web page link the way the student should use the app?
3. Should live AI generation (option C) be included now, or later?
