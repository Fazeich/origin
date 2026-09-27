import { chunkMeters, type GameConfig } from '../core/config';
import { mod } from '../core/math';
import { noise } from '../generation/noise';
import { Voxel } from '../voxels/registry';

export const BIOMES = [
  { name: 'Mossland', surface: Voxel.Grass },
  { name: 'Ochre dunes', surface: Voxel.Sand },
  { name: 'Basalt highlands', surface: Voxel.Stone },
] as const;
export interface BiomeSample { weights: number[]; dominant: number; regionX: number; regionZ: number }
/** Warped region lattice. No speed, elapsed time, renderer, or FPS dependency. */
export function biomeAtChunk(c: GameConfig, cx: number, cz: number): BiomeSample {
  const bx = cx / c.biomeSizeInChunks, bz = cz / c.biomeSizeInChunks;
  const f = c.biome.warpFrequency;
  const x = bx + (noise(bx * f, bz * f, c.seed + 991) - 0.5) * c.biome.warp;
  const z = bz + (noise(bx * f + 41, bz * f - 17, c.seed + 177) - 0.5) * c.biome.warp;
  // Region centres lie at half integers, retaining a useful three-biome junction near spawn.
  const rx = Math.floor(x), rz = Math.floor(z);
  const candidates: { id: number; distance: number; x: number; z: number }[] = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const gx = rx + dx, gz = rz + dz;
    candidates.push({ id: mod(gx + 2 * gz + c.seed, BIOMES.length),
      distance: Math.hypot(x - gx - 0.5, z - gz - 0.5), x: gx, z: gz });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  const weights = [0, 0, 0], nearest = candidates[0];
  let total = 0;
  for (const p of candidates) {
    const t = Math.max(0, 1 - (p.distance - nearest.distance) / c.biome.transition);
    const w = t * t * (3 - 2 * t);
    weights[p.id] += w; total += w;
  }
  for (let i = 0; i < weights.length; i++) weights[i] /= total;
  return { weights, dominant: weights.indexOf(Math.max(...weights)), regionX: nearest.x, regionZ: nearest.z };
}
export const biomeAt = (c: GameConfig, x: number, z: number) => biomeAtChunk(c, x / chunkMeters(c), z / chunkMeters(c));
