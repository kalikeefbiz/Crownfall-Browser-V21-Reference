import {beforeReadability} from './helpers/controlled-feel-seams.js';
import test from 'node:test';
import {withoutPantherFist} from './helpers/panther-fist-seams.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CHARACTER_VISUALS} from '../src/character-visuals.js';
import {CharacterRenderer} from '../src/character-renderer.js';
import {CombatSimulation} from '../src/combat.js';
import {CombatFeedback} from '../src/combat-feedback.js';
import {SET} from '../src/summoners.js';

test('Set additions retain baseline registration, run, Kit, Riven and all runtime logic',async()=>{
 const source=execFileSync('git',['show','d8109a1:src/character-visuals.js'],{encoding:'utf8'});
 const old=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const current=beforeReadability(CHARACTER_VISUALS);
 current.riven=old.CHARACTER_VISUALS.riven; // Approved idle/run addition checked in riven-art tests.
 delete current.set.effects;
 delete current.set.animations['contact:predatory'];
 for(const key of ['idle','basic','ability:warcry'])delete current.set.animations[key];
 assert.deepEqual(current,old.CHARACTER_VISUALS);
 for(const file of fs.readdirSync('src').filter(n=>n.endsWith('.js')&&n!=='character-visuals.js'))
  assert.equal(withoutPantherFist(fs.readFileSync('src/'+file,'utf8'),file.slice(0,-3)),execFileSync('git',['show','d8109a1:src/'+file],{encoding:'utf8'}),file);
});

test('eight Set action sources are packaged unchanged with explicit JPEG matte or PNG alpha',()=>{
 for(const [state,count,folder] of [['idle',1,'idle'],['basic',4,'basic'],['ability:warcry',3,'war-cry']]){
  const clip=CHARACTER_VISUALS.set.animations[state];assert.equal(clip.frames.length,count);
  assert.equal(clip.loop,state==='idle');assert.equal(clip.fps,state==='idle'?1:12);
  clip.frames.forEach((frame,i)=>{
   assert.equal(frame.src,`assets/characters/set/${folder}/${String(i).padStart(3,'0')}.png`);
   const bytes=fs.readFileSync(frame.src);assert.deepEqual(fs.readFileSync('dist/'+frame.src),bytes);
   if(bytes[0]===255){assert.equal(bytes[1],216);assert.deepEqual(frame.matte,{low:.88,high:.98});}
   else{assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.equal(frame.matte,undefined);}
  });
 }
});

test('existing Set cast hooks render basic and war cry once in order then resume idle or run',()=>{
 const old=globalThis.Image;
 const gl=new Proxy({}, {get:(_,k)=>k==='getParameter'?()=>2048:k==='getShaderParameter'||k==='getProgramParameter'?()=>true:k==='getUniformLocation'?(_,n)=>n:k==='getAttribLocation'?()=>0:/^[A-Z_0-9]+$/.test(k)?k:()=>({})});
 globalThis.Image=class{constructor(){this.width=1223;this.height=1286;}set src(v){this.onload();}};
 try{for(const movement of ['idle','run'])for(const [id,state,count] of [['claw','basic',4],['warcry','ability:warcry',3]]){
  const r=new CharacterRenderer(gl),s=new CombatSimulation(SET),feedback=new CombatFeedback();feedback.bind(s);
  s.player.animation=movement;r.prepare(s,s.player);assert.equal(r.states.get(s.player).animator.state,movement);
  assert.ok(s.cast(id));const a=r.states.get(s.player).animator,action=a.action;
  assert.equal(s.cast(id),false);assert.equal(a.action,action);
  const before=JSON.stringify(s.player);
  for(let i=0;i<count;i++){s.now=i/12;r.prepare(s,s.player);assert.equal(a.state,state);assert.equal(a.frame,i);assert.ok(r.replaces(s.player));r.drawSprites({x:0,z:0},2);}
  assert.equal(JSON.stringify(s.player),before);
  s.player.animation=movement;s.now=count/12;r.prepare(s,s.player);assert.equal(a.state,movement);assert.equal(a.action,null);r.dispose();
 }}finally{if(old===undefined)delete globalThis.Image;else globalThis.Image=old;}
});