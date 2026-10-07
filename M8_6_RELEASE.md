# Crownfall Arena — M8.6 + M8.5.1

## Recoverable baseline
Human-tested M8.5: published Version 12, c9c1c0b0405b674d66cd0f6fba54d473a2112216. Hosting deployment succeeded and source provenance matched. Clean tree; 141/141 baseline tests passed before edits. Tag `m85-playtested-locked`; complete verified bundle `../crownfall-m85-playtested.bundle`. Restore with `git worktree add ../crownfall-m85-restored m85-playtested-locked`.

## Supplied artwork
All six JPEGs preserved byte-for-byte in assets/arena. Render-only material layer in src/arena-art.js:
1. Lane: cropped stone/earth material, world-space sampling with blended offsets, feathered Wilderness edge. Existing lane dimensions preserved.
2. Wilderness: rough ground material, mirrored/blended samples to soften repeats. No decorative collision.
3. Midfield: 7-unit surface at exact neutral origin; white JPEG background and fringes masked by material. No cover or tree.
4. Goals: cropped bronze boundary strip at exact existing goal X coordinates. Team accents remain dynamic renderer geometry.
5. Minor camps: masked 7-unit clearings at six unchanged camp positions; no white rectangle.
6. Major: cropped central clearing and worn masonry, excluding waterfalls/bridges that would misleadingly suggest navigation changes; softly blended 11×10 surface at existing major position.

Assets are flat source imagery, not meshes or seamless PBR materials. Some repeated surface motifs remain. Nothing was regenerated. Original files were not modified. White mattes are suppressed at render time, not converted to new source art. Decorative terrain has no collision or cover. Existing visible collision islands remain authoritative.

Broad opaque blue/red floor fills replaced with narrow territorial edge ribbons; front, endpoint lines, and HUD stay visible. Summoner and combat rendering unchanged. Art uses 6 capped 1024² textures (about 32 MiB including mipmaps), one static quad buffer, 14 bounded draw calls, no per-frame texture/buffer allocation, no particles. Texture load failure leaves safe prototype floor fallback.

## Editor
MINIMIZE hides only settings dock; small EDIT tab reopens it. Seven handles stay visible/draggable and in-progress pointer capture/draft/selection survive. Save, Cancel, confirmed Reset, local persistence unchanged. No gameplay runs in editor.

## Verification
146 tests (141 existing + 5 focused). Original renderer byte guard now reverses exactly four authorized art seams and still compares every other byte to baseline; no gameplay protection removed. All gameplay, collision, AI, data, input, camera, combat feedback files remain byte-identical to M8.5.
Three full bot matches: 94.4s ticket victory, 98.28s ticket victory, 91.03s total-control victory; 8/11/10 Wilderness rotations; both Riven stances; no five-second navigation stalls. Baseline telemetry unchanged.
Editor simulated at 568×320, 844×390, 932×430. 1000 rendered test frames reuse fixed resources. Native offscreen Mesa GLSL compile/link and 14-surface render: GL error zero; white mattes absent. This is not browser or iPhone visual/performance acceptance. Physical-device frame rate, asset readability in full combat, and touch accessibility require human playtesting.

Stop after deployment; no next milestone.