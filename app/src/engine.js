/* Adaptive engine: builds sets, grades them, and moves each skill through its levels.
   Rules are documented in CLAUDE.md and .claude/skills/grade-and-diagnose. */
(function (G) {
  const M1 = G.M1;
  const Q = M1.qlib;

  const CONFIG = (M1.config = Object.assign({
    setSize: 25,
    diagnostic: { basic: 3, intermediate: 7, hard: 8, challenge: 7 }, // 10% / 30% / 60%
    tierWeight: [4, 2, 1],         // basic-focus skills get the most questions
    minSlots: [2, 2, 3],           // per skill, by focus tier
    upShare: 0.3,                  // share of a skill's questions one tier above its focus
    secureAt: 0.8,                 // accuracy that counts toward securing a tier
    secureStreak: 2,               // sets in a row needed to secure a tier
    achieveRun: 3,                 // hard/challenge answers in a row, all correct
    reviewCount: 3,                // spaced-review questions from earlier finished units, scored separately
  }, M1.config || {}));

  const LEVELS = ["basic", "intermediate", "hard", "challenge"];
  const TIER_NAMES = ["Basic", "Intermediate", "Hard"];
  const tierOf = (level) => Math.min(2, LEVELS.indexOf(level));

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function unitInfo(unitId) {
    const u = (M1.curriculum.units || []).find((x) => x.id === unitId);
    if (!u) throw new Error("unknown unit " + unitId);
    return u;
  }

  function instantiate(g, seed) {
    const r = Q.rng((seed * 7919 + hash(g.id)) >>> 0);
    const q0 = g.make(r);
    const q = Object.assign({}, q0, {
      id: g.id + ":" + seed, gen: g.id, seed, skill: g.skill, level: g.level,
      type: q0.type || g.type, calc: q0.calc != null ? q0.calc : g.calc,
      fp: g.id + "|" + JSON.stringify(q0.key),
    });
    delete q.key;
    return q;
  }

  function bankQuestion(item) {
    return Object.assign({}, item, { gen: "bank", fp: "bank|" + item.id });
  }

  function newUnitState(unitId, prev) {
    const u = unitInfo(unitId);
    const skills = {};
    for (const s of u.skills) skills[s.id] = { focus: 0, streak: 0, hardRun: 0, achieved: false, right: 0, total: 0 };
    return { unitId, round: prev ? prev.round + 1 : 1, sets: 0, mastered: false, skills };
  }

  // ───────────── Building a set ─────────────
  function buildSet(unitId, state, seenList, seed) {
    const u = unitInfo(unitId);
    const content = M1.units[unitId] || {};
    const gens = content.generators || [];
    const bank = (content.bank || []).map(bankQuestion);
    const r = Q.rng(seed >>> 0);
    const seen = new Set(seenList || []);
    const diagnostic = state.sets === 0;

    let active = u.skills.map((s) => s.id).filter((id) => !state.skills[id].achieved);
    if (!active.length) active = u.skills.map((s) => s.id); // everything achieved: keep practising hard questions

    // slots: [{skill, level}]
    let slots = [];
    if (diagnostic) {
      // Walk one shuffled skill order across the level ladder so every skill is seen at 2–3 different levels.
      const order = r.shuffle(active);
      let k = 0;
      for (const level of LEVELS) for (let i = 0; i < CONFIG.diagnostic[level]; i++, k++) slots.push({ skill: order[k % order.length], level });
    } else {
      const focus = (id) => (state.skills[id].achieved ? 2 : state.skills[id].focus);
      const weights = active.map((id) => CONFIG.tierWeight[focus(id)]);
      let counts = active.map((id) => CONFIG.minSlots[focus(id)]);
      let used = counts.reduce((a, b) => a + b, 0);
      while (used > CONFIG.setSize) { // too many skills for the minimums: trim the strongest first
        const i = counts.findIndex((c, k) => c > 1 && focus(active[k]) === Math.max(...active.map(focus)));
        counts[i >= 0 ? i : counts.indexOf(Math.max(...counts))]--; used--;
      }
      const totalW = weights.reduce((a, b) => a + b, 0);
      const extra = CONFIG.setSize - used;
      const shares = weights.map((w) => (w / totalW) * extra);
      counts = counts.map((c, i) => c + Math.floor(shares[i]));
      const rema = shares.map((s, i) => [s - Math.floor(s), i]).sort((a, b) => b[0] - a[0]);
      let left = CONFIG.setSize - counts.reduce((a, b) => a + b, 0);
      for (let k = 0; left > 0; k++, left--) counts[rema[k % rema.length][1]]++;
      active.forEach((id, i) => {
        const f = focus(id);
        const up = f < 2 ? Math.round(counts[i] * CONFIG.upShare) : 0;
        for (let k = 0; k < counts[i]; k++) {
          const tier = k < counts[i] - up ? f : f + 1;
          const level = tier === 2 ? (r.chance(0.5) ? "hard" : "challenge") : LEVELS[tier];
          slots.push({ skill: id, level });
        }
      });
    }

    // Fill each slot with a fresh question, keeping the question types mixed.
    const typeCount = {};
    const inSet = new Set();
    const questions = [];
    for (const slot of slots) {
      const q = pickQuestion(slot, gens, bank, r, seen, inSet, typeCount);
      if (!q) continue;
      questions.push(q);
      inSet.add(q.fp);
      typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    }
    // Ramp up: easier tiers first, shuffled within a tier.
    const ordered = [];
    for (const lv of LEVELS) ordered.push(...r.shuffle(questions.filter((q) => q.level === lv)));
    return { id: "s" + Date.now().toString(36) + r.int(100, 999), unitId, round: state.round, setNumber: state.sets + 1,
      diagnostic, createdAt: new Date().toISOString(), questions: ordered };
  }

  // Spaced review: a few questions from units the student already finished, added after the 25.
  // They are marked review and never count toward the unit's score, levels or mastery.
  function reviewQuestions(unitIds, seenList, seed, n = CONFIG.reviewCount) {
    const r = Q.rng(seed >>> 0);
    const seen = new Set(seenList || []);
    const pool = unitIds.filter((id) => ((M1.units[id] || {}).generators || []).length);
    const out = [];
    for (let k = 0; k < n * 4 && out.length < n && pool.length; k++) {
      const uid = pool[(k + r.int(0, pool.length - 1)) % pool.length];
      const gens = M1.units[uid].generators.filter((g) => g.level !== "basic");
      const g = r.pick(gens);
      let q;
      try { q = instantiate(g, r.int(1, 2e9)); } catch (e) { continue; }
      if (seen.has(q.fp) || out.some((x) => x.fp === q.fp || x.gen === q.gen)) continue;
      out.push(Object.assign(q, { review: true, reviewUnit: uid }));
    }
    return out;
  }

  // Written bank items store the right choice first; shuffle choices (and their notes) when one is picked.
  function shuffleChoices(q, r) {
    if (!Array.isArray(q.choices) || q.noShuffle) return q;
    const order = r.shuffle(q.choices.map((_, i) => i));
    const out = Object.assign({}, q, { choices: order.map((i) => q.choices[i]) });
    if (Array.isArray(q.why)) out.why = order.map((i) => q.why[i]);
    out.answer = Array.isArray(q.answer) ? q.answer.map((a) => order.indexOf(a)).sort((x, y) => x - y) : order.indexOf(q.answer);
    return out;
  }

  function pickQuestion(slot, gens, bank, r, seen, inSet, typeCount) {
    const levelsToTry = [slot.level].concat(nearby(slot.level));
    for (const level of levelsToTry) {
      const cands = gens.filter((g) => g.skill === slot.skill && g.level === level);
      const bankC = bank.filter((b) => b.skill === slot.skill && b.level === level && !seen.has(b.fp) && !inSet.has(b.fp));
      // Least-used type first so a set mixes mcq, numeric, graphs and multi-select.
      const ranked = r.shuffle(cands).sort((a, b) => (typeCount[a.type] || 0) - (typeCount[b.type] || 0));
      if (bankC.length && r.chance(0.35)) return shuffleChoices(r.pick(bankC), r);
      for (const g of ranked) {
        for (let tries = 0; tries < 40; tries++) {
          let q;
          try { q = instantiate(g, r.int(1, 2e9)); } catch (e) { continue; }
          if (!seen.has(q.fp) && !inSet.has(q.fp)) return q;
        }
      }
      if (bankC.length) return shuffleChoices(r.pick(bankC), r);
    }
    return null;
  }
  function nearby(level) {
    const i = LEVELS.indexOf(level);
    return [i + 1, i - 1, i + 2, i - 2, i + 3, i - 3].filter((k) => k >= 0 && k < 4).map((k) => LEVELS[k]);
  }

  // ───────────── Grading ─────────────
  function isCorrect(q, resp) {
    if (resp == null || resp === "") return false;
    switch (q.type) {
      case "mcq":
      case "graph-mcq":
        return Number(resp) === q.answer;
      case "multi": {
        const a = (resp || []).slice().sort((x, y) => x - y), b = q.answer.slice().sort((x, y) => x - y);
        return a.length === b.length && a.every((v, i) => v === b[i]);
      }
      case "numeric": {
        const v = Q.parseNum(resp);
        if (!Number.isFinite(v)) return false;
        if (q.accept) return accepts(q.accept, v); // "make it true" items: any value in the allowed set
        const tol = q.tol != null ? q.tol : 1e-6 * Math.max(1, Math.abs(q.answer));
        return Math.abs(v - q.answer) <= tol;
      }
      case "plot": {
        const key = (p) => p[0].toFixed(4) + "," + Number(p[1]).toFixed(4);
        const want = new Set(q.answer.map(key)), got = new Set((resp || []).map(key));
        return want.size === got.size && [...want].every((k) => got.has(k));
      }
    }
    return false;
  }

  // accept: { in: [values] } or { lo, hi, loOpen, hiOpen, int, not: [values] }. Missing bounds are unbounded.
  function accepts(a, v) {
    const eps = 1e-9;
    if (a.in) return a.in.some((x) => Math.abs(x - v) < eps);
    if (a.lo != null && (a.loOpen ? v <= a.lo + eps : v < a.lo - eps)) return false;
    if (a.hi != null && (a.hiOpen ? v >= a.hi - eps : v > a.hi + eps)) return false;
    if (a.int && Math.abs(v - Math.round(v)) > eps) return false;
    if ((a.not || []).some((x) => Math.abs(x - v) < eps)) return false;
    return true;
  }

  function gradeSet(set, answers) {
    const results = set.questions.map((q, i) => isCorrect(q, answers[i]));
    const bySkill = {};
    const review = { right: 0, total: 0 };
    set.questions.forEach((q, i) => {
      if (q.review) { review.total++; if (results[i]) review.right++; return; }
      const s = (bySkill[q.skill] = bySkill[q.skill] || { right: 0, total: 0, tiers: [[0, 0], [0, 0], [0, 0]] });
      const t = tierOf(q.level);
      s.total++; s.tiers[t][1]++;
      if (results[i]) { s.right++; s.tiers[t][0]++; }
    });
    const main = set.questions.map((q, i) => (q.review ? null : results[i])).filter((x) => x !== null);
    const right = main.filter(Boolean).length;
    return { results, right, total: main.length, percent: Math.round((100 * right) / main.length), bySkill, review };
  }

  // ───────────── Moving levels ─────────────
  function updateState(state, set, grade) {
    const st = JSON.parse(JSON.stringify(state));
    const events = [];
    const name = (id) => (unitInfo(st.unitId).skills.find((s) => s.id === id) || {}).name || id;

    for (const [id, g] of Object.entries(grade.bySkill)) {
      const sk = st.skills[id];
      if (!sk) continue;
      sk.right += g.right; sk.total += g.total;
      const acc = (t) => (g.tiers[t][1] ? g.tiers[t][0] / g.tiers[t][1] : null);

      if (set.diagnostic) {
        // Placement: start at the lowest tier the student hasn't shown.
        const a0 = acc(0), a1 = acc(1);
        if (a0 !== null && a0 < CONFIG.secureAt) sk.focus = 0;
        // No basic question for this skill and under half the intermediate ones right: start at Basic.
        else if (a1 !== null && a1 < CONFIG.secureAt) sk.focus = a0 === null && a1 < 0.5 ? 0 : 1;
        else if (a1 === null) sk.focus = a0 === null ? 0 : 1;
        else sk.focus = 2;
        sk.streak = 0;
        events.push({ kind: "placed", skill: id, text: `${name(id)}: starting at ${TIER_NAMES[sk.focus]}` });
      } else if (!sk.achieved) {
        const a = acc(sk.focus);
        if (a !== null) {
          sk.streak = a >= CONFIG.secureAt ? sk.streak + 1 : 0;
          if (sk.streak >= CONFIG.secureStreak && sk.focus < 2) {
            sk.focus++; sk.streak = 0;
            events.push({ kind: "up", skill: id, text: `${name(id)}: moved up to ${TIER_NAMES[sk.focus]}` });
          } else if (a < 0.5 && sk.focus > 0 && g.tiers[sk.focus][1] >= 2) {
            // Struggling badly at this tier: step back to rebuild the base.
            sk.focus--; sk.streak = 0;
            events.push({ kind: "down", skill: id, text: `${name(id)}: extra practice at ${TIER_NAMES[sk.focus]}` });
          }
        }
      }
    }
    // Achieved: a run of hard/challenge answers, all correct, while at the Hard tier.
    set.questions.forEach((q, i) => {
      const sk = st.skills[q.skill];
      if (!sk || q.review || tierOf(q.level) < 2) return;
      sk.hardRun = grade.results[i] ? sk.hardRun + 1 : 0;
    });
    for (const [id, sk] of Object.entries(st.skills)) {
      if (!sk.achieved && sk.focus === 2 && sk.hardRun >= CONFIG.achieveRun && grade.bySkill[id] && grade.bySkill[id].tiers[2][0] === grade.bySkill[id].tiers[2][1]) {
        sk.achieved = true;
        events.push({ kind: "achieved", skill: id, text: `${name(id)}: achieved` });
      }
    }
    st.sets++;
    if (grade.percent === 100) {
      st.mastered = true;
      events.push({ kind: "mastered", text: "Unit mastered: every question correct" });
    }
    return { state: st, events };
  }

  M1.engine = { accepts, reviewQuestions, LEVELS, TIER_NAMES, tierOf, instantiate, newUnitState, buildSet, isCorrect, gradeSet, updateState, unitInfo, hash };
})(typeof window !== "undefined" ? window : globalThis);
