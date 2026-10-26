/* Unit 8 Connecting Algebra & Geometry: written question bank (context and SAT-style items that don't fit a template).
   Every item is re-solved in tests/run-tests.mjs (see BANK_CHECKS) before it ships. */
(function (G) {
  const M1 = G.M1;
  const bank = [
    { id: "u8b01", skill: "u8.distance", level: "hard", type: "numeric", calc: true, lesson: 1, standard: "NC.M1.G-GPE.4", answer: 13,
      prompt: "A circle has center $(2, -1)$ and passes through $(7, 11)$. What is its radius?",
      hint: "The radius is the distance from the center to any point on the circle.", solution: "$\\sqrt{(7 - 2)^2 + (11 - (-1))^2} = \\sqrt{25 + 144} = \\sqrt{169} = \\mathbf{13}$" },
    { id: "u8b02", skill: "u8.midpoint", level: "hard", type: "numeric", calc: false, lesson: 2, standard: "NC.M1.G-GPE.6", answer: -1,
      prompt: "$M(3, -2)$ is the midpoint of $\\overline{AB}$. $A = (-1, 4)$ and $B = (x, y)$. What is $x + y$?",
      hint: "Go from A to M, then the same again.", solution: "From $A$ to $M$: $+4$ in $x$, $-6$ in $y$. $B = (7, -8)$, so $x + y = \\mathbf{-1}$." },
    { id: "u8b03", skill: "u8.slopes", level: "challenge", type: "mcq", calc: false, lesson: 3, standard: "NC.M1.G-GPE.5",
      prompt: "Line $\\ell$ passes through $(0, 4)$ and $(6, 0)$. Which line is perpendicular to $\\ell$?",
      choices: ["$y = \\frac{3}{2}x + 1$", "$y = -\\frac{2}{3}x + 1$", "$y = \\frac{2}{3}x - 4$", "$y = -\\frac{3}{2}x$"], answer: 0,
      why: ["Correct.", "That slope equals $\\ell$'s slope, so the lines are parallel.", "Change the sign and flip: $-\\frac{2}{3} \\to \\frac{3}{2}$.", "Flip and change the sign."],
      hint: "Find the slope of $\\ell$ first.", solution: "Slope of $\\ell$: $\\frac{0 - 4}{6 - 0} = -\\frac{2}{3}$. Perpendicular slope: $\\frac{3}{2}$. **$y = \\frac{3}{2}x + 1$**" },
    { id: "u8b04", skill: "u8.polygons", level: "hard", type: "numeric", calc: false, lesson: 4, standard: "NC.M1.G-GPE.4", answer: 10,
      prompt: "A rectangle has vertices $(0, 0)$, $(8, 0)$, $(8, 6)$ and $(0, 6)$. How long is each diagonal?",
      hint: "A diagonal joins opposite corners.", solution: "From $(0, 0)$ to $(8, 6)$: $\\sqrt{64 + 36} = \\mathbf{10}$." },
    { id: "u8b05", skill: "u8.polygons", level: "challenge", type: "mcq", calc: false, lesson: 4, standard: "NC.M1.G-GPE.4",
      prompt: "$A(1, 1)$, $B(4, 5)$ and $C(8, 2)$ are three vertices of parallelogram $ABCD$. What is $D$?",
      choices: ["$(5, -2)$", "$(11, 6)$", "$(-3, 4)$", "$(5, 2)$"], answer: 0,
      why: ["Correct.", "That makes $ABDC$ a parallelogram, with the vertices in a different order.", "That makes $D$ opposite $C$ in a different parallelogram.", "Check the $y$-coordinate: from $B$ to $C$ is $-3$."],
      hint: "In $ABCD$, the move from $B$ to $C$ matches the move from $A$ to $D$.", solution: "$B$ to $C$: $+4$, $-3$. From $A$: $D = (1 + 4, 1 - 3) = \\mathbf{(5, -2)}$." },
    { id: "u8b06", skill: "u8.distance", level: "hard", type: "numeric", calc: true, lesson: 1, standard: "NC.M1.G-GPE.4", answer: 16,
      prompt: "What is the perimeter of the triangle with vertices $(0, 0)$, $(6, 0)$ and $(3, 4)$?",
      hint: "Find all three side lengths.", solution: "Sides: 6, $\\sqrt{9 + 16} = 5$, and $\\sqrt{9 + 16} = 5$. Perimeter $= \\mathbf{16}$." },
    { id: "u8b07", skill: "u8.midpoint", level: "challenge", type: "numeric", calc: false, lesson: 2, standard: "NC.M1.G-GPE.6", answer: -3,
      prompt: "$A = (-4, 1)$ and $B = (11, -9)$. Point $P$ is on $\\overline{AB}$ and $AP$ is $\\frac{2}{5}$ of $AB$. What is the $y$-coordinate of $P$?",
      hint: "Find $\\frac{2}{5}$ of the change in $y$.", solution: "Change in $y$: $-10$. $\\frac{2}{5}(-10) = -4$. $y = 1 - 4 = \\mathbf{-3}$." },
    { id: "u8b08", skill: "u8.slopes", level: "hard", type: "numeric", calc: false, lesson: 3, standard: "NC.M1.G-GPE.5", answer: 6,
      prompt: "The line through $(2, k)$ and $(6, 9)$ is parallel to $3x - 4y = 12$. What is $k$?",
      hint: "Find the slope of $3x - 4y = 12$ first.", solution: "$y = \\frac{3}{4}x - 3$, slope $\\frac{3}{4}$. $\\frac{9 - k}{6 - 2} = \\frac{3}{4}$, so $9 - k = 3$ and $k = \\mathbf{6}$." },
    { id: "u8b09", skill: "u8.polygons", level: "hard", type: "mcq", calc: false, lesson: 4, standard: "NC.M1.G-GPE.4",
      prompt: "Which describes the triangle with vertices $(-2, 1)$, $(2, 4)$ and $(5, 0)$?",
      choices: ["Right and isosceles", "Equilateral", "Right and scalene", "Isosceles but not right"], answer: 0,
      why: ["Correct.", "The third side is $\\sqrt{50}$, not 5.", "Two sides are both 5.", "$25 + 25 = 50$, so it is right."],
      hint: "Find the three squared side lengths.", solution: "Squared sides: $16 + 9 = 25$, $9 + 16 = 25$, $49 + 1 = 50$. Two equal sides, and $25 + 25 = 50$: **right and isosceles**." },
    { id: "u8b10", skill: "u8.distance", level: "challenge", type: "numeric", calc: false, lesson: 1, standard: "NC.M1.G-GPE.4", answer: 12,
      prompt: "How many points with whole-number (integer) coordinates are exactly 5 units from the origin?",
      hint: "You need $x^2 + y^2 = 25$. Think about $3$-$4$-$5$, and about points on the axes.", solution: "$(\\pm 3, \\pm 4)$ and $(\\pm 4, \\pm 3)$ give 8 points; $(\\pm 5, 0)$ and $(0, \\pm 5)$ give 4 more. **12** points." },
  ];
  M1.units.u8 = Object.assign(M1.units.u8 || {}, { bank });
})(typeof window !== "undefined" ? window : globalThis);
