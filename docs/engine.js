/* rpsf engine v2 — pure rules, no UI. Works in browser and node.
 *
 * State (plain arrays, cheap to clone):
 *   n      cards per side           (index = side*n + slot)
 *   t[]    card type  0 rock 1 paper 2 scissors 3 foam   (fixed per card)
 *   h[]    hearts (0 = dead)        a[] attack bonus      c[] cut (thorns)
 *   cap[]  hearts the card started with (rest heals up to this)
 *   turn   0 = P1 to move, 1 = P2
 *   nk     turns since the last attack-kill (drives fatigue)
 *
 * A "move" is always complete (includes follow-up choices) so bots/solvers
 * can enumerate them:
 *   {k:'atk', from, to, steal?:{src,attr,to}}   steal only when a foam dies
 *   {k:'rest', from}
 *   {k:'sac', from, to}                          non-foam sacrifice
 *   {k:'fsac', from, src, attr, to}              foam sacrifice
 *
 * Rule changes vs the pico-8 cart (v0.91b):
 *   - sacrifice (and foam pop) is a FREE action for everybody: it never ends the turn
 *   - rest heals +1 up to the card's starting hearts (was: only 1 -> 2),
 *     but not once exhaustion has begun (otherwise healing could cancel it)
 *   - fatigue: after FATIGUE_AT turns with no kill, at the end of every round
 *     every living card loses 1 heart -> games can't go on forever
 *   - foam death / foam sacrifice can't soft-lock when the killer is dead
 *   - foam sacrifice may pass the foam's own stats on
 */
