# Player controller

`src/player/controller.ts` represents feet position, yaw/pitch, vertical velocity, grounded state and AABB only. There is no visible body. Radius 0.28m, height 1.75m, eye 1.62m. Inputs are normalized for diagonal speed, rotated by yaw and stepped at 120Hz with gravity and jumping. Frame accumulation is capped to avoid giant catch-up movements after suspension.

Collision queries current voxel IDs, not heightfield or meshes. Each axis movement subdivides displacement into less than half a voxel, then resolves a collision by binary search. This also bounds tunnelling during fast falls. Grounded movement may step up 0.3m if both raised positions are unobstructed. Gravity settles feet onto terrain. The absolute bedrock floor guards against out-of-world falls. Unloaded chunks block entry.

`src/player/input.ts` owns keyboard and pointer-lock listeners. Menu entry requests capture in a user gesture; no control instruction is displayed. Mouse adjusts camera orientation with pitch clamp. Esc, lost capture, blur and hidden document clear keys and pause. Space is edge-triggered, not auto-bunny-hop. Pointer-lock failure produces an operational menu error, not an interaction tutorial.

Axis-separated AABB collision is intentionally simple: no capsule, slope friction, crouch, swimming, sprint, interpolated physics render pose or network prediction. Cliffs require jumping or digging; deep shafts can trap a player.
