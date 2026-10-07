import {withoutControlledFeel} from './helpers/controlled-feel-seams.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CharacterAnimator, animationFrames, characterRect, CHARACTER_VISUALS, WORLD_RENDER_LAYERS} from '../src/character-visuals.js';
import {CharacterRenderer, CharacterTextureCache} from '../src/character-renderer.js';
import {CombatFeedback} from '../src/combat-feedback.js';
import {CrownfallMatch} from '../src/match.js';
import {CrownfallBot} from '../src/match-bots.js';
import {CombatSimulation} from '../src/combat.js';
import {withoutM92Presentation} from './helpers/m92-presentation-seams.js';

const frames = Array.from({length: 8}, (_, i) => ({src: 'run-' + i + '.png'}));
const definition = {scale: 2.5, anchor: [.5,.7], offset: [0,.7], facing: 'mirror-x',
 animations: {idle: {frames:[{src:'idle.png'}],fps:1,loop:true},run:{frames,fps:12,loop:true},
 basic:{frames:frames.slice(0,3),fps:12},'ability:sample':{frames,fps:12},
 hit:{frames:frames.slice(0,2),fps:12},death:{frames,fps:12},respawn:{frames:frames.slice(0,3),fps:12}}};

test('Kit basic uses the six approved unmodified uploads in numeric order at 12 FPS once',()=>{
 const d=CHARACTER_VISUALS['kit-asher'],clip=d.animations.basic;
 const hashes=[
  'd5918960e4f5341ec72ea3cbcf2798fdb97f104f519865521262826b11c07896',
  '956f9cc4619f6135ecba9d4dc6f519418ec005eaca2f5cd1c03a621a0351ccfc',
  'dfb1f7b508cfa64c8a9729b87c529837773b4ebca279dd5cbe66bc2b3f5140fa',
  '92100d6ed6cb41eee6a3c26fe7c770091b0851847f2d083a4b2063f9028b1cd8',
  '2c38d635f7655bad152d3276623f3e8d6acee4f35fe003b3703fb1312dc55ecb',
  '4f3410f8cb66d8b3a4bcc48502092fcff9c8accf19160a3fea7eb7a4d47bc243'
 ];
 assert.equal(clip.fps,12);assert.equal(clip.loop,false);assert.equal(clip.frames.length,6);
 clip.frames.forEach((f,i)=>{
  assert.deepEqual(f,{src:`assets/characters/kit-asher/basic/${String(i).padStart(3,'0')}.png`});
  assert.equal(createHash('sha256').update(fs.readFileSync(f.src)).digest('hex'),hashes[i]);
 });
 for(const movement of ['idle','run']){
  const a=new CharacterAnimator(d),p={animation:movement,angle:0};a.update(p,0);a.trigger('basic',1);
  for(let i=0;i<6;i++){a.update(p,1+i/12);assert.equal(a.state,'basic');assert.equal(a.frame,i);}
  a.update(p,1.5);assert.equal(a.state,movement);assert.equal(a.action,null);
 }
});

