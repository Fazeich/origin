import { index3 } from '../core/math';
import { VOXELS, type Voxel } from '../voxels/registry';
export interface MeshData { positions: Float32Array; normals: Float32Array; colors: Float32Array; indices: Uint32Array }
export type Mesher = (padded: Uint8Array, size: number) => MeshData;
/** Input is (size+2)^3 with a one-voxel halo. Output is local voxel coordinates. */
export const greedyMesh: Mesher = (padded, size) => {
  const positions: number[] = [], normals: number[] = [], colors: number[] = [], indices: number[] = [];
  const mask = new Int16Array(size * size), p = [0, 0, 0], q = [0, 0, 0];
  const read = (x: number, y: number, z: number) => padded[index3(x + 1, y + 1, z + 1, size + 2)];
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3, v = (d + 2) % 3;
    q.fill(0); q[d] = 1;
    for (p[d] = -1; p[d] < size;) {
      let n = 0;
      for (p[v] = 0; p[v] < size; p[v]++) for (p[u] = 0; p[u] < size; p[u]++) {
        const a = read(p[0], p[1], p[2]), b = read(p[0] + q[0], p[1] + q[1], p[2] + q[2]);
        // Only emit a face owned by THIS chunk; halo blocks occlude, never emit.
        mask[n++] = a && !b && p[d] >= 0 ? a : b && !a && p[d] < size - 1 ? -b : 0;
      }
      p[d]++;
      for (let j = 0; j < size; j++) for (let i = 0; i < size;) {
        const at = i + j * size, material = mask[at];
        if (!material) { i++; continue; }
        let width = 1, height = 1;
        while (i + width < size && mask[at + width] === material) width++;
        outer: while (j + height < size) {
          for (let k = 0; k < width; k++) if (mask[at + k + height * size] !== material) break outer;
          height++;
        }
        p[u] = i; p[v] = j;
        const du = [0, 0, 0], dv = [0, 0, 0]; du[u] = width; dv[v] = height;
        const first = positions.length / 3, sign = Math.sign(material);
        const color = VOXELS[Math.abs(material) as Voxel].color;
        // Small deterministic stratum variation retains the natural, flat-colour direction.
        const shade = d === 1 ? (sign > 0 ? 1 : 0.62) : d === 0 ? 0.82 : 0.91;
        for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
          positions.push(p[0] + a * du[0] + b * dv[0], p[1] + a * du[1] + b * dv[1], p[2] + a * du[2] + b * dv[2]);
          normals.push(d === 0 ? sign : 0, d === 1 ? sign : 0, d === 2 ? sign : 0);
          colors.push(color[0] * shade, color[1] * shade, color[2] * shade);
        }
        if (sign > 0) indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
        else indices.push(first, first + 2, first + 1, first, first + 3, first + 2);
        for (let y = 0; y < height; y++) mask.fill(0, at + y * size, at + y * size + width);
        i += width;
      }
    }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), colors: new Float32Array(colors), indices: new Uint32Array(indices) };
};
