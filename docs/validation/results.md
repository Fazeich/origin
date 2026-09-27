# Actual validation — 2026-09-28

The following were run locally against this implementation, not inferred from compilation:

| Check | Result |
| --- | --- |
| `npm ci --no-fund` | successful clean lockfile install, 174 packages, npm audit reports zero vulnerabilities |
| `npm run lint` | passed |
| `npm run typecheck` / strict tsc in build | passed |
| `npm test` | 25 tests passed |
| `npm run build` | passed; static HTML/CSS/JS and separate worker asset produced |
| `npm run test:e2e` | 2 Chrome tests passed, including actual input and worker/GPU pipeline |
| `npm run test:production` | passed on static `dist` preview; [raw report](production.json) |
| `npm run profile` | completed four real rendered scenarios; [raw metrics](profile.json) |
| `node scripts/traversal.mjs` | all three sampled region walks completed using the actual AABB controller; [raw report](traversal.json) |

## Unit and integration coverage

World API tests exercise interior deletion, both X/Z faces, both vertical faces, triple-boundary corners, exact dirty neighbour sets, rejected invalid input, range limits, negative coordinates, and session edit replay after unload. A neighbour mesh gains the previously occluded face after a boundary edit. The mesher is checked for six-quad solid-box reduction, zero enclosed faces, material separation, halo ownership and outward triangle winding.

The foundation test digs a column to y=0, verifies the exposed top mesh, raycasts Bedrock, and checks that attempts at/below zero do not change revisions or dirty state. Its gray appearance was inspected in the browser screenshot. Player tests dig a collider-sized shaft, fall to the foundation, jump, climb a voxel step, stop at a wall and avoid tunnelling during fast falls. Missing chunks block collision safely.

Generation tests cover same/different seeds, alternative voxel densities and chunk dimensions, all three surfaces, smooth terrain changes, chunk-space rescaling, independence from movement speed/physics frequency, and zero-weight material exclusion at noise clamp endpoints.

## Browser behaviour

Headless Chrome runs actual WebGL, Web Workers and browser input events. E2E verified start, pointer lock, WASD displacement, mouse yaw, jump, LMB mutation and asynchronous rebuild, falling into an excavated shaft, foundation immunity, rapid edit revision convergence, pause, unchanged state during pause, eviction/reload of edited chunks, bounded loaded count and absence of page/console errors. Normal gameplay contains no text instructions and diagnostics remain hidden by default.

Production smoke serves the built assets and verifies pointer lock, WASD, mouse/LMB rebuilding, Esc, resume, F3, no console errors and absence of the development inspection bridge even with ?test. No production gameplay function depends on that bridge.

Reviewed actual screenshots: [menu](menu.png), [spawn](spawn.png), [Mossland](mossland.png), [dunes](ochre-dunes.png), [highlands](basalt-highlands.png). Bedrock and E2E failure/success artifacts are generated in ignored `test-results/`. Visual inspection found a material-selection boundary bug; a dedicated regression test now covers it.

## Biome traversal

Seven measured straight geography spans at z=64 were 113–135m, equivalent to 31.39–37.50 seconds at 3.6m/s. Three complete routes were also stepped through the **actual player collision controller**, without jumps or bypassing terrain: highlands 33.89s, Mossland 34.17s, dunes 37.50s. These are simulated physics durations with procedural collision and no streaming waits, not stopwatch measurements of a human walking. Region width still derives exclusively from chunk-space configuration.

## Scope of evidence

This validates the local playable loop and a static production build. No deployment, multiplayer, disk persistence, mobile controls, weak-device benchmark or multi-hour soak was performed. Deep digging can trap a player, as there is no building/escape tool in scope. See [performance limitations](../architecture/performance.md) and root README.

Environment issues encountered and resolved: a global private npm registry was overridden locally with the public registry; npm 10.9 optional-peer resolution required the documented project npm setting; one clean-install retry was needed while Windows finished releasing esbuild after server shutdown. No portfolio files were edited by this task.
