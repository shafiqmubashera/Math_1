/* Unit 5 Systems of Equations & Inequalities: written question bank (context and SAT-style items that don't fit a template).
   Every item is re-solved in tests/run-tests.mjs (see BANK_CHECKS) before it ships. */
(function (G) {
  const M1 = G.M1;
  const bank = [
    { id: "u5b01", skill: "u5.count", level: "challenge", type: "numeric", calc: false, lesson: 9, standard: "NC.M1.A-REI.6", answer: 24,
      prompt: "The system $2x + 3y = 12$ and $4x + 6y = k$ has infinitely many solutions. What is $k$?",
      hint: "How is the second left side related to the first?", solution: "$4x + 6y$ is $2(2x + 3y)$, so the equations must be the same line: $k = 2(12) = \\mathbf{24}$." },
    { id: "u5b02", skill: "u5.solve", level: "challenge", type: "numeric", calc: false, lesson: 4, standard: "NC.M1.A-REI.6", answer: 40, think: true,
      prompt: "If $x + y = 10$ and $x - y = 4$, what is $x^2 - y^2$?",
      hint: "$x^2 - y^2 = (x + y)(x - y)$.", solution: "$x^2 - y^2 = (x + y)(x - y) = 10 \\cdot 4 = \\mathbf{40}$. (Or solve: $x = 7$, $y = 3$, $49 - 9 = 40$.)" },
    { id: "u5b03", skill: "u5.model", level: "hard", type: "numeric", calc: false, lesson: 5, standard: "NC.M1.A-CED.3", answer: 8,
      prompt: "A test has 20 questions worth 100 points in all. Some questions are worth 3 points and the rest are worth 8 points. How many 8-point questions are there?",
      hint: "Write one equation for the number of questions and one for the points.", solution: "$a + b = 20$ and $3a + 8b = 100$. Then $3(20 - b) + 8b = 100$, so $5b = 40$ and $b = \\mathbf{8}$." },
    { id: "u5b04", skill: "u5.model", level: "challenge", type: "numeric", calc: false, lesson: 5, standard: "NC.M1.A-CED.3", answer: 41,
      prompt: "Two numbers add to 56. The larger number is 4 less than 3 times the smaller. What is the larger number?",
      hint: "Let $s$ be the smaller number.", solution: "$s + (3s - 4) = 56$, so $4s = 60$, $s = 15$, and the larger is $3(15) - 4 = \\mathbf{41}$." },
    { id: "u5b05", skill: "u5.ineq2", level: "hard", type: "mcq", calc: false, lesson: 7, standard: "NC.M1.A-REI.12",
      prompt: "Which point is a solution of the system $y \\ge 2x - 3$ and $y < -x + 4$?",
      choices: ["$(0, 0)$", "$(3, 2)$", "$(-1, 6)$", "$(4, -2)$"], answer: 0,
      why: ["Correct.", "$2 \\ge 3$ is false.", "$6 < 5$ is false.", "$-2 \\ge 5$ is false."],
      hint: "Check each point in both inequalities.", solution: "$(0, 0)$: $0 \\ge -3$ ✓ and $0 < 4$ ✓. **$(0, 0)$**" },
    { id: "u5b06", skill: "u5.count", level: "hard", type: "mcq", calc: false, lesson: 9, standard: "NC.M1.A-REI.6",
      prompt: "Which equation, together with $3x - 2y = 8$, makes a system with **no** solution?",
      choices: ["$6x - 4y = 10$", "$6x - 4y = 16$", "$2x - 3y = 8$", "$3x + 2y = 8$"], answer: 0,
      why: ["Correct.", "That is the same line: infinitely many solutions.", "Different slope: one solution.", "Different slope: one solution."],
      hint: "No solution: same slope, different line.", solution: "$6x - 4y = 10$ is $3x - 2y = 5$: same slope as $3x - 2y = 8$ but a different line. **$6x - 4y = 10$**" },
    { id: "u5b07", skill: "u5.standard", level: "challenge", type: "numeric", calc: false, lesson: 2, standard: "NC.M1.A-CED.2", answer: 40,
      prompt: "The line $4x + 5y = 40$ and the two axes form a triangle. What is its area?",
      hint: "Find both intercepts. They are the legs of a right triangle.", solution: "$x$-intercept 10, $y$-intercept 8. Area $= \\frac{1}{2}(10)(8) = \\mathbf{40}$." },
    { id: "u5b08", skill: "u5.model", level: "challenge", type: "numeric", calc: true, lesson: 5, standard: "NC.M1.A-CED.3", answer: 150,
      prompt: "Rental A costs \\$30 plus \\$0.20 per mile. Rental B costs \\$45 plus \\$0.10 per mile. For how many miles do the two rentals cost the same?",
      hint: "Set the two costs equal.", solution: "$30 + 0.2m = 45 + 0.1m$, so $0.1m = 15$ and $m = \\mathbf{150}$." },
    { id: "u5b09", skill: "u5.solve", level: "hard", type: "numeric", calc: false, lesson: 4, standard: "NC.M1.A-REI.5", answer: 3,
      prompt: "Solve the system. What is $x$?<br>$3x - y = 7$<br>$2x + 3y = 12$",
      hint: "Multiply the first equation by 3, then add.", solution: "$9x - 3y = 21$. Add $2x + 3y = 12$: $11x = 33$, so $x = \\mathbf{3}$ (and $y = 2$)." },
    { id: "u5b10", skill: "u5.ineq2", level: "challenge", type: "numeric", calc: true, lesson: 8, standard: "NC.M1.A-CED.3", answer: 26000,
      prompt: "A farmer plants corn ($c$ acres) and soybeans ($s$ acres) on at most 100 acres. She must plant at least 20 and at most 60 acres of corn. Profit is \\$300 per acre of corn and \\$200 per acre of soybeans. What is the greatest possible profit, in dollars?",
      hint: "Corn earns more per acre, but corn is capped. Fill the rest with soybeans.", solution: "Use the most corn allowed, 60 acres, and fill the rest with 40 acres of soybeans: $300(60) + 200(40) = \\mathbf{26000}$." },
  ];
  M1.units.u5 = Object.assign(M1.units.u5 || {}, { bank });
})(typeof window !== "undefined" ? window : globalThis);