(function (root) {
  'use strict';
  const R = 0, P = 1, S = 2, F = 3;
  const TYPE_NAMES = ['rock', 'paper', 'scissors', 'foam'];
  const ATTRS = ['h', 'a', 'c'];
  const FATIGUE_AT = 10;

  function beats(x, y) { return (x === R && y === S) || (x === P && y === R) || (x === S && y === P); }

  function dmg(ta, aa, tb) {
    if (ta === F) return aa > 0 ? aa : 0;
    if (tb === F) return 1 + aa;
    if (beats(ta, tb)) return 2 + aa;
    if (ta === tb) return 1 + aa;
    return aa > 0 ? 1 : 0;
  }

  // variant: {hp, bonus:{h,a,c}, bonus2?:{h,a,c}}  (bonus2 = extra for P2 only, balance knob)
  function newState(variant, loadouts) {
    variant = variant || {};
    const bonus = variant.bonus || {};
    const bonus2 = variant.bonus2 || {};
    const types = loadouts || [[R, P, S, F], [R, P, S, F]];
    const n = types[0].length;
    const s = { n, t: [], h: [], a: [], c: [], cap: [], turn: 0, nk: 0 };
    for (let side = 0; side < 2; side++) {
      const b = side === 0 ? bonus : { h: (bonus.h || 0) + (bonus2.h || 0), a: (bonus.a || 0) + (bonus2.a || 0), c: (bonus.c || 0) + (bonus2.c || 0) };
      for (let k = 0; k < n; k++) {
        const ty = types[side][k];
        const base = ty && ty.t !== undefined ? ty : { t: ty };
        s.t.push(base.t);
        const ex0 = (side === 1 && variant.p2cards && variant.p2cards[k]) || {};
        const hp = (variant.hp || 2) + (b.h || 0) + (base.h || 0) + (ex0.h || 0);
        s.h.push(Math.max(1, hp));
        s.cap.push(Math.max(1, hp));
        const extra = (side === 1 && variant.p2cards && variant.p2cards[k]) || {};
        s.a.push(Math.max(0, (b.a || 0) + (base.a || 0) + (extra.a || 0)));
        s.c.push(Math.max(0, (b.c || 0) + (base.c || 0) + (extra.c || 0)));
      }
    }
    return s;
  }

  function clone(s) {
    return { n: s.n, t: s.t, h: s.h.slice(), a: s.a.slice(), c: s.c.slice(), cap: s.cap, turn: s.turn, nk: s.nk };
  }

  const side = (s, i) => (i >= s.n ? 1 : 0);
  const alive = (s, i) => s.h[i] > 0;
  function aliveIdx(s, sd) {
    const r = [];
    for (let k = 0; k < s.n; k++) if (s.h[sd * s.n + k] > 0) r.push(sd * s.n + k);
    return r;
  }
  function countAlive(s, sd) {
    let c = 0;
    for (let k = 0; k < s.n; k++) if (s.h[sd * s.n + k] > 0) c++;
    return c;
  }
  function allAlive(s) { return aliveIdx(s, 0).concat(aliveIdx(s, 1)); }

  function tidy(s) {
    for (let i = 0; i < s.h.length; i++) if (s.h[i] <= 0) { s.h[i] = 0; s.a[i] = 0; s.c[i] = 0; }
  }

  // null = running, 0 = draw, 1 = P1 wins, 2 = P2 wins
  function result(s) {
    const a = countAlive(s, 0), b = countAlive(s, 1);
    if (a === 0 && b === 0) return 0;
    if (a === 0) return 2;
    if (b === 0) return 1;
    return null;
  }

  /* ---------- primitives (mutate s, push events) ---------- */

  function doAttack(s, i, j, ev) {
    const d = dmg(s.t[i], s.a[i], s.t[j]);
    ev.push({ e: 'lunge', from: i, to: j });
    let foamDied = false;
    if (s.t[i] === s.t[j] && d >= s.h[j]) { s.h[i] += 1; ev.push({ e: 'soul', card: i }); }
    if (d > 0) {
      s.h[j] -= d;
      ev.push({ e: 'hit', from: i, to: j, dmg: d });
      if (s.h[j] <= 0) { s.h[j] = 0; ev.push({ e: 'die', card: j, by: 'hit' }); foamDied = s.t[j] === F; }
    } else {
      ev.push({ e: 'block', from: i, to: j });
    }
    const cut = s.c[j];
    if (cut > 0) {
      s.h[i] -= cut;
      ev.push({ e: 'cut', from: j, to: i, dmg: cut });
      if (s.h[i] <= 0) { s.h[i] = 0; ev.push({ e: 'die', card: i, by: 'cut' }); }
    }
    if (s.h[j] <= 0 && s.h[i] > 0) {
      const tj = s.t[j];
      if (tj === R) { s.a[i]++; ev.push({ e: 'loot', card: i, attr: 'a' }); }
      else if (tj === P) { s.h[i]++; ev.push({ e: 'loot', card: i, attr: 'h' }); }
      else if (tj === S) { s.c[i]++; ev.push({ e: 'loot', card: i, attr: 'c' }); }
    }
    return { killed: s.h[j] <= 0, foamDied, d };
  }

  function doSteal(s, src, attr, to, ev) {
    s[attr][src] -= 1;
    s[attr][to] += 1;
    ev.push({ e: 'steal', src, to, attr });
    if (s.h[src] <= 0) { s.h[src] = 0; ev.push({ e: 'die', card: src, by: 'steal' }); }
  }

  function stealOptions(s, killerSide, exclude) {
    const out = [];
    const dests = aliveIdx(s, killerSide);
    const srcs = allAlive(s);
    for (const src of srcs) for (const attr of ATTRS) {
      if (s[attr][src] <= 0) continue;
      for (const to of dests) {
        if (to === src || to === exclude) continue;
        out.push({ src, attr, to });
      }
    }
    return out;
  }

  /* ---------- turn bookkeeping ---------- */

  function endTurn(s, ev, killedByAttack) {
    tidy(s);
    s.nk = killedByAttack ? 0 : s.nk + 1;
    let r = result(s);
    if (r === null && s.turn === 1 && s.nk >= FATIGUE_AT) {
      ev.push({ e: 'fatigue' });
      for (let i = 0; i < s.h.length; i++) if (s.h[i] > 0) {
        s.h[i] -= 1;
        if (s.h[i] <= 0) ev.push({ e: 'die', card: i, by: 'fatigue' });
      }
      tidy(s);
      r = result(s);
    }
    s.turn = 1 - s.turn;
    return r;
  }

  /* ---------- public: apply a complete move ---------- */

  function applyMove(s0, m) {
    const s = clone(s0);
    const ev = [];
    const me = s.turn;
    let killed = false;
    if (m.k === 'atk') {
      const r = doAttack(s, m.from, m.to, ev);
      killed = r.killed || s.h[m.from] <= 0;
      if (r.foamDied && m.steal) { tidy(s); doSteal(s, m.steal.src, m.steal.attr, m.steal.to, ev); }
    } else if (m.k === 'rest') {
      ev.push({ e: 'rest', card: m.from });
      if (s.nk < FATIGUE_AT && s.h[m.from] < s.cap[m.from]) { s.h[m.from] += 1; ev.push({ e: 'heal', card: m.from }); }
    } else if (m.k === 'sac') {
      ev.push({ e: 'sac', card: m.from, to: m.to });
      const ty = s.t[m.from];
      s.h[m.from] = 0;
      ev.push({ e: 'die', card: m.from, by: 'sac' });
      const attr = ty === R ? 'a' : ty === P ? 'h' : 'c';
      s[attr][m.to] += 1;
      ev.push({ e: 'loot', card: m.to, attr, sac: true });
    } else if (m.k === 'fsac') {
      ev.push({ e: 'sac', card: m.from, to: m.to, foam: true });
      doSteal(s, m.src, m.attr, m.to, ev);
      s.h[m.from] = 0;
      ev.push({ e: 'die', card: m.from, by: 'sac' });
    }
    if (m.k === 'sac' || m.k === 'fsac') {
      // free action: same player moves again (nk / fatigue untouched)
      tidy(s);
      const r2 = result(s);
      ev.push({ e: 'end', result: r2, again: r2 === null });
      return { state: s, events: ev, result: r2, mover: me };
    }
    const res = endTurn(s, ev, killed);
    ev.push({ e: 'end', result: res });
    return { state: s, events: ev, result: res, mover: me };
  }

  /* ---------- public: legal moves ---------- */

  function legalMoves(s) {
    const me = s.turn, foe = 1 - me;
    const mine = aliveIdx(s, me), theirs = aliveIdx(s, foe);
    const out = [];
    for (const i of mine) {
      for (const j of theirs) {
        const base = { k: 'atk', from: i, to: j };
        // does it kill a foam? then expand follow-up choices
        const probe = clone(s);
        const r = doAttack(probe, i, j, []);
        tidy(probe);
        if (r.foamDied && result(probe) === null && countAlive(probe, me) > 0) {
          const opts = stealOptions(probe, me, -1);
          if (opts.length) { for (const st of opts) out.push({ k: 'atk', from: i, to: j, steal: st }); continue; }
        }
        out.push(base);
      }
      out.push({ k: 'rest', from: i });
      if (mine.length >= 2) {
        if (s.t[i] === F) {
          for (const src of allAlive(s)) for (const attr of ATTRS) {
            if (s[attr][src] <= 0) continue;
            for (const to of mine) {
              if (to === i || to === src) continue;
              out.push({ k: 'fsac', from: i, src, attr, to });
            }
          }
        } else {
          for (const to of mine) if (to !== i) out.push({ k: 'sac', from: i, to });
        }
      }
    }
    return out;
  }

  /* ---------- helpers for UI / bots ---------- */

  function stateKey(s) {
    let k = s.turn + ':' + Math.min(s.nk, FATIGUE_AT + 1) + ':';
    for (let i = 0; i < s.h.length; i++) k += s.h[i] + '.' + s.a[i] + '.' + s.c[i] + ',';
    return k;
  }

  // what an attack would do, without committing (for the target preview badges)
  function previewAttack(s, i, j) {
    const p = clone(s);
    const ev = [];
    const r = doAttack(p, i, j, ev);
    return {
      dmg: r.d, kills: p.h[j] <= 0,
      cut: s.c[j], selfDies: p.h[i] <= 0, soul: ev.some(e => e.e === 'soul'), foam: r.foamDied,
      loot: ev.find(e => e.e === 'loot') || null,
    };
  }

  const api = { R, P, S, F, TYPE_NAMES, ATTRS, FATIGUE_AT, beats, dmg, newState, clone, applyMove, legalMoves, result, aliveIdx, countAlive, allAlive, stateKey, previewAttack, side };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RPSF = api;
})(typeof self !== 'undefined' ? self : this);
