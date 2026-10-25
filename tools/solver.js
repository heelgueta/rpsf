/* exhaustive solver for rpsf (3-valued: win/draw/loss under perfect play).
 * usage: node tools/solver.js [variant] [--limit=N]
 * The game graph is a DAG once `nk` (turns since last kill) is part of the state,
 * so plain memoised negamax is exact. */
const E = require('../docs/engine.js');

const VARIANTS = {
  classic: {}, rain: { bonus: { h: 1 } }, glass: { bonus: { c: 1 } }, fire: { bonus: { a: 1 } },
};

function key(s) {
  const a = [s.turn, Math.min(s.nk, E.FATIGUE_AT)];
  for (let i = 0; i < s.h.length; i++) a.push(s.h[i], s.a[i], s.c[i]);
  return String.fromCharCode.apply(null, a);
}

function makeSolver(opts) {
  opts = opts || {};
  const memo = new Map();
  let nodes = 0;
  const limit = opts.limit || Infinity;
  function val(s) {
    const k = key(s);
    const c = memo.get(k);
    if (c !== undefined) return c;
    if (++nodes > limit) throw new Error('node limit');
    const moves = E.legalMoves(s);
    // cheap ordering: attacks that kill first, then other attacks
    let best = -1;
    const outs = moves.map(m => E.applyMove(s, m));
    if (opts.order) { for (const o of outs) o.h = opts.order(o.state, s.turn); outs.sort((x, y) => y.h - x.h); }
    for (const o of outs) {
      let v;
      if (o.result !== null) v = o.result === 0 ? 0 : (o.result === s.turn + 1 ? 1 : -1);
      else v = -val(o.state);
      if (v > best) { best = v; if (best === 1) break; }
    }
    memo.set(k, best);
    return best;
  }
  return { val, memo, get nodes() { return nodes; } };
}

if (require.main === module) {
  const name = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'classic';
  const lim = (process.argv.find(a => a.startsWith('--limit=')) || '').split('=')[1];
  const s0 = E.newState(VARIANTS[name]);
  const sv = makeSolver({ limit: lim ? +lim : Infinity });
  const t0 = Date.now();
  const v = sv.val(s0);
  console.log(name, 'value for P1 (to move):', v === 1 ? 'P1 WINS' : v === 0 ? 'DRAW' : 'P2 WINS', 'states:', sv.memo.size, 'ms:', Date.now() - t0);
}
module.exports = { makeSolver, key, VARIANTS };