test('existing Kit cast event selects and draws basic frames, rejects cooldown spam and returns to locomotion',()=>{
 const old=globalThis.Image,{gl,calls}=fakeGPU();globalThis.Image=class{constructor(){this.width=1254;this.height=1254;}set src(v){this.onload();}};
 try{
  const r=new CharacterRenderer(gl),s=new CombatSimulation(),feedback=new CombatFeedback();feedback.bind(s);
  r.prepare(s,s.player);assert.equal(r.states.get(s.player).animator.state,'idle');
  assert.ok(s.cast('whip'));const a=r.states.get(s.player).animator,action=a.action;
  assert.equal(s.cast('whip'),false);assert.equal(a.action,action);
  const before=JSON.stringify(s.player),draws=calls.filter(c=>c[0]==='drawArrays').length;
  for(let i=0;i<6;i++){
   s.now=i/12;r.prepare(s,s.player);assert.equal(a.frame,i);assert.equal(a.state,'basic');
   assert.equal(r.states.get(s.player).frame.src,CHARACTER_VISUALS['kit-asher'].animations.basic.frames[i].src);
   assert.ok(r.replaces(s.player));r.drawSprites({x:0,z:0},2);
  }
  assert.equal(calls.filter(c=>c[0]==='drawArrays').length-draws,6);assert.equal(JSON.stringify(s.player),before);
  s.now=.5;r.prepare(s,s.player);assert.equal(a.state,'idle');
  s.now=.6;s.player.animation='run';assert.ok(s.cast('whip'));r.prepare(s,s.player);assert.equal(a.frame,0);
  s.now=1.1;r.prepare(s,s.player);assert.equal(a.state,'run');assert.ok(r.replaces(s.player));
  for(const id of ['set','riven']){const p={id,animation:'idle'};r.prepare({definition:{id},player:p,now:0},p);assert.equal(r.replaces(p),true);}
  r.dispose();
 }finally{if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});

test('M9.2 protects every M9.1 runtime source outside exact reviewed renderer/event seams',()=>{
 const additions=['character-visuals.js','character-renderer.js'];
 for(const name of fs.readdirSync('src').filter(n=>n.endsWith('.js')&&!additions.includes(n))) {
  const current=fs.readFileSync('src/'+name,'utf8');
  assert.equal(withoutM92Presentation(current,name.slice(0,-3)),execFileSync('git',['show','cbced6e:src/'+name],{encoding:'utf8'}),name);
 }
 for(const name of ['index.html','style.css'])assert.equal(withoutControlledFeel(fs.readFileSync(name,'utf8'),name),execFileSync('git',['show','cbced6e:'+name],{encoding:'utf8'}));
});

test('eight frames play at 12 FPS in order, immediately enter/exit run and never write gameplay position',()=>{
 const a=new CharacterAnimator(definition),p={x:7,z:8,angle:Math.PI/2,animation:'idle',dead:false};
 a.update(p,1);assert.equal(a.state,'idle');p.animation='run';
 const before=JSON.stringify(p);for(let i=0;i<18;i++){a.update(p,2+i/12);assert.equal(a.frame,i%8);assert.equal(a.state,'run');}
 assert.equal(JSON.stringify(p),before);p.animation='idle';a.update(p,4);assert.equal(a.state,'idle');assert.equal(a.frame,0);
 p.animation='run';a.update(p,4.001);assert.equal(a.state,'run');assert.equal(a.frame,0);
});

test('hip anchor remains invariant through per-frame poses, atlas regions and facing changes',()=>{
 const a=new CharacterAnimator(definition),visual=a.definition;
 for(const flip of [false,true])for(let i=0;i<8;i++){
  const frame={src:'x',anchor:[.35+i*.025,.65],offset:[0,0]},r=characterRect(visual,null,frame,.8,flip);
  assert.ok(Math.abs(r.left+r.width*(flip?1-frame.anchor[0]:frame.anchor[0])-visual.offset[0])<1e-12);
  assert.ok(Math.abs(r.bottom+r.height*(1-frame.anchor[1])-visual.offset[1])<1e-12);
 }
});

test('facing uses authoritative aim independently from run direction and retains side at vertical',()=>{
 const a=new CharacterAnimator(definition),p={animation:'run',angle:-Math.PI/2};a.update(p,0);assert.equal(a.flip,true);
 p.angle=0;a.update(p,.1);assert.equal(a.flip,true);p.angle=Math.PI/2;a.update(p,.2);assert.equal(a.flip,false);
});

test('missing clips fall back; death hides missing art; respawn and time rewind reset safely',()=>{
 const p={animation:'run',angle:0,dead:false},a=new CharacterAnimator({...CHARACTER_VISUALS['kit-asher'], animations:{idle:CHARACTER_VISUALS['kit-asher'].animations.idle}});
 a.update(p,2);assert.equal(a.state,'idle');a.trigger('ability:not-authored',2);assert.equal(a.action,null);
 p.dead=true;a.update(p,3);assert.equal(a.clip,null);p.dead=false;a.update(p,4);assert.equal(a.state,'idle');
 const full=new CharacterAnimator(definition);full.update(p,0);full.trigger('basic',.1);full.update(p,.1);assert.equal(full.state,'basic');
 full.update(p,1);assert.equal(full.state,'run');p.dead=true;full.update(p,1.1);full.update(p,10);assert.equal(full.frame,7);
 p.dead=false;full.update(p,11);assert.equal(full.state,'respawn');full.update(p,12);assert.equal(full.state,'run');
 full.update(p,0);assert.equal(full.state,'run');assert.equal(full.frame,0);
});

test('individual frames and row-major atlas clips compile with bounded frame counts',()=>{
 assert.equal(animationFrames({frames}).length,8);
 const atlas=animationFrames({sheet:{src:'a.png',columns:4,rows:2},frameCount:8});
 assert.deepEqual(atlas[0].uv,[0,0,.25,.5]);assert.deepEqual(atlas[7].uv,[.75,.5,.25,.5]);
 assert.equal(animationFrames({sheet:{src:'a',columns:0,rows:2},frameCount:8}).length,0);
 assert.equal(animationFrames({sheet:{src:'a',columns:4,rows:2},frameCount:9}).length,0);
});

test('visual events observe successful casts and hits without affecting audio or throwing into combat',()=>{
 const f=new CombatFeedback({enabled:false}),events=[];const remove=f.subscribeVisual(e=>events.push(e));
 f.subscribeVisual(()=>{throw Error('bad animation');});f.emit({type:'cast',source:{id:'kit'},ability:{id:'whip',basic:true},time:1});
 assert.deepEqual(events[0],{type:'character-animation',event:'cast',time:1,source:'kit',target:undefined,ability:'whip',basic:true});
 assert.ok(Object.isFrozen(events[0]));remove();f.emit({type:'hit',target:{id:'kit'},time:2});assert.equal(events.length,1);
});

function fakeGPU(){const calls=[];return {calls,gl:new Proxy({}, {get:(_,k)=>k==='getParameter'?()=>2048:k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getUniformLocation'?(_,n)=>n:k==='getAttribLocation'?()=>0:/^[A-Z_0-9]+$/.test(k)?k:(...args)=>{calls.push([k,...args]);return {};}})};}

test('texture cache loads once per URL, supports NPOT, reports errors and disposes textures',()=>{
 const {gl,calls}=fakeGPU(),images=[],cache=new CharacterTextureCache(gl,()=>{const i={width:301,height:512};images.push(i);return i;});
 const e=cache.load({src:'one.png'});assert.equal(cache.load({src:'one.png'}),e);assert.equal(images.length,1);images[0].onload();assert.equal(e.status,'ready');
 assert.equal(calls.filter(c=>c[0]==='texImage2D').length,1);assert.equal(calls.filter(c=>c[0]==='generateMipmap').length,0);
 const bad=cache.load({src:'missing.png'});images[1].onerror();assert.equal(bad.status,'failed');
 const large=cache.load({src:'large.png'});images[2].width=4096;images[2].onload();assert.equal(large.status,'failed');
 cache.dispose();assert.equal(calls.filter(c=>c[0]==='deleteTexture').length,1);
});

test('sprite renderer preserves world anchor, reuses buffers, restores GL state and coexists with placeholders',()=>{
 const old=globalThis.Image,{gl,calls}=fakeGPU();globalThis.Image=class{constructor(){this.width=512;this.height=512;}set src(v){this.onload();}};
 try {
  const r=new CharacterRenderer(gl,{test:{...definition,shadow:{width:1.3,depth:.8,opacity:.3}}});
  const sim={definition:{id:'test'},now:0,player:{id:'p',x:4,z:3,animation:'run',angle:1,dead:false},feedback:new CombatFeedback()};
  const before=JSON.stringify(sim.player),allocations=calls.filter(c=>c[0]==='createBuffer'||c[0]==='createTexture').length;
  for(let i=0;i<20;i++){sim.now=i/12;r.prepare(sim,sim.player);assert.equal(r.replaces(sim.player),true);r.drawShadows({x:0,z:0},2);r.drawSprites({x:0,z:0},2);}
  assert.equal(JSON.stringify(sim.player),before);assert.equal(calls.filter(c=>c[0]==='createBuffer'||c[0]==='createTexture').length,allocations);
  assert.ok(calls.some(c=>c[0]==='uniform2f'&&c[1]==='origin'&&c[2]===4&&c[3]===3));
  assert.deepEqual(calls.filter(c=>c[0]==='depthMask').at(-1),['depthMask',true]);
  sim.player.dead=true;r.prepare(sim,sim.player);assert.equal(r.states.get(sim.player).animator.state,'death');
  const other={definition:{id:'set'},player:{id:'s',x:0,z:0},now:0};r.prepare(other,other.player);assert.equal(r.replaces(other.player),false);assert.equal(sim.feedback.visualListeners.size,0);r.dispose();
 } finally {if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});

test('missing GPU asset safely returns to placeholder rather than removing the Summoner',()=>{
 const old=globalThis.Image,{gl}=fakeGPU();globalThis.Image=class{set src(v){this.onerror();}};
 try{const r=new CharacterRenderer(gl,{test:definition}),sim={definition:{id:'test'},now:0,player:{id:'p',x:0,z:0}};r.prepare(sim,sim.player);assert.equal(r.replaces(sim.player),false);r.dispose();}
 finally{if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});

test('documented layer order places territory below shadows, sprites, combat and HUD',()=>{
 assert.ok(WORLD_RENDER_LAYERS.indexOf('territory')<WORLD_RENDER_LAYERS.indexOf('summoner-sprites'));
 const source=fs.readFileSync('src/renderer.js','utf8');assert.ok(source.indexOf('this.art.render(')<source.indexOf('this.characters.drawShadows('));
 assert.ok(source.indexOf('this.characters.drawSprites(')<source.indexOf('this.drawBuffer(this.dynamicBuffer,m.v.length/6-worldCount,worldCount)'));
});

test('complete matches remain identical with character animation observers attached for all Summoners',()=>{
 for(const summoner of ['kit-asher','set','riven']) {
  const run=visual=>{const m=new CrownfallMatch(summoner),pilot=new CrownfallBot(0),f=new CombatFeedback({enabled:false});
   const animators=m.actors.map(()=>new CharacterAnimator(definition));if(visual){f.bind(m.human);f.subscribeVisual(e=>{
    const i=m.actors.findIndex(a=>a.sim.player.id===(e.event==='hit'?e.target:e.source));if(i>=0)animators[i].trigger(e.basic?'basic':'hit',e.time);
   });}m.start();for(let i=0;i<60*305&&!m.rules.result;i++){m.step(pilot.read(m.human,m));if(visual)m.actors.forEach((a,i)=>animators[i].update(a.sim.player,a.sim.now));}
   assert.ok(m.rules.result);return JSON.stringify({rules:m.rules,actors:m.actors.map(a=>({p:a.sim.player,record:a.record,stance:a.sim.stance})),rotations:m.wilderness.rotationCount,rewards:m.wilderness.rewardCount});};
  assert.equal(run(true),run(false),summoner);
 }
});

test('approved Kit loose PNGs load in exact numeric order with stable hip registration',()=>{
 const d=CHARACTER_VISUALS['kit-asher'], a=new CharacterAnimator(d);
 const player={animation:'idle',angle:0,dead:false};
 a.update(player,0); assert.equal(a.clip.frames[a.frame].src,'assets/characters/kit-asher/idle/000.png');
 assert.equal(d.animations.run.fps,12);
 for(const [state,clip] of Object.entries(d.animations)) for(const [i,frame] of clip.frames.entries()) {
  assert.equal(frame.src,state==='ability:blast'?'assets/characters/kit-asher/abilities/expellant-cast.png':`assets/characters/kit-asher/${state}/${String(i).padStart(3,'0')}.png`);
  const bytes=fs.readFileSync(frame.src);
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),1254); assert.equal(bytes.readUInt32BE(20),1254);
  for(const flip of [false,true]) {
   const r=characterRect(d,clip,frame,1,flip),p=frame.anchor||d.anchor;
   assert.ok(Math.abs(r.left+r.width*(flip?1-p[0]:p[0]))<1e-9);
   assert.ok(Math.abs(r.bottom+r.height*(1-p[1])-.806)<1e-9);
  }
 }
 player.animation='run'; a.update(player,1);
 for(let i=0;i<16;i++){a.update(player,1+i/12);assert.equal(a.frame,i%8);}
 player.animation='idle';a.update(player,3);assert.equal(a.state,'idle');assert.equal(a.frame,0);
});