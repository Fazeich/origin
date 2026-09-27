# World generation

`src/generation/noise.ts` supplies seeded integer hash, smooth value noise and layered FBM. No generation path reads time or Math.random. `terrainColumn` converts horizontal voxel coordinates to metres, queries biome weights, combines biome height parameters, and adds low-amplitude detail. Highlands use a ridged transformation of layered noise; dunes and mossland use different amplitude/frequency/elevation.

Height is quantized to voxels and clamped below the world ceiling. The highest occupied voxel uses the selected biome surface; the configured soil-depth layer uses Dirt under Grass, Sand under dunes, Stone in highlands. Deeper cells are Stone; y=0 is always Bedrock; all cells above the surface are Air. No procedural caves or fluids.

`src/generation/column.ts` computes every horizontal terrain column once for an expanded chunk column, fills typed storage, applies sparse session edits and extracts vertical chunks plus halo meshes. This avoids expensive noise evaluation per voxel. Neighbour samples use global coordinates, avoiding seed seams. The worker receives a complete serializable config.

The terrain envelope is metre-based; changing voxel scale changes detail density without redefining player size. Biome geography, separately, uses chunk-space scale. Changing chunk size or voxel scale therefore changes a biome's physical width as documented. Per-biome elevation/amplitude/frequency and surface-patch tuning live in the central config. A zero-weight material is never selected, including at noise clamp endpoints; this has a dedicated regression test.
