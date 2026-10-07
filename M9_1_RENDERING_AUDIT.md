# M9.1 — visual foundation and floor ownership

## Checkpoint/provenance
User calls the accepted baseline M9. Hosting and source identify it as Version 13 / 914a2dec2a7035e059306e5ffbb6c081678a3114 (source milestone label M8.6). No separate M9 publication exists in this Site's newest history. Preserved exactly as `m9-reported-playtested-checkpoint`, plus verified full-history bundle `../crownfall-m91-baseline.bundle`. Clean working tree and 146/146 baseline tests passed before changes. No missing M9 systems were invented.

## Rendering audit
Custom JavaScript WebGL 1 renderer, flat ES modules, local fixed-step simulation. Orthographic tilted projection. Static and dynamic vertex-colored triangle buffers, textured terrain quads with alpha blending. Canvas 2D health/feedback layer; HTML/CSS HUD, menus, and touch controls. No Unity/Godot/Three.js or scene/asset engine.

| Capability | Current state / realistic path |
|---|---|
| Layered environment art, terrain decals | Supported: textured ground planes and masked art; alpha and depth ordering already available |
| Transparent overlays | Supported; M9.1 reuses material program and static quad |
| Animated VFX, hit effects, telegraphs | Existing timed geometry/effect pools; sprite sheets and richer meshes can replace presentation |
| Particles | Bounded effect pools exist; dedicated batched sprite-particle renderer would need implementation |
| Characters/sprites | Characters are procedural boxes with primitive pose animation. No rigged mesh, sprite atlas, skeletal animator or asset loader yet |
| Shadows | Flat contact discs only; blob shadows feasible cheaply. Dynamic shadows require a new render pass |
| Lighting | Fixed vertex colors/face shading and baked image lighting. No normals, scene lights, PBR, or dynamic lighting |
| Screen-space effects | Canvas/CSS feedback supported. GPU postprocessing requires framebuffer/effect passes |
| Props | Flat decals and primitive geometry supported; authored props need a mesh/sprite asset pipeline |
| Camera effects | Existing tracking/projection; subtle presentation offsets feasible. No camera changes in this pass |
| Mobile performance | Capped pixel ratio, reused buffers, six capped terrain textures. More alpha layers increase overdraw; CPU-built dynamic geometry is a future scaling limit |

A polished stylized 2D/2.5D mobile game is feasible without migrating engines. The current presentation is not an asset-production pipeline: quality comparable to the intended references requires authored consistent character/prop assets, animation, batch loading/rendering, lighting direction, and real-device profiling. Sophisticated dynamic 3D characters, shadows and lights would require substantial renderer additions. Ground textures alone cannot remove the block-character prototype appearance. No migration or character redesign performed.

## Changes
Single alpha-blended ground draw, opacity .22, restrained cyan/blue and red/pink. Reads `match.rules.front` directly each rendered frame: this is the very front from which `rules.control` and the top meter derive. No second territorial calculation, rounding, quantization, easing lag, or simulation write. Exactly goalA→goalB and ±lane halfWidth; Wilderness excluded. Front line remains. Surface sits above terrain, below Summoners, camps, telegraphs and combat.
Removed the broad spawn floor rectangles and square spawn pads, preserving team-colored orientation strips and all collision geometry. Kept meaningful camp, CC, health and targeting indicators; primitive Summoner/camp models need proper future assets rather than improvised redesign.

One extra quad/draw call, no added textures, particles, buffers, or per-frame allocations. Terrain source images unchanged. Core combat, AI, map, controls, menus and match systems unchanged byte-for-byte.

## Validation limits
Full automated suite and explicit neutral/advantage/rapid-handoff/100% uniform tests; preserved default and custom controls/menus/results coverage. Native Mesa offscreen shader rendering verifies compilation and color composition, not mobile frame rate. Human iPhone testing remains required for readability/performance acceptance. Live browser may be blocked by ChatGPT authentication; hosting provenance is checked independently.