import { key3 } from '../core/math';
export interface Chunk {
  x: number; y: number; z: number; key: string;
  /** Owned by World. Never mutate outside its action API. */
  data: Uint8Array; revision: number; meshRevision: number;
}
export const createChunk = (x: number, y: number, z: number, data: Uint8Array): Chunk =>
  ({ x, y, z, key: key3(x, y, z), data, revision: 0, meshRevision: -1 });
