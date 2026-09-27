# Portfolio audit — 2026-09-28

Inspected the repository manifest, lockfiles, entry point, Vite/TS/ESLint/test configuration, agent rules, README/context docs, both active terrain pipelines, streaming types, FPS controller, material setup, CSS, and co-op plugin. Existing checkout was clean. Letters and Snake implementations are excluded from reuse and architectural decisions.

| Area | Observed implementation | Origin decision |
| --- | --- | --- |
| Frontend | React 18.3, strict TypeScript 5.7; lazy route pages | Keep TypeScript; tiny menu needs only DOM, so no React dependency |
| Renderer | Three 0.172, R3F 8, drei 9, postprocessing | Keep Three 0.172; direct scene ownership makes chunk GPU lifetime explicit |
| Build | Vite 6, React plugin, manual vendor chunks, alias `@` | Vite 6, independent build and worker bundles; no React plugin |
| Packages | packageManager says Yarn 1.22; npm and yarn locks both present; README uses npm; locks ignored by Git | Standardize npm, commit package-lock.json |
| UI | styled-components theme plus Sandbox CSS, Effector discrete state, mutable frame refs | Retain frame-state-outside-UI principle; small DOM menu and opt-in debug |
| Routing | BrowserRouter basename /portfolio; / defaults Sandbox, /expedition older scene | Single standalone entry; relative build base supports a hosting subdirectory |
| Deployment | GitHub Pages static solo; Vite middleware co-op/SSE rooms | Static client only; do not transplant domain-specific room server |
| Geometry | Sandbox 1m heightfield triangles; expedition displaced PlaneGeometry; decorative merged boxes | New volumetric Uint8Array storage and greedy chunk meshing |
| Collision | Sandbox heightfield interpolation + natural-object radii | New voxel AABB controller; mutations immediately affect collision |
| Generation | Seeded value noise, biomes, bounded streaming cache | Reuse mathematical approach, write independent chunk-space regions and terrain |
| Visual | Muted greens, warm light, serif titles, fog, restrained DOM | Similar atmosphere with original flat material palette; no textures/models copied |
| Conventions | Small domain files, strict TS, mutable fast state; Vitest + Playwright | Preserve conventions; enforce authoritative world API and document every subsystem |

The old heightfield cannot expose underground faces or arbitrary voxel holes. Extending it would create two conflicting terrain truths. The old survival controller also contains hands, items, health, and unrelated interactions. Neither is copied. The reusable foundation is the toolchain, renderer, testing approach, deterministic noise technique, resource-disposal discipline, and visual direction. No portfolio source or assets are imported or modified.
