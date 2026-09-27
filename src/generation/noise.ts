export function hash(x: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function noise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x), iz = Math.floor(z), u = smooth(x - ix), v = smooth(z - iz);
  const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed);
  const c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, z: number, seed: number, octaves = 3): number {
  let sum = 0, weight = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x, z, seed + i * 1013) * weight;
    total += weight; weight *= 0.5; x *= 2; z *= 2;
  }
  return sum / total;
}
