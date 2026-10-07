// Presentation data only. Positions, collision, abilities and time belong to simulation.
// Approved loose frames, ordered by their numbered filenames.
const SET_BASIC_FRAMES = [
  {src: 'assets/characters/set/basic/000.png', matte: {low: .88, high: .98}},
  {src: 'assets/characters/set/basic/001.png', matte: {low: .88, high: .98}},
  {src: 'assets/characters/set/basic/002.png'},
  {src: 'assets/characters/set/basic/003.png', matte: {low: .88, high: .98}}
];
export const CHARACTER_VISUALS = Object.freeze({
  'kit-asher': {
    version: 1, fallback: 'placeholder', scale: 2.6, anchor: [.5, .55],
    offset: [0, .806], facing: 'mirror-x', authoredFacing: 1,
    shadow: {width: 1.35, depth: .85, opacity: .3},
    effects: {
      trail: {src: 'assets/characters/kit-asher/abilities/ember-step-trail.png', width: 1.25, linger: .45, shear: .55},
      radial: {src: 'assets/characters/kit-asher/abilities/solar-ring.png', edgeMask: true},
      dragon: {src: 'assets/characters/kit-asher/abilities/last-flame.png', length: 4.5, width: 2.5, pivot: .88, height: .65},
      blast: {src: 'assets/characters/kit-asher/abilities/expellant-blast.png', length: 4, width: 1.7, pivot: 0, height: .8, palmOffset: .7}
    },
    animations: {
      'ability:blast': {fps: 3, loop: false, frames: [
        {src: 'assets/characters/kit-asher/abilities/expellant-cast.png'}
      ]},
      idle: {fps: 1, loop: true, frames: [
        {src: 'assets/characters/kit-asher/idle/000.png',
          // Uploaded idle is JPEG with a white matte; source pixels are preserved.
          matte: {low: .88, high: .98}}
      ]},
      basic: {fps: 12, loop: false, frames: [
        {src: 'assets/characters/kit-asher/basic/000.png'},
        {src: 'assets/characters/kit-asher/basic/001.png'},
        {src: 'assets/characters/kit-asher/basic/002.png'},
        {src: 'assets/characters/kit-asher/basic/003.png'},
        {src: 'assets/characters/kit-asher/basic/004.png'},
        {src: 'assets/characters/kit-asher/basic/005.png'}
      ]},
      run: {fps: 12, loop: true, frames: [
        {src: 'assets/characters/kit-asher/run/000.png', anchor: [0.51, 0.49]},
        {src: 'assets/characters/kit-asher/run/001.png', anchor: [0.52, 0.455]},
        {src: 'assets/characters/kit-asher/run/002.png', anchor: [0.535, 0.46]},
        {src: 'assets/characters/kit-asher/run/003.png', anchor: [0.515, 0.49]},
        {src: 'assets/characters/kit-asher/run/004.png', anchor: [0.525, 0.49]},
        {src: 'assets/characters/kit-asher/run/005.png', anchor: [0.52, 0.455]},
        {src: 'assets/characters/kit-asher/run/006.png', anchor: [0.54, 0.47]},
        {src: 'assets/characters/kit-asher/run/007.png', anchor: [0.52, 0.455]}
      ]}
    }
  },
  set: {
    version: 1, fallback: 'placeholder', scale: 2.86, anchor: [.55, .65],
    offset: [0, 1.001], facing: 'mirror-x', authoredFacing: 1,
    shadow: {width: 1.4, depth: .85, opacity: .3},
    effects: {
      slam: {src: 'assets/characters/set/panther-fist/000.png'},
      fallingClaw: {src: 'assets/characters/set/panther-fist/001.png',
        matte: {low: .88, high: .98}, width: 3, height: 3.6}
    },
    animations: {
      // Attachment-order mapping. JPEG source bytes are preserved; matte is runtime only.
      idle: {fps: 1, loop: true, frames: [
        {src: 'assets/characters/set/idle/000.png', matte: {low: .88, high: .98}}
      ]},
      basic: {fps: 12, loop: false, frames: SET_BASIC_FRAMES},
      'contact:predatory': {fps: 18, loop: false, frames: SET_BASIC_FRAMES},
      'ability:warcry': {fps: 12, loop: false, frames: [
        {src: 'assets/characters/set/war-cry/000.png', matte: {low: .88, high: .98}},
        {src: 'assets/characters/set/war-cry/001.png', matte: {low: .88, high: .98}},
        {src: 'assets/characters/set/war-cry/002.png'}
      ]},
      run: {fps: 12, loop: true, frames: [
        {src: 'assets/characters/set/run/000.png'},
        {src: 'assets/characters/set/run/001.png'},
        {src: 'assets/characters/set/run/002.png'},
        {src: 'assets/characters/set/run/003.png'},
        {src: 'assets/characters/set/run/004.png'},
        {src: 'assets/characters/set/run/005.png'},
        {src: 'assets/characters/set/run/006.png'},
        {src: 'assets/characters/set/run/007.png'}
      ]}
    }
  },
  riven: {
    version: 1, fallback: 'placeholder', scale: 2.86, anchor: [.5, .65],
    offset: [0, 1.001], facing: 'mirror-x', authoredFacing: 1,
    shadow: {width: 1.25, depth: .8, opacity: .3},
    animations: {
      idle: {fps: 1, loop: true, frames: [
        // Original JPEG preserved unchanged; remove its white matte at runtime.
        {src: 'assets/characters/riven/idle/000.png', matte: {low: .88, high: .98}}
      ]},
      run: {fps: 12, loop: true, frames: [
        {src: 'assets/characters/riven/run/000.png'},
        {src: 'assets/characters/riven/run/001.png'},
        {src: 'assets/characters/riven/run/002.png'},
        {src: 'assets/characters/riven/run/003.png'},
        {src: 'assets/characters/riven/run/004.png'},
        {src: 'assets/characters/riven/run/005.png'},
        {src: 'assets/characters/riven/run/006.png'},
        {src: 'assets/characters/riven/run/007.png'}
      ]}
    }
  }
});

