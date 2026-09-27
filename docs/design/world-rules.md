# World rules

- Y-up world; integer voxel y=0 is the gray foundation. No voxel exists below it.
- Bedrock cannot be destroyed. Every other solid initial material can be removed within the configured reach.
- A voxel is the base unit, initially 0.25m. There is no larger logical block subdivided at runtime.
- Terrain authority is data, not visible geometry. Collision changes with that data.
- Geography is deterministic for seed and generation config. Horizontal loading follows the player; height is bounded.
- Three biomes occupy warped regions measured in chunks. Time and movement speed never define their scale.
- Digging has no item rewards, building counterpart or automatic escape. Refresh starts an unchanged generated world.
