/* rpsf battle — UI. Talks to engine.js / bots.js only through plain data. */
(function () {
  'use strict';
  const E = window.RPSF;
  const BOTS = Object.assign({}, window.RPSBots.BOTS, (window.RPSOracle ? { oracle: window.RPSOracle } : {}));
  const ICON = ['🪨', '📄', '✂️', '🫧'];
  const NAME = ['Rock', 'Paper', 'Scissors', 'Foam'];
  const AICON = { h: '❤️', a: '⚔️', c: '🌵' };
  const ANAME = { h: 'heart', a: 'attack', c: 'cut' };
  const $ = id => document.getElementById(id);

  const VARIANTS = {
    classic: { name: '⚔️ Classic', blurb: 'the base game. every card: 2 hearts, no bonuses.', def: {} },
    rain: { name: '🌧 Rain', blurb: 'everyone starts with +1 heart. longer fights, rest matters.', def: { bonus: { h: 1 } } },
    glass: { name: '🔮 Glass', blurb: 'everyone starts with +1 cut (thorns). hitting hurts you back.', def: { bonus: { c: 1 } } },
    fire: { name: '🔥 Fire', blurb: 'everyone starts with +1 attack. every hit bites harder.', def: { bonus: { a: 1 } } },
  };
  window.RPSF_VARIANTS = VARIANTS;

  /* ---------- persistence ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('rpsf2.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('rpsf2.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const cfg = Object.assign({ mode: 'bot', bot: 'grumble', side: 'p1', variant: 'classic', speed: 1 }, store.get('cfg', {}));
  if (!BOTS[cfg.bot]) cfg.bot = 'grumble';
  const saveCfg = () => store.set('cfg', cfg);

  /* ---------- menu ---------- */
  function chips(el, items, cur, onPick) {
    el.innerHTML = '';
    items.forEach(it => {
      const b = document.createElement('button');
      b.className = 'chip' + (it.key === cur ? ' on' : '') + (it.off ? ' off' : '');
      b.textContent = it.label;
      b.onclick = () => { if (!it.off) onPick(it.key); };
      el.appendChild(b);
    });
  }
  function buildMenu() {
    chips($('modeChips'), [{ key: 'bot', label: '🤖 vs bot' }, { key: 'pvp', label: '👥 2 players, 1 phone' }], cfg.mode, k => { cfg.mode = k; saveCfg(); buildMenu(); });
    const bots = Object.keys(BOTS).map(k => ({ key: k, label: BOTS[k].name }));
    chips($('botChips'), bots, cfg.bot, k => { cfg.bot = k; saveCfg(); buildMenu(); });
    $('botBlurb').textContent = BOTS[cfg.bot].blurb;
    chips($('sideChips'), [{ key: 'p1', label: 'P1 (moves first)' }, { key: 'p2', label: 'P2 (moves second)' }, { key: 'rnd', label: '🎲 random' }], cfg.side, k => { cfg.side = k; saveCfg(); buildMenu(); });
    chips($('varChips'), Object.keys(VARIANTS).map(k => ({ key: k, label: VARIANTS[k].name })), cfg.variant, k => { cfg.variant = k; saveCfg(); buildMenu(); });
    $('varBlurb').textContent = VARIANTS[cfg.variant].blurb;
    $('botGroup').classList.toggle('hidden', cfg.mode !== 'bot');
    $('sideGroup').classList.toggle('hidden', cfg.mode !== 'bot');
  }

  function openSheet(html) { $('sheetBody').innerHTML = html + '<button class="close" id="sheetClose">close</button>'; $('sheet').classList.remove('hidden'); $('sheetClose').onclick = closeSheet; }
  function closeSheet() { $('sheet').classList.add('hidden'); }

  function rulesHtml() {
    return `<h2>how to play</h2>
    <div class="tri">🪨 ▶ ✂️ ▶ 📄 ▶ 🪨</div>
    <p>Each side has four cards: <b>rock, paper, scissors, foam</b>. Kill all four enemy cards to win.</p>
    <p>Every card shows <b>❤️ hearts</b>, <b>⚔️ attack</b> bonus and <b>🌵 cut</b> (thorns). On your turn pick a card, then an action:</p>
    <h4>⚔️ attack</h4>
    <ul><li>Winning matchup (rock→scissors, scissors→paper, paper→rock): <b>2 + ⚔️</b> damage.</li>
    <li>Same type: <b>1 + ⚔️</b>. Losing matchup: <b>0</b> (or 1 if you have any ⚔️).</li>
    <li>Anything hitting <b>foam</b>: <b>1 + ⚔️</b>. Foam itself only hits for its ⚔️.</li>
    <li><b>🌵 cut:</b> if the target has cut, you take that much damage back — even if you killed it, even if you did 0.</li>
    <li><b>Mirror kill:</b> kill your own type and you gain +1 ❤️.</li></ul>
    <h4>💀 loot</h4>
    <p>Kill a card (and survive) and you gain: rock → +1 ⚔️, paper → +1 ❤️, scissors → +1 🌵. Foam gives nothing — but see below.</p>
    <h4>🔥 sacrifice</h4>
    <p>Burn one of your cards to give another of yours the same bonus a kill of it would give. Ends your turn. You can't sacrifice your last card.</p>
    <h4>🫧 foam is weird</h4>
    <p>When foam <b>dies in a fight</b>, the killer moves 1 point (❤️/⚔️/🌵) from <i>any</i> card on the board to one of the killer's own cards. When you <b>sacrifice foam</b>, you do the same move (and foam's own points can be passed on).</p>
    <h4>💤 rest</h4>
    <p>Heal 1 ❤️ (up to the card's starting hearts) — or just pass. No healing once exhaustion starts.</p>
    <h4>⏳ exhaustion</h4>
    <p>If 10 turns pass with no kill, then after every round <b>all cards lose 1 ❤️</b> until someone dies. Games can't stall forever.</p>`;
  }

  function statsHtml() {
    const rec = store.get('rec', {});
    const keys = Object.keys(rec);
    if (!keys.length) return '<h2>my record</h2><p>no games yet. go lose to Foamy.</p>';
    let rows = keys.sort().map(k => { const [b, v] = k.split('|'); const r = rec[k]; return `<tr><td>${(BOTS[b] || { name: b }).name}</td><td>${(VARIANTS[v] || { name: v }).name}</td><td>${r.w}W ${r.l}L ${r.d}D</td></tr>`; }).join('');
    return `<h2>my record</h2><table class="t"><tr><th>vs</th><th>variant</th><th>you</th></tr>${rows}</table>`;
  }

  /* ---------- game state ---------- */
  let G = null;
  const els = [];
  const speeds = [1.6, 1, 0.45];
  const speedIcons = ['🐢', '▶', '⏩'];
  const T = () => (G && G.skip ? 0.06 : speeds[cfg.speed] === undefined ? 1 : speeds[cfg.speed]);
  const wait = ms => new Promise(r => setTimeout(r, ms * T()));

  function startGame() {
    const V = VARIANTS[cfg.variant];
    let human = 0;
    if (cfg.mode === 'bot') human = cfg.side === 'rnd' ? (Math.random() < 0.5 ? 0 : 1) : (cfg.side === 'p1' ? 0 : 1);
    const st = E.newState(V.def);
    G = { state: st, view: E.clone(st), mode: cfg.mode, human, bottom: cfg.mode === 'bot' ? human : 0, botKey: cfg.bot, variant: cfg.variant,
      moves: [], busy: false, skip: false, ui: null, legal: [], log: [], over: false, t0: Date.now() };
    $('menu').classList.add('hidden'); $('game').classList.remove('hidden');
    buildBoard(); render(); say('fight!'); nextTurn();
  }

  function isHuman(sd) { return G.mode === 'pvp' || sd === G.human; }
  function who(sd) { return G.mode === 'pvp' ? 'P' + (sd + 1) : (sd === G.human ? 'your' : 'enemy'); }
  function nm(i) { return who(E.side(G.state, i)) + ' ' + NAME[G.state.t[i]].toLowerCase(); }

  function buildBoard() {
    const n = G.state.n;
    const foeSide = 1 - G.bottom, meSide = G.bottom;
    const foe = $('foeRow'), me = $('meRow');
    foe.innerHTML = ''; me.innerHTML = '';
    foe.style.setProperty('--n', n); me.style.setProperty('--n', n);
    foe.className = 'side foe' + (foeSide === 0 ? ' is-p1' : '');
    me.className = 'side me' + (meSide === 1 ? ' is-p2' : '');
    els.length = 0;
    [[foeSide, foe], [meSide, me]].forEach(([sd, row]) => {
      for (let k = 0; k < n; k++) {
        const i = sd * n + k;
        const d = document.createElement('div');
        d.className = 'card t' + G.state.t[i];
        d.innerHTML = '<div class="ico"></div><div class="name"></div><div class="hp"></div><div class="mods"></div>';
        d.querySelector('.ico').textContent = ICON[G.state.t[i]];
        d.querySelector('.name').textContent = NAME[G.state.t[i]];
        d.onclick = () => onCardTap(i);
        row.appendChild(d); els[i] = d;
      }
    });
  }

  function render() {
    const v = G.view, n = v.n, ui = G.ui;
    for (let i = 0; i < v.h.length; i++) {
      const el = els[i]; if (!el) continue;
      const h = Math.max(0, v.h[i]);
      const sd = E.side(v, i);
      const dead = h <= 0;
      const myTurn = !G.busy && !G.over && isHuman(G.state.turn);
      const cls = ['card', 't' + v.t[i]];
      if (dead) cls.push('dead');
      if (ui && ui.from === i) cls.push('sel');
      if (ui && ui.pickSet && ui.pickSet.has(i)) cls.push('pick');
      if (myTurn && !ui && sd === G.state.turn && !dead) cls.push('can', 'mine');
      el.className = cls.join(' ');
      el.querySelector('.hp').className = 'hp' + (h > 5 ? ' many' : '');
      el.querySelector('.hp').textContent = dead ? '' : (h > 5 ? '❤️×' + h : '❤️'.repeat(h));
      el.querySelector('.mods').innerHTML = dead ? '' : `<span class="${v.a[i] ? '' : 'z'}">⚔️${v.a[i]}</span><span class="${v.c[i] ? '' : 'z'}">🌵${v.c[i]}</span>`;
      const old = el.querySelector('.badge'); if (old) old.remove();
      const b = ui && ui.badges && ui.badges[i];
      if (b) { const bd = document.createElement('div'); bd.className = 'badge ' + (b.cls || ''); bd.innerHTML = b.text + (b.sub ? `<span class="sub">${b.sub}</span>` : ''); el.appendChild(bd); }
    }
    const turn = G.state.turn;
    $('foeRow').classList.toggle('active', E.side(v, 0) !== undefined && (1 - G.bottom) === turn);
    $('meRow').classList.toggle('active', G.bottom === turn);
    const tb = $('turnBanner');
    tb.className = turn === 0 ? 'p1' : 'p2';
    if (G.over) tb.textContent = 'game over';
    else if (G.mode === 'pvp') tb.textContent = `P${turn + 1}'s turn`;
    else tb.textContent = turn === G.human ? 'your turn' : `${BOTS[G.botKey].name} is thinking…`;
    const nk = G.state.nk;
    $('fatigue').textContent = nk >= E.FATIGUE_AT ? '☠ exhaustion: everyone loses ❤️ every round' : nk >= 5 ? `⏳ ${nk}/${E.FATIGUE_AT} turns without a kill` : '';
    $('speedBtn').textContent = speedIcons[cfg.speed];
  }

  function say(text) {
    const nar = $('narr');
    if (nar.textContent && nar.textContent !== text) { G.log.push(nar.textContent); if (G.log.length > 3) G.log.shift(); }
    nar.textContent = text;
    $('logbox').innerHTML = G.log.slice().reverse().map(x => `<div>${x}</div>`).join('');
  }

  /* ---------- fx helpers ---------- */
  function center(i) {
    const r = els[i].getBoundingClientRect(), g = $('game').getBoundingClientRect();
    return { x: r.left - g.left + r.width / 2, y: r.top - g.top + r.height / 2, r };
  }
  function fl(i, text, color) {
    const c = center(i);
    const d = document.createElement('div');
    d.className = 'float'; d.textContent = text; d.style.color = color; d.style.left = c.x + 'px'; d.style.top = (c.y - 10) + 'px';
    d.style.animationDuration = (1 * Math.max(0.3, T())) + 's';
    $('fx').appendChild(d); setTimeout(() => d.remove(), 1200);
  }
  function anim(i, frames, ms) { try { els[i].animate(frames, { duration: ms * T() + 1, easing: 'ease-out' }); } catch (e) { /* old browser */ } }
  function shake(i) { anim(i, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], 380); }
  function glow(i, col) { anim(i, [{ boxShadow: '0 0 0 0 ' + col }, { boxShadow: '0 0 0 8px ' + col + ', 0 0 26px ' + col }, { boxShadow: '0 0 0 0 transparent' }], 600); }
  function lunge(a, b, slow) {
    const ca = center(a), cb = center(b);
    const dx = (cb.x - ca.x) * 0.72, dy = (cb.y - ca.y) * 0.72;
    els[a].style.zIndex = 10;
    anim(a, [{ transform: 'none' }, { transform: `translate(${dx}px,${dy}px) scale(1.15)`, offset: 0.45 }, { transform: 'none' }], slow ? 700 : 520);
    setTimeout(() => { els[a].style.zIndex = ''; }, (slow ? 700 : 520) * T() + 20);
  }
  function orb(a, b, label) {
    const ca = center(a), cb = center(b);
    const o = document.createElement('div'); o.className = 'orb'; o.textContent = label;
    o.style.left = (ca.x - 11) + 'px'; o.style.top = (ca.y - 11) + 'px';
    $('fx').appendChild(o);
    try { o.animate([{ transform: 'translate(0,0) scale(.6)' }, { transform: `translate(${(cb.x - ca.x) / 2}px,${(cb.y - ca.y) / 2 - 30}px) scale(1.3)`, offset: .5 }, { transform: `translate(${cb.x - ca.x}px,${cb.y - ca.y}px) scale(.8)` }], { duration: 650 * T() + 1, easing: 'ease-in-out' }); } catch (e) { /* noop */ }
    setTimeout(() => o.remove(), 650 * T() + 40);
  }

  async function play(events) {
    const v = G.view;
    for (const e of events) {
      switch (e.e) {
        case 'lunge': say(`${nm(e.from)} attacks ${nm(e.to)}`); lunge(e.from, e.to); await wait(300); break;
        case 'hit': v.h[e.to] -= e.dmg; render(); shake(e.to); fl(e.to, '−' + e.dmg, '#ff5a6e'); await wait(420); break;
        case 'block': say(`${nm(e.to)} shrugs it off`); fl(e.to, '0', '#aaa'); await wait(380); break;
        case 'soul': v.h[e.card] += 1; render(); glow(e.card, '#5be38a'); fl(e.card, '+❤️ mirror', '#5be38a'); await wait(380); break;
        case 'cut': say(`🌵 thorns! ${nm(e.to)} takes ${e.dmg}`); v.h[e.to] -= e.dmg; render(); shake(e.to); fl(e.to, '🌵−' + e.dmg, '#ff9b4a'); await wait(480); break;
        case 'loot': v[e.attr][e.card] += 1; render(); glow(e.card, '#ffd25a'); fl(e.card, '+' + AICON[e.attr], '#ffd25a'); say(e.sac ? `${nm(e.card)} receives the sacrifice (+${ANAME[e.attr]})` : `${nm(e.card)} loots +${ANAME[e.attr]}`); await wait(520); break;
        case 'die': say(`${nm(e.card)} is destroyed`); anim(e.card, [{ transform: 'none', opacity: 1 }, { transform: 'scale(1.15) rotate(-6deg)', opacity: 1, offset: .3 }, { transform: 'scale(.7) rotate(6deg)', opacity: .3 }], 520); fl(e.card, '💀', '#fff'); await wait(520); v.h[e.card] = 0; render(); break;
        case 'steal': say(`${nm(e.src)} → ${nm(e.to)}: 1 ${ANAME[e.attr]}`); v[e.attr][e.src] -= 1; render(); orb(e.src, e.to, AICON[e.attr]); await wait(650); v[e.attr][e.to] += 1; render(); glow(e.to, '#7fe6e0'); await wait(250); break;
        case 'sac': say(`${nm(e.card)} is sacrificed${e.foam ? ' — the foam pops!' : ''}`); lunge(e.card, e.to, true); glow(e.card, '#ff9b4a'); await wait(520); break;
        case 'rest': say(`${nm(e.card)} rests`); fl(e.card, '💤', '#9bd'); await wait(350); break;
        case 'heal': v.h[e.card] += 1; render(); glow(e.card, '#5be38a'); fl(e.card, '+❤️', '#5be38a'); await wait(380); break;
        case 'fatigue': {
          say('☠ exhaustion! everyone loses 1 ❤️');
          const f = document.createElement('div'); f.className = 'flash'; $('fx').appendChild(f); setTimeout(() => f.remove(), 1100);
          for (let i = 0; i < v.h.length; i++) if (v.h[i] > 0) { v.h[i] -= 1; shake(i); }
          render(); await wait(800); break;
        }
        default: break;
      }
    }
  }

  /* ---------- turn flow ---------- */
  function nextTurn() {
    G.ui = null; G.busy = false;
    G.legal = E.legalMoves(G.state);
    render();
    if (isHuman(G.state.turn)) { setHint('<b>tap one of your cards</b>'); setBtns([]); return; }
    G.busy = true; render(); setHint('…'); setBtns([]);
    setTimeout(() => {
      let m;
      try { m = BOTS[G.botKey].pick(G.state, Math.random); } catch (err) { console.error(err); m = G.legal[Math.floor(Math.random() * G.legal.length)]; }
      commit(m);
    }, 450);
  }

  async function commit(move) {
    G.busy = true; G.ui = null; G.skip = false;
    setBtns([]); setHint(G.mode === 'pvp' || !isHuman(G.state.turn) ? '' : '<i>tap to hurry</i>');
    const out = E.applyMove(G.state, move);
    G.moves.push(move);
    G.view = E.clone(G.state);
    render();
    await play(out.events);
    G.state = out.state; G.view = E.clone(out.state);
    G.skip = false;
    if (out.result !== null) return gameOver(out.result);
    nextTurn();
  }

  /* ---------- input ---------- */
  const FIELDS = { atk: ['to', 'steal.src', 'steal.attr', 'steal.to'], sac: ['to'], fsac: ['src', 'attr', 'to'], rest: [] };
  const getF = (m, f) => { const p = f.split('.'); return p.length === 2 ? (m[p[0]] || {})[p[1]] : m[f]; };
  const CARDF = new Set(['to', 'src', 'steal.src', 'steal.to']);

  function cands() {
    const ui = G.ui;
    return G.legal.filter(m => m.from === ui.from && m.k === ui.kind && Object.keys(ui.picks).every(f => getF(m, f) === ui.picks[f]));
  }
  function nextField() {
    const ui = G.ui, cs = cands();
    for (const f of FIELDS[ui.kind]) {
      if (f in ui.picks) continue;
      const vals = [...new Set(cs.map(m => getF(m, f)).filter(x => x !== undefined))];
      if (vals.length) return { f, vals, cs };
    }
    return null;
  }

  function onCardTap(i) {
    if (!G || G.busy || G.over || !isHuman(G.state.turn)) return;
    const ui = G.ui, st = G.state;
    if (!ui) {
      if (E.side(st, i) === st.turn && st.h[i] > 0) { G.ui = { from: i, kind: null, picks: {}, pickSet: null, badges: null }; showActions(); }
      return;
    }
    if (ui.pickSet && ui.pickSet.has(i)) { ui.picks[ui.field] = i; advance(); return; }
    if (!ui.kind) { // switch selection
      if (E.side(st, i) === st.turn && st.h[i] > 0) { G.ui = { from: i, kind: null, picks: {}, pickSet: null, badges: null }; showActions(); }
      else { G.ui = null; render(); setHint('<b>tap one of your cards</b>'); setBtns([]); }
    }
  }

  function chart(i) {
    const st = G.state, foe = 1 - st.turn;
    const seen = new Set(E.aliveIdx(st, foe).map(j => st.t[j]));
    return [0, 1, 2, 3].filter(t => seen.has(t)).map(t => `${ICON[t]}${E.dmg(st.t[i], st.a[i], t)}`).join(' ');
  }

  function showActions() {
    const st = G.state, i = G.ui.from, ty = st.t[i];
    G.ui.kind = null; G.ui.picks = {}; G.ui.pickSet = null; G.ui.badges = null;
    const canSac = E.countAlive(st, st.turn) >= 2;
    const healTxt = st.h[i] < st.cap[i] && st.nk < E.FATIGUE_AT ? 'heal ❤️' : 'pass';
    setHint(`<b>${ICON[ty]} ${NAME[ty]}</b> <span>❤️${st.h[i]} ⚔️${st.a[i]} 🌵${st.c[i]}</span>` + (ty === 3 && st.a[i] === 0 ? '<span>foam hits for 0 (only its ⚔️)</span>' : `<span>damage vs ${chart(i)}</span>`));
    setBtns([
      { cls: 'atk', html: '⚔️ attack', fn: () => begin('atk') },
      { cls: 'sac', html: ty === 3 ? '🫧 pop foam<small>move 1 point</small>' : '🔥 sacrifice', dis: !canSac, fn: () => begin(ty === 3 ? 'fsac' : 'sac') },
      { cls: 'rst', html: '💤 rest<small>' + healTxt + '</small>', fn: () => commit({ k: 'rest', from: i }) },
    ]);
    render();
  }

  function begin(kind) { G.ui.kind = kind; G.ui.picks = {}; advance(true); }

  const HINTS = {
    'atk.to': 'pick a <b>target</b>', 'atk.steal.src': '🫧 foam popped! take 1 point from…', 'atk.steal.attr': 'which point?', 'atk.steal.to': '…and give it to one of <b>your</b> cards',
    'sac.to': 'who gets the <b>bonus</b>?', 'fsac.src': '🫧 take 1 point from…', 'fsac.attr': 'which point?', 'fsac.to': '…and give it to one of <b>your</b> cards',
  };

  function advance(first) {
    const ui = G.ui, st = G.state;
    let nf = nextField();
    while (nf && nf.vals.length === 1 && !(first && nf.f === 'to') && !(ui.kind === 'fsac' && nf.f === 'src')) {
      ui.picks[nf.f] = nf.vals[0]; first = false; nf = nextField();
    }
    if (!nf) { const m = cands()[0]; if (m) return commit(m); return; }
    ui.field = nf.f;
    const cancel = { cls: 'cancel', html: '← back', fn: () => { G.ui = { from: ui.from, kind: null, picks: {}, pickSet: null, badges: null }; showActions(); } };
    if (CARDF.has(nf.f)) {
      ui.pickSet = new Set(nf.vals); ui.badges = {};
      const ty = st.t[ui.from];
      nf.vals.forEach(j => {
        if (ui.kind === 'atk' && nf.f === 'to') {
          const p = E.previewAttack(st, ui.from, j);
          const bits = [];
          if (p.cut) bits.push(`🌵${p.cut} back`);
          if (p.soul) bits.push('mirror +❤️');
          ui.badges[j] = { text: p.dmg > 0 ? '−' + p.dmg + (p.kills ? ' 💀' : '') : '0', cls: p.kills ? 'kill' : p.dmg === 0 ? 'zero' : '', sub: (p.selfDies ? '☠ you die · ' : '') + bits.join(' · '), };
          if (p.selfDies) ui.badges[j].cls += ' danger';
        } else if (ui.kind === 'sac') {
          ui.badges[j] = { text: '+' + (ty === 0 ? '⚔️' : ty === 1 ? '❤️' : '🌵'), cls: 'good' };
        }
      });
      setHint(HINTS[ui.kind + '.' + nf.f]);
      setBtns([cancel]);
    } else { // attr choice
      ui.pickSet = null; ui.badges = null;
      const src = ui.picks['steal.src'] !== undefined ? ui.picks['steal.src'] : ui.picks.src;
      setHint(`${HINTS[ui.kind + '.' + nf.f]} <span>from ${nm(src)}</span>`);
      setBtns(nf.vals.map(a => ({ cls: '', html: `${AICON[a]} ${ANAME[a]}<small>has ${st[a][src]}</small>`, fn: () => { ui.picks[nf.f] = a; advance(); } })).concat([cancel]));
    }
    render();
  }

  function setHint(h) { $('hint').innerHTML = h; }
  function setBtns(list) {
    const b = $('btns'); b.innerHTML = '';
    list.forEach(x => { const el = document.createElement('button'); el.className = x.cls || ''; el.innerHTML = x.html; if (x.dis) el.disabled = true; else el.onclick = x.fn; b.appendChild(el); });
  }

  /* ---------- game over ---------- */
  function gameOver(res) {
    G.over = true; render();
    let title, sub = '';
    if (res === 0) title = '🤝 draw';
    else if (G.mode === 'pvp') title = `🏆 P${res} wins!`;
    else title = (res - 1 === G.human) ? '🏆 you win!' : '💀 you lose';
    if (G.mode === 'bot') {
      const rec = store.get('rec', {}); const key = G.botKey + '|' + G.variant;
      rec[key] = rec[key] || { w: 0, l: 0, d: 0 };
      if (res === 0) rec[key].d++; else if (res - 1 === G.human) rec[key].w++; else rec[key].l++;
      store.set('rec', rec);
    }
    const turns = G.moves.length;
    sub = `${turns} turns`;
    if (window.RPSTelemetry) window.RPSTelemetry.log({ v: 2, ts: Date.now(), mode: G.mode, bot: G.mode === 'bot' ? G.botKey : null, variant: G.variant, human: G.mode === 'bot' ? G.human : null, moves: G.moves, result: res, ms: Date.now() - G.t0 });
    setTimeout(() => {
      openSheet(`<div class="result"><div class="big2">${title}</div><p>${sub}</p></div>
        <div class="btnrow"><button class="pri" id="rem">rematch</button><button id="swp">${G.mode === 'bot' ? 'swap sides' : 'menu'}</button></div>`);
      $('rem').onclick = () => { closeSheet(); startGame(); };
      $('swp').onclick = () => { closeSheet(); if (G.mode === 'bot') { cfg.side = G.human === 0 ? 'p2' : 'p1'; saveCfg(); startGame(); } else toMenu(); };
    }, 700);
  }

  function toMenu() { G = null; $('game').classList.add('hidden'); $('menu').classList.remove('hidden'); buildMenu(); }

  /* ---------- wire up ---------- */
  $('playBtn').onclick = startGame;
  $('rulesBtn').onclick = () => openSheet(rulesHtml());
  $('statsBtn').onclick = () => openSheet(statsHtml());
  $('menuBtn').onclick = () => openSheet(`<h2>menu</h2><div class="btnrow"><button id="mHow">rules</button><button id="mQuit">quit to menu</button></div>`);
  document.addEventListener('click', e => {
    if (e.target.id === 'mHow') openSheet(rulesHtml());
    if (e.target.id === 'mQuit') { closeSheet(); toMenu(); }
  });
  $('speedBtn').onclick = () => { cfg.speed = (cfg.speed + 1) % 3; saveCfg(); render(); };
  $('board').addEventListener('pointerdown', () => { if (G && G.busy) G.skip = true; });
  $('sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
  buildMenu();
  window.RPSF_DEBUG = { get G() { return G; }, cfg };
})();
