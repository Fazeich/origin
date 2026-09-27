# Meshing

`src/meshing/greedy.ts` implements the replaceable `Mesher` function type. Input is a compact (N+2)³ voxel snapshot, including a one-cell halo. Output contains transferable positions, normals, linear colours and Uint32 indices. Positions are local voxel coordinates; the renderer supplies voxel scale and chunk translation.

For each principal axis and each slice, build a signed material mask wherever solid meets air. Only faces belonging to the current chunk emit; halo voxels only occlude. Merge equal material/sign rectangles into quads, then emit four vertices and six indices with outward winding. Material boundaries are never merged. Internal solid-solid faces emit nothing.

One full isolated solid chunk reduces to six quads; a fully occluded chunk emits no indices. World-bottom outside space is air, so bottom faces may exist but are frustum-culled below the floor. At corner edits only three face neighbours matter; diagonals do not share a face and are not invalidated.

Generation/initial mesh and edit remesh use the same function in workers. Snapshot collection and GPU upload still run on the main thread. Greedy T-junctions are accepted for this prototype; no cracks appeared in inspected scenes, but large-coordinate/other GPU precision testing is future work. No AO, transparency, fluids or material atlas is implemented.
