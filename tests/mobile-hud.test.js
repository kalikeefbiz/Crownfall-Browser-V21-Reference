import test from 'node:test';
import assert from 'node:assert/strict';
import {MobileHUD} from '../src/hud-presentation.js';
import {AbilityInput} from '../src/ability-input.js';
import {InputController} from '../src/input.js';
import {CrownfallMatch} from '../src/match.js';
import {MatchHUD} from '../src/match-ui.js';
class Element {
 constructor(rect={left:0,top:0,width:56,height:56}){this.rect=rect;this.handlers={};this.children=[];this.parts={};this.dataset={};this.attrs={};this.props={};this.flags=new Set();this.capture=new Set();this.hidden=false;this.textContent='';this.style={setProperty:(k,v)=>this.props[k]=v};this.classList={toggle:(k,v)=>v?this.flags.add(k):this.flags.delete(k),add:k=>this.flags.add(k),remove:k=>this.flags.delete(k)};}
 addEventListener(k,f){(this.handlers[k]??=[]).push(f);}emit(k,e={}){for(const f of this.handlers[k]||[])f({preventDefault(){},...e});}
 setAttribute(k,v){this.attrs[k]=v;}querySelector(k){return this.parts[k]??=new Element();}append(n){this.children.push(n);}getBoundingClientRect(){return this.rect;}
 setPointerCapture(id){this.capture.add(id);}hasPointerCapture(id){return this.capture.has(id);}releasePointerCapture(id){this.capture.delete(id);}
}
function setup(id='kit-asher'){
 const nodes=new Map();globalThis.document=new Element();globalThis.window=new Element();document.createElement=()=>new Element();document.getElementById=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 const match=new CrownfallMatch(id,{countdownSeconds:0}),input=new InputController();match.start();const sim=match.human,buttons=new AbilityInput(input,()=>sim.player.angle,sim.definition),hud=new MobileHUD(),matchHUD=new MatchHUD();
 const update=now=>{buttons.update(sim);matchHUD.update(match);hud.update(sim,buttons,false,now);};return {nodes,match,sim,input,buttons,hud,update};
}
test('HUD reads health, Ultimate progress/readiness and camps without changing simulation or queued actions',()=>{
 const {nodes,sim,match,buttons,update}=setup();sim.player.health=720;sim.player.ultimateMeter=32;sim.player.modifiers.mobility={label:'Mobility',expires:20,speedBonus:.2};const before=JSON.stringify(match.snapshot());update(1000);assert.equal(JSON.stringify(match.snapshot()),before);assert.deepEqual(buttons.read(),{actions:[],attackHeld:false});assert.equal(nodes.get('health-value').textContent,'720/845');assert.match(nodes.get('buff-status').textContent,/Mobility 20s/);const ult=buttons.buttons.get('dragon');assert.equal(ult.querySelector('.cooldown').textContent,'32%');assert.equal(ult.props['--charge'],'32%');assert.equal(ult.flags.has('ultimate-ready'),false);
 sim.player.ultimateMeter=100;update(1100);assert.equal(ult.querySelector('span').textContent,'READY');assert.equal(ult.flags.has('ultimate-ready'),true);sim.cast('dragon');update(1200);assert.equal(ult.flags.has('ultimate-ready'),false);assert.equal(ult.props['--charge'],'0%');assert.ok(Number(ult.querySelector('.cooldown').textContent)>0);
});
test('both Riven stances stay readable while shared AMP cooldown and switch input are preserved',()=>{
 const {nodes,sim,buttons,update}=setup('riven');update(0);assert.equal(buttons.buttons.get('stance').querySelector('span').textContent,'STANCE');assert.equal(nodes.get('current-stance').textContent,'RESO BLADES');sim.cast('amp');const b=buttons.buttons.get('stance');b.emit('pointerdown',{pointerId:3,clientX:30,clientY:30});b.emit('pointerup',{pointerId:3});for(const a of buttons.read().actions)sim.cast(a.id,a.angle);update(10);assert.equal(buttons.buttons.get('stance').querySelector('span').textContent,'STANCE');assert.equal(nodes.get('current-stance').textContent,'PERCUSSIVE PULSE');assert.equal(buttons.buttons.get('amp').querySelector('.cooldown').textContent,'6.0');assert.ok(buttons.buttons.has('pulse'));assert.ok(buttons.buttons.has('percussive-solo'));assert.equal(buttons.buttons.get('stance').querySelector('.cooldown').textContent,'3.0');
});
test('moved/resized joysticks and skill target support three independent fingers',()=>{
 const {nodes,input,buttons,update}=setup();update(0);const move=nodes.get('move-stick'),aim=nodes.get('aim-stick');move.rect={left:28,top:265,width:92,height:92};aim.rect={left:567,top:265,width:92,height:92};move.emit('pointerdown',{pointerId:11,clientX:110,clientY:311});aim.emit('pointerdown',{pointerId:12,clientX:613,clientY:275});const step=buttons.buttons.get('step');step.emit('pointerdown',{pointerId:13,clientX:460,clientY:270});step.emit('pointermove',{pointerId:13,clientX:495,clientY:250});assert.equal(input.read().moveX,1);assert.equal(input.read().aiming,true);step.emit('pointerup',{pointerId:13});assert.equal(buttons.read().actions.length,1);assert.equal(buttons.read().actions.length,0);assert.equal(input.read().moveX,1);assert.equal(input.read().aiming,true);aim.emit('pointercancel',{pointerId:12});assert.equal(input.read().moveX,1);move.emit('pointerup',{pointerId:11});assert.equal(input.read().moveX,0);
});
test('event feed expires, identical later eliminations reappear, and rematch clears stale messages',()=>{
 const {nodes,match,update,hud}=setup();update(0);assert.equal(nodes.get('match-feed').hidden,true);match.feed.unshift('Kit Asher defeated Set');match.actors[0].record.deaths=1;update(10);assert.equal(nodes.get('match-feed').hidden,false);update(3100);assert.ok(Number(nodes.get('match-feed').style.opacity)<1);update(3600);assert.equal(nodes.get('match-feed').hidden,true);match.actors[0].record.deaths++;update(4000);assert.equal(nodes.get('match-feed').hidden,false);
 const next=new CrownfallMatch();hud.update(next.human,new AbilityInput({enabled:true},()=>0,next.human.definition),false,4010);assert.equal(nodes.get('match-feed').hidden,true);
});
test('all Wilderness buffs and individual final-life states remain available in compact displays',()=>{
 const {sim,match,nodes,update}=setup('set');for(const label of ['Mobility','Cooldown','Defense','Damage'])sim.player.modifiers[label]={label,expires:20};match.rules.tickets[1]=0;const team=match.entities.filter(p=>p.team===1);team[1].finalRespawnAvailable=false;team[2].eliminated=true;update(0);for(const label of ['Mobility','Cooldown','Defense','Damage'])assert.match(nodes.get('buff-status').textContent,new RegExp(label+' 20s'));const final=nodes.get('final-lives').textContent;assert.match(final,/1 RESPAWN/);assert.match(final,/LAST LIFE/);assert.match(final,/OUT/);match.rules.elapsed=21;update(21000);assert.equal(nodes.get('buff-status').textContent,'');
});