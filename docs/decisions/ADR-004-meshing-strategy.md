# ADR-004 — greedy faces in workers

Status: accepted, 2026-09-28.

Use signed-material greedy masks on three axes, merging exposed equal-material quads. Pass a one-voxel halo so neighbour faces are resolved without reading Three geometry. Work is isolated behind a pure Mesher signature and executed in a bounded two-worker pool with transferable buffers.

Simple culled faces were acceptable, but greedy merging substantially reduces broad terrain surfaces without coupling storage to renderer. Per-voxel objects are prohibited. Costs: some T-junctions, no AO-aware merging, main-thread snapshot copies and GPU uploads. Revision/identity checks prevent stale worker results replacing newer geometry.
