import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
const output = new URL('../docs/validation/', import.meta.url);
await mkdir(output, { recursive: true });
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const { CONFIG } = await server.ssrLoadModule('/src/core/config.ts');
const { generateColumn } = await server.ssrLoadModule('/src/generation/column.ts');
const { biomeAt, BIOMES } = await server.ssrLoadModule('/src/biomes/regions.ts');
const { terrainColumn } = await server.ssrLoadModule('/src/generation/terrain.ts');
const samples = [];
for (let i = 0; i < 30; i++) {
  const start = performance.now(); const chunks = generateColumn(CONFIG, i - 15, -4);
  samples.push({ ms: performance.now() - start, triangles: chunks.reduce((n, c) => n + c.mesh.indices.length / 3, 0) });
}
const spans = []; let last = -512, previous = biomeAt(CONFIG, last, 64).dominant;
for (let x = -511; x <= 512; x++) {
  const current = biomeAt(CONFIG, x, 64).dominant;
  if (current !== previous) { if (last !== -512) spans.push({ biome: BIOMES[previous].name, meters: x - last, seconds: (x - last) / CONFIG.player.speed }); last = x; previous = current; }
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const start = performance.now();
await page.goto('http://127.0.0.1:3100/?test');
await page.waitForFunction(() => window.__origin?.world.chunks.size === 507 && window.__origin.stream.settled);
const loadMs = performance.now() - start;
await page.screenshot({ path: new URL('menu.png', output).pathname.replace(/^\/([A-Z]:)/, '$1') });
await page.locator('#enter').click();
await page.waitForFunction(() => document.pointerLockElement !== null);
const scenarios = [];
for (const position of [{ name: 'spawn', x: -18, z: -18 }, { name: 'mossland', x: -48, z: 48 }, { name: 'ochre-dunes', x: -48, z: -48 }, { name: 'basalt-highlands', x: 48, z: -48 }]) {
  const height = terrainColumn(CONFIG, position.x * CONFIG.voxelsPerMeter, position.z * CONFIG.voxelsPerMeter).height;
  await page.evaluate(({ position, height }) => {
    const a = window.__origin; a.player.position = { x: position.x, y: (height + 1) / a.world.config.voxelsPerMeter + 0.5, z: position.z };
    a.player.pitch = -0.12; a.player.yaw = -2.25; a.player.velocityY = 0;
  }, { position, height });
  await page.waitForTimeout(100);
  await page.waitForFunction(() => window.__origin.stream.settled && window.__origin.player.grounded);
  await page.waitForTimeout(3500);
  const measurement = await page.evaluate(async () => {
    const frames = []; let previous = performance.now();
    await new Promise(resolve => {
      const frame = now => { frames.push(now - previous); previous = now; if (frames.length < 600) requestAnimationFrame(frame); else resolve(); };
      requestAnimationFrame(frame);
    });
    frames.sort((a,b) => a-b);
    const a = window.__origin, gl = a.renderer.gl, context = gl.getContext(), extension = context.getExtension('WEBGL_debug_renderer_info');
    return { fps: 1000 / (frames.reduce((a,b)=>a+b,0)/frames.length), frameMeanMs: frames.reduce((a,b)=>a+b,0)/frames.length,
      frameP95Ms: frames[Math.floor(frames.length * .95)], sampleFrames: frames.length,
      chunks: a.world.chunks.size, triangles: gl.info.render.triangles, drawCalls: gl.info.render.calls,
      geometries: gl.info.memory.geometries, voxelBytes: [...a.world.chunks.values()].reduce((n,c)=>n+c.data.byteLength,0),
      workerLastMs: a.stream.lastWorkerMs, position: {...a.player.position},
      gpu: extension ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'unavailable' };
  });
  scenarios.push({ name: position.name, biome: BIOMES[biomeAt(CONFIG, position.x, position.z).dominant].name, ...measurement });
  await page.screenshot({ path: new URL(`${position.name}.png`, output).pathname.replace(/^\/([A-Z]:)/, '$1') });
}
await page.evaluate(() => { const a=window.__origin; a.player.pitch=-1.55; });
await page.mouse.click(720,450); await page.waitForFunction(()=>window.__origin.stream.settled);
const edit = await page.evaluate(() => ({ rebuilds: window.__origin.stream.rebuildCount, snapshotMs: window.__origin.stream.lastSnapshotMs, workerMs: window.__origin.stream.lastWorkerMs }));
const report = { measuredAt: new Date().toISOString(), platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model, browser: browser.version(), viewport: '1440x900, deviceScaleFactor=1', note: 'Headless Chrome, dev Vite. RAF timings are not a universal or headed-browser FPS guarantee.', config: CONFIG, loadMs, generationSamples: samples, biomeCrossSections: spans, scenarios, edit, errors };
await writeFile(new URL('profile.json', output), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close(); await server.close();
