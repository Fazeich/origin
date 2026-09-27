import { describe, expect, it } from 'vitest';
import { CONFIG, chunkMeters, validateConfig } from '../../src/core/config';
import { index3, key3 } from '../../src/core/math';
import { Voxel } from '../../src/voxels/registry';
import { World } from '../../src/world/world';
import { generateColumn } from '../../src/generation/column';
import { terrainColumn, sampleColumn } from '../../src/generation/terrain';
import { biomeAt, biomeAtChunk, BIOMES } from '../../src/biomes/regions';
import { greedyMesh } from '../../src/meshing/greedy';
import { raycast } from '../../src/interaction/raycast';
import { applyAction } from '../../src/interaction/actions';
import { Player } from '../../src/player/controller';

const small = () => ({ ...structuredClone(CONFIG), chunkSize: 8, worldHeightVoxels: 32 });
function filledWorld() {
  const c = small(), world = new World(c);
  for (let z = -1; z <= 1; z++) for (let y = 0; y < 4; y++) for (let x = -1; x <= 1; x++) {
    const data = new Uint8Array(c.chunkSize ** 3).fill(Voxel.Stone);
    if (y === 0) for (let z = 0; z < c.chunkSize; z++) for (let x = 0; x < c.chunkSize; x++) data[index3(x, 0, z, c.chunkSize)] = Voxel.Bedrock;
    world.attach(x, y, z, data);
  }
  return world;
}
describe('authoritative voxel state', () => {
  it.each([
    [2, 10, 2, ['0,1,0']],
    [0, 10, 2, ['0,1,0', '-1,1,0']],
    [7, 10, 2, ['0,1,0', '1,1,0']],
    [2, 8, 2, ['0,1,0', '0,0,0']],
    [2, 15, 2, ['0,1,0', '0,2,0']],
    [2, 10, 0, ['0,1,0', '0,1,-1']],
    [2, 10, 7, ['0,1,0', '0,1,1']],
    [7, 15, 7, ['0,1,0', '1,1,0', '0,2,0', '0,1,1']],
  ] as const)('invalidates exactly face neighbours at (%s,%s,%s)', (x, y, z, keys) => {
    const world = filledWorld(); expect(world.destroyVoxel(x, y, z)).toBe(true);
    expect([...world.dirty].sort()).toEqual([...keys].sort());
    expect(world.getVoxel(x, y, z)).toBe(Voxel.Air);
    expect(world.collisionSolid(x, y, z)).toBe(false);
    for (const key of keys) expect(world.chunks.get(key)!.revision).toBe(1);
    expect(world.destroyVoxel(x, y, z)).toBe(false);
  });
  it('exposes a real neighbouring face at a removed chunk boundary', () => {
    const world = filledWorld(), chunk = world.chunks.get('1,1,0')!;
    const before = greedyMesh(world.snapshot(chunk), 8);
    world.destroyVoxel(7, 10, 2);
    const after = greedyMesh(world.snapshot(chunk), 8);
    expect(after.indices.length).toBe(before.indices.length + 6);
    const face = Array.from(after.normals).some((n, i) => i % 3 === 0 && n === -1);
    expect(face).toBe(true);
  });
  it('digging reaches visible, raycastable and indestructible foundation with no false rebuild', () => {
    const world = filledWorld();
    for (let y = 31; y > 0; y--) expect(world.destroyVoxel(2, y, 2)).toBe(true);
    world.dirty.clear();
    const versions = [...world.chunks.values()].map(c => c.revision);
    const hit = raycast(world, { x: 0.625, y: 0.7, z: 0.625 }, { x: 0, y: -1, z: 0 }, 4, 4);
    expect(hit?.voxel).toBe(Voxel.Bedrock); expect(hit?.y).toBe(0);
    expect(applyAction(world, { type: 'destroy', origin: { x: 0.625, y: 0.7, z: 0.625 }, direction: { x: 0, y: -1, z: 0 } })).toBe(false);
    expect(world.destroyVoxel(2, -1, 2)).toBe(false);
    expect(world.getVoxel(2, -1, 2)).toBe(Voxel.Air);
    expect(world.dirty.size).toBe(0);
    expect([...world.chunks.values()].map(c => c.revision)).toEqual(versions);
    const mesh = greedyMesh(world.snapshot(world.chunks.get('0,0,0')!), 8);
    let foundTop = false;
    for (let i = 0; i < mesh.positions.length; i += 3) if (mesh.positions[i + 1] === 1 && mesh.normals[i + 1] === 1) foundTop = true;
    expect(foundTop).toBe(true);
  });
  it('preserves edits on unloading, generating with a halo, and reloading negative chunks', () => {
    const world = filledWorld(); world.destroyVoxel(-1, 10, -1);
    world.unload('-1,1,-1');
    const generated = generateColumn(world.config, -1, -1, world.editsForColumn(-1, -1));
    const item = generated.find(c => c.y === 1)!;
    world.attach(-1, 1, -1, item.data);
    expect(world.getVoxel(-1, 10, -1)).toBe(Voxel.Air);
    expect(world.getVoxel(-1, 0, -1)).toBe(Voxel.Bedrock);
  });
  it('rejects malformed/outside/unloaded mutations', () => {
    const world = filledWorld();
    for (const x of [NaN, Infinity, 1.2, 100000]) expect(world.destroyVoxel(x, 10, 2)).toBe(false);
    expect(world.destroyVoxel(2, 32, 2)).toBe(false);
  });
});

