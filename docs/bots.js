/* rpsf bots. Each bot: (state, rng) -> move. rng defaults to Math.random. */
(function (root) {
  'use strict';
  const E = (typeof require !== 'undefined') ? require('./engine.js') : root.RPSF;

  const pickRandom = (arr, rng) => arr[Math.floor(rng() * arr.length)];

  // silly: random, but won't throw a card at a wall every single time
  function foamy(s, rng) {
    rng = rng || Math.random;
    const moves = E.legalMoves(s);
    const atks = moves.filter(m => m.k === 'atk');
    if (atks.length && rng() < 0.6) return pickRandom(atks, rng);
    return pickRandom(moves, rng);
  }

  function cardValue(s, i) {
    if (s.h[i] <= 0) return 0;
    const f = s.t[i] === E.F ? 0.6 : 1;
    return f * (2 + 1.0 * s.h[i] + 1.6 * s.a[i] + 1.3 * s.c[i]);
  }
  function evaluate(s, me) {
    const r = E.result(s);
    if (r !== null) return r === 0 ? 0 : (r === me + 1 ? 10000 : -10000);
    let v = 0;
    for (let i = 0; i < s.h.length; i++) v += (E.side(s, i) === me ? 1 : -1) * cardValue(s, i);
    return v;
  }

  // medium: one-ply greedy on the evaluation, with a little noise
  function grumble(s, rng) {
    rng = rng || Math.random;
    const me = s.turn;
    let best = -1e9, bm = [];
    for (const m of E.legalMoves(s)) {
      const o = E.applyMove(s, m);
      let v = evaluate(o.state, me) + rng() * 0.8;
      if (v > best + 1e-9) { best = v; bm = [m]; } else if (Math.abs(v - best) < 1e-9) bm.push(m);
    }
    return pickRandom(bm, rng);
  }

  // smart: alpha-beta search, depth-limited by a time budget
  function sage(s, rng, opts) {
    rng = rng || Math.random;
    opts = opts || {};
    const me = s.turn;
    const budget = opts.ms || 450;
    const t0 = Date.now();
    let timedOut = false;

    function ab(st, depth, alpha, beta) {
      const r = E.result(st);
      if (r !== null || depth === 0) return evaluate(st, me);
      if ((Date.now() - t0) > budget) { timedOut = true; return evaluate(st, me); }
      const moves = E.legalMoves(st);
      const scored = moves.map(m => { const o = E.applyMove(st, m); return { m, o, v: evaluate(o.state, me) }; });
      const maxing = st.turn === me;
      scored.sort((x, y) => maxing ? y.v - x.v : x.v - y.v);
      let best = maxing ? -1e9 : 1e9;
      for (const sc of scored) {
        const v = sc.o.result !== null ? evaluate(sc.o.state, me) : ab(sc.o.state, depth - 1, alpha, beta);
        if (maxing) { if (v > best) best = v; if (best > alpha) alpha = best; }
        else { if (v < best) best = v; if (best < beta) beta = best; }
        if (alpha >= beta) break;
      }
      return best;
    }

    const root = E.legalMoves(s).map(m => ({ m, o: E.applyMove(s, m) }));
    let chosen = null;
    for (let depth = 1; depth <= 6; depth++) {
      timedOut = false;
      let best = -1e9, bm = [];
      for (const r of root) {
        const v = r.o.result !== null ? evaluate(r.o.state, me) : ab(r.o.state, depth - 1, -1e9, 1e9);
        if (timedOut) break;
        if (v > best + 1e-9) { best = v; bm = [r.m]; } else if (Math.abs(v - best) < 1e-9) bm.push(r.m);
      }
      if (timedOut) break;
      chosen = bm;
      if (best >= 9000) break;
    }
    return pickRandom(chosen || [root[0].m], rng);
  }

  const BOTS = {
    foamy: { name: 'Foamy', blurb: 'chaotic. mostly harmless.', pick: foamy },
    grumble: { name: 'Grumble', blurb: 'greedy. sees one move ahead.', pick: grumble },
    sage: { name: 'Sage', blurb: 'searches several moves deep.', pick: sage },
  };

  const api = { BOTS, foamy, grumble, sage, evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RPSBots = api;
})(typeof self !== 'undefined' ? self : this);
