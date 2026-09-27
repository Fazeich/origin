# Definition of done

A change is ready when it installs with npm ci, passes lint/typecheck/tests/build, and relevant actual browser behaviour has been checked. Origin's first slice additionally requires:

- Deterministic, streamed, compact voxel chunks and at least three visually distinguishable chunk-space biomes.
- Configurable voxel size, chunk size, seed, height, region scale, range, movement and jump parameters.
- FPS pointer lock, mouse look, movement, collision and jump without a visible body.
- Real LMB voxel-state deletion, limited reach and correct neighbour geometry after boundary edits.
- Visible gray Bedrock at y=0, raycastable but immutable, with no false dirty/rebuild changes.
- Exposed faces only; geometry must not scale as one render object per voxel.
- No tutorial or hints; debug is opt-in.
- Evidence from tests, runtime and measured performance, with limitations written honestly.
- Updated README, agent contract, architecture docs and significant ADRs.
