import {withoutControlledFeel,beforeReadability} from './helpers/controlled-feel-seams.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CHARACTER_VISUALS,CharacterAnimator,characterRect} from '../src/character-visuals.js';
import {CharacterRenderer} from '../src/character-renderer.js';
import {CombatSimulation} from '../src/combat.js';
import {RIVEN} from '../src/riven-data.js';

test('Riven idle/run is the only runtime change from Version 19; Kit and Set retain their definitions and assets',async()=>{
 for(const file of fs.readdirSync('src').filter(n=>n.endsWith('.js')&&n!=='character-visuals.js'))
  assert.equal(withoutControlledFeel(fs.readFileSync('src/'+file,'utf8'),file.slice(0,-3)),execFileSync('git',['show','325527f:src/'+file],{encoding:'utf8'}),file);
 const source=execFileSync('git',['show','325527f:src/character-visuals.js'],{encoding:'utf8'});
 const old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const id of ['kit-asher','set'])assert.deepEqual(beforeReadability(CHARACTER_VISUALS[id]),old.CHARACTER_VISUALS[id]);
 const current=fs.readFileSync('src/character-visuals.js','utf8');
 assert.equal(current.slice(current.indexOf('export const CHARACTER_ASSET_LIMITS')),source.slice(source.indexOf('export const CHARACTER_ASSET_LIMITS')));
 assert.deepEqual(Object.keys(CHARACTER_VISUALS.riven.animations),['idle','run']);assert.equal(CHARACTER_VISUALS.riven.effects,undefined);
 for(const file of execFileSync('git',['ls-tree','-r','--name-only','325527f','assets/characters'],{encoding:'utf8'}).trim().split('\n'))
  assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show','325527f:'+file],{maxBuffer:8*1024*1024}));
});

test('nine Riven uploads preserve attachment order and bytes; run loops 000–007 at 12 FPS with stable registration',()=>{
 const order=JSON.parse(fs.readFileSync('tests/helpers/riven-attachment-order.json','utf8'));
 assert.equal(order.length,9);
 for(let i=0;i<9;i++){
  const record=order[i],expected=i===0?'assets/characters/riven/idle/000.png':`assets/characters/riven/run/${String(i-1).padStart(3,'0')}.png`;
  assert.equal(record.attachment,i+1);assert.equal(record.path,expected);
  const bytes=fs.readFileSync(expected);assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);assert.deepEqual(fs.readFileSync('dist/'+expected),bytes);
  if(i===0)assert.equal(bytes.subarray(0,2).toString('hex'),'ffd8');else{assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);}
 }
 const d=CHARACTER_VISUALS.riven,a=new CharacterAnimator(d),p={x:3,z:5,animation:'idle',angle:Math.PI/2};
 a.update(p,0);assert.equal(a.clip.frames[0].src,order[0].path);
 p.animation='run';const before=JSON.stringify(p);
 for(let i=0;i<24;i++){
  a.update(p,1+i/12);assert.equal(a.state,'run');assert.equal(a.frame,i%8);assert.equal(a.clip.fps,12);assert.equal(a.clip.loop,true);
  const f=a.clip.frames[a.frame];assert.equal(f.src,order[1+i%8].path);
  for(const flip of [false,true]){const rect=characterRect(d,a.clip,f,1,flip);assert.ok(Math.abs(rect.bottom)<1e-10);assert.ok(Math.abs(rect.left+rect.width*.5)<1e-10);}
 }
 assert.equal(JSON.stringify(p),before);assert.equal(a.flip,false);p.angle=-Math.PI/2;a.update(p,4);assert.equal(a.flip,true);
 p.animation='idle';a.update(p,4.1);assert.equal(a.state,'idle');assert.equal(a.frame,0);
});

test('Riven actual movement renders cached idle/run in both existing stances without new action clips',()=>{
 const old=globalThis.Image,calls=[];
 const gl=new Proxy({}, {get:(_,k)=>k==='getParameter'?()=>2048:k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getUniformLocation'?(_,n)=>n:k==='getAttribLocation'?()=>0:/^[A-Z_0-9]+$/.test(k)?k:(...args)=>{calls.push([k,...args]);return {};}});
 globalThis.Image=class{constructor(){this.width=1254;this.height=1254;}set src(v){this.onload();}};
 const r=new CharacterRenderer(gl),s=new CombatSimulation(RIVEN);
 try{
  r.prepare(s,s.player);assert.ok(r.replaces(s.player));const allocations=calls.filter(c=>c[0]==='createTexture').length;
  for(const stance of Object.keys(RIVEN.stances)){
   s.stance=stance;s.step({moveX:1,moveZ:0});r.prepare(s,s.player);assert.equal(r.states.get(s.player).animator.state,'run');r.drawSprites({x:0,z:0},2);
   s.step({moveX:0,moveZ:0});r.prepare(s,s.player);assert.equal(r.states.get(s.player).animator.state,'idle');assert.ok(r.replaces(s.player));
  }
  assert.equal(calls.filter(c=>c[0]==='createTexture').length,allocations);
 }finally{r.dispose();if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});