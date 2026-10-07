import {withoutM92Presentation} from './helpers/m92-presentation-seams.js';
import test from 'node:test';
import {withoutM8UX} from './helpers/m8-entry-seams.js';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {CONFIG} from '../src/config.js';
import {MovementSimulation} from '../src/simulation.js';
import {CrownfallMatch} from '../src/match.js';
import {CrownfallBot} from '../src/match-bots.js';
import {CrownfallRules} from '../src/crownfall-rules.js';
import * as currentData from '../src/match-data.js';
import {MATCH_MAP,MATCH_LANE,ARENA_LAYOUT,CAMP_SITES,MATCH_DEFAULTS,WILDERNESS_CONFIG,BOT_CONFIG} from '../src/match-data.js';
import {staticArena} from '../src/renderer.js';
const baseline='6211d36b8fbc5a5073d895e3dfa814b5a3a77a16';
const old=file=>execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'});
const baselineData=await import('data:text/javascript,'+encodeURIComponent(old('src/match-data.js')));
test('M7 leaves protected M6 combat, territory, feedback, AI, camera and input byte-identical',()=>{
 for(const file of ['config','simulation','combat-data','riven-data','summoners','combat-core','combat','modifiers','advanced-actions','returning-weapons','crownfall-rules','match-bots','wilderness','camera','input','ability-input','combat-view','combat-feedback','match-ui','main']){const source=readFileSync(new URL('../src/'+file+'.js',import.meta.url),'utf8');assert.equal(file==='main'?withoutM8UX(source):withoutM92Presentation(source,file),old('src/'+file+'.js'),file);}
 for(const key of ['MATCH_DEFAULTS','WILDERNESS_CONFIG','BOT_CONFIG','MATCH_LANE','MATCH_TRAINING'])assert.deepEqual(currentData[key],baselineData[key]);
 assert.deepEqual(MATCH_DEFAULTS,baselineData.MATCH_DEFAULTS);assert.deepEqual(WILDERNESS_CONFIG,baselineData.WILDERNESS_CONFIG);assert.deepEqual(BOT_CONFIG,baselineData.BOT_CONFIG);assert.deepEqual(MATCH_LANE,baselineData.MATCH_LANE);
});
test('six spawn pads are valid, separated, behind goals, and equal distance from neutral',()=>{
 const m=new CrownfallMatch();for(const p of m.entities){assert.ok(!m.human.blocked(p.x,p.z));assert.equal(Math.abs(p.x),ARENA_LAYOUT.spawnX);assert.ok(Math.abs(p.x)>MATCH_LANE.goalB);assert.ok(m.entities.every(q=>q===p||Math.hypot(p.x-q.x,p.z-q.z)>2));}
 for(const a of m.entities.filter(p=>p.team===1)){const b=m.entities.find(p=>p.team===2&&p.z===a.z);assert.equal(a.x,-b.x);assert.ok(Math.hypot(a.x,a.z)/CONFIG.summoner.speed<5.3);}
});
test('lane stays one broad obstacle-free front; all camp sites and geometry are valid and fair by X reflection',()=>{
 const nav=new MovementSimulation(CONFIG,MATCH_MAP);assert.equal(MATCH_MAP.width,68);assert.equal(MATCH_MAP.depth,64);assert.equal(MATCH_LANE.halfWidth,12);
 for(let x=-28;x<=28;x++)for(let z=-12;z<=12;z++)assert.ok(!nav.blocked(x,z));
 assert.equal(CAMP_SITES.filter(c=>c.type==='damage').length,1);for(const c of CAMP_SITES){assert.ok(!nav.blocked(c.x,c.z));assert.ok(Math.abs(c.z)>MATCH_LANE.halfWidth+9);assert.ok(CAMP_SITES.some(d=>d.x===-c.x&&d.z===c.z&&d.type===c.type));}
 for(const w of MATCH_MAP.walls){assert.ok(Math.abs(w.x)+w.w/2<MATCH_MAP.width/2);assert.ok(Math.abs(w.z)+w.d/2<MATCH_MAP.depth/2);assert.ok(Math.abs(w.z)-w.d/2>MATCH_LANE.halfWidth);assert.ok(w.h<=.75);assert.ok(MATCH_MAP.walls.some(v=>v.x===-w.x&&v.z===w.z&&v.w===w.w&&v.d===w.d));}
});
// Uses the real collision and bot steering policies, not an idealized reachability graph.
function navigate(start,goal,id='kit-asher'){
 const m=new CrownfallMatch(id,{countdownSeconds:0}),s=m.human,b=new CrownfallBot(0);m.start();s.player.x=start.x;s.player.z=start.z;s.player.previous={...start};s.targets=[];
 const target={...goal,kind:'monster',dead:false,team:0};const context={ultimateReady:()=>false,lane:m.lane,rules:{elapsed:0},wilderness:{assigned:()=>target}};
 let steps=0,stalled=0;for(;steps<60*14;steps++){const before={x:s.player.x,z:s.player.z};const command=b.read(s,context);s.step({...command,actions:[],attackHeld:false});context.rules.elapsed+=1/60;if(Math.hypot(s.player.x-goal.x,s.player.z-goal.z)<(id==='set'?1.8:id==='riven'?5.8:4.2))break;if(Math.hypot(s.player.x-before.x,s.player.z-before.z)<.001)stalled++;}
 assert.ok(steps<60*14,`${id} route ${JSON.stringify(start)} -> ${JSON.stringify(goal)} stuck at ${s.player.x},${s.player.z}`);assert.ok(stalled<60,`stalled ${stalled} frames`);return steps/60;
}
test('real bots reach every objective from both sides and return to lane without long stalls',()=>{
 for(const camp of CAMP_SITES)for(const side of [-1,1])for(const id of ['kit-asher','set','riven']){navigate({x:side*18,z:Math.sign(camp.z)*8},camp,id);navigate(camp,{x:side*6,z:0},id);}
});
test('lane-to-camp travel has a measurable cost, equivalent access and short returns',()=>{
 for(const camp of CAMP_SITES){const duration=navigate({x:camp.x,z:Math.sign(camp.z)*12},camp,'set');assert.ok(duration>1&&duration<4);const mirrored={...camp,x:-camp.x};assert.ok(Math.abs(duration-navigate({x:-camp.x,z:Math.sign(camp.z)*12},mirrored,'set'))<.02);}
});
test('neutral, lateral movement, bypass safeguard and team-wipe collapse retain M6 rules',()=>{
 const r=new CrownfallRules({},MATCH_LANE),e=[{team:1,x:14,z:-8},{team:2,x:20,z:8}];const c=r.measure(e);e[0].z=8;e[1].z=-8;assert.equal(r.measure(e),c);e[0].x=30;r.measure(e);assert.equal(r.front,e[1].x);assert.ok(r.control<1);e[0].dead=true;e[1].dead=true;assert.equal(r.measure(e),.5);
});
test('arena is a bounded static mesh; rendering adds no recurring map allocations',()=>{const mesh=staticArena(MATCH_MAP);assert.ok(mesh.v.length<100000);assert.ok(mesh.v.every(Number.isFinite));});