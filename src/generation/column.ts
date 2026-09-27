import { type GameConfig } from '../core/config';
import { index3 } from '../core/math';
import { terrainColumn, sampleColumn } from './terrain';
import { greedyMesh, type MeshData } from '../meshing/greedy';
import { type Edit } from '../world/world';
export interface GeneratedChunk { y: number; data: Uint8Array; mesh: MeshData }

export function generateColumn(c: GameConfig, cx: number, cz: number, edits: Edit[] = []): GeneratedChunk[] {
  const s = c.chunkSize, p = s + 2, height = c.worldHeightVoxels + 2;
  const volume = new Uint8Array(p * p * height);
  const index = (x: number, y: number, z: number) => x + p * (y + height * z);
  for (let z = 0; z < p; z++) for (let x = 0; x < p; x++) {
    const column = terrainColumn(c, cx * s + x - 1, cz * s + z - 1);
    for (let y = 0; y < height; y++) volume[index(x, y, z)] = sampleColumn(c, column, y - 1);
  }
  for (const [wx, wy, wz, id] of edits) {
    const x = wx - cx * s + 1, y = wy + 1, z = wz - cz * s + 1;
    if (x >= 0 && x < p && y > 1 && y < height && z >= 0 && z < p) volume[index(x, y, z)] = id;
  }
  const chunks: GeneratedChunk[] = [];
  for (let cy = 0; cy < c.worldHeightVoxels / s; cy++) {
    const padded = new Uint8Array(p ** 3), data = new Uint8Array(s ** 3);
    for (let z = 0; z < p; z++) for (let y = 0; y < p; y++) for (let x = 0; x < p; x++) {
      const id = volume[index(x, cy * s + y, z)];
      padded[index3(x, y, z, p)] = id;
      if (x > 0 && x <= s && y > 0 && y <= s && z > 0 && z <= s) data[index3(x - 1, y - 1, z - 1, s)] = id;
    }
    chunks.push({ y: cy, data, mesh: greedyMesh(padded, s) });
  }
  return chunks;
}
