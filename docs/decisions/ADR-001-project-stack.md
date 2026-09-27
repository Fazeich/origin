# ADR-001 — standalone TypeScript / Vite / Three

Status: accepted, 2026-09-28.

Portfolio uses React/R3F/Three, Vite and strict TypeScript, but its terrain and survival state do not satisfy volumetric mutation. Keep Three and the toolchain; create a sibling project using direct Three and DOM for the tiny shell. Use npm with a committed lockfile. Tool patches are updated within their major families based on npm audit, rather than blindly copying portfolio versions.

Alternatives: extending the current heightfield creates competing truths; copying the entire shell introduces unrelated state/dependencies; a new native engine conflicts with the browser portfolio goal. Direct Three gives explicit GPU lifetime and no React work during streaming. Cost: future complex menus may need a UI framework, and portfolio integration currently remains a simple independent-host link.
