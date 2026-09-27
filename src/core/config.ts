/** All distances outside voxel storage are metres; chunk coordinates are integers. */
export const CONFIG = {
  voxelsPerMeter: 4,
  chunkSize: 32,
  seed: 73129,
  worldMinHeight: 0,
  worldHeightVoxels: 96,
  renderDistance: 6,
  workerCount: 2,
  biomeSizeInChunks: 16,
  biome: { warp: 0.16, warpFrequency: 1.6, transition: 0.18 },
  terrain: {
    baseHeight: 5, soilDepth: 0.75, detailFrequency: 0.18, detailAmplitude: 0.18,
    surfacePatchFrequency: 0.28, surfaceNoiseLow: 0.2, surfaceNoiseHigh: 0.8,
    profiles: [
      { elevation: 0, amplitude: 3.0, frequency: 0.026 },
      { elevation: 0.7, amplitude: 4.2, frequency: 0.04 },
      { elevation: 3.5, amplitude: 9.0, frequency: 0.022 },
    ],
  },
  player: { speed: 3.6, radius: 0.28, height: 1.75, eyeHeight: 1.62,
    gravity: 22, jumpSpeed: 6.2, stepHeight: 0.3, mouseSensitivity: 0.002,
    spawnX: -18, spawnZ: -18, spawnYaw: -2.25 },
  interactionRange: 4,
  fixedStep: 1 / 120,
  maxFrameDelta: 0.1,
  graphics: { fov: 72, pixelRatioCap: 1.5, fogNearFraction: 0.48, fogFarFraction: 0.93 },
};
export type GameConfig = typeof CONFIG;
export const voxelSize = (c: GameConfig) => 1 / c.voxelsPerMeter;
export const chunkMeters = (c: GameConfig) => c.chunkSize / c.voxelsPerMeter;
export function validateConfig(c: GameConfig): void {
  if (c.worldMinHeight !== 0 || !Number.isInteger(c.chunkSize) || c.chunkSize < 4 || c.chunkSize > 64
      || c.voxelsPerMeter <= 0 || !Number.isFinite(c.voxelsPerMeter)
      || c.worldHeightVoxels % c.chunkSize !== 0 || c.worldHeightVoxels < c.chunkSize
      || c.biomeSizeInChunks < 1 || c.renderDistance < 1 || c.workerCount < 1) {
    throw new Error('Invalid world configuration');
  }
}
