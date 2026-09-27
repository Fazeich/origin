export enum Voxel { Air, Grass, Dirt, Stone, Sand, Bedrock }
interface VoxelDefinition { name: string; color: readonly [number, number, number]; solid: boolean; destructible: boolean }
/** Linear-light RGB values, shared by worker meshing and renderer. */
export const VOXELS: Record<Voxel, VoxelDefinition> = {
  [Voxel.Air]: { name: 'Air', color: [0, 0, 0], solid: false, destructible: false },
  [Voxel.Grass]: { name: 'Grass', color: [0.19, 0.27, 0.14], solid: true, destructible: true },
  [Voxel.Dirt]: { name: 'Dirt', color: [0.22, 0.15, 0.10], solid: true, destructible: true },
  [Voxel.Stone]: { name: 'Stone', color: [0.29, 0.32, 0.34], solid: true, destructible: true },
  [Voxel.Sand]: { name: 'Sand', color: [0.55, 0.35, 0.19], solid: true, destructible: true },
  [Voxel.Bedrock]: { name: 'Bedrock', color: [0.075, 0.083, 0.09], solid: true, destructible: false },
};
export const isSolid = (id: Voxel) => VOXELS[id].solid;
