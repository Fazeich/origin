# Interaction

Actual left mousedown while captured calls `applyAction({type:'destroy', origin:player.eye, direction:player.direction})`. `src/interaction/raycast.ts` normalizes the direction and performs grid DDA through voxel state. It returns the first solid voxel, entry normal and distance, bounded to the configured 4m range. Zero/nonfinite directions are rejected; axis-aligned rays use infinite crossing time for zero components.

The action layer recomputes the hit and calls World.destroyVoxel. The World layer checks loaded state, integer coordinates, height, air and destructibility. Air replacement changes collision immediately; visible geometry catches up after worker meshing. There are no fake particles, hidden decorative cubes or shader-only deletion tricks.

Bedrock is a valid ray target, but mutation returns false and nothing is displayed. One press removes one voxel; there is no hold-to-mine acceleration. The dot crosshair carries no material or action label.

The local API receives a trusted eye pose. A future server must get that pose from authoritative actor state, validate range/rate/sequence, and rerun DDA. The current seam is not a network security mechanism.
