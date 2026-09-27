# Multiplayer: future, not implemented

No room server, accounts, network transport or remote players exist in Origin. Portfolio's SSE room server models a different survival game and is deliberately not reused.

Existing seam: Input → typed DestroyAction → ray validation → World mutation → versioned chunks → derived meshes. A future small authoritative server can share deterministic generation, registry and action rules, maintain canonical actor poses and chunk edit sequences, then send accepted edits/deltas. Rendering remains client-side and disposable.

Before connecting this API to untrusted clients, add actor authentication/session identity, server pose validation, rate/reach/line-of-sight checks, monotonically sequenced actions, revisioned chunk sync and reconnect reconciliation. Never trust a client-provided ray origin or mesh state. None of these future responsibilities is claimed as implemented.