describe('greedy meshing', () => {
  it('merges a solid chunk into six outward-facing quads with correct winding', () => {
    const size = 8, p = size + 2, padded = new Uint8Array(p ** 3);
    for (let z = 1; z <= size; z++) for (let y = 1; y <= size; y++) for (let x = 1; x <= size; x++) padded[index3(x, y, z, p)] = Voxel.Stone;
    const mesh = greedyMesh(padded, size);
    expect(mesh.indices.length).toBe(36);
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = Array.from(mesh.indices.slice(i, i + 3)).map(v => v * 3);
      const ab = [0, 1, 2].map(j => mesh.positions[b + j] - mesh.positions[a + j]);
      const ac = [0, 1, 2].map(j => mesh.positions[c + j] - mesh.positions[a + j]);
      const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
      expect(cross.reduce((sum, v, j) => sum + v * mesh.normals[a + j], 0)).toBeGreaterThan(0);
    }
    padded.fill(Voxel.Stone); expect(greedyMesh(padded, size).indices.length).toBe(0);
    padded.fill(Voxel.Air); expect(greedyMesh(padded, size).indices.length).toBe(0);
  });
  it('does not merge different materials and never emits halo-owned faces', () => {
    const p = 6, padded = new Uint8Array(p ** 3);
    padded[index3(1, 1, 1, p)] = Voxel.Stone; padded[index3(2, 1, 1, p)] = Voxel.Sand;
    expect(greedyMesh(padded, 4).indices.length).toBe(60);
    padded.fill(0); padded[index3(0, 1, 1, p)] = Voxel.Stone;
    expect(greedyMesh(padded, 4).indices.length).toBe(0);
  });
});

