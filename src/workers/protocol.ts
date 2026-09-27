import { type GameConfig } from '../core/config';
import { type GeneratedChunk } from '../generation/column';
import { type MeshData } from '../meshing/greedy';
import { type Edit } from '../world/world';
export type Job = { kind: 'generate'; config: GameConfig; x: number; z: number; edits: Edit[] }
  | { kind: 'mesh'; size: number; padded: Uint8Array };
export type JobResult = { kind: 'generate'; chunks: GeneratedChunk[]; milliseconds: number }
  | { kind: 'mesh'; mesh: MeshData; milliseconds: number };
export const meshTransfers = (m: MeshData): ArrayBuffer[] =>
  [m.positions.buffer, m.normals.buffer, m.colors.buffer, m.indices.buffer] as ArrayBuffer[];
