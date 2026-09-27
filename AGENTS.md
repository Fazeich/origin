# Origin — mandatory agent contract

Origin is a first-person, mutable voxel sandbox prototype. Read `docs/architecture/overview.md`, the relevant subsystem document, and `docs/agents/workflow.md` before changing code. This standalone project deliberately has no runtime import from portfolio.

## Invariants

1. A voxel is NEVER an individual render object, entity, mesh, or UI component. Use compact chunk storage and derived surfaces.
2. All gameplay mutations go through `World.destroyVoxel` / the world action boundary. No direct data edits from input or renderer.
3. Voxel state is authoritative. Meshes are disposable, derived representations.
4. Chunk size and voxel scale come from `src/core/config.ts`; never spread literal dimensions through the engine.
5. Bedrock occupies voxel height zero and cannot be destroyed. Below zero is no voxel world.
6. No tutorials, onboarding, tooltips, interaction hints, control legends, block labels, objectives, or biome labels in game. This is intentional design, not unfinished UX. Only an explicitly enabled developer overlay may expose diagnostics.
7. Actions must retain a validation boundary suitable for future server authority. No fake destruction or direct mesh edits.
8. Update affected documentation in the same task as architecture changes; record actual tests and limitations.
9. Biome size is measured in chunks through configuration. Traversal time is a derived observation, never a generation input.

## Scope and boundaries

Do not introduce inventory, crafting, combat, mobs, caves, fluids, body/hands, accounts, or production networking without new requirements. Do not use Letters/Snake code or mechanics. Read `docs/research/portfolio.md` for reuse decisions.

`core` defines units/config; `generation` and `biomes` are deterministic pure functions; `chunks` defines storage; `world` owns mutation and streaming; `meshing` derives indexed surfaces in workers; `rendering` owns Three/GPU lifetime; `player` uses voxel collision; `interaction` uses grid DDA; `debug` is opt-in and must not become gameplay UI.

Before finishing: lint, strict typecheck, unit tests, build, browser runtime tests. Investigate asynchronous mesh revisions, boundary seams, lost focus, and disposal. Never claim measured FPS from a guessed number. `docs/architecture/performance.md` records the actual environment and evidence.
