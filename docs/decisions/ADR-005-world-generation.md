# ADR-005 — deterministic layered terrain and session journal

Status: accepted, 2026-09-28.

Use seeded smooth value noise and layered/ridged height functions to fill true voxel columns. The heightfield is only a generation technique, not runtime collision or destruction authority. Solid underground layers allow excavation in any direction after generation. Every column begins with Bedrock at zero.

Do not add caves, erosion or fluids in this slice. Keep edits as sparse world-authoritative entries, reapply on reload of a streamed column, and retain deterministic halo sampling. No disk persistence is implied. A future saved-world schema must include generation version to prevent replaying edits against changed geography.
