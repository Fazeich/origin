import { type GameConfig } from '../core/config';
import { clamp } from '../core/math';
import { BIOMES, biomeAt } from '../biomes/regions';
import { fbm, noise } from './noise';
import { Voxel } from '../voxels/registry';

export interface TerrainColumn { height: number; surface: Voxel }
export function terrainColumn(c: GameConfig, vx: number, vz: number): TerrainColumn {
  const x = vx / c.voxelsPerMeter, z = vz / c.voxelsPerMeter;
  const biome = biomeAt(c, x, z);
  let height = c.terrain.baseHeight;
  for (let i = 0; i < BIOMES.length; i++) {
    const b = c.terrain.profiles[i], n = fbm(x * b.frequency, z * b.frequency, c.seed + i * 101);
    const shape = i === 2 ? 1 - Math.abs(n * 2 - 1) : n;
    height += biome.weights[i] * (b.elevation + shape * b.amplitude);
  }
  height += (noise(x * c.terrain.detailFrequency, z * c.terrain.detailFrequency, c.seed + 17) - 0.5) * c.terrain.detailAmplitude;
  // Coherent patches in the blend band, instead of a straight material seam.
  const t = c.terrain;
  const roll = clamp((noise(x * t.surfacePatchFrequency, z * t.surfacePatchFrequency, c.seed + 13) - t.surfaceNoiseLow)
    / (t.surfaceNoiseHigh - t.surfaceNoiseLow), 0, 0.999999);
  let accumulated = 0, surface: Voxel = BIOMES[biome.dominant].surface;
  for (let i = 0; i < BIOMES.length; i++) {
    accumulated += biome.weights[i];
    if (roll < accumulated) { surface = BIOMES[i].surface; break; }
  }
  return { height: clamp(Math.floor(height * c.voxelsPerMeter), 2, c.worldHeightVoxels - 2), surface };
}
export function sampleColumn(c: GameConfig, column: TerrainColumn, y: number): Voxel {
  if (y < 0 || y >= c.worldHeightVoxels || y > column.height) return Voxel.Air;
  if (y === 0) return Voxel.Bedrock;
  if (y === column.height) return column.surface;
  if (y > column.height - Math.ceil(c.terrain.soilDepth * c.voxelsPerMeter)) {
    return column.surface === Voxel.Grass ? Voxel.Dirt : column.surface;
  }
  return Voxel.Stone;
}
