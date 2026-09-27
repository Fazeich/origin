# Architecture

Standalone Vite/TypeScript/Three client. No React objects per voxel, physics library, database, network server, or dependency on portfolio. Coordinates are Y-up. World/player/render coordinates use metres; storage/raycast cell coordinates use integer voxels; streaming and biome regions use chunk coordinates.

Input → local action validation → World Uint8Array state → affected chunk revisions → worker greedy meshing → Three BufferGeometry replacement.

Generation and initial meshing run in a two-worker pool. The same workers rebuild edited chunks from a copied one-voxel halo. Main-thread world storage is the source of truth; render revisions reject stale replies. Collision queries storage directly, never geometry. Sparse session edits survive unload/reload. Reloading the page resets the session.

Initial configuration: 32³ voxels/chunk, 4 voxels/metre, 96 voxels vertical height, horizontal streaming radius 6 chunks. A chunk is 8m wide. Biome regions are 16 chunks (128m), warped and blended. Nominal traversal at 3.6m/s is 35.56 seconds. Actual routes vary with terrain and region edges.

Read the subsystem files alongside this overview. Research rationale: `../research/portfolio.md`. Implementation choices: `../decisions/`.
