import { chunkMeters } from '../core/config';
import { key2 } from '../core/math';
import { type Chunk } from '../chunks/chunk';
import { type MeshData } from '../meshing/greedy';
import { WorkerPool } from '../workers/pool';
import { World } from './world';

export interface ChunkRenderer { update(chunk: Chunk, mesh: MeshData): void; remove(key: string): void }
export class Streamer {
  private readonly pool: WorkerPool;
  private readonly pendingColumns = new Set<string>();
  private readonly pendingMeshes = new Set<string>();
  private desired = new Set<string>();
  private queue: { x: number; z: number }[] = [];
  private center = '';
  private disposed = false;
  rebuildCount = 0;
  lastWorkerMs = 0;
  lastSnapshotMs = 0;
  failure: Error | null = null;
  constructor(readonly world: World, private readonly renderer: ChunkRenderer) { this.pool = new WorkerPool(world.config.workerCount); }

  update(x: number, z: number): void {
    if (this.failure || this.disposed) return;
    const c = this.world.config, cx = Math.floor(x / chunkMeters(c)), cz = Math.floor(z / chunkMeters(c));
    const center = `${cx},${cz},${c.renderDistance}`;
    if (center !== this.center) {
      this.center = center; this.desired = new Set(); this.queue = [];
      for (let dz = -c.renderDistance; dz <= c.renderDistance; dz++) for (let dx = -c.renderDistance; dx <= c.renderDistance; dx++) {
        const px = cx + dx, pz = cz + dz;
        this.desired.add(key2(px, pz)); this.queue.push({ x: px, z: pz });
      }
      this.queue.sort((a, b) => (a.x - cx) ** 2 + (a.z - cz) ** 2 - (b.x - cx) ** 2 - (b.z - cz) ** 2);
      for (const chunk of this.world.chunks.values()) {
        if (!this.desired.has(key2(chunk.x, chunk.z))) { this.renderer.remove(chunk.key); this.world.unload(chunk.key); }
      }
    }
    for (const key of this.world.dirty) {
      if (!this.pool.available) break;
      if (this.pendingMeshes.has(key)) continue;
      const chunk = this.world.chunks.get(key);
      if (!chunk) { this.world.dirty.delete(key); continue; }
      const revision = chunk.revision, start = performance.now(), padded = this.world.snapshot(chunk);
      this.lastSnapshotMs = performance.now() - start;
      this.world.dirty.delete(key); this.pendingMeshes.add(key);
      void this.pool.run({ kind: 'mesh', size: c.chunkSize, padded }).then(result => {
        this.pendingMeshes.delete(key);
        if (this.disposed || result.kind !== 'mesh' || this.world.chunks.get(key) !== chunk) return;
        if (chunk.revision !== revision) { this.world.dirty.add(key); return; }
        this.renderer.update(chunk, result.mesh); chunk.meshRevision = revision;
        this.rebuildCount++; this.lastWorkerMs = result.milliseconds;
      }).catch(error => this.fail(error));
    }
    while (this.pool.available && this.queue.length) {
      const p = this.queue.shift()!, columnKey = key2(p.x, p.z);
      if (this.pendingColumns.has(columnKey) || this.world.chunks.has(`${p.x},0,${p.z}`)) continue;
      this.pendingColumns.add(columnKey);
      const editVersion = this.world.editVersion;
      void this.pool.run({ kind: 'generate', config: c, x: p.x, z: p.z, edits: this.world.editsForColumn(p.x, p.z) }).then(result => {
        this.pendingColumns.delete(columnKey);
        if (this.disposed || result.kind !== 'generate' || !this.desired.has(columnKey)) return;
        for (const item of result.chunks) {
          const chunk = this.world.attach(p.x, item.y, p.z, item.data);
          this.renderer.update(chunk, item.mesh); chunk.meshRevision = chunk.revision;
          if (this.world.editVersion !== editVersion) this.world.invalidate(chunk.x, chunk.y, chunk.z);
        }
        this.lastWorkerMs = result.milliseconds;
      }).catch(error => this.fail(error));
    }
  }
  get settled(): boolean { return !this.queue.length && !this.pendingColumns.size && !this.pendingMeshes.size && !this.world.dirty.size; }
  private fail(error: unknown): void { if (!this.disposed) this.failure = error instanceof Error ? error : new Error(String(error)); }
  dispose(): void { this.disposed = true; this.pool.dispose(); }
}
