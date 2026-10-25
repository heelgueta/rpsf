# rpsf battle

A tiny two-player duel of four cards: **rock, paper, scissors, foam**.
Originally a PICO-8 cart (`rpsf_091b-0.p8.png`, source extracted in `rpsf_091b.lua`);
this repo now holds the v2 web version.

- `docs/` — the playable game (static, mobile-first). Deployed by GitHub Pages.
  - `engine.js` pure rules · `bots.js` bots · `ui.js` interface
- `tools/` — exhaustive solver and analysis scripts (node)

Rules summary lives in the in-game "how to play". Changes from the cart:
sacrifice is a free action that never ends the turn (for humans and bots), rest heals up to starting hearts,
and *exhaustion* (10 turns with no kill → everyone loses a heart per round,
no healing) guarantees every game ends.
