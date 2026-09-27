# ADR-003 — 32³ chunks and complete-column streaming

Status: accepted, 2026-09-28.

Choose cubic 32³ Uint8 chunks (32KiB each, 8m side). Default height is three chunks and load radius six columns. At most 507 chunk arrays are resident. Generate full vertical columns together to amortize terrain sampling, but independently mesh and invalidate each 3D chunk.

16³ would reduce individual rebuild cost but increase scene objects/draw calls. Larger chunks would increase edit latency and padded snapshot work. 32³ balances those costs and remains replaceable through config. Horizontal streaming is unbounded; vertical height is finite. Sparse session edits outlive evicted arrays. Empty chunks have no render object.
