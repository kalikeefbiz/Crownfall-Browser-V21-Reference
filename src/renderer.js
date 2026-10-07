import {CharacterRenderer} from './character-renderer.js';
import {ArenaArt} from './arena-art.js';
import {drawCombat} from './combat-view.js';
import {CONFIG,MAP} from './config.js';
const C={ground:'#172c32',lane:'#344349',line:'#496069',stone:'#354b55',cap:'#536d74',teal:'#4fe0c1',fire:'#ff914a'};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
class Mesh {
  constructor(){this.v=[];}
  tri(a,b,c,color,shade=1){const col=rgb(color).map(n=>n*shade);for(const p of [a,b,c])this.v.push(...p,...col);}
  quad(a,b,c,d,col,s=1){this.tri(a,b,c,col,s);this.tri(a,c,d,col,s);}
  box(x,y,z,w,h,d,col,angle=0){const co=Math.cos(angle),si=Math.sin(angle);const p=(a,b,c)=>[x+a*co+c*si,y+b,z-a*si+c*co];const a=p(-w/2,0,-d/2),b=p(w/2,0,-d/2),c=p(w/2,0,d/2),e=p(-w/2,0,d/2),A=p(-w/2,h,-d/2),B=p(w/2,h,-d/2),D=p(w/2,h,d/2),E=p(-w/2,h,d/2);
    this.quad(A,B,D,E,col,1.13);this.quad(a,b,B,A,col,.6);this.quad(b,c,D,B,col,.72);this.quad(c,e,E,D,col,.87);this.quad(e,a,A,E,col,.7);
  }
  disc(x,y,z,r,col,n=24){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;this.tri([x,y,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],col);}}
  ring(x,y,z,r,t,col,n=40){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;const p=(angle,radius)=>[x+Math.cos(angle)*radius,y,z+Math.sin(angle)*radius];this.quad(p(a,r),p(b,r),p(b,r-t),p(a,r-t),col);}}
}
export function staticArena(map=MAP){const m=new Mesh(),lane=map.lane||{goalA:-21,goalB:21,halfWidth:3.85},width=map.width,depth=map.depth,lw=lane.halfWidth*2;
  m.box(0,-.5,0,width,.5,depth,C.ground);m.box(0,.005,0,width-2,.03,lw,C.lane);
  if(map.arena){
    // Flat route aprons communicate connections; they have no collision or scoring role.
    for(const route of map.arena.routes)m.box(route.x,.042,route.z,route.w,.006,route.d,'#243b3c');
    // A broad neutral seam, never a central capture circle or choke point.
    for(const x of [-map.arena.neutralWidth/2,map.arena.neutralWidth/2])
      for(let z=-lane.halfWidth+1;z<lane.halfWidth;z+=3)m.box(x,.14,z,.07,.01,1,'#748482');
    for(const z of [-lane.halfWidth,lane.halfWidth]){
      for(let x=lane.goalA;x<lane.goalB;x+=4)m.box(x+1,.14,z,2,.015,.12,'#708582');
      for(const x of [lane.goalA,lane.goalB]){m.box(x,0,z+Math.sign(z)*1.3,.6,.7,.6,C.stone);m.box(x,.7,z+Math.sign(z)*1.3,.5,.05,.5,x<0?'#68c6df':'#d97b8b');}
    }
    for(const side of [-1,1]){
      const color=side<0?'#68c6df':'#d97b8b',goal=side<0?lane.goalA:lane.goalB;
      m.box(goal,.15,0,.2,.012,lw,color);
      for(const z of map.arena.spawnOffsets){m.box(side*map.arena.spawnX,.095,z,1.4,.01,.12,color);}
    }
  }else{
    for(let x=-width/2+2;x<width/2;x+=2)m.box(x,.04,0,.035,.006,lw,'#3b5056');
    for(const z of [-lane.halfWidth,lane.halfWidth])m.box(0,.05,z,width-2,.02,.07,C.line);
    for(const x of [lane.goalA+4,lane.goalB-4]){m.disc(x,.05,0,2.8,'#223b43');m.ring(x,.07,0,2.8,.12,x<0?C.teal:C.fire);m.ring(x,.08,0,2.45,.03,'#63858c');}
    m.ring(0,.06,0,2.6,.09,'#799198');m.ring(0,.06,0,.7,.035,'#63858c');
    for(const z of [-10,10])for(let x=-16;x<=16;x+=4)m.box(x,.01,z,2.6,.04,2.6,'#233b40');
  }
  for(const w of map.walls){m.box(w.x,0,w.z,w.w,w.h,w.d,C.stone);m.box(w.x,w.h,w.z,w.w+.12,.12,w.d+.12,C.cap);m.box(w.x,w.h+.13,w.z,w.w*.7,.035,.13,'#759290');}
  for(const z of [-depth/2,depth/2])m.box(0,0,z,width,map.arena?.45:1.2,.5,C.stone);
  for(const x of [-width/2,width/2])m.box(x,0,0,.5,map.arena?.45:1.2,depth,C.stone);
  if(!map.arena)for(const x of [-width/2+2,width/2-2])for(const z of [-depth/2+2,-4,4,depth/2-2]){m.box(x,0,z,.8,1.7,.8,C.stone);m.box(x,1.7,z,.42,.4,.42,x<0?C.teal:C.fire);}
  return m;
}
export class ArenaRenderer {
  constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!this.gl)throw new Error('WebGL is unavailable. Open this build in a browser with WebGL enabled.');
    const gl=this.gl;
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,`attribute vec3 position; attribute vec3 color; uniform vec2 center; uniform vec2 extent; uniform vec2 tilt; varying vec3 tint; void main(){vec3 p=position-vec3(center.x,0.,center.y);gl_Position=vec4(p.x/extent.x,(-p.z*tilt.x+p.y*tilt.y)/extent.y,(-p.z*tilt.y-p.y*tilt.x)/100.,1.);tint=color;}`);
    const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float; varying vec3 tint; void main(){gl_FragColor=vec4(tint,1.);}`);
    this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);this.pos=gl.getAttribLocation(this.program,'position');this.col=gl.getAttribLocation(this.program,'color');this.center=gl.getUniformLocation(this.program,'center');this.extent=gl.getUniformLocation(this.program,'extent');gl.uniform2f(gl.getUniformLocation(this.program,'tilt'),CONFIG.camera.tiltSin,CONFIG.camera.tiltCos);
    this.staticBuffer=gl.createBuffer();this.dynamicBuffer=gl.createBuffer();this.arenaMap=MAP;const mesh=staticArena();this.staticCount=mesh.v.length/6;gl.bindBuffer(gl.ARRAY_BUFFER,this.staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.v),gl.STATIC_DRAW);
    this.dynamicMesh=new Mesh();this.dynamicData=new Float32Array(300000);gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.dynamicData.byteLength,gl.DYNAMIC_DRAW);
    this.art=new ArenaArt(gl);this.characters=new CharacterRenderer(gl);gl.useProgram(this.program);
    gl.enable(gl.DEPTH_TEST);gl.clearColor(.035,.065,.08,1);this.quality='standard';
  }
  drawBuffer(buffer,count,first=0){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(this.pos);gl.vertexAttribPointer(this.pos,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(this.col);gl.vertexAttribPointer(this.col,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,first,count);}
  render(p,camera,time,aiming,combat=null,preview=null){const gl=this.gl,canvas=this.canvas,dpr=Math.min(devicePixelRatio||1,CONFIG.graphics[this.quality]);const w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    const map=combat?.map||MAP;if(this.arenaMap!==map){const mesh=staticArena(map);this.arenaMap=map;this.staticCount=mesh.v.length/6;gl.bindBuffer(gl.ARRAY_BUFFER,this.staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.v),gl.STATIC_DRAW);}
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform2f(this.center,camera.x,camera.z);gl.uniform2f(this.extent,CONFIG.camera.halfHeight*w/h,CONFIG.camera.halfHeight);this.drawBuffer(this.staticBuffer,this.staticCount);gl.disableVertexAttribArray(this.pos);gl.disableVertexAttribArray(this.col);this.art.render(map,camera,w/h,combat?.match?.rules);gl.useProgram(this.program);
    this.characters.prepare(combat,p);this.characters.drawEffects(camera,w/h,true);this.characters.drawShadows(camera,w/h);gl.useProgram(this.program);
    const m=this.dynamicMesh;m.v.length=0;
    if(combat?.match){const match=combat.match,front=match.rules.front,lane=match.lane;for(const z of [-lane.halfWidth+.15,lane.halfWidth-.15]){m.box((lane.goalA+front)/2,.085,z,front-lane.goalA,.008,.3,'#428ca0');m.box((front+lane.goalB)/2,.085,z,lane.goalB-front,.008,.3,'#ae596d');}m.box(front,.105,0,.1,.02,lane.halfWidth*2,'#e9dcc2');for(const gx of [lane.goalA,0,lane.goalB])m.box(gx,.11,0,.055,.02,lane.halfWidth*2,'#899795');for(const actor of match.actors)drawSummoner(m,actor.sim===combat?p:actor.sim.player,actor.sim,actor.sim===combat&&aiming,this.characters.replaces(actor.sim.player));
    }else drawSummoner(m,p,combat,aiming,this.characters.replaces(p));
    const worldCount=m.v.length/6;
    if(combat?.match){for(const actor of combat.match.actors)drawCombat(m,actor.sim,actor.sim===combat?preview:null,this.characters);}else if(combat)drawCombat(m,combat,preview,this.characters);
    if(m.v.length>this.dynamicData.length){this.dynamicData=new Float32Array(2**Math.ceil(Math.log2(m.v.length)));gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.dynamicData.byteLength,gl.DYNAMIC_DRAW);}
    this.dynamicData.set(m.v);gl.bindBuffer(gl.ARRAY_BUFFER,this.dynamicBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.dynamicData.subarray(0,m.v.length));this.drawBuffer(this.dynamicBuffer,worldCount);
    gl.disableVertexAttribArray(this.pos);gl.disableVertexAttribArray(this.col);
    this.characters.drawSprites(camera,w/h);this.characters.drawEffects(camera,w/h,false);gl.useProgram(this.program);
    this.drawBuffer(this.dynamicBuffer,m.v.length/6-worldCount,worldCount);
  }
}

function drawSummoner(m,p,combat,aiming,sprite=false){
const {x,z,angle}=p,run=p.animation==='run',stride=run?Math.sin(p.distance*3.4)*.24:0;
    if(!sprite)m.disc(x,.1,z,.68,'#152126');m.ring(x,.11,z,.73,.09,combat?.player.team===2?'#f5787e':C.teal);
    if(!combat?.player.dead){
    if(!sprite){
    const part=(lx,y,lz,w,h,d,col)=>m.box(x+lx*Math.cos(angle)+lz*Math.sin(angle),y,z-lx*Math.sin(angle)+lz*Math.cos(angle),w,h,d,col,angle);
    if(combat?.definition.id==='set'){
     const leap=combat.advanced.leap, lift=leap?Math.sin(Math.PI*(1-leap.remaining/leap.ability.range))*.8:0,pose=combat.advanced.pose;
     part(0,.55+lift,0,.85,.95,.55,'#1c2236');part(0,1.5+lift,0,.6,.55,.5,'#151923');part(0,1.53+lift,.3,.42,.24,.23,'#272b39');
     for(const side of [-1,1]){part(side*.22,1.95+lift,-.05,.17,.23,.18,'#151923');part(side*.16,1.78+lift,.265,.1,.065,.03,'#c79aff');part(side*.52,.75+lift,pose?.kind==='punch'&&pose.side===(side===-1?0:1)?.55:-stride*side,.3,.65,.33,'#202532');part(side*.23,.12+lift,pose?.kind==='kick'&&side===1?.65:stride*side,.3,.6,.37,'#131924');}
     for(let i=0;i<5;i++)part(Math.sin(i*.6)*.16,.6+lift-i*.055,-.5-i*.18,.13,.14,.28,'#151923');part(0,.75+lift,.31,.88,.1,.08,'#5c397f');
    }else if(combat?.definition.id==='riven'){
     const pose=combat.advanced.pose,playing=!!pose,beat=playing?Math.sin(combat.now*30)*.12:0;
     part(-.19,.15,stride,.24,.62,.3,'#263637');part(.19,.15,-stride,.24,.62,.3,'#263637');part(0,.7,0,.65,.68,.4,'#31584f');
     part(0,1.39,0,.42,.43,.4,'#bda48b');part(0,1.78,-.03,.46,.13,.42,'#c7c5b4');part(0,1.35,-.23,.45,.5,.15,'#c7c5b4');
     for(const side of [-1,1]){part(side*.27,1.58,0,.17,.08,.15,'#bda48b');part(side*.41,.86+beat*side,playing?.38:-stride*side,.18,.48,.22,'#739b8d');}
     if(combat.stance==='reso'&&playing){part(0,.8,.4,.48,.25,.18,'#9ee9d8');part(.35,1,.4,.55,.1,.1,'#d4fff2');}
     if(combat.stance==='reso'){part(-.28,1.08,0,.08,.35,.1,'#c9fff1');part(.28,1.08,0,.08,.35,.1,'#c9fff1');}
     if(combat.stance==='pulse'){for(const side of [-1,1]){part(side*.5,.54,.85,.05,.45,.05,'#719d9f');part(side*.5,.98,.85,.64,.14,.55,'#8bdace');part(side*.5,1.13,.85,.66,.035,.57,'#dbfff7');}part(0,.3,1.15,.67,.58,.44,'#548b88');part(.85,1.28,1,.65,.05,.65,'#c2eee5');}
    }else{
    part(-.19,.15,stride,.24,.62,.3,'#202b34');part(.19,.15,-stride,.24,.62,.3,'#202b34');
    part(0,.7,0,.68,.66,.39,'#242a30');
    part(-.45,.75,-stride,.2,.56,.25,'#633f30');part(.45,.75,stride,.2,.56,.25,'#633f30');
    part(0,1.39,0,.42,.42,.4,'#704632');part(0,1.76,-.03,.46,.16,.42,'#1a1b22');part(0,1.4,-.22,.44,.39,.15,'#1a1b22');for(const side of [-1,1]){part(side*.23,1.37,-.12,.09,.47,.12,'#15161b');part(side*.45,.76,0,.22,.17,.27,'#a7a59a');}part(0,.8,.26,.09,.04,.8,'#ee722c');part(0,1.56,.212,.3,.06,.03,'#ffb84c');part(0,.84,.22,.67,.11,.06,C.fire);
    }
    }
    const fx=Math.sin(angle),fz=Math.cos(angle);m.tri([x+fx*1.2,.12,z+fz*1.2],[x+fx*.85+fz*.2,.12,z+fz*.85-fx*.2],[x+fx*.85-fz*.2,.12,z+fz*.85+fx*.2],C.fire);
    if(aiming){for(let i=1;i<9;i++)m.disc(x+fx*i*.5,.13,z+fz*i*.5,.055,C.fire,6);m.ring(x+fx*4.6,.13,z+fz*4.6,.32,.05,C.fire,16);}
    }
}