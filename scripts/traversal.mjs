import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { CONFIG } = await server.ssrLoadModule('/src/core/config.ts');
  const { Player } = await server.ssrLoadModule('/src/player/controller.ts');
  const { terrainColumn, sampleColumn } = await server.ssrLoadModule('/src/generation/terrain.ts');
  const { biomeAt, BIOMES } = await server.ssrLoadModule('/src/biomes/regions.ts');
  const boundaries = []; let previous = biomeAt(CONFIG, -256, 64).dominant;
  for (let x = -255; x <= 256; x++) {
    const b = biomeAt(CONFIG, x, 64).dominant;
    if (b !== previous) boundaries.push({ x, biome: b });
    previous = b;
  }
  const cache = new Map();
  const column = (x,z) => { const key = `${x},${z}`; if (!cache.has(key)) cache.set(key,terrainColumn(CONFIG,x,z)); return cache.get(key); };
  const collision = { collisionSolid: (x,y,z) => y < 0 || sampleColumn(CONFIG,column(x,z),y) !== 0 };
  const results = [];
  for (let i = 0; i + 1 < boundaries.length; i++) {
    const start = boundaries[i], end = boundaries[i+1];
    const player = new Player(CONFIG,collision);
    const scale = CONFIG.voxelsPerMeter;
    player.position = { x: start.x, y: (column(start.x*scale,64*scale).height+1)/scale+0.5,z:64 };
    for (let j=0;j<120;j++) player.step(CONFIG.fixedStep,{forward:0,right:0,jump:false});
    let seconds = 0;
    while (player.position.x < end.x && seconds < 60) {
      player.step(CONFIG.fixedStep,{forward:0,right:1,jump:false}); seconds += CONFIG.fixedStep;
    }
    results.push({ biome: BIOMES[start.biome].name, startX: start.x, endX: end.x,
      reachedX: player.position.x, seconds, completed: player.position.x>=end.x,
      route: 'straight +X at z=64; actual AABB controller and generated voxel collision; no jumps; no streaming waits; simulated fixed-step time' });
  }
  await writeFile('docs/validation/traversal.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} finally { await server.close(); }
