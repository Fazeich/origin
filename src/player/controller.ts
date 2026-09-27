import { type GameConfig } from '../core/config';
import { type Vec3 } from '../core/math';
export interface CollisionWorld { collisionSolid(x: number, y: number, z: number): boolean }
export interface Movement { forward: number; right: number; jump: boolean }
const EPSILON = 1e-6;
export class Player {
  position: Vec3 = { x: 0, y: 20, z: 0 }; // Feet, in metres.
  yaw = 0;
  pitch = -0.08;
  velocityY = 0;
  grounded = false;
  constructor(readonly config: GameConfig, private readonly world: CollisionWorld) {}
  get eye(): Vec3 { return { ...this.position, y: this.position.y + this.config.player.eyeHeight }; }
  get direction(): Vec3 {
    const cos = Math.cos(this.pitch);
    return { x: -Math.sin(this.yaw) * cos, y: Math.sin(this.pitch), z: -Math.cos(this.yaw) * cos };
  }
  collides(position: Vec3): boolean {
    const c = this.config, scale = c.voxelsPerMeter, radius = c.player.radius;
    const minX = Math.floor((position.x - radius + EPSILON) * scale), maxX = Math.floor((position.x + radius - EPSILON) * scale);
    const minY = Math.floor((position.y + EPSILON) * scale), maxY = Math.floor((position.y + c.player.height - EPSILON) * scale);
    const minZ = Math.floor((position.z - radius + EPSILON) * scale), maxZ = Math.floor((position.z + radius - EPSILON) * scale);
    for (let z = minZ; z <= maxZ; z++) for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      if (this.world.collisionSolid(x, y, z)) return true;
    }
    return false;
  }
  private move(axis: 'x' | 'y' | 'z', distance: number): boolean {
    if (!distance) return false;
    // Bound each sweep to less than half a voxel, even at terminal falling speed or alternate scale.
    const steps = Math.ceil(Math.abs(distance) * this.config.voxelsPerMeter / 0.45), increment = distance / steps;
    for (let i = 0; i < steps; i++) {
      const before = this.position[axis];
      this.position[axis] += increment;
      if (!this.collides(this.position)) continue;
      if (axis !== 'y' && this.grounded) {
        const step = this.config.player.stepHeight, target = { ...this.position, y: this.position.y + step };
        const raised = { ...target, [axis]: before };
        if (!this.collides(target) && !this.collides(raised)) { this.position = target; continue; }
      }
      this.position[axis] = before;
      let lo = 0, hi = 1;
      for (let j = 0; j < 14; j++) {
        const mid = (lo + hi) / 2;
        this.position[axis] = before + increment * mid;
        if (this.collides(this.position)) hi = mid; else lo = mid;
      }
      this.position[axis] = before + increment * lo;
      return true;
    }
    return false;
  }
  step(dt: number, input: Movement): void {
    const c = this.config.player, length = Math.max(1, Math.hypot(input.forward, input.right));
    if (input.jump && this.grounded) { this.velocityY = c.jumpSpeed; this.grounded = false; }
    const dx = (-Math.sin(this.yaw) * input.forward + Math.cos(this.yaw) * input.right) / length * c.speed * dt;
    const dz = (-Math.cos(this.yaw) * input.forward - Math.sin(this.yaw) * input.right) / length * c.speed * dt;
    this.move('x', dx); this.move('z', dz);
    this.velocityY -= c.gravity * dt;
    const verticalHit = this.move('y', this.velocityY * dt);
    this.grounded = verticalHit && this.velocityY < 0;
    if (verticalHit) this.velocityY = 0;
    // Last-resort absolute floor; no voxel exists below the world's minimum height.
    if (this.position.y < 1 / this.config.voxelsPerMeter) { this.position.y = 1 / this.config.voxelsPerMeter; this.velocityY = 0; this.grounded = true; }
  }
}
