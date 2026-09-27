# ADR-006 — warped chunk-space region lattice

Status: accepted, 2026-09-28.

Use 16-chunk regions, noise-warped coordinates, distance blend bands and three deterministically assigned neighbouring types. Blend terrain parameters; choose coherent surface patches in transitions. The lattice guarantees quick access to all three test biomes while avoiding perfectly square visual borders.

At 32 voxels/chunk and 4 voxels/metre, nominal width is 128m. At 3.6m/s this derives 35.56s traversal. Speed/time/FPS are explicitly not generator inputs. Increasing only biomeSizeInChunks changes geographic scale. The repeating assignment is a test-layout tradeoff; rich non-repeating climate geography can replace type assignment later while preserving chunk-space scale.
