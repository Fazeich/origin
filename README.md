# Origin

Playable browser prototype of a harsh first-person voxel sandbox. Procedural terrain is real mutable voxel data: digging exposes underground volume, collision changes immediately, and the bottom foundation cannot be removed. The game deliberately provides no tutorials, control hints, objectives, or explanatory labels.

**Status:** first local playable slice. Three biomes, streamed chunk storage, worker generation/greedy meshing, FPS movement, voxel destruction, session edits, and developer diagnostics. No multiplayer, inventory, crafting, building, mobs, body/hands, or persistent save system.

## Run

Node.js **22.12+**, npm, desktop keyboard/mouse, and a WebGL2 browser. Chrome was used for runtime validation.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:3100/** and select **Войти**. The menu action supplies the browser gesture required for pointer lock. This is a start menu, not an in-world instruction. If embedded-browser capture is unavailable, open the URL in a normal Chrome/Edge tab.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
npm run test:e2e
npm run test:production
```

Preview: **http://127.0.0.1:4100/**. E2E uses installed Google Chrome (`channel: 'chrome'`); alternatively install Playwright Chromium and change that setting. The E2E command starts a dev server if none is running. `npm run profile` requires a running dev server and writes measured JSON/images under `docs/validation/`.

The project `.npmrc` uses the public npm registry and disables automatic peer installation because npm 10.9 crashes on Vitest's optional browser-peer graph. Required peers are explicit. A committed npm lockfile makes `npm ci` reproducible. No dependencies are linked to portfolio.

## Controls (developer reference only)

| Input | Action |
| --- | --- |
| WASD | Move at 3.6m/s |
| Mouse | Look while pointer-locked |
| Space | Jump |
| Left mouse | Destroy the first solid voxel within 4m |
| Esc / focus loss | Pause and release capture |
| F3 | Toggle developer diagnostics |

`?seed=12345` selects a deterministic world; `?debug` enables diagnostics on entry. `?test` enables an inspection bridge **only on the dev server**, for automated validation; it is eliminated from production builds. It is not gameplay functionality.

## Architecture

TypeScript 5.7, Vite 6.4, Three.js 0.172. Direct Three scene ownership, small DOM menu, no React runtime. Tooling and atmosphere follow portfolio; terrain, physics, and world state are independent. [Portfolio audit](docs/research/portfolio.md).

`src/core/config.ts` is the configuration entry point. Default: 4 voxels/m, 32³ chunks (8m wide), 24m vertical extent, 6-chunk horizontal load radius, 16-chunk biome regions (128m nominal, 35.56s at current speed). Region edges are distorted and blended, so actual crossing times vary.

| Module | Responsibility |
| --- | --- |
| `world`, `chunks`, `voxels` | Uint8Array authority, registry, mutation, bounded streaming, sparse session edits |
| `generation`, `biomes` | Seeded terrain, warped chunk-space regions, weighted heights/material patches |
| `meshing`, `workers` | Greedy exposed-face quads, typed-array transfer, asynchronous generation/rebuilds |
| `player`, `interaction` | Fixed-step AABB movement, step-up, jump, pointer lock, DDA ray/action validation |
| `rendering`, `debug` | Indexed chunk geometry, GPU disposal, atmosphere, opt-in metrics |

Read [AGENTS.md](AGENTS.md) before changing the engine. Documentation index: [docs/README.md](docs/README.md). Measured results: [performance](docs/architecture/performance.md); actual checks: [validation](docs/validation/results.md).

## Hosting

`dist/` is a self-contained static build; no backend is required. Relative asset URLs support a hosting subdirectory. Serve over HTTP(S), not `file://`, so module workers load. GitHub Pages target: **https://fazeich.github.io/origin/**, from the `gh-pages` branch of `Fazeich/origin`. Portfolio routes and repository are separate.

```sh
npm run deploy
```

This builds production assets and publishes `dist/` to `gh-pages` using the configured Git remote and your GitHub credentials. Source stays on `main`; updates to source alone do not deploy. `public/.nojekyll` is included to bypass Jekyll processing. See [deployment](docs/architecture/deployment.md) for setup and verification.

## Limitations

- Horizontal streaming is unbounded, vertical storage is 96 voxels; distant chunks disappear into fog. No cave generation or fluids.
- Edits survive streaming only within the current browser session. Refresh loses edits. Long sessions with extensive digging grow the sparse edit journal.
- Missing columns block movement until ready. No LOD, terrain shadows, ambient occlusion, texture assets, or worker cancellation mid-job.
- Main-thread halo snapshots and GPU geometry uploads still cost time. Headless profile numbers are environment-specific, not performance promises.
- A deep narrow shaft can trap the player; no building, flight, or rescue mechanic is part of this slice. Reload resets the test world.
- Local action validation is a future authority seam, not secure multiplayer. Remote actors, server simulation, prediction, and persistence are unimplemented.

Next milestone: measure sustained walking/digging on several real GPUs, add bounded edit-journal save/load, and expand collision/streaming stress coverage before introducing small server-authoritative co-op.
