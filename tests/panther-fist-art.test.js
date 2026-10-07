import {beforeReadability} from './helpers/controlled-feel-seams.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CHARACTER_VISUALS} from '../src/character-visuals.js';
import {CharacterRenderer} from '../src/character-renderer.js';
import {CombatSimulation} from '../src/combat.js';
import {SET} from '../src/summoners.js';
import {drawCombat} from '../src/combat-view.js';
import {withoutPantherFist} from './helpers/panther-fist-seams.js';

test('Panther Fist changes only explicit presentation seams from Version 17',async()=>{
 for(const file of fs.readdirSync('src').filter(n=>n.endsWith('.js')&&n!=='character-visuals.js'))
  assert.equal(withoutPantherFist(fs.readFileSync('src/'+file,'utf8'),file.slice(0,-3)),execFileSync('git',['show','486ab88:src/'+file],{encoding:'utf8'}),file);
 const source=execFileSync('git',['show','486ab88:src/character-visuals.js'],{encoding:'utf8'});
 const old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const current=beforeReadability(CHARACTER_VISUALS);delete current.set.effects;
 current.riven=old.CHARACTER_VISUALS.riven; // Approved idle/run addition checked in riven-art tests.
 delete current.set.animations['contact:predatory'];
 assert.deepEqual(current,old.CHARACTER_VISUALS);
 for(const file of execFileSync('git',['ls-tree','-r','--name-only','486ab88','assets/characters'],{encoding:'utf8'}).trim().split('\n'))
  assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show','486ab88:'+file],{maxBuffer:8*1024*1024}));
 for(const file of ['000.png','001.png']){
  const p='assets/characters/set/panther-fist/'+file;assert.deepEqual(fs.readFileSync(p),fs.readFileSync('dist/'+p));
 }
});

test('claw descends at authoritative target and impact appears only on existing resolution, fading with VFX expiry',()=>{
 const old=globalThis.Image,calls=[];
 const gl=new Proxy({}, {get:(_,k)=>k==='getParameter'?()=>2048:k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getUniformLocation'?(_,n)=>n:k==='getAttribLocation'?()=>0:/^[A-Z_0-9]+$/.test(k)?k:(...args)=>{calls.push([k,...args]);return {};}});
 globalThis.Image=class{constructor(){this.width=1254;this.height=1254;}set src(v){this.onload();}};
 const r=new CharacterRenderer(gl),s=new CombatSimulation(SET),ground=[];
 try{
  s.player.x=0;s.player.z=0;s.targets=[];assert.ok(s.cast('fist',0,{x:2,z:3}));
  r.drawEffect=(...args)=>ground.push(args);
  const before=JSON.stringify(s.advanced.impacts),heights=[];
  for(const now of [0,.35,.69]){
   s.now=now;r.prepare(s,s.player);calls.length=0;r.drawEffects({x:0,z:0},2,false);
   assert.deepEqual(calls.find(c=>c[0]==='uniform2f'&&c[1]==='origin'),['uniform2f','origin',2,3]);
   heights.push(calls.find(c=>c[0]==='uniform4f'&&c[1]==='rect')[3]);
   r.drawEffects({x:0,z:0},2,true);assert.equal(ground.length,0);
  }
  assert.ok(heights[0]>heights[1]&&heights[1]>heights[2]);assert.equal(JSON.stringify(s.advanced.impacts),before);
  const meshes=[];drawCombat(new Proxy({}, {get:(_,k)=>(...args)=>meshes.push([k,...args])}),s,null,r);
  assert.ok(meshes.some(c=>c[0]==='ring'&&c[1]===2&&c[3]===3&&c[4]===s.ability('fist').radius));
  assert.ok(!meshes.some(c=>c[0]==='box'&&c.includes('#9f6ec8')));
  r.cache.entries.get(CHARACTER_VISUALS.set.effects.fallingClaw.src).status='failed';meshes.length=0;
  drawCombat(new Proxy({}, {get:(_,k)=>(...args)=>meshes.push([k,...args])}),s,null,r);
  assert.ok(meshes.some(c=>c[0]==='box'&&c.includes('#9f6ec8')));
  s.now=.7;s.advanced.update(1/60);r.prepare(s,s.player);assert.equal(s.advanced.impacts.length,0);
  r.drawEffects({x:0,z:0},2,true);assert.equal(ground.length,1);
  assert.equal(ground[0][0],CHARACTER_VISUALS.set.effects.slam);
  assert.deepEqual(ground[0].slice(1,3),[2,3]);assert.equal(ground[0][4],s.ability('fist').radius*2);
  s.now=1.15;ground.length=0;r.drawEffects({x:0,z:0},2,true);assert.ok(ground[0][8]>0&&ground[0][8]<1);
  s.step({moveX:0,moveZ:0},.1);r.prepare(s,s.player);ground.length=0;r.drawEffects({x:0,z:0},2,true);assert.equal(ground.length,0);
 }finally{r.dispose();if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});