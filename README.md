# CS2 Dust2 — Tower Defense

2D tower defense in the style of CS2 on the Dust2 map. Defend CT-spawn from terrorists coming via Long A, Tunnels → B and Mid → Catwalk.

## Stack

- Next.js 16 (App Router, webpack)
- Phaser 4 — game engine, rendered client-side only
- Redux Toolkit — UI state mirror
- eventemitter3 — Phaser ↔ React event bridge
- Tailwind CSS 4, TypeScript

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Structure

```
src/
  app/                 Next.js pages and layout
  components/game/     React wrapper for Phaser + HUD/UI
  lib/game/
    scenes/            Boot, Menu, Game, UI, GameOver
    systems/           Gameplay systems (waves, towers, enemies…)
    data/              Map, paths, sprites, sounds, configs
    utils/             Math helpers, spatial grid
    events.ts          Event bus between Phaser and React
  store/               Redux store and slices
```

## Assets

- Map background: `public/game/maps/dust2.jpg`. Enemy paths and tower slots are defined on top of it in `src/lib/game/data/paths.ts` and `src/lib/game/data/map.ts`.
- Sprites (towers, enemies, effects) are drawn in code and rendered to PNG:

  ```bash
  pnpm sprites   # scripts/generate-sprites.mjs → public/game/sprites/*.png
  ```

- Sounds go to `public/game/sounds/`. Missing files are skipped; missing sprites fall back to colored placeholders.
