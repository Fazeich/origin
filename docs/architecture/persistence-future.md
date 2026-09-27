# Persistence: future, not implemented

The current sparse journal maps chunk key → local voxel index → replacement ID and exists only in memory. It survives chunk eviction and is reapplied to generation, including halo neighbours. Reloading closes the session and resets terrain. Seed selection alone does not save edits.

A future local save should persist a versioned schema containing seed, generation version, scale/dimensions and chunk edit lists, with validation and an explicit reset/migration policy. IndexedDB can be considered for larger journals. A production shared world requires server authority and snapshots/deltas; no database or storage service is currently present.

Bound journal memory or provide measured budgets before calling long sessions production-ready. Regeneration must use the same generation version or edits may target different terrain after an algorithm update.
