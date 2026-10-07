import {withoutControlledFeel,beforeReadability} from './helpers/controlled-feel-seams.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CHARACTER_VISUALS} from '../src/character-visuals.js';
import {CharacterRenderer} from '../src/character-renderer.js';
import {CombatSimulation} from '../src/combat.js';
import {CombatFeedback} from '../src/combat-feedback.js';
import {drawCombat} from '../src/combat-view.js';

function setup(){
 const old=globalThis.Image,calls=[];
 const gl=new Proxy({}, {get:(_,k)=>k==='getParameter'?()=>2048:k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getUniformLocation'?(_,n)=>n:k==='getAttribLocation'?()=>0:/^[A-Z_0-9]+$/.test(k)?k:(...args)=>{calls.push([k,...args]);return {};}});
 globalThis.Image=class{constructor(){this.width=1024;this.height=1024;}set src(v){this.onload();}};
 const renderer=new CharacterRenderer(gl),sim=new CombatSimulation(),feedback=new CombatFeedback();feedback.bind(sim);
 sim.player.x=0;sim.player.z=0;sim.targets=[];renderer.prepare(sim,sim.player);
 return {renderer,sim,calls,close(){renderer.dispose();if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}};
}
const idle={moveX:0,moveZ:0,aiming:false};

test('ability art preserves every protected gameplay source and prior character definitions',async()=>{
 for(const name of fs.readdirSync('src').filter(n=>n.endsWith('.js')&&!['character-visuals.js','character-renderer.js','renderer.js','combat-view.js'].includes(n)))
  assert.equal(withoutControlledFeel(fs.readFileSync('src/'+name,'utf8'),name.slice(0,-3)),execFileSync('git',['show','0d2face:src/'+name],{encoding:'utf8'}),name);
 const source=execFileSync('git',['show','0d2face:src/character-visuals.js'],{encoding:'utf8'});
 const old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.equal(CHARACTER_VISUALS.riven.fallback,old.CHARACTER_VISUALS.riven.fallback); // Authored locomotion covered by riven-art tests.
 assert.equal(CHARACTER_VISUALS.set.fallback,old.CHARACTER_VISUALS.set.fallback);
 assert.equal(CHARACTER_VISUALS.set.animations.idle.frames[0].src,'assets/characters/set/idle/000.png');
 const current=beforeReadability(CHARACTER_VISUALS['kit-asher']);delete current.effects;delete current.animations['ability:blast'];
 assert.deepEqual(current,old.CHARACTER_VISUALS['kit-asher']);
});

test('all five supplied ability PNGs are packaged with alpha and within the existing GPU limit',()=>{
 for(const name of ['ember-step-trail','solar-ring','last-flame','expellant-cast','expellant-blast']){
  const p=`assets/characters/kit-asher/abilities/${name}.png`,b=fs.readFileSync(p);
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b[25],6);
  assert.ok(b.readUInt32BE(16)<=2048&&b.readUInt32BE(20)<=2048);
  assert.deepEqual(fs.readFileSync('dist/'+p),b);
 }
});

test('dash keeps run animation and observed endpoints, lingers and fades without changing simulation',()=>{
 const h=setup(),{renderer:r,sim:s}=h;
 try{
  s.cast('whip');s.now=.6;assert.ok(s.cast('step',Math.PI/2));
  const item=r.states.get(s.player),t=item.trail;assert.equal(t.x,0);assert.equal(t.z,0);
  for(let i=0;i<30;i++){s.step(idle);r.prepare(s,s.player);if(s.dash)assert.equal(item.animator.state,'run');}
  assert.ok(t.endX>0);assert.equal(t.endX,s.player.x);assert.equal(t.endZ,s.player.z);assert.notEqual(t.ended,null);
  const before=JSON.stringify(s.player),draws=[];r.drawEffect=(...args)=>draws.push(args);r.drawEffects({x:0,z:0},2,true);
  assert.equal(draws.length,1);assert.equal(draws[0][4],Math.hypot(t.endX-t.x,t.endZ-t.z));assert.ok(draws[0][8]>0&&draws[0][8]<1);
  assert.equal(JSON.stringify(s.player),before);
  for(let i=0;i<40;i++)s.step(idle);r.prepare(s,s.player);assert.equal(item.trail,null);
 }finally{h.close();}
});

test('ring reads existing AOE, projectiles read exact live position/direction and cast returns to locomotion',()=>{
 const h=setup(),{renderer:r,sim:s}=h;
 try{
  const draws=[];r.drawEffect=(...args)=>draws.push(args);
  s.cast('ring');r.prepare(s,s.player);r.drawEffects({x:0,z:0},2,true);
  assert.equal(draws[0][4],s.ability('ring').range*2);assert.equal(draws[0][1],s.player.x);assert.equal(draws[0][2],s.player.z);
  assert.ok(r.replacesEffect(s,'radial'));assert.equal(r.replacesEffect(s,'cone'),false);
  assert.equal(r.replacesEffect({definition:{id:'set'}},'radial'),false);
  s.cast('dragon',-Math.PI/2);s.step(idle);r.prepare(s,s.player);draws.length=0;r.drawEffects({x:0,z:0},2,false);
  const p=s.projectiles.items.find(p=>p.active&&p.type==='dragon');assert.equal(draws[0][1],p.x);assert.equal(draws[0][2],p.z);assert.equal(draws[0][3],p.angle);
  assert.equal(s.cast('blast'),false);assert.notEqual(r.states.get(s.player).animator.action?.state,'ability:blast');
  s.temporary.grant('blast',10,s.now);assert.ok(s.cast('blast',Math.PI/2));r.prepare(s,s.player);
  assert.equal(r.states.get(s.player).animator.state,'ability:blast');draws.length=0;r.drawEffects({x:0,z:0},2,false);
  const blast=draws.find(d=>d[0]===CHARACTER_VISUALS['kit-asher'].effects.blast);assert.ok(blast[1]>s.player.x);assert.equal(blast[6],0);
  for(let i=0;i<24;i++)s.step(idle);r.prepare(s,s.player);assert.equal(r.states.get(s.player).animator.state,'idle');
  s.step({moveX:1,moveZ:0});r.prepare(s,s.player);assert.equal(r.states.get(s.player).animator.state,'run');
  const before=JSON.stringify(s.player);drawCombat(new Proxy({}, {get:()=>()=>{}}),s,null,r);assert.equal(JSON.stringify(s.player),before);
 }finally{h.close();}
});