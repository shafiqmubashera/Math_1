/* Unit 6 Quadratic Functions: written question bank (context and SAT-style items that don't fit a template).
   Every item is re-solved in tests/run-tests.mjs (see BANK_CHECKS) before it ships. */
(function (G) {
  const M1 = G.M1;
  const bank = [
    { id: "u6b01", skill: "u6.features", level: "challenge", type: "numeric", calc: true, lesson: 5, standard: "NC.M1.F-IF.4", answer: 3,
      prompt: "A ball's height, in feet, after $t$ seconds is $h(t) = -16t^2 + 32t + 48$. After how many seconds does the ball hit the ground?",
      hint: "The ball hits the ground when $h(t) = 0$. Factor out $-16$ first.", solution: "$-16(t^2 - 2t - 3) = -16(t - 3)(t + 1) = 0$. Time is positive, so $t = \\mathbf{3}$ seconds." },
    { id: "u6b02", skill: "u6.features", level: "hard", type: "mcq", calc: false, lesson: 4, standard: "NC.M1.F-IF.7",
      prompt: "Which function has its vertex at $(2, -5)$?",
      choices: ["$y = (x - 2)^2 - 5$", "$y = (x + 2)^2 - 5$", "$y = (x - 2)^2 + 5$", "$y = (x + 5)^2 + 2$"], answer: 0,
      why: ["Correct.", "$(x + 2)^2$ puts the vertex at $x = -2$.", "$+5$ puts the vertex at $y = 5$.", "The coordinates are mixed up."],
      hint: "In $(x - h)^2 + k$, the vertex is $(h, k)$.", solution: "$h = 2$ and $k = -5$: **$y = (x - 2)^2 - 5$**." },
    { id: "u6b03", skill: "u6.diffs", level: "hard", type: "numeric", calc: false, lesson: 2, standard: "NC.M1.F-LE.1", answer: 121,
      prompt: "For $x = 1, 2, 3, 4$ the values of a quadratic function are $4, 9, 16, 25$. What is the value when $x = 10$?",
      hint: "Look for a pattern in the values: what are they squares of?", solution: "The values are $(x + 1)^2$. At $x = 10$: $11^2 = \\mathbf{121}$." },
    { id: "u6b04", skill: "u6.model", level: "challenge", type: "numeric", calc: true, lesson: 6, standard: "NC.M1.A-CED.2", answer: 2250,
      prompt: "A theater sells 200 tickets at \\$10 each. For every \\$1 the price goes up, it sells 10 fewer tickets. Revenue is $R(x) = (10 + x)(200 - 10x)$, where $x$ is the number of \\$1 increases. What is the greatest possible revenue, in dollars?",
      hint: "The zeros are $x = -10$ and $x = 20$. The vertex is halfway between.", solution: "Vertex at $x = \\frac{-10 + 20}{2} = 5$. $R(5) = 15 \\cdot 150 = \\mathbf{2250}$ dollars." },
    { id: "u6b05", skill: "u6.compare", level: "challenge", type: "mcq", calc: false, lesson: 6, standard: "NC.M1.F-LE.3",
      prompt: "Which function is greatest for very large values of $x$?",
      choices: ["$f(x) = 100x + 1000$", "$g(x) = 5x^2$", "$h(x) = 1.1^x$", "$k(x) = 50x$"], answer: 2,
      why: ["Linear growth is passed by quadratic and exponential growth.", "Exponential growth with a factor above 1 eventually passes any quadratic.", "Correct.", "Linear growth is passed by quadratic and exponential growth."],
      hint: "Linear adds, quadratic adds more and more, exponential multiplies.", solution: "Exponential growth eventually beats quadratic, which beats linear. **$h(x) = 1.1^x$**, even though it starts small." },
    { id: "u6b06", skill: "u6.features", level: "challenge", type: "numeric", calc: false, lesson: 4, standard: "NC.M1.F-IF.4", answer: 9,
      prompt: "The vertex of $f(x) = x^2 - 6x + c$ is on the $x$-axis. What is $c$?",
      hint: "The vertex is at $x = 3$. Its $y$-value must be 0.", solution: "Vertex $x = -\\frac{-6}{2} = 3$. $f(3) = 9 - 18 + c = 0$, so $c = \\mathbf{9}$." },
    { id: "u6b07", skill: "u6.diffs", level: "challenge", type: "numeric", calc: false, lesson: 2, standard: "NC.M1.F-LE.1", answer: 23,
      prompt: "A quadratic function has $f(0) = 2$, $f(1) = 5$ and $f(2) = 12$. What is $f(3)$?",
      hint: "Use first and second differences.", solution: "First differences 3, 7; second difference 4. Next first difference: 11. $f(3) = 12 + 11 = \\mathbf{23}$." },
    { id: "u6b08", skill: "u6.model", level: "hard", type: "numeric", calc: false, lesson: 3, standard: "NC.M1.A-CED.2", answer: 6,
      prompt: "A rectangle's length is 3 cm more than its width, and its area is 54 square cm. What is its width, in cm?",
      hint: "Try whole numbers: $w(w + 3) = 54$.", solution: "$6 \\cdot 9 = 54$, so the width is **6** cm." },
    { id: "u6b09", skill: "u6.features", level: "hard", type: "multi", calc: false, lesson: 4, standard: "NC.M1.F-IF.7",
      prompt: "$f(x) = (x - 1)(x - 7)$. Select **all** true statements.",
      choices: ["The zeros are 1 and 7.", "The vertex is $(4, -9)$.", "The $y$-intercept is 7.", "The graph opens down.", "The axis of symmetry is $x = 4$."], answer: [0, 1, 2, 4],
      why: ["", "", "", "$a = 1 > 0$, so it opens up.", ""],
      hint: "Zeros from the factors; the vertex halfway between; the $y$-intercept at $x = 0$.", solution: "Zeros 1 and 7; axis $x = 4$; $f(4) = 3(-3) = -9$; $f(0) = (-1)(-7) = 7$; opens up. True: the zeros, the vertex, the $y$-intercept and the axis." },
    { id: "u6b10", skill: "u6.compare", level: "hard", type: "numeric", calc: false, lesson: 6, standard: "NC.M1.F-IF.9", answer: 8,
      prompt: "What is the average rate of change of $f(x) = x^2$ from $x = 2$ to $x = 6$?",
      hint: "$\\frac{f(6) - f(2)}{6 - 2}$", solution: "$\\frac{36 - 4}{4} = \\mathbf{8}$" },
  ];
  M1.units.u6 = Object.assign(M1.units.u6 || {}, { bank });
})(typeof window !== "undefined" ? window : globalThis);
