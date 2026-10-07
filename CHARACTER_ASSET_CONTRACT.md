# Crownfall character asset contract v1

M9.2 infrastructure checkpoint. Kit run integration is pending identification of the approved numbered frames. This is not a completed or deployed M9.2 release.

## Future artwork delivery

| Property | Required convention |
|---|---|
| Format | RGBA PNG, straight alpha, sRGB; real transparent pixels, no baked checkerboard, white matte or ground shadow |
| Recommended frame | 512 × 512 pixels; 256 × 256 is suitable for small mobile assets |
| Canvas | Identical dimensions throughout a clip; preferably throughout the Summoner's set |
| Pivot | Hip/lower-torso center at the same pixel coordinate in every frame; normalized `[x,y]` from top-left |
| Pose | Leave padding for all limbs/effects; do not auto-center each pose's bounding box |
| Scale | Start at 2.4 screen-aligned world units per full canvas height; tune visual scale only to fit existing health bars/collision markers |
| Offset | Screen-aligned world units `[right,up]`; baseline hip height commonly 0.7; never movement/collision units |
| Names | `idle/000.png`, `run/000.png` through `run/007.png`; explicit chronological order |
| Folder | `assets/characters/<summoner-id>/<state>/<frame>.png` |
| FPS | Per clip; run initially 12 FPS; idle 1 FPS for a still; no effect on simulation tick rate |
| States | `idle`, `run`, `basic`, `ability`, `ability:<authoritative-ability-id>`, `hit`, `death`, `respawn` |
| Facing | Single authored direction plus `mirror-x` initially; based on independent aim, never inferred from velocity |
| Texture bounds | Maximum 2048 × 2048, further restricted by device `MAX_TEXTURE_SIZE`; larger textures safely fail to fallback |
| Atlas | Uniform grid, explicit columns/rows/frameCount, row-major order; or individual frame objects with normalized `uv:[left,top,width,height]` |
| Atlas padding | Include transparent/extruded gutters; explicit UV rectangles can exclude gutters; do not pack touching silhouettes |
| Individual frames | Supported directly; each URL cached/uploaded once; a later atlas changes manifest data only |

Supply a numbered sequence or manifest. Upload order and visually similar pose variants are not reliable animation ordering.

## Manifest

Definitions live in `src/character-visuals.js`, keyed by existing Summoner ID. No character-specific renderer branches are required.

```js
{
  version: 1,
  fallback: 'placeholder',
  fallbackAsset: {src: 'assets/characters/example/idle/000.png'}, // optional
  scale: 2.4,
  anchor: [0.5, 0.7],
  offset: [0, 0.7],
  facing: 'mirror-x', authoredFacing: 1,
  shadow: {width: 1.35, depth: 0.85, opacity: 0.3},
  animations: {
    idle: {fps: 1, loop: true, frames: [{src: 'assets/characters/example/idle/000.png'}]},
    run: {fps: 12, loop: true, frames: [
      {src: 'assets/characters/example/run/000.png'},
      {src: 'assets/characters/example/run/001.png'}
      // Continue in explicit frame order.
    ]},
    basic: {fps: 12, loop: false, frameCount: 8,
      sheet: {src: 'assets/characters/example/basic.png', columns: 4, rows: 2}}
  }
}
```

Each clip can override `anchor`, `offset`, `scale`; each frame can override them again. These compensate authored canvas registration only. They never move the gameplay anchor. Individual-frame count is inferred from the array; grid sheets use `frameCount`. Sparse clips are legal. Missing action art leaves locomotion intact. Missing run uses idle; missing/decode-failed textures use idle/fallback asset, then the original placeholder. Missing death art hides the live character body. Set/Riven keep their existing procedural visuals.

## Runtime architecture

- `CharacterAnimator`: presentation-only clip state and simulation-time playback. Run/idle responds on the next rendered frame, without delaying gameplay. Nonloop clips clamp at last frame; actions expire by visual clip duration only. Death has priority; respawn resets appropriately; time rewind and new actor objects reset state.
- `CombatFeedback.subscribeVisual`: separate frozen scalar event snapshots from successful authoritative casts/hits. Subscriber failures are isolated. Existing audio/feedback subscriptions retain their original event stream. Death/respawn are observed from authoritative player state.
- `CharacterRenderer`: shared WebGL 1 quad/program, per-actor observers and shared texture cache. Visuals read simulation state only. Pauses freeze because simulation time stops.
- URL images preload at renderer creation; no image decode, CPU pixel manipulation or texture allocation in the animation loop. NPOT textures use LINEAR and CLAMP_TO_EDGE without mipmaps. Explicit disposal releases resources and subscribers.
- Ground shadow is one softly faded projected ellipse quad at the player position. Sprite anchoring does not affect shadow placement.
- Screen-aligned billboard facing uses horizontal mirroring of the independent aim x component, with a small vertical-direction deadband. The existing directional ground indicator still communicates exact aiming. A single frontal picture cannot visually represent a true rear/side view; future directional art will be needed for that quality level.

## Render passes

Existing terrain and authoritative territory floor are unchanged. Ground decals/team markers remain world geometry. Character shadows render after terrain. Existing placeholder geometry renders before authored sprites. Sprites write cutout depth, sort by ground z, and use alpha blending. The existing combat geometry pass follows sprites; it retains camps, projectiles, telegraphs and feedback, with depth resolving world intersections. Canvas critical health/damage indicators and HTML HUD remain above WebGL. This is a minimal integration, not a new renderer or VFX rewrite.

## Approved Kit asset integration

The newly supplied idle is mapped to `idle/000.png`. Its upload was JPEG despite its PNG-style name; only the container format was converted, with decoded RGB pixels verified identical. The existing optional matte shader removes its white background. All eight genuine RGBA run PNGs are copied byte-for-byte to `run/000.png` through `007.png`, in the user-approved chronological order. No artwork was generated.

Run loops at 12 FPS. The manifest uses a 2-world-unit canvas height, a stable hip anchor with per-frame registration offsets, and a 0.62-world-unit visual lift. These values affect presentation only. The authoritative position, ground shadow, collision, health-bar projection and camera are unchanged. The visible head remains below the existing health-bar projection; registration is approximate and can receive visual-only tuning after device testing.

## Validation

- Existing M9.1 recovery checkpoint and completed infrastructure/bot regression remain preserved.
- All nine 1254 × 1254 textures decoded, uploaded and rendered through the actual character shaders in native offscreen GLES; shader compile/link passed and GL error was zero. Idle and both stride halves were visually inspected.
- Automated coverage verifies the approved file order, PNG dimensions, every run-frame index at 12 FPS, looping, immediate idle/run transitions and fixed hip registration in both facing directions. Protected source comparisons continue to check unchanged gameplay, collision, camera, health indicators, controls and UI.
- Complete suite: 161/161 passed, including full-match observer-on/off regression. Build passes.
- This is offscreen rendering and automated validation, not physical iPhone or in-arena browser visual acceptance. No deployment was requested for this asset validation pass.
- Nine full-size RGBA GPU textures consume approximately 54 MiB before driver overhead. They load once and are shared by all Kit instances. Future authored assets should follow the 512px recommendation above; no supplied art was resized in this pass. A genuine transparent idle PNG is still preferable to white-matte removal for clean edges on every background.