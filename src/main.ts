import { CONFIG, validateConfig } from './core/config';
import { terrainColumn } from './generation/terrain';
import { World } from './world/world';
import { Streamer } from './world/streamer';
import { Renderer } from './rendering/renderer';
import { Player } from './player/controller';
import { Input } from './player/input';
import { applyAction } from './interaction/actions';
import { Metrics } from './debug/metrics';
import './style.css';

async function start(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
  const menu = document.querySelector<HTMLElement>('#menu')!, enter = document.querySelector<HTMLButtonElement>('#enter')!;
  const crosshair = document.querySelector<HTMLElement>('#crosshair')!, debug = document.querySelector<HTMLElement>('#debug')!;
  const error = document.querySelector<HTMLElement>('#error')!;
  const c = structuredClone(CONFIG), params = new URLSearchParams(location.search);
  const seed = params.get('seed'); if (seed !== null && Number.isSafeInteger(Number(seed))) c.seed = Number(seed);
  validateConfig(c);
  const world = new World(c), renderer = new Renderer(canvas, c), stream = new Streamer(world, renderer), player = new Player(c, world);
  const metrics = new Metrics(debug);
  const height = terrainColumn(c, Math.floor(c.player.spawnX * c.voxelsPerMeter), Math.floor(c.player.spawnZ * c.voxelsPerMeter)).height;
  player.position = { x: c.player.spawnX, y: (height + 1) / c.voxelsPerMeter + 0.5, z: c.player.spawnZ };
  player.yaw = c.player.spawnYaw;
  debug.hidden = !params.has('debug');
  let started = false, disposed = false, frame = 0, last = performance.now(), accumulator = 0, reportedFailure = false;
  const input = new Input(canvas, player,
    () => applyAction(world, { type: 'destroy', origin: player.eye, direction: player.direction }),
    locked => { menu.hidden = locked; crosshair.hidden = !locked; accumulator = 0; if (locked) started = true; enter.textContent = started ? 'Продолжить' : 'Войти'; },
    () => { debug.hidden = !debug.hidden; }, message => { error.textContent = message; });
  enter.onclick = () => { error.textContent = ''; void input.capture().catch(e => { error.textContent = `Захват мыши недоступен: ${String(e)}`; }); };
  const animate = (now: number) => {
    if (disposed) return;
    const rawDt = (now - last) / 1000; last = now;
    stream.update(player.position.x, player.position.z);
    if (stream.failure && !reportedFailure) {
      reportedFailure = true; console.error(stream.failure); error.textContent = 'Не удалось загрузить мир. Перезагрузите страницу.';
      document.exitPointerLock(); menu.hidden = false; enter.disabled = true;
    }
    // Wait for a collision-safe neighbourhood, rather than allowing a spawn in missing chunks.
    const s = c.chunkSize, sx = Math.floor(player.position.x * c.voxelsPerMeter / s), sz = Math.floor(player.position.z * c.voxelsPerMeter / s);
    let ready = true;
    for (let z = sz - 1; z <= sz + 1; z++) for (let x = sx - 1; x <= sx + 1; x++) if (!world.chunks.has(`${x},0,${z}`)) ready = false;
    if (ready && enter.disabled && !reportedFailure) { enter.disabled = false; enter.textContent = started ? 'Продолжить' : 'Войти'; }
    if (ready && (input.locked || !started)) {
      accumulator += Math.min(rawDt, c.maxFrameDelta);
      while (accumulator >= c.fixedStep) {
        player.step(c.fixedStep, input.locked ? input.movement() : { forward: 0, right: 0, jump: false });
        accumulator -= c.fixedStep;
      }
    } else accumulator = 0;
    renderer.draw(player); metrics.tick(rawDt, player, renderer, stream);
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  const dispose = () => { disposed = true; cancelAnimationFrame(frame); input.dispose(); stream.dispose(); renderer.dispose(); };
  window.addEventListener('pagehide', dispose, { once: true });
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  if (import.meta.env.DEV && params.has('test')) {
    const { installTestBridge } = await import('./debug/test-bridge');
    installTestBridge({ world, player, stream, renderer, metrics, input });
  }
}
void start().catch(e => {
  console.error(e);
  document.querySelector('#error')!.textContent = `Не удалось запустить Origin. Требуется браузер с WebGL2. ${String(e)}`;
});
