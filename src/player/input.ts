import { clamp } from '../core/math';
import { Player, type Movement } from './controller';
export class Input {
  readonly keys = new Set<string>();
  locked = false;
  private jump = false;
  private readonly abort = new AbortController();
  constructor(readonly canvas: HTMLCanvasElement, player: Player, onAction: () => void, onLock: (locked: boolean) => void, onDebug: () => void, onError: (message: string) => void) {
    const options = { signal: this.abort.signal };
    const clear = () => { this.keys.clear(); this.jump = false; };
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      clear(); onLock(this.locked);
    }, options);
    document.addEventListener('pointerlockerror', () => onError('Захват мыши недоступен. Откройте игру в отдельной вкладке браузера.'), options);
    window.addEventListener('keydown', e => {
      if (e.code === 'F3') { e.preventDefault(); if (!e.repeat) onDebug(); }
      if (!this.locked) return;
      if (e.code === 'Escape') { clear(); document.exitPointerLock(); return; }
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'Space' && !e.repeat) this.jump = true;
    }, options);
    window.addEventListener('keyup', e => this.keys.delete(e.code), options);
    window.addEventListener('mousemove', e => {
      if (!this.locked) return;
      player.yaw -= e.movementX * player.config.player.mouseSensitivity;
      player.pitch = clamp(player.pitch - e.movementY * player.config.player.mouseSensitivity, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    }, options);
    canvas.addEventListener('mousedown', e => { if (e.button === 0 && this.locked) onAction(); }, options);
    canvas.addEventListener('contextmenu', e => e.preventDefault(), options);
    const pause = () => { clear(); if (document.pointerLockElement === canvas) document.exitPointerLock(); };
    window.addEventListener('blur', pause, options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, options);
  }
  movement(): Movement {
    const jump = this.jump; this.jump = false;
    return { forward: Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')), right: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')), jump };
  }
  async capture(): Promise<void> { await this.canvas.requestPointerLock(); }
  dispose(): void { this.abort.abort(); if (document.pointerLockElement === this.canvas) document.exitPointerLock(); }
}