describe('procedural geography', () => {
  it('generates identical data and meshes for identical seed, independent of request order', () => {
    const c = small(), a = generateColumn(c, -1, 0), b = generateColumn(c, -1, 0);
    expect(a).toEqual(b);
    const changed = { ...c, seed: c.seed + 99 };
    expect(generateColumn(changed, -1, 0)).not.toEqual(a);
    for (const chunk of a) if (chunk.y === 0) for (let x = 0; x < c.chunkSize; x++) expect(chunk.data[index3(x, 0, 0, c.chunkSize)]).toBe(Voxel.Bedrock);
  });
  it('supports alternate voxel scale and chunk dimensions', () => {
    for (const voxelsPerMeter of [2, 5]) {
      const c = { ...small(), voxelsPerMeter }; validateConfig(c);
      const chunks = generateColumn(c, 0, 0);
      expect(chunks.length).toBe(c.worldHeightVoxels / c.chunkSize);
      expect(chunks[0].data.length).toBe(c.chunkSize ** 3);
    }
  });
  it('finds all three distinct surfaces near spawn and blends transitions', () => {
    const types = new Set(), surfaces = new Set(); let blended = 0;
    for (let z = -80; z <= 80; z += 8) for (let x = -80; x <= 80; x += 8) {
      const b = biomeAt(CONFIG, x, z); types.add(b.dominant);
      expect(b.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
      if (b.weights.filter(w => w > 0.05).length > 1) blended++;
      surfaces.add(terrainColumn(CONFIG, x * CONFIG.voxelsPerMeter, z * CONFIG.voxelsPerMeter).surface);
    }
    expect(types.size).toBe(3); expect(surfaces.size).toBe(3); expect(blended).toBeGreaterThan(0);
  });
  it('scales regions in chunk-space, independent of speed, FPS, and voxel size', () => {
    const bigger = { ...CONFIG, biomeSizeInChunks: CONFIG.biomeSizeInChunks * 2 };
    const faster = { ...CONFIG, fixedStep: 1 / 30, player: { ...CONFIG.player, speed: 100 } };
    for (let x = -55; x < 55; x += 3) {
      expect(biomeAtChunk(CONFIG, x, 7)).toEqual(biomeAtChunk(bigger, x * 2, 14));
      expect(biomeAtChunk(CONFIG, x, 7)).toEqual(biomeAtChunk(faster, x, 7));
      expect(biomeAtChunk(CONFIG, x, 7)).toEqual(biomeAtChunk({ ...CONFIG, voxelsPerMeter: 8 }, x, 7));
    }
    const nominal = chunkMeters(CONFIG) * CONFIG.biomeSizeInChunks / CONFIG.player.speed;
    expect(nominal).toBeGreaterThan(30); expect(nominal).toBeLessThan(40);
  });
  it('never selects a zero-weight surface in a pure biome, even at noise-clamp endpoints', () => {
    for (const [cx, cz] of [[-48, -48], [-48, 48], [48, -48]]) {
      for (let z = cz - 5; z <= cz + 5; z++) for (let x = cx - 5; x <= cx + 5; x++) {
        const b = biomeAt(CONFIG, x, z);
        expect(b.weights[b.dominant]).toBe(1);
        expect(terrainColumn(CONFIG, x * CONFIG.voxelsPerMeter, z * CONFIG.voxelsPerMeter).surface).toBe(BIOMES[b.dominant].surface);
      }
    }
  });
  it('keeps terrain continuous across region boundaries and never generates below zero', () => {
    let maxDelta = 0;
    for (let x = -600; x < 600; x++) {
      const a = terrainColumn(CONFIG, x, 100), b = terrainColumn(CONFIG, x + 1, 100);
      maxDelta = Math.max(maxDelta, Math.abs(a.height - b.height));
      expect(sampleColumn(CONFIG, a, -1)).toBe(Voxel.Air);
    }
    expect(maxDelta).toBeLessThanOrEqual(2);
  });
});

describe('grid raycast and range', () => {
  const world = { getVoxel: (x: number, y: number, z: number) => x === -2 && y === 1 && z === 0 ? Voxel.Stone : Voxel.Air };
  it('handles negative coordinates, axis-aligned rays and exact maximum range', () => {
    const origin = { x: 0.5, y: 0.3, z: 0.1 }, direction = { x: -1, y: 0, z: 0 };
    expect(raycast(world, origin, direction, 0.749, 4)).toBeNull();
    const hit = raycast(world, origin, direction, 0.75, 4);
    expect(hit?.x).toBe(-2); expect(hit?.normal.x).toBe(1); expect(hit?.distance).toBe(0.75);
    expect(raycast(world, origin, { x: 0, y: 0, z: 0 }, 4, 4)).toBeNull();
  });
  it('does not destroy beyond gameplay reach', () => {
    const world = filledWorld(); const before = world.editVersion;
    expect(applyAction(world, { type: 'destroy', origin: { x: 0.5, y: 20, z: 0.5 }, direction: { x: 0, y: -1, z: 0 } })).toBe(false);
    expect(world.editVersion).toBe(before);
  });
});

describe('player collision', () => {
  it('falls onto voxel floor and remains above bedrock after digging a body-sized shaft', () => {
    const c = small(), world = filledWorld();
    for (let z = 0; z <= 4; z++) for (let x = 0; x <= 4; x++) for (let y = 1; y < 32; y++) world.destroyVoxel(x, y, z);
    const player = new Player(c, world); player.position = { x: 0.625, y: 6, z: 0.625 };
    for (let i = 0; i < 1000; i++) player.step(c.fixedStep, { forward: 0, right: 0, jump: false });
    expect(player.position.y).toBeCloseTo(0.25, 4); expect(player.grounded).toBe(true); expect(player.collides(player.position)).toBe(false);
    const y = player.position.y; player.step(c.fixedStep, { forward: 0, right: 0, jump: true });
    expect(player.position.y).toBeGreaterThan(y);
  });
  it('blocks walls, supports one-voxel steps, and does not tunnel on large falling speed', () => {
    const c = structuredClone(CONFIG);
    const world = { collisionSolid: (x: number, y: number) => y === 0 || (x === 6 && y < 12) || (x === 2 && y === 1) };
    const player = new Player(c, world); player.position = { x: 0, y: 0.25, z: 0 }; player.grounded = true;
    let maxY = player.position.y;
    for (let i = 0; i < 150; i++) { player.step(c.fixedStep, { forward: 0, right: 1, jump: false }); maxY = Math.max(maxY, player.position.y); }
    expect(maxY).toBeGreaterThan(0.49); expect(player.position.x).toBeLessThanOrEqual(1.5 - c.player.radius + 0.0001);
    player.position = { x: 0, y: 10, z: 0 }; player.velocityY = -100;
    player.step(0.2, { forward: 0, right: 0, jump: false });
    expect(player.position.y).toBeCloseTo(0.25, 4);
  });
  it('does not enter unloaded chunks', () => {
    const world = filledWorld(); world.unload(key3(0, 1, 0));
    expect(world.collisionSolid(2, 10, 2)).toBe(true);
  });
});
