import {CONFIG} from './config.js';
import {CAMP_SITES} from './match-data.js';
// Render-only surfaces. No collision, navigation, simulation, or mutable map data.
export const ARENA_ART=Object.freeze({maxTextureSize:1024,brightness:.76,territoryOpacity:.12,assets:['wilderness','lane','midfield','goal','minor','major']});
export function arenaSurfaces(map){
 if(!map.arena)return [];
 const lane=map.lane;
 return [
  {asset:'wilderness',x:0,z:0,w:map.width,d:map.depth,y:.06,mode:1},
  {asset:'lane',x:0,z:0,w:map.width-2,d:lane.halfWidth*2,y:.065,mode:2},
  {asset:'midfield',x:0,z:0,w:7,d:7,y:.07,mode:3},
  ...[lane.goalA,lane.goalB].flatMap(x=>[-6,6].map(z=>({asset:'goal',x,z,w:1.9,d:12,y:.075,mode:4}))),
  ...CAMP_SITES.map(c=>({asset:c.type==='damage'?'major':'minor',x:c.x,z:c.z,w:c.type==='damage'?11:7,d:c.type==='damage'?10:7,y:.07,mode:c.type==='damage'?5:3}))
 ];
}
export class ArenaArt {
 constructor(gl){this.gl=gl;this.textures=new Map();this.failed=[];this.surfaces=[];this.map=null;
  // The test DOM and unsupported renderers keep the existing safe floor fallback.
  if(typeof Image==='undefined')return;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const vs=shader(gl.VERTEX_SHADER,`attribute vec2 corner;uniform vec4 rect;uniform float elevation;uniform vec2 center,extent,tilt;varying vec2 uv,world;void main(){uv=corner;world=rect.xy+(corner-.5)*rect.zw;vec2 p=world-center;gl_Position=vec4(p.x/extent.x,(-p.y*tilt.x+elevation*tilt.y)/extent.y,(-p.y*tilt.y-elevation*tilt.x)/100.,1.);}`);
  const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D art;uniform float mode,brightness,front,territoryOpacity;varying vec2 uv,world;
   vec2 mirrorUV(vec2 p){return 1.-abs(mod(p,2.)-1.);}
   void main(){
    if(mode>5.5){float edge=1.-smoothstep(.05,.4,abs(world.x-front));vec3 team=world.x<front?vec3(.40,.57,.62):vec3(.62,.51,.53);vec3 rim=world.x<front?vec3(.28,.72,.82):vec3(.82,.48,.57);gl_FragColor=vec4(mix(team,rim,edge),mix(territoryOpacity,.30,edge));return;}
    vec2 sampleUV=uv;float alpha=1.;
    if(mode<1.5){sampleUV=mix(vec2(.08),vec2(.92),mirrorUV(world/11.));}
    else if(mode<2.5){sampleUV=mix(vec2(.23,.04),vec2(.77,.96),mirrorUV(vec2(world.y/8.,world.x/14.)));float edge=min(uv.y,1.-uv.y);alpha=smoothstep(0.,.065+.018*sin(world.x*1.7),edge);}
    else if(mode<3.5){}
    else if(mode<4.5){sampleUV=vec2(mix(.12,.88,uv.y),mix(.398,.518,uv.x));alpha=smoothstep(0.,.13,min(uv.x,1.-uv.x));}
    else{sampleUV=mix(vec2(.27,.20),vec2(.74,.75),uv);alpha=smoothstep(0.,.14,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));}
    vec4 c=texture2D(art,sampleUV);
    if(mode<2.5){vec2 alternate=mirrorUV(vec2(world.y*.071-world.x*.019,world.x*.063+world.y*.027)+vec2(.37,.61));if(mode>1.5)alternate=mix(vec2(.23,.04),vec2(.77,.96),alternate);float blend=.32+.22*sin(world.x*.29+sin(world.y*.23));c=mix(c,texture2D(art,alternate),blend);}
    // Supplied JPEG cutouts have white mattes. Remove them in the material,
    // including JPEG edge fringes, without changing the approved source files.
    if(mode>2.5&&mode<3.5){float white=min(c.r,min(c.g,c.b));float coverage=1.-smoothstep(.77,.96,white);alpha*=coverage;c.rgb=max(vec3(0.),(c.rgb-vec3(1.-coverage))/max(coverage,.01));}
    if(alpha<.01)discard;gl_FragColor=vec4(c.rgb*brightness,alpha);
   }`);
  this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);
  this.corner=gl.getAttribLocation(this.program,'corner');this.uniforms={};for(const n of ['rect','elevation','center','extent','tilt','art','mode','brightness','front','territoryOpacity'])this.uniforms[n]=gl.getUniformLocation(this.program,n);
  this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,1,1,0,0,1,1,0,1]),gl.STATIC_DRAW);
  for(const name of ARENA_ART.assets){const img=new Image();img.onload=()=>{const limit=Math.min(ARENA_ART.maxTextureSize,gl.getParameter(gl.MAX_TEXTURE_SIZE)),size=2**Math.floor(Math.log2(limit)),c=document.createElement('canvas');c.width=size;c.height=size;c.getContext('2d').drawImage(img,0,0,c.width,c.height);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);this.textures.set(name,t);};img.onerror=()=>this.failed.push(name);img.src='assets/arena/'+name+'.jpeg';}
 }
 render(map,camera,aspect,rules=null){if(!this.program||!map.arena)return;if(this.map!==map){this.map=map;this.surfaces=arenaSurfaces(map);}const gl=this.gl,u=this.uniforms;gl.useProgram(this.program);gl.uniform2f(u.center,camera.x,camera.z);gl.uniform2f(u.extent,CONFIG.camera.halfHeight*aspect,CONFIG.camera.halfHeight);gl.uniform2f(u.tilt,CONFIG.camera.tiltSin,CONFIG.camera.tiltCos);gl.uniform1f(u.brightness,ARENA_ART.brightness);gl.uniform1i(u.art,0);gl.activeTexture(gl.TEXTURE0);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(this.corner);gl.vertexAttribPointer(this.corner,2,gl.FLOAT,false,8,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  for(const s of this.surfaces){const texture=this.textures.get(s.asset);if(!texture)continue;gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform4f(u.rect,s.x,s.z,s.w,s.d);gl.uniform1f(u.elevation,s.y);gl.uniform1f(u.mode,s.mode);gl.drawArrays(gl.TRIANGLES,0,6);}
  // Same authoritative front that produces rules.control and the HUD; no smoothing lag,
  // quantization, capture logic, or simulation writes. Draw above art and below combat.
  if(rules){const lane=map.lane;gl.uniform4f(u.rect,(lane.goalA+lane.goalB)/2,0,lane.goalB-lane.goalA,lane.halfWidth*2);gl.uniform1f(u.elevation,.09);gl.uniform1f(u.mode,6);gl.uniform1f(u.front,rules.front);gl.uniform1f(u.territoryOpacity,ARENA_ART.territoryOpacity);gl.drawArrays(gl.TRIANGLES,0,6);}
  gl.depthMask(true);gl.disable(gl.BLEND);gl.disableVertexAttribArray(this.corner);
 }
}