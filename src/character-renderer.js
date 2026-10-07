import {CONFIG} from './config.js';
import {CHARACTER_VISUALS, CHARACTER_ASSET_LIMITS, CharacterAnimator, characterRect} from './character-visuals.js';

// Shared URL cache. Upload once, CLAMP + LINEAR supports NPOT sheets on WebGL 1.
export class CharacterTextureCache {
  constructor(gl, createImage = () => new Image()) {this.gl = gl; this.createImage = createImage; this.entries = new Map(); this.disposed = false;}
  load(frame) {
    if (this.entries.has(frame.src)) return this.entries.get(frame.src);
    const entry = {status: 'loading', texture: null, width: 0, height: 0}; this.entries.set(frame.src, entry);
    try {
      const image = this.createImage();
      image.onerror = () => {entry.status = 'failed';};
      image.onload = () => {
        if (this.disposed) return;
        try {
          const gl = this.gl, max = Math.min(CHARACTER_ASSET_LIMITS.maxTextureSize, gl.getParameter(gl.MAX_TEXTURE_SIZE));
          // Reject oversize sheets instead of silently destroying cell boundaries.
          if (!image.width || !image.height || image.width > max || image.height > max) throw Error('Character texture exceeds device limit');
          entry.width = image.width; entry.height = image.height;
          const texture = gl.createTexture(); entry.texture = texture; gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          entry.status = 'ready';
        } catch (error) {if (entry.texture) this.gl.deleteTexture(entry.texture); entry.texture = null; entry.status = 'failed';}
      };
      image.src = frame.src;
    } catch {entry.status = 'failed';}
    return entry;
  }
  dispose() {this.disposed = true; for (const e of this.entries.values()) if (e.texture) this.gl.deleteTexture(e.texture); this.entries.clear();}
}

