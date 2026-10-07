import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {withoutControlledFeel} from './helpers/controlled-feel-seams.js';
import {CHARACTER_VISUALS,characterRect} from '../src/character-visuals.js';
test('controlled feel changes only reviewed input and presentation, retaining all art and gameplay',()=>{
 for(const file of [...fs.readdirSync('src').filter(n=>n.endsWith('.js')).map(n=>'src/'+n),'style.css','index.html'])
  assert.equal(withoutControlledFeel(fs.readFileSync(file,'utf8'),file),execFileSync('git',['show','a84e78f:'+file],{encoding:'utf8'}),file);
 for(const file of execFileSync('git',['ls-tree','-r','--name-only','a84e78f','assets'],{encoding:'utf8'}).trim().split('\n'))
  assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show','a84e78f:'+file],{maxBuffer:16*1024*1024}));
});
test('all three sprite registrations grow proportionally with unchanged pivots and frame data',async()=>{
 const source=execFileSync('git',['show','a84e78f:src/character-visuals.js'],{encoding:'utf8'});
 const old=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).CHARACTER_VISUALS;
 for(const id of ['kit-asher','set','riven']){
  const d=CHARACTER_VISUALS[id],b=old[id];assert.ok(Math.abs(d.scale/b.scale-1.3)<1e-10);assert.deepEqual(d.animations,b.animations);assert.deepEqual(d.anchor,b.anchor);assert.deepEqual(d.effects,b.effects);
  for(const clip of Object.values(d.animations))for(const frame of clip.frames){const rect=characterRect(d,clip,frame,1),prior=characterRect(b,clip,frame,1);assert.ok(Math.abs(rect.bottom-prior.bottom*1.3)<1e-10);}
 }
});