# ADR-002 — configurable quarter-metre voxels

Status: accepted, 2026-09-28.

Use 4 voxels/metre initially, with the conversion defined in `core/config.ts`. All world/player/render distances use metres; storage uses integer cells. There is no 4³-block runtime hierarchy. Other densities are validated in tests.

This supplies finer digging than metre blocks while retaining compact byte storage. Increasing density grows memory/meshing cost for the same physical volume; biome widths also change when chunk voxel dimensions stay constant. Changes require performance measurement, not engine rewrites.
