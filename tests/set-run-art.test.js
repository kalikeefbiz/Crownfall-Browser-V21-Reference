import {beforeReadability} from './helpers/controlled-feel-seams.js';
import test from 'node:test';
import {withoutPantherFist} from './helpers/panther-fist-seams.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CHARACTER_VISUALS,CharacterAnimator,characterRect} from '../src/character-visuals.js';
import {CharacterRenderer} from '../src/character-renderer.js';
import {CombatSimulation} from '../src/combat.js';
import {SET} from '../src/summoners.js';

test('Set run preserves all baseline runtime code, Kit art and Riven definition',async()=>{
 for(const file of fs.readdirSync('src').filter(n=>n.endsWith('.js')&&n!=='character-visuals.js'))
  assert.equal(withoutPantherFist(fs.readFileSync('src/'+file,'utf8'),file.slice(0,-3)),execFileSync('git',['show','1150292:src/'+file],{encoding:'utf8'}),file);
 const source=execFileSync('git',['show','1150292:src/character-visuals.js'],{encoding:'utf8'});
 const old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.deepEqual(beforeReadability(CHARACTER_VISUALS['kit-asher']),old.CHARACTER_VISUALS['kit-asher']);
 assert.equal(CHARACTER_VISUALS.riven.fallback,old.CHARACTER_VISUALS.riven.fallback); // Authored locomotion covered by riven-art tests.
 for(const file of execFileSync('git',['ls-tree','-r','--name-only','1150292','assets/characters/kit-asher'],{encoding:'utf8'}).trim().split('\n'))
  assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show','1150292:'+file],{maxBuffer:8*1024*1024}));
});

test('Set ordered run loops at 12 FPS, mirrors aim, keeps stable pivot and falls back when stopped',()=>{
 const d=CHARACTER_VISUALS.set,a=new CharacterAnimator(d),p={x:4,z:7,animation:'run',angle:Math.PI/2};
 assert.equal(d.animations.run.fps,12);assert.equal(d.animations.run.loop,true);assert.equal(d.animations.run.frames.length,8);
 const before=JSON.stringify(p);
 for(let i=0;i<24;i++){
  a.update(p,i/12);assert.equal(a.frame,i%8);assert.equal(a.state,'run');
  const f=a.clip.frames[a.frame];assert.equal(f.src,`assets/characters/set/run/${String(i%8).padStart(3,'0')}.png`);
  const b=fs.readFileSync(f.src);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),437);assert.equal(b.readUInt32BE(20),431);
  assert.deepEqual(fs.readFileSync('dist/'+f.src),b);
  for(const flip of [false,true]){const r=characterRect(d,a.clip,f,437/431,flip);
   assert.ok(Math.abs(r.left+r.width*(flip?1-d.anchor[0]:d.anchor[0]))<1e-10);assert.ok(Math.abs(r.bottom)<1e-10);
  }
 }
 assert.equal(JSON.stringify(p),before);assert.equal(a.flip,false);p.angle=-Math.PI/2;a.update(p,2);assert.equal(a.flip,true);
 p.animation='idle';a.update(p,2.1);assert.equal(a.clip.frames[0].src,'assets/characters/set/idle/000.png');p.animation='run';a.update(p,2.2);assert.equal(a.frame,0);
});

test('Set existing movement selects sprites, stopping restores idle, with cached draw resources',()=>{
 const old=globalThis.Image,calls=[];
 const gl=new Proxy({}, {get:(_,k)=>k==='getParameter'?()=>2048:k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getUniformLocation'?(_,n)=>n:k==='getAttribLocation'?()=>0:/^[A-Z_0-9]+$/.test(k)?k:(...args)=>{calls.push([k,...args]);return {};}});
 globalThis.Image=class{constructor(){this.width=437;this.height=431;}set src(v){this.onload();}};
 const r=new CharacterRenderer(gl),s=new CombatSimulation(SET);
 try{
  r.prepare(s,s.player);assert.equal(r.replaces(s.player),true);
  const allocations=calls.filter(c=>['createTexture','createBuffer'].includes(c[0])).length;
  for(let i=0;i<90;i++){s.step({moveX:1,moveZ:0});r.prepare(s,s.player);assert.equal(r.replaces(s.player),true);r.drawShadows({x:0,z:0},2);r.drawSprites({x:0,z:0},2);}
  assert.equal(calls.filter(c=>['createTexture','createBuffer'].includes(c[0])).length,allocations);
  s.step({moveX:0,moveZ:0});r.prepare(s,s.player);assert.equal(r.replaces(s.player),true);assert.equal(r.states.get(s.player).animator.state,'idle');
 }finally{r.dispose();if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});