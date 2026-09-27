import { biomeAt, BIOMES } from '../biomes/regions';
import { chunkMeters } from '../core/config';
import { Player } from '../player/controller';
import { Renderer } from '../rendering/renderer';
import { Streamer } from '../world/streamer';
export class Metrics {
  private readonly frames: number[] = [];
  private elapsed = 0;
  fps = 0;
  frameMs = 0;
  p95Ms = 0;
  constructor(private readonly element: HTMLElement) {}
  tick(dt: number, player: Player, renderer: Renderer, stream: Streamer): void {
    this.frames.push(dt * 1000); if (this.frames.length > 600) this.frames.shift();
    this.elapsed += dt;
    if (this.elapsed < 0.25) return;
    this.elapsed = 0;
    const sorted = [...this.frames].sort((a, b) => a - b);
    this.frameMs = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    this.fps = 1000 / this.frameMs; this.p95Ms = sorted[Math.floor(sorted.length * 0.95)];
    if (this.element.hidden) return;
    const c = player.config, p = player.position, b = biomeAt(c, p.x, p.z), width = chunkMeters(c);
    this.element.textContent = [
      'ORIGIN / DEVELOPER', `${this.fps.toFixed(1)} FPS  ${this.frameMs.toFixed(2)} ms  p95 ${this.p95Ms.toFixed(2)} ms`,
      `xyz ${p.x.toFixed(2)} ${p.y.toFixed(2)} ${p.z.toFixed(2)}`,
      `chunk ${Math.floor(p.x / width)} ${Math.floor(p.y / width)} ${Math.floor(p.z / width)}`,
      `region ${b.regionX},${b.regionZ} / ${BIOMES[b.dominant].name}`,
      `chunks ${stream.world.chunks.size} / radius ${c.renderDistance} / ${stream.settled ? 'settled' : 'streaming'}`,
      `triangles ${renderer.gl.info.render.triangles} / calls ${renderer.gl.info.render.calls}`,
      `rebuilds ${stream.rebuildCount} / dirty ${stream.world.dirty.size}`,
      `worker ${stream.lastWorkerMs.toFixed(2)} ms / snapshot ${stream.lastSnapshotMs.toFixed(2)} ms`,
      `seed ${c.seed} / biome ${c.biomeSizeInChunks} chunks / scale ${c.voxelsPerMeter}`,
    ].join('\n');
  }
}