export const CHARACTER_ASSET_LIMITS = Object.freeze({maxTextureSize: 2048, maxFrameSize: 512});

// Explicit pass contract; depth still resolves intersections with existing geometry.
export const WORLD_RENDER_LAYERS = Object.freeze([
  'terrain', 'territory', 'ground-decals', 'ground-shadows',
  'world-geometry', 'summoner-sprites', 'combat-vfx', 'critical-indicators', 'hud'
]);

export function animationFrames(clip) {
  if (!clip) return [];
  if (Array.isArray(clip.frames)) return clip.frames;
  const sheet = clip.sheet;
  if (!sheet || !sheet.src || !Number.isInteger(clip.frameCount) || clip.frameCount < 1 ||
      clip.frameCount > 256 || !Number.isInteger(sheet.columns) || sheet.columns < 1 ||
      !Number.isInteger(sheet.rows) || sheet.rows < 1 || clip.frameCount > sheet.columns * sheet.rows) return [];
  return Array.from({length: clip.frameCount}, (_, i) => ({src: sheet.src,
    uv: [(i % sheet.columns) / sheet.columns, Math.floor(i / sheet.columns) / sheet.rows,
      1 / sheet.columns, 1 / sheet.rows]}));
}

export function compileVisual(definition = {}) {
  const clips = Object.create(null);
  for (const [state, value] of Object.entries(definition.animations || {})) {
    const frames = animationFrames(value).filter(f => f && typeof f.src === 'string' && f.src.length);
    if (frames.length) clips[state] = {...value, frames, fps: Math.max(1, Math.min(60, value.fps || 12)), loop: value.loop === true};
  }
  return {...definition, scale: definition.scale || 2.4, anchor: definition.anchor || [.5, .8],
    offset: definition.offset || [0, 0], clips};
}

// One observer per authoritative player object. Never writes to that object or sim.
export class CharacterAnimator {
  constructor(definition) { this.definition = compileVisual(definition); this.reset(); }
  reset() { this.state = ''; this.started = 0; this.lastTime = -1; this.dead = false; this.action = null;
    this.frame = 0; this.clip = null; this.flip = false; }
  trigger(state, now) {
    const clip = this.definition.clips[state];
    if (!clip) return; // Absent action art must not interrupt working locomotion.
    this.action = {state, start: now, end: now + clip.frames.length / clip.fps};
  }
  update(player, now, locomotionOverride) {
    if (now < this.lastTime) this.reset();
    if (player.dead && !this.dead) { this.action = null; this.started = now; this.state = ''; }
    if (!player.dead && this.dead) this.trigger('respawn', now);
    this.dead = !!player.dead; this.lastTime = now;
    const clips = this.definition.clips;
    const locomotion = locomotionOverride || (player.animation === 'run' ? 'run' : 'idle');
    let state = player.dead ? 'death' : this.action && now < this.action.end ? this.action.state : locomotion;
    if (!player.dead && this.action && now >= this.action.end) this.action = null;
    // Death without authored art is hidden, never displayed as a living idle actor.
    let clip = clips[state];
    if (!clip && !player.dead) { state = 'idle'; clip = clips.idle; }
    if (state !== this.state) { this.state = state; this.started = this.action?.state === state ? this.action.start : now; }
    this.clip = clip || null;
    if (clip) { const index = Math.floor(Math.max(0, now - this.started) * clip.fps + 1e-7);
      this.frame = clip.loop ? index % clip.frames.length : Math.min(index, clip.frames.length - 1); }
    // Facing follows aim, not velocity. Near vertical aim retains the last side.
    const side = Math.sin(player.angle || 0);
    if (this.definition.facing === 'mirror-x' && Math.abs(side) > .08)
      this.flip = side * (this.definition.authoredFacing || 1) < 0;
    return this;
  }
}

// Stable hip-space rectangle, expressed in screen-aligned world units, top-left UVs.
export function characterRect(visual, clip, frame, aspect = 1, flip = false, out = {}) {
  const pivot = frame.anchor || clip?.anchor || visual.anchor;
  const offset = frame.offset || [0, 0], clipOffset = clip?.offset || [0, 0];
  const h = visual.scale * (clip?.scale || 1) * (frame.scale || 1), w = h * aspect;
  const sign = flip ? -1 : 1;
  out.left = sign * (visual.offset[0] + clipOffset[0] + offset[0]) - w * (flip ? 1 - pivot[0] : pivot[0]);
  out.bottom = visual.offset[1] + clipOffset[1] + offset[1] - h * (1 - pivot[1]);
  out.width = w; out.height = h;
  return out;
}