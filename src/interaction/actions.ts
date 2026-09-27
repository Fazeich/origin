import { type Vec3 } from '../core/math';
import { World } from '../world/world';
import { raycast } from './raycast';
export interface DestroyAction { type: 'destroy'; origin: Vec3; direction: Vec3 }
/** Local authority seam: future server obtains origin from validated actor pose, then re-runs this ray. */
export function applyAction(world: World, action: DestroyAction): boolean {
  const hit = raycast(world, action.origin, action.direction, world.config.interactionRange, world.config.voxelsPerMeter);
  return hit ? world.destroyVoxel(hit.x, hit.y, hit.z) : false;
}
