# Measured performance — 2026-09-28 (local Moscow date)

Raw reproducible output: [profile.json](../validation/profile.json). Command: run the dev server, then `npm run profile`. Headless Chrome 153.0.8010.53, Windows 10.0.26200, AMD Ryzen 5 7600, NVIDIA RTX 4070 through ANGLE/D3D11. Viewport 1440×900, device scale factor 1. Each stationary scene records 600 RAF intervals after streaming and warm-up. These are developer-environment measurements, not a guarantee for other hardware or a headed-browser benchmark.

## Configuration and memory

- Chunk: 32³ IDs, 8m side, 32KiB storage.
- Biome size: 16 chunks, 128m nominal. Height: 96 voxels / 24m.
- Load/render radius: 6 chunks / 48m. Fog: 23.04–44.64m.
- Loaded arrays: 507 (169 complete columns), 16,613,376 bytes = 15.84MiB, excluding mesh arrays, workers, JS objects and sparse edits.
- Two worker slots; no per-voxel render objects. Complete initial window measured at about 834ms from navigation on the warm local dev environment.

| Scene | RAF FPS | Mean frame | p95 frame | Rendered triangles | Draw calls |
| --- | ---: | ---: | ---: | ---: | ---: |
| Spawn transition | 180.28 | 5.55ms | 5.60ms | 20,110 | 85 |
| Mossland | 180.25 | 5.55ms | 5.60ms | 11,352 | 71 |
| Ochre dunes | 180.08 | 5.55ms | 5.60ms | 26,708 | 103 |
| Basalt highlands | 180.04 | 5.55ms | 5.60ms | 36,774 | 153 |

Counts include the sky sphere. Resident GPU geometry varied from 85 to 173, much lower than the 507 data chunks because empty chunks do not render. Frustum culling further reduces visible calls. RAF appears capped around 180Hz in this environment; it is not an uncapped GPU throughput measurement.

A 30-column Node/Vite-SSR generation+mesh microbenchmark measured mean 12.90ms, min 11.05ms, max 40.81ms (includes cold/JIT effects). Browser last-job samples were 3.5–5.7ms; these are individual observations, not percentile distributions. A real LMB at the profiled chunk corner rebuilt three chunks; last snapshot cost 4.9ms on the main thread and last worker remesh cost 1.0ms. No console/page errors were recorded.

## Bottlenecks and limits

Main-thread halo assembly performs string-keyed voxel lookups, including procedural fallback at unloaded boundaries. GPU upload and disposal are also on the main thread. Burst digging can accumulate dirty work, although only two worker jobs are in flight and obsolete revisions are discarded. Geometric complexity increases around fragmented excavation and material transitions. Sparse session edits grow without a lifetime cap. No LOD or mid-job worker cancellation exists.

Next optimizations should be measurement-driven: specialize halo copying from neighbouring typed arrays; cache unloaded boundary columns; budget uploads per frame; pool temporary masks/buffers; introduce LOD only if larger radius demands it. Do not replace correctness checks with optimistic mesh-only edits.

Not measured: mobile or low-end GPU performance, long-session memory soak, cross-browser GPU precision, network throughput, production multiplayer or full heap/GPU memory accounting. Browser tests cover walking, excavation, streaming and real production assets; this table specifically measures stationary dev scenes.
