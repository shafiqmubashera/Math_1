/* Saves progress. Uses the page's account storage when available (so the parent can see it too),
   otherwise this browser. Layout:
     students/<id>                main: unit levels, set in progress, history with times
     students/<id>/sets/<setId>   one finished set: questions, answers, results, times
     students/<id>/seen/<unitId>  fingerprints of every question already shown */
(function (G) {
  const M1 = G.M1;
  const LS = {
    get(k) { try { const v = G.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { G.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  const emptyMain = () => ({ version: 1, units: {}, current: null, history: [], flags: [], openAll: false });

  async function init() {
    let db = null, user = null, uid = null, owner = false;
    try {
      if (G.claude && G.claude.use) {
        [db, user] = await Promise.all([G.claude.use("db"), G.claude.use("user")]);
        if (user) { uid = await user.id(); owner = !!(await user.isOwner()); }
      }
    } catch (e) { db = null; }
    const accountOk = !!(db && uid);
    let mode = accountOk ? "account" : "browser";

    // One write at a time per document; a newer save replaces a queued one.
    const queues = {};
    function write(path, data) {
      const q = (queues[path] = queues[path] || { busy: false, next: null });
      q.next = data;
      if (q.busy) return;
      const pump = async () => {
        q.busy = true;
        while (q.next) {
          const body = q.next; q.next = null;
          try { await db.doc(path).set(body); }
          catch (e) {
            if (e && e.code === "unavailable") { await new Promise((r) => setTimeout(r, 400 + Math.random() * 600)); try { await db.doc(path).set(body); } catch (e2) { fallback(e2); } }
            else fallback(e);
          }
        }
        q.busy = false;
      };
      pump();
    }
    function fallback(e) {
      if (mode === "account") { mode = "browser"; api.onModeChange && api.onModeChange(mode, e); }
    }
    const base = () => "students/" + uid;

    const api = {
      get mode() { return mode; },
      uid, isOwner: owner, user,
      onModeChange: null,
      async loadMain() {
        if (mode === "account") {
          try { const s = await db.doc(base()).get(); if (s.exists) return Object.assign(emptyMain(), JSON.parse(JSON.stringify(s.data()))); }
          catch (e) { fallback(e); }
          const local = LS.get("m1:main");
          return local || emptyMain();
        }
        return LS.get("m1:main") || emptyMain();
      },
      saveMain(main) {
        LS.set("m1:main", main); // always keep a browser copy as a backup
        if (mode === "account") write(base(), main);
      },
      async loadSeen(unitId) {
        const local = LS.get("m1:seen:" + unitId) || [];
        if (mode !== "account") return local;
        try { const s = await db.doc(base() + "/seen/" + unitId).get(); const remote = s.exists ? s.data().fps || [] : []; return Array.from(new Set(remote.concat(local))); }
        catch (e) { return local; }
      },
      saveSeen(unitId, fps) {
        const trimmed = fps.slice(-4000); // ~160 sets of history; older questions may come back eventually
        LS.set("m1:seen:" + unitId, trimmed);
        if (mode === "account") write(base() + "/seen/" + unitId, { fps: trimmed });
      },
      saveSet(rec) {
        const ids = LS.get("m1:setids") || [];
        ids.push(rec.id);
        while (ids.length > 30) { const old = ids.shift(); try { G.localStorage.removeItem("m1:set:" + old); } catch (e) {} }
        LS.set("m1:setids", ids); LS.set("m1:set:" + rec.id, rec);
        if (mode === "account") write(base() + "/sets/" + rec.id, rec);
      },
      async loadSet(studentId, setId) {
        if (mode === "account") {
          try { const s = await db.doc("students/" + (studentId || uid) + "/sets/" + setId).get(); if (s.exists) return s.data(); } catch (e) {}
        }
        return LS.get("m1:set:" + setId);
      },
      // Parent view: the owner can read every student's main document.
      async listStudents() {
        if (mode !== "account" || !owner) return [];
        try {
          const snap = await db.collection("students").get();
          return snap.docs.filter((d) => d.exists).map((d) => ({ id: d.id, main: d.data() }));
        } catch (e) { return []; }
      },
      async names(ids) {
        if (!user || !ids.length || !user.profiles) return {};
        try { const ps = await user.profiles(ids); const out = {}; for (const id of ids) out[id] = (ps[id] && ps[id].name) || ""; return out; }
        catch (e) { return {}; }
      },
    };
    return api;
  }

  M1.store = { init, emptyMain };
})(typeof window !== "undefined" ? window : globalThis);
