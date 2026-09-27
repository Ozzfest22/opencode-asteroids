# AGENTS.md

## Repo shape

- Vanilla JS game, zero tooling: **no `package.json`, no build, no tests, no linter**. Do not add dependencies, bundlers, or tooling unless explicitly asked.
- All logic is in `game.js` (~420 lines), loaded by a plain `<script>` tag from `index.html`. No ES modules — one shared global scope with top-level `'use strict'`. Keep new code in that style.
- Canvas is fixed 800×600 via the `W`/`H` consts in `game.js`; the `<canvas>` element in `index.html` duplicates these values — keep them in sync if either changes.

## Run / verify

- Only verification is manual: open `index.html` directly (file://) or `npx serve .` → `http://localhost:3000`.
- There is no automated test/lint/typecheck step. Verify changes by reading the code carefully.

## Code conventions (from `game.js`)

- Loop: `loop()` computes `dt` clamped to 0.05 s, then `update(dt)` → `draw()`. All movement/timers are dt-based — never use frame counts.
- Input: `keys[e.code]` for held keys; `pressed(code)` for one-shot presses. `pressed()` *consumes* `justPressed`, so it must be called at most once per frame per key.
- World wraps toroidally: every entity position goes through `wrap(v, max)`. New moving entities must wrap too.
- Asteroids are table-driven by size 1–3 (3 = big): `RADII`, `SPEEDS`, `POINTS` arrays at the top of the Asteroid section. `split()` yields two asteroids of one size smaller.
- Game state is the string global `state`: `'playing' | 'dead' | 'gameover'`, switched in `update()`/`killShip()`.
- Style: 2-space indent, section banners like `// ── Update ────`, comments and most UI text in Spanish (`NIVEL`, `PUNTAJE`); README is Spanish. Match this when editing.

## Gotchas

- `README.md` claims power-ups and a "estrella fugaz" asteroid type — **neither exists in `game.js`**. Trust the code; treat the README as aspirational, and don't assume those features are implemented.
- Ship/asteroid collision uses a fudge factor (`ship.radius + a.radius * 0.82`), and respawn invincibility blink is driven by `ship.invincible` — touching these affects difficulty.
- `justPressed` is never bulk-cleared; stale entries are only cleared by `pressed()`. Adding a second consumer of the same key per frame will break input.
