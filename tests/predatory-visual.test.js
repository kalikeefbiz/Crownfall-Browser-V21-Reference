import {beforeReadability} from './helpers/controlled-feel-seams.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CHARACTER_VISUALS,CharacterAnimator} from '../src/character-visuals.js';
import {CharacterRenderer} from '../src/character-renderer.js';
import {CombatSimulation} from '../src/combat.js';
import {SET} from '../src/summoners.js';
import {withoutPredatoryVisual} from './helpers/predatory-visual-seams.js';

test('Predatory presentation preserves Version 18 gameplay and all existing visual definitions',async()=>{
 for(const file of fs.readdirSync('src').filter(n=>n.endsWith('.js')&&n!=='character-visuals.js'))
  assert.equal(withoutPredatoryVisual(fs.readFileSync('src/'+file,'utf8'),file.slice(0,-3)),execFileSync('git',['show','5bfc44a:src/'+file],{encoding:'utf8'}),file);
 const source=execFileSync('git',['show','5bfc44a:src/character-visuals.js'],{encoding:'utf8'});
 const old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const current=beforeReadability(CHARACTER_VISUALS);delete current.set.animations['contact:predatory'];
 current.riven=old.CHARACTER_VISUALS.riven; // Approved idle/run addition checked in riven-art tests.
 assert.deepEqual(current,old.CHARACTER_VISUALS);
 const clips=CHARACTER_VISUALS.set.animations;
 assert.equal(clips.basic.frames,clips['contact:predatory'].frames);
 assert.equal(clips.basic.fps,12);assert.equal(clips['contact:predatory'].fps,18);
 const p={animation:'idle'},a=new CharacterAnimator(CHARACTER_VISUALS.set);a.trigger('basic',0);
 for(let i=0;i<4;i++){a.update(p,i/12);assert.equal(a.frame,i);assert.equal(a.state,'basic');}
 a.update(p,4/12);assert.equal(a.state,'idle');
});

test('Predatory leap runs, actual contact plays accelerated frames once, and misses never trigger them',()=>{
 const old=globalThis.Image;
 const gl=new Proxy({}, {get:(_,k)=>k==='getParameter'?()=>2048:k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getUniformLocation'?(_,n)=>n:k==='getAttribLocation'?()=>0:/^[A-Z_0-9]+$/.test(k)?k:()=>({})});
 globalThis.Image=class{constructor(){this.width=1223;this.height=1286;}set src(v){this.onload();}};
 try{for(const hit of [true,false]){
  const s=new CombatSimulation(SET),r=new CharacterRenderer(gl);s.player.x=0;s.player.z=0;
  const target=s.targets[0];target.x=2.5;target.z=0;s.targets=hit?[target]:[];
  r.prepare(s,s.player);const a=r.states.get(s.player).animator;a.trigger('basic',s.now);
  assert.ok(s.cast('predatory',Math.PI/2));r.prepare(s,s.player);assert.equal(a.state,'run');assert.equal(a.action,null);
  let guard=0;
  while(s.advanced.leap&&guard++<60){s.step({moveX:0,moveZ:0});r.prepare(s,s.player);if(s.advanced.leap)assert.equal(a.state,'run');}
  assert.ok(guard<60);
  if(hit){
   const q=s.advanced.sequence;assert.ok(q);assert.equal(a.state,'contact:predatory');
   const before=JSON.stringify(s.player),sequence=JSON.stringify(q);
   for(let i=0;i<4;i++){s.now=q.started+i/18;r.prepare(s,s.player);assert.equal(a.state,'contact:predatory');assert.equal(a.frame,i);assert.equal(r.states.get(s.player).frame.src,CHARACTER_VISUALS.set.animations.basic.frames[i].src);r.drawSprites({x:0,z:0},2);}
   assert.equal(JSON.stringify(s.player),before);assert.equal(JSON.stringify(q),sequence);
   s.now=q.started+4/18;s.player.animation='idle';r.prepare(s,s.player);assert.equal(a.state,'idle');
   s.player.animation='run';s.now+=.01;r.prepare(s,s.player);assert.equal(a.state,'run');assert.equal(a.action,null);
  }else{assert.equal(s.advanced.sequence,null);assert.equal(a.action,null);assert.notEqual(a.state,'contact:predatory');assert.ok(s.lastEvent.includes('no contact'));}
  assert.equal(s.cooldowns.ready('predatory',s.now),false);r.dispose();
 }}finally{if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});