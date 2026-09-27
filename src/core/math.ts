export interface Vec3 { x: number; y: number; z: number }
export const key3 = (x: number, y: number, z: number) => `${x},${y},${z}`;
export const key2 = (x: number, z: number) => `${x},${z}`;
export const mod = (n: number, d: number) => ((n % d) + d) % d;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const index3 = (x: number, y: number, z: number, size: number) => x + size * (y + size * z);
