import { type Vec3 } from '../core/math';
import { isSolid, type Voxel } from '../voxels/registry';
export interface VoxelReader { getVoxel(x: number, y: number, z: number): Voxel }
export interface VoxelHit extends Vec3 { distance: number; normal: Vec3; voxel: Voxel }
/** Amanatides–Woo traversal; input is metres, output is voxel coordinates and metre distance. */
export function raycast(world: VoxelReader, origin: Vec3, direction: Vec3, range: number, scale: number): VoxelHit | null {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (!Number.isFinite(length) || length === 0 || ![origin.x, origin.y, origin.z, range, scale].every(Number.isFinite) || range < 0 || scale <= 0) return null;
  const o = [origin.x * scale, origin.y * scale, origin.z * scale];
  const d = [direction.x / length, direction.y / length, direction.z / length];
  const cell = o.map(Math.floor), step = d.map(Math.sign);
  const delta = d.map(v => v === 0 ? Infinity : Math.abs(1 / v));
  const max = d.map((v, i) => v === 0 ? Infinity : ((v > 0 ? cell[i] + 1 : cell[i]) - o[i]) / v);
  let distance = 0, normal: Vec3 = { x: 0, y: 0, z: 0 };
  while (distance <= range * scale) {
    const voxel = world.getVoxel(cell[0], cell[1], cell[2]);
    if (isSolid(voxel)) return { x: cell[0], y: cell[1], z: cell[2], voxel, distance: distance / scale, normal };
    const axis = max[0] <= max[1] && max[0] <= max[2] ? 0 : max[1] <= max[2] ? 1 : 2;
    distance = max[axis]; cell[axis] += step[axis]; max[axis] += delta[axis];
    normal = { x: axis === 0 ? -step[axis] : 0, y: axis === 1 ? -step[axis] : 0, z: axis === 2 ? -step[axis] : 0 };
  }
  return null;
}
