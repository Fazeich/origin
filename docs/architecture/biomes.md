# Biome regions

`src/biomes/regions.ts` maps metres → continuous chunk coordinates → configured region coordinates → noise-warped lattice. Region scale is exclusively `config.biomeSizeInChunks`. No player speed, elapsed time or FPS enters this function.

Neighbouring region centres are evaluated in a 3×3 neighbourhood. The deterministic lattice assigns three biome types using wrapped coordinate/seed arithmetic, ensuring adjacent test regions include all types. Warping distorts their boundaries. Distance-based smooth transition bands produce normalized weights. Heights blend with those weights; coherent noise patches choose a surface within transition areas.

| Biome | Surface | Terrain |
| --- | --- | --- |
| Mossland | muted olive Grass over Dirt | low, broad rounded relief |
| Ochre dunes | warm Sand | moderately rolling, higher-frequency relief |
| Basalt highlands | cool gray Stone | elevated, ridged relief |

Default size is 16×16 chunks, nominal 128×128m, with edge distortion and a transition parameter of 0.18 region units. Nominal crossing is 128/3.6 = 35.56s; this is an output calculation, not a generator parameter. Measured one-dimensional crossings in `../validation/profile.json` span 31.39–37.50s. Actual fixed-step AABB-controller traversal of three sample routes completed in 33.89s, 34.17s and 37.50s without jumping (`../validation/traversal.json`, simulated time with no streaming waits). Uneven routes, jumping, transition bands and direction change actual walking times.

Spawn (-18,-18)m sits near a three-region junction. Developer inspection points: (-48,48) Mossland; (-48,-48) dunes; (48,-48) highlands. These are documentation only, never shown in normal game. Enlarging `biomeSizeInChunks` scales geography without rewriting the algorithm. The repeating type arrangement is intentional for this test world; a richer non-repeating region assignment is a future design change.
