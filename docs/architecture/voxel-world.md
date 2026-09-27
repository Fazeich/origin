# Voxel world and units

`src/voxels/registry.ts` defines Air, Grass, Dirt, Stone, Sand and Bedrock IDs plus solid/destructible metadata and linear RGB colour. One voxel is a Uint8 value. No runtime 4³ super-block exists. Scale converts directly between integer cells and metres.

`src/world/world.ts` owns loaded chunks and the sparse edit journal. Storage index is `x + size * (y + size * z)`. Floor division plus positive modulo handles negative world X/Z. Minimum logical height is zero; y<0 and y>=worldHeightVoxels read as Air. Bedrock occupies the first voxel slice [0, voxelSize) metres. Collision additionally enforces an absolute floor below the world.

Gameplay writes use `destroyVoxel(integerX, integerY, integerZ)`. It rejects malformed, out-of-height, unloaded, air and immutable targets before mutating. It writes Air, journals the edit, increments versions and invalidates the owner and face-adjacent boundary neighbours only. Attempts on Bedrock have no side effects. Read fallback outside loaded chunks is deterministic generation plus journal, used for halo/raycast; collision treats missing in-height chunks as solid for streaming safety.

The world arrays remain on the main thread. Workers receive copies and transfer fresh result buffers back. Mesh state never replaces voxel state.
