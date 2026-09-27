# Coding standards

Strict TypeScript, named exports, single-purpose domain files, no `any` in engine code. Type-only imports mark subsystem boundaries. Configuration holds dimensions and tuning. Helpers should retain units in parameter names or documentation.

Fast state is mutable and independent of UI. Chunk arrays are owned by World. Generation produces arrays, meshing consumes a snapshot, and only rendering creates Three objects. World functions never depend on DOM or Three. Worker jobs are serializable typed discriminated unions with transferable arrays.

Every asynchronous mesh reply must verify the chunk object identity and revision before replacing GPU geometry. Dispose old geometry on replacement and eviction; stop listeners/workers/RAF on lifecycle cleanup. Pool failure is surfaced instead of silently losing jobs.

Avoid one object per voxel. A chunk may own one render mesh. Greedy quads may span same-material voxel faces. Do not treat the mesh as collision authority. Do not optimize away the Bedrock or action boundary checks.
