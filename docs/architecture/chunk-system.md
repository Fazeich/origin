# Chunk system

Default cubic size: 32³ = 32,768 IDs = 32KiB/chunk, 8m side at 4 voxels/m. The 96-voxel vertical extent has three stacked chunks. The streamer loads complete vertical columns around the player, nearest-first; radius six means at most 13×13×3 = 507 resident chunks (15.84375MiB voxel arrays).

`src/world/streamer.ts` owns desired columns, ordered generation requests, pending sets, dirty rebuild scheduling and eviction. Two workers bound concurrency. Rebuilds take priority over further generation. Geometry and world arrays unload outside the square window; session edits remain sparse. No production persistence is implied.

Initial generation includes deterministic halo neighbours even when they are not loaded. Thus initial shared faces are culled consistently and loading a neighbour does not force a world rebuild. A generation reply whose halo may predate an edit gets invalidated. Remesh replies must match both chunk object identity and revision; stale replies are dropped and current dirty work is rescheduled. Empty chunks retain data but create no mesh.

No worker cancels an already running column job. Results outside the current desired set are discarded. Unloaded space blocks the controller until data is ready. Finite height and bounded horizontal residency make the prototype inspectable while allowing continuous exploration.
