# Workflow

1. Read root AGENTS.md, architecture overview, relevant subsystem docs and ADRs.
2. Inspect current config and tests; explicitly distinguish metres, voxels and chunks.
3. Make a small coherent change within subsystem ownership. Keep generated GPU representations separate from authority.
4. Add regression tests for changed invariants, especially boundaries, negative coordinates, async replies and collision.
5. Run lint, typecheck, unit tests and build. Run browser tests for lifecycle, input, rendering or worker changes.
6. Inspect screenshots when rendering changes. Profile if complexity, allocations, streaming radius or meshing changes.
7. Update docs with actual behaviour, commands and results. Record architectural decisions in ADRs, not just comments.

Do not add game hints to simplify testing; use the explicit dev bridge or README. Do not transplant survival/mini-game systems from portfolio. Do not report tests you did not run.
