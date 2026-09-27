import { type GameConfig } from '../core/config';
import { index3, key3, mod } from '../core/math';
import { createChunk, type Chunk } from '../chunks/chunk';
import { sampleColumn, terrainColumn } from '../generation/terrain';
import { Voxel, VOXELS } from '../voxels/registry';

export type Edit = [number, number, number, Voxel];
export class World {
  readonly chunks = new Map<string, Chunk>();
  readonly dirty = new Set<string>();
  private readonly edits = new Map<string, Map<number, Voxel>>();
  editVersion = 0;
  constructor(readonly config: GameConfig) {}

  getVoxel(x: number, y: number, z: number): Voxel {
    const c = this.config, s = c.chunkSize;
    if (y < 0 || y >= c.worldHeightVoxels) return Voxel.Air;
    const key = key3(Math.floor(x / s), Math.floor(y / s), Math.floor(z / s));
    const index = index3(mod(x, s), mod(y, s), mod(z, s), s);
    const chunk = this.chunks.get(key);
    if (chunk) return chunk.data[index];
    const edit = this.edits.get(key)?.get(index);
    return edit ?? sampleColumn(c, terrainColumn(c, x, z), y);
  }

  /** Unloaded horizontal columns are temporarily solid, preventing falls into incomplete streaming. */
  collisionSolid(x: number, y: number, z: number): boolean {
    if (y < 0) return true;
    if (y >= this.config.worldHeightVoxels) return false;
    const s = this.config.chunkSize;
    const chunk = this.chunks.get(key3(Math.floor(x / s), Math.floor(y / s), Math.floor(z / s)));
    return !chunk || VOXELS[chunk.data[index3(mod(x, s), mod(y, s), mod(z, s), s)] as Voxel].solid;
  }

  attach(x: number, y: number, z: number, data: Uint8Array): Chunk {
    const chunk = createChunk(x, y, z, data);
    for (const [index, value] of this.edits.get(chunk.key) ?? []) chunk.data[index] = value;
    this.chunks.set(chunk.key, chunk);
    return chunk;
  }

  unload(key: string): void { this.chunks.delete(key); this.dirty.delete(key); }

  /** Trusted state mutation boundary. Input is integer voxel coordinates, never render objects. */
  destroyVoxel(x: number, y: number, z: number): boolean {
    if (![x, y, z].every(Number.isSafeInteger) || y <= 0 || y >= this.config.worldHeightVoxels) return false;
    const s = this.config.chunkSize;
    const cx = Math.floor(x / s), cy = Math.floor(y / s), cz = Math.floor(z / s);
    const key = key3(cx, cy, cz), chunk = this.chunks.get(key);
    if (!chunk) return false;
    const lx = mod(x, s), ly = mod(y, s), lz = mod(z, s), index = index3(lx, ly, lz, s);
    if (!VOXELS[chunk.data[index] as Voxel].destructible) return false;
    chunk.data[index] = Voxel.Air;
    let edits = this.edits.get(key);
    if (!edits) { edits = new Map(); this.edits.set(key, edits); }
    edits.set(index, Voxel.Air); this.editVersion++;
    this.invalidate(cx, cy, cz);
    if (lx === 0) this.invalidate(cx - 1, cy, cz);
    if (lx === s - 1) this.invalidate(cx + 1, cy, cz);
    if (ly === 0) this.invalidate(cx, cy - 1, cz);
    if (ly === s - 1) this.invalidate(cx, cy + 1, cz);
    if (lz === 0) this.invalidate(cx, cy, cz - 1);
    if (lz === s - 1) this.invalidate(cx, cy, cz + 1);
    return true;
  }

  invalidate(x: number, y: number, z: number): void {
    const key = key3(x, y, z), chunk = this.chunks.get(key);
    if (chunk) { chunk.revision++; this.dirty.add(key); }
  }

  snapshot(chunk: Chunk): Uint8Array {
    const s = this.config.chunkSize, p = s + 2, result = new Uint8Array(p ** 3);
    for (let z = -1; z <= s; z++) for (let y = -1; y <= s; y++) for (let x = -1; x <= s; x++) {
      result[index3(x + 1, y + 1, z + 1, p)] = this.getVoxel(chunk.x * s + x, chunk.y * s + y, chunk.z * s + z);
    }
    return result;
  }

  editsForColumn(cx: number, cz: number): Edit[] {
    const s = this.config.chunkSize, result: Edit[] = [];
    for (let z = cz - 1; z <= cz + 1; z++) for (let x = cx - 1; x <= cx + 1; x++) {
      for (let y = 0; y < this.config.worldHeightVoxels / s; y++) {
        for (const [i, id] of this.edits.get(key3(x, y, z)) ?? []) {
          result.push([x * s + i % s, y * s + Math.floor(i / s) % s, z * s + Math.floor(i / (s * s)), id]);
        }
      }
    }
    return result;
  }
}
