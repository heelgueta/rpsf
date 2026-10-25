/* The Oracle: exact game-theoretic player.
 *
 * The game graph is a finite DAG (kills, sacrifices and exhaustion all make
 * progress), so every position has an exact value under perfect play:
 * +1 mover wins, 0 draw, -1 mover loses. We compute it live with memoised
 * negamax (move ordering by a cheap evaluation makes wins fall out fast).
 *
 *  - winning position  -> play a move that keeps the win (prefers killing blows)
 *  - drawn/lost        -> among the best moves, pick the one that gives the
 *                         opponent the most ways to go wrong ("swindle score")
 * Nothing is trained or approximated: it simply knows the answer.
 */
(function (root) {
  'use strict';
  const E = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./engine.js') : root.RPSF;
  const B = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./bots.js') : root.RPSBots;

  function key(s) {
    const a = [s.turn, Math.min(s.nk, E.FATIGUE_AT)];
    for (let i = 0; i < s.h.length; i++) a.push(s.h[i], s.a[i], s.c[i]);
    return String.fromCharCode.apply(null, a);
  }
  const outcome = (o, turn) => (o.result === 0 ? 0 : (o.result === turn + 1 ? 1 : -1));

  function create() {
    let memo = new Map();
    let deadline = Infinity, ticks = 0;
    const MEMO_CAP = 2500000;

    function val(s) {
      const k = key(s);
      const c = memo.get(k);
      if (c !== undefined) return c;
      if ((++ticks & 2047) === 0 && Date.now() > deadline) throw new Error('timeout');
      const outs = E.legalMoves(s).map(m => E.applyMove(s, m));
      for (const o of outs) o.h = o.result !== null ? 1e9 * (outcome(o, s.turn)) : B.evaluate(o.state, s.turn);
      outs.sort((x, y) => y.h - x.h);
      let best = -1;
      for (const o of outs) {
        const v = o.result !== null ? outcome(o, s.turn) : (o.state.turn === s.turn ? val(o.state) : -val(o.state));
        if (v > best) { best = v; if (best === 1) break; }
      }
      memo.set(k, best);
      return best;
    }

    function childValue(s, o) { return o.result !== null ? outcome(o, s.turn) : (o.state.turn === s.turn ? val(o.state) : -val(o.state)); }

    // fraction of the opponent's replies that are mistakes (they lose value by playing them)
    function trapScore(o, mover) {
      if (o.result !== null || o.state.turn === mover) return 0;
      const st = o.state, replies = E.legalMoves(st).map(m => E.applyMove(st, m));
      const vals = replies.map(r => childValue(st, r));
      const top = Math.max.apply(null, vals);
      return vals.filter(v => v < top).length / vals.length;
    }

    function pick(s, opts) {
      opts = opts || {};
      deadline = Date.now() + (opts.ms || 8000); ticks = 0;
      if (memo.size > MEMO_CAP) memo = new Map();
      const moves = E.legalMoves(s);
      const outs = moves.map((m, i) => ({ m, o: E.applyMove(s, m) }));
      for (const x of outs) x.v = childValue(s, x.o);
      const best = Math.max.apply(null, outs.map(x => x.v));
      let cand = outs.filter(x => x.v === best);
      if (cand.length > 1) {
        if (best === 1) {
          for (const x of cand) x.score = (x.o.result !== null ? 1e6 : 0) + B.evaluate(x.o.state, s.turn);
        } else {
          for (const x of cand) x.score = trapScore(x.o, s.turn) * 100 + B.evaluate(x.o.state, s.turn) * 0.01;
        }
        const top = Math.max.apply(null, cand.map(x => x.score));
        cand = cand.filter(x => x.score >= top - 1e-9);
      }
      const choice = cand[Math.floor(Math.random() * cand.length)];
      return { move: choice.m, value: best, states: memo.size };
    }

    return { pick, val, reset() { memo = new Map(); }, get size() { return memo.size; } };
  }

  const api = { create, key };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RPSOracleCore = api;
})(typeof self !== 'undefined' ? self : this);
