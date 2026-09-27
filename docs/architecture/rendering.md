# Rendering and lifecycle

`src/rendering/renderer.ts` owns a Three WebGLRenderer, camera, scene, shared vertex-coloured Lambert material and per-chunk indexed BufferGeometry. Nonempty chunks have one mesh each. Empty chunks have no object. Local voxel coordinates scale by 1/voxelsPerMeter, and chunk translation uses chunk metres. Geometry has bounding volumes for normal Three frustum culling.

Atmosphere consists of a procedural gradient sky sphere with a small sun glow, hemisphere light, warm directional light, ACES tone mapping and distance fog. No external fonts, textures or art assets are needed. Fog reaches opaque colour before the nearest edge of the loaded window. Device pixel ratio is capped at 1.5. There are no shadow maps or postprocess passes.

Replacing or unloading a chunk removes its mesh and disposes its geometry. The shared material survives chunk replacement. Page cleanup stops input listeners, workers and RAF, disposes all geometries/materials and renderer, and releases mouse capture. Vite HMR also cleans up. GPU/context loss recovery beyond the browser default is not implemented.

The menu, title and pause state are DOM/CSS; game mode displays only a tiny dot. Developer metrics require ?debug or F3. The inspection bridge loads only in DEV with ?test and is removed from production.