export class CharacterRenderer {
  constructor(gl, definitions = CHARACTER_VISUALS) {
    this.gl = gl; this.definitions = definitions; this.actors = []; this.byId = new Map(); this.states = new WeakMap(); this.rect = {};
    this.cache = new CharacterTextureCache(gl); this.root = null; this.feedback = null; this.unsubscribe = null;
    // The existing headless DOM keeps the exact placeholder path.
    if (typeof Image === 'undefined') return;
    const shader = (type, source) => {const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s)); return s;};
    const vs = shader(gl.VERTEX_SHADER, CHARACTER_VERTEX_SHADER);
    const fs = shader(gl.FRAGMENT_SHADER, CHARACTER_FRAGMENT_SHADER);
    this.program = gl.createProgram(); gl.attachShader(this.program, vs); gl.attachShader(this.program, fs); gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(this.program)); gl.deleteShader(vs); gl.deleteShader(fs);
    this.corner = gl.getAttribLocation(this.program, 'corner'); this.u = {};
    for (const n of ['center','extent','tilt','origin','rect','uvRect','flip','art','matte','mode','opacity','direction','height','shear','edgeMask']) this.u[n] = gl.getUniformLocation(this.program, n);
    this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,1,1,0,0,1,1,0,1]), gl.STATIC_DRAW);
    for (const definition of Object.values(definitions)) {
      const animator = new CharacterAnimator(definition);
      for (const clip of Object.values(animator.definition.clips)) for (const frame of clip.frames) this.cache.load(frame);
      for (const frame of Object.values(definition.effects || {})) this.cache.load(frame);
      if (definition.fallbackAsset) this.cache.load(definition.fallbackAsset);
    }
  }
  observe(event) {
    if (event.type !== 'character-animation') return;
    const state = this.byId.get(event.event === 'hit' ? event.target : event.source);
    if (!state) return;
    if (event.event === 'cast') {
      if (event.ability === 'step' && state.definition.effects?.trail) {
        const item = this.actors.find(a => a.animator === state);
        if (item) item.trail = {x: item.player.x, z: item.player.z, endX: item.player.x, endZ: item.player.z, ended: null};
        state.action = null;
      }
      const specific = 'ability:' + event.ability;
      state.trigger(event.basic ? 'basic' : state.definition.clips[specific] ? specific : 'ability', event.time);
    } else if (event.event === 'hit') state.trigger('hit', event.time);
  }
  prepare(combat, player) {
    if (!this.program) return;
    const root = combat?.match || combat || player;
    if (root !== this.root || (combat?.now ?? 0) < this.lastTime) {
      this.root = root; this.states = new WeakMap(); this.byId.clear(); this.actors.length = 0;
    }
    this.lastTime = combat?.now ?? 0;
    if (this.feedback !== combat?.feedback) {this.unsubscribe?.(); this.feedback = combat?.feedback;
      this.unsubscribe = this.feedback?.subscribeVisual(e => this.observe(e));}
    this.actors.length = 0;
    if (combat?.match) for (const actor of combat.match.actors) this.add(actor.sim.player, actor.sim);
    else this.add(player, combat);
    // Existing camera points down the +z screen axis. Far to near for alpha edges.
    this.actors.sort((a, b) => a.player.z - b.player.z);
  }
  add(player, sim) {
    let item = this.states.get(player);
    if (!item) {
      const animator = new CharacterAnimator(this.definitions[sim?.definition.id] || {});
      item = {player, animator, frame: null, entry: null, sim}; this.states.set(player, item); this.byId.set(player.id, animator);
    }
    if (item.trail) {
      const t = item.trail, now = sim?.now ?? 0;
      if (t.ended === null) {t.endX = player.x; t.endZ = player.z; if (!sim?.dash) t.ended = now;}
      if (t.ended !== null && now >= t.ended + item.animator.definition.effects.trail.linger) item.trail = null;
    }
    const sequence = sim?.advanced?.sequence, leap = sim?.advanced?.leap;
    const contactClip = sequence && 'contact:' + sequence.ability.id;
    if (sequence && sequence !== item.sequence && item.animator.definition.clips[contactClip])
      item.animator.trigger(contactClip, sequence.started);
    item.sequence = sequence;
    const contactLeap = leap && item.animator.definition.clips['contact:' + leap.ability.id];
    if (contactLeap) item.animator.action = null;
    const a = item.animator.update(player, sim?.now ?? 0, contactLeap ? 'run' : undefined); item.frame = a.clip?.frames[a.frame] || null;
    item.entry = item.frame && this.cache.entries.get(item.frame.src);
    if (item.entry?.status !== 'ready') {
      item.frame = !player.dead && (a.definition.clips.idle?.frames[0] || a.definition.fallbackAsset);
      item.entry = item.frame && this.cache.entries.get(item.frame.src);
    }
    if (item.entry?.status !== 'ready') item.frame = null;
    this.actors.push(item);
  }
  replaces(player) {return !!this.states.get(player)?.frame;}
  replacesEffect(sim, type) {
    const f = this.definitions[sim.definition.id]?.effects?.[type];
    return !!this.program && !!f && this.cache.entries.get(f.src)?.status === 'ready';
  }
  drawEffect(frame, x, z, angle, length, width, pivot, height, opacity, shear = 0) {
    const entry = this.cache.entries.get(frame.src); if (entry?.status !== 'ready') return;
    const gl = this.gl, u = this.u;
    gl.bindTexture(gl.TEXTURE_2D, entry.texture); gl.uniform2f(u.origin, x, z);
    gl.uniform4f(u.rect, -length * pivot, -width / 2, length, width);
    gl.uniform4f(u.uvRect, 0, 0, 1, 1); gl.uniform1f(u.flip, 0); gl.uniform2f(u.matte, 1, 1);
    gl.uniform2f(u.direction, Math.sin(angle), Math.cos(angle)); gl.uniform1f(u.height, height);
    gl.uniform1f(u.shear, shear); gl.uniform1f(u.edgeMask, frame.edgeMask ? 1 : 0);
    gl.uniform1f(u.opacity, opacity); gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  drawEffects(camera, aspect, ground) {
    if (!this.program) return;
    this.begin(camera, aspect, 2); this.gl.depthMask(false);
    for (const item of this.actors) {
      const sim = item.sim, data = item.animator.definition.effects;
      if (!sim || !data) continue;
      if (ground) {
        const t = item.trail;
        if (t) {const dx = t.endX - t.x, dz = t.endZ - t.z, length = Math.hypot(dx, dz);
          if (length > .01) this.drawEffect(data.trail, t.x, t.z, Math.atan2(dx, dz), length, data.trail.width, 0, .16,
            t.ended === null ? 1 : Math.max(0, 1 - (sim.now - t.ended) / data.trail.linger), data.trail.shear);
        }
        for (const e of sim.effects.items) if (e.active && (e.type === 'radial' || e.type === 'slam') && data[e.type])
          this.drawEffect(data[e.type], e.x, e.z, Math.PI / 2, e.range * 2, e.range * 2, .5, .17,
            Math.min(1, Math.max(0, (e.expires - sim.now) / .15)));
      } else {
        const claw = data.fallingClaw, entry = claw && this.cache.entries.get(claw.src);
        if (entry?.status === 'ready') {
          const gl = this.gl, u = this.u;
          gl.uniform1f(u.mode, 0); gl.uniform1f(u.edgeMask, 0);
          gl.bindTexture(gl.TEXTURE_2D, entry.texture);
          gl.uniform4f(u.uvRect, 0, 0, 1, 1); gl.uniform1f(u.flip, 0);
          gl.uniform2f(u.matte, claw.matte?.low ?? 1, claw.matte?.high ?? 1);
          gl.uniform1f(u.opacity, 1);
          for (const impact of sim.advanced.impacts) {
            // Read the same authoritative countdown as the existing falling primitive.
            const progress = Math.max(0, Math.min(1, (sim.now - impact.created) / impact.ability.castTime));
            const height = .4 + Math.pow(1 - progress, .6) * 5;
            gl.uniform2f(u.origin, impact.x, impact.z);
            gl.uniform4f(u.rect, -claw.width / 2, height * CONFIG.camera.tiltCos, claw.width, claw.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
          gl.uniform1f(u.mode, 2);
        }
        for (const p of sim.projectiles.items) {
          const f = data[p.type]; if (!p.active || !f || !['dragon','blast'].includes(p.type)) continue;
          // Grow from the palm toward the authoritative projectile tip, then travel with it.
          const length = p.type === 'blast' ? Math.min(f.length, Math.max(.05, p.ability.range - p.remaining + p.ability.width - f.palmOffset)) : f.length;
          const offset = p.type === 'blast' ? p.ability.width - length : 0;
          this.drawEffect(f, p.x + Math.sin(p.angle) * offset, p.z + Math.cos(p.angle) * offset,
            p.angle, length, f.width, f.pivot, f.height, 1);
        }
      }
    }
    this.end();
  }
  begin(camera, aspect, mode) {
    const gl = this.gl, u = this.u;
    gl.useProgram(this.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); gl.enableVertexAttribArray(this.corner);
    gl.vertexAttribPointer(this.corner, 2, gl.FLOAT, false, 8, 0);
    gl.uniform2f(u.center, camera.x, camera.z); gl.uniform2f(u.extent, CONFIG.camera.halfHeight * aspect, CONFIG.camera.halfHeight);
    gl.uniform2f(u.tilt, CONFIG.camera.tiltSin, CONFIG.camera.tiltCos); gl.uniform1f(u.mode, mode);
    gl.uniform1f(u.edgeMask, 0); gl.uniform1f(u.shear, 0);
    gl.uniform1i(u.art, 0); gl.activeTexture(gl.TEXTURE0); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }
  end() {const gl = this.gl; gl.depthMask(true); gl.disable(gl.BLEND); gl.disableVertexAttribArray(this.corner);}
  drawShadows(camera, aspect) {
    if (!this.program) return;
    const gl = this.gl, u = this.u; this.begin(camera, aspect, 1); gl.depthMask(false);
    for (const item of this.actors) {const shadow = item.animator.definition.shadow;
      if (!item.frame || item.player.dead || !shadow) continue;
      gl.bindTexture(gl.TEXTURE_2D, item.entry.texture); gl.uniform2f(u.origin, item.player.x, item.player.z);
      gl.uniform4f(u.rect, -shadow.width / 2, -shadow.depth / 2, shadow.width, shadow.depth);
      gl.uniform1f(u.opacity, shadow.opacity); gl.drawArrays(gl.TRIANGLES, 0, 6);
    } this.end();
  }
  drawSprites(camera, aspect) {
    if (!this.program) return;
    const gl = this.gl, u = this.u; this.begin(camera, aspect, 0); gl.depthMask(true);
    for (const item of this.actors) {
      const frame = item.frame; if (!frame) continue;
      const a = item.animator, uv = frame.uv || [0, 0, 1, 1];
      const rect = characterRect(a.definition, a.clip, frame, item.entry.width * uv[2] / (item.entry.height * uv[3]), a.flip, this.rect);
      gl.bindTexture(gl.TEXTURE_2D, item.entry.texture); gl.uniform2f(u.origin, item.player.x, item.player.z);
      gl.uniform4f(u.rect, rect.left, rect.bottom, rect.width, rect.height); gl.uniform4f(u.uvRect, ...uv);
      gl.uniform1f(u.flip, a.flip ? 1 : 0); gl.uniform1f(u.opacity, 1);
      gl.uniform2f(u.matte, frame.matte?.low ?? 1, frame.matte?.high ?? 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } this.end();
  }
  dispose() {this.unsubscribe?.(); this.cache.dispose(); if (this.buffer) this.gl.deleteBuffer(this.buffer); if (this.program) this.gl.deleteProgram(this.program);}
}

export const CHARACTER_VERTEX_SHADER = `precision mediump float;attribute vec2 corner;
uniform vec2 center,extent,tilt,origin,direction;uniform vec4 rect,uvRect;uniform float flip,mode,height,shear;
varying vec2 uv,local;
void main(){local=corner;vec2 p=origin-center;
 if(mode>1.5){vec2 q=rect.xy+corner*rect.zw;q.y+=(corner.x-.5)*shear*rect.w;vec2 g=p+direction*q.x+vec2(direction.y,-direction.x)*q.y;gl_Position=vec4(g.x/extent.x,(-g.y*tilt.x+height*tilt.y)/extent.y,(-g.y*tilt.y-height*tilt.x)/100.,1.);}
 else if(mode>.5){vec2 g=p+rect.xy+corner*rect.zw;gl_Position=vec4(g.x/extent.x,(-g.y*tilt.x+.102*tilt.y)/extent.y,(-g.y*tilt.y-.102*tilt.x)/100.,1.);}
 else{vec2 q=rect.xy+corner*rect.zw;gl_Position=vec4((p.x+q.x)/extent.x,(-p.y*tilt.x+q.y)/extent.y,(-p.y*tilt.y-.75*tilt.x)/100.,1.);}
 uv=uvRect.xy+vec2(mix(corner.x,1.-corner.x,flip),1.-corner.y)*uvRect.zw;}`;
export const CHARACTER_FRAGMENT_SHADER = `precision mediump float;
uniform sampler2D art;uniform vec2 matte;uniform float mode,opacity,edgeMask;varying vec2 uv,local;
void main(){if(mode>.5&&mode<1.5){float r=length((local-.5)*2.);gl_FragColor=vec4(.02,.03,.04,(1.-smoothstep(.15,1.,r))*opacity);return;}
 vec4 c=texture2D(art,uv);if(matte.x<matte.y){float cover=1.-smoothstep(matte.x,matte.y,min(c.r,min(c.g,c.b)));c.a*=cover;c.rgb=max(vec3(0.),(c.rgb-vec3(1.-cover))/max(cover,.01));}
 if(edgeMask>.5)c.a*=1.-smoothstep(.82,1.,length((local-.5)*2.));
 if(c.a<.025)discard;gl_FragColor=vec4(c.rgb,c.a*opacity);}`;