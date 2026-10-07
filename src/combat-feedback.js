// Presentation observer only. No damage, timing, AI, movement, or match-rule writes.
// Bounded buffers, simulation-time expiry; optional sound subscribers receive copies.
export const FEEDBACK_CONFIG=Object.freeze({maxEffects:48,maxNumbers:18,numberSeconds:.65,mergeSeconds:.16,hitSeconds:.22,noticeSeconds:1.6,lowHealth:.3,criticalHealth:.15,enabled:true});
export class CombatFeedback {
 constructor(config={}){this.config={...FEEDBACK_CONFIG,...config};this.listeners=new Set();this.visualListeners=new Set();this.reset();}
 reset(){this.effects=[];this.numbers=[];this.states=new Map();this.casts=new Map();this.ready=false;this.scoring=null;this.notice=null;this.incoming=null;this.now=0;}
 bind(sim){if(this.sim===sim)return;this.reset();this.sim=sim;for(const s of sim.match?sim.match.actors.map(a=>a.sim):[sim])s.feedback=this;}
 subscribeVisual(listener){this.visualListeners.add(listener);return ()=>this.visualListeners.delete(listener);}
 subscribe(listener){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
 signal(event){for(const fn of this.listeners)try{fn(Object.freeze({...event}));}catch{/* Audio/analytics must never interrupt gameplay. */}}
 effect(e){if(this.effects.length>=this.config.maxEffects)this.effects.shift();this.effects.push(e);}
 notify(text,time=this.now){this.notice={text,expires:time+this.config.noticeSeconds};}
 emit(e){for(const listener of this.visualListeners)try{listener(Object.freeze({type:'character-animation',event:e.type,time:e.time,source:e.source?.id,target:e.target?.id,ability:e.ability?.id,basic:!!e.ability?.basic}));}catch{/* Animation cannot interrupt combat. */}if(!this.config.enabled)return;const {source:s,target:t,ability:a,time}=e;const tier=a?.ultimate||a?.temporary?3:a?.basic?1:2;const color=s?.summonerId==='set'||a?.visual==='panther'?'#d1a2ff':s?.summonerId==='riven'||a?.visual==='scythe'||a?.visual==='wave'||a?.visual==='scream'?'#b9ffea':s?.kind==='monster'?'#e8c57d':'#ffbb66';
  if(e.type==='cast'){
   if(a.effect==='cone')this.casts.set(s.id,{ability:a,hit:false,at:time});
   if(a.ultimate){this.effect({kind:a.id==='death-scream'?'scream':'cast',x:s.x,z:s.z,range:a.id==='death-scream'?a.range:1,color,start:time,expires:time+(a.id==='death-scream'?.5:.3)});this.signal({type:'ultimate-cast',source:s.id,ability:a.id});}
   if(a.effect==='stance')this.signal({type:'stance-switch',source:s.id});
   return;
  }
  if(e.type==='miss'){if(s===this.sim?.player)this.notify(a.name+' · missed',time);this.signal({type:'miss',source:s.id,ability:a.id});return;}
  if(e.type!=='hit')return;
  const cast=this.casts.get(s?.id);if(cast&&cast.ability.id===a?.id)cast.hit=true;
  let n=this.numbers.find(n=>n.id===t.id&&time-n.started<=this.config.mergeSeconds);
  if(n){n.amount+=e.amount;n.tier=Math.max(n.tier,tier);}else{if(this.numbers.length>=this.config.maxNumbers)this.numbers.shift();this.numbers.push({id:t.id,x:t.x,z:t.z,amount:e.amount,tier,started:time,expires:time+this.config.numberSeconds});}
  if(!this.effects.some(f=>f.kind==='hit'&&f.id===t.id&&f.expires>time))this.effect({kind:'hit',id:t.id,x:t.x,z:t.z,color,tier,start:time,expires:time+this.config.hitSeconds});
  if(t===this.sim?.player)this.incoming={text:a?.name||s?.name||'Incoming hit',expires:time+1.1};
  this.signal({type:'hit',source:s?.id,target:t.id,ability:a?.id,amount:e.amount,tier});
  if(t.dead){this.effect({kind:t.eliminated?'elimination':'death',x:t.x,z:t.z,color:t.team===1?'#68dbc6':'#f68d9e',start:time,expires:time+.7});this.signal({type:t.kind==='monster'?'camp-defeated':t.eliminated?'elimination':'death',target:t.id});if(t.eliminated)this.notify((t.name||'Summoner')+' · OUT',time);}
 }
 update(sim){this.now=sim.now;const now=this.now;this.effects=this.effects.filter(e=>e.expires>now);this.numbers=this.numbers.filter(e=>e.expires>now);
  for(const [id,c]of this.casts)if(now-c.at>.04){if(!c.hit&&id===sim.player.id)this.notify(c.ability.name+' · missed');this.casts.delete(id);}
  const all=[sim.player,...sim.targets];for(const p of all){const old=this.states.get(p.id);const current={health:p.health,dead:p.dead,stance:null,mods:Object.fromEntries(Object.entries(p.modifiers||{}).filter(([k,v])=>k.startsWith('camp:')&&v.expires>now).map(([k,v])=>[k,v.expires])),attack:p.nextAttack,away:p.home?Math.hypot(p.x-p.home.x,p.z-p.home.z):0,at:now,ghost:old?.ghost??p.health};
   current.ghost=p.dead?p.health:Math.max(p.health,current.ghost-p.maxHealth*Math.min(.1,Math.max(0,now-(old?.at??now)))*1.5);
   if(p.kind==='monster'&&old&&!p.dead){if((current.away>.2&&old.away<=.2)||(current.attack>old.attack&&old.attack<=now)){this.effect({kind:'camp',id:p.id,x:p.x,z:p.z,text:'ENGAGED',color:'#eccd85',expires:now+.7});}if(old.health<p.maxHealth&&p.health===p.maxHealth&&current.away<.01){this.effect({kind:'camp',id:p.id,x:p.x,z:p.z,text:'RESET',color:'#adc8ad',expires:now+1});this.signal({type:'camp-reset',target:p.id});}}
   if(p===sim.player&&old)for(const [k,expires]of Object.entries(current.mods))if(old.mods[k]!==expires){const label=p.modifiers[k].label;this.notify(label+' acquired');this.signal({type:'buff-acquired',buff:k});}
   this.states.set(p.id,current);
  }
  const ult=sim.activeAbilities().find(a=>a.ultimate),ready=!sim.player.dead&&!!ult&&(!sim.match||sim.match.active&&sim.match.ultimateReady(sim))&&sim.cooldowns.ready(ult.id,now);
  if(ready&&!this.ready){this.readyAt=now;this.signal({type:'ultimate-ready',source:sim.player.id});}this.ready=ready;
  const score=sim.match?.rules.scoringTeam;if(score!==this.scoring){if(score)this.signal({type:'scoring',team:score});this.scoring=score;}
 }
 drawWorld(m){if(!this.config.enabled)return;for(const e of this.effects){const left=(e.expires-this.now),age=Math.max(0,this.now-(e.start??this.now));if(e.kind==='hit'){const radius=.25+age*(e.tier===3?3:2);m.ring(e.x,.8,e.z,radius,.04*e.tier,e.color,12);}else if(e.kind==='death'||e.kind==='elimination'){m.ring(e.x,.12,e.z,.5+age,.06,e.color,16);if(e.kind==='elimination'){m.box(e.x,.2,e.z,.9,.08,.1,e.color,Math.PI/4);m.box(e.x,.2,e.z,.9,.08,.1,e.color,-Math.PI/4);}}else if(e.kind==='scream'){for(let i=0;i<3;i++){const r=Math.min(e.range,Math.max(.2,(age/.5-i*.14)*e.range));m.ring(e.x,.2+i*.18,e.z,r,.065,e.color,32);}m.ring(e.x,.85,e.z,.7,.08,'#effffb',16);}else if(e.kind==='cast')m.ring(e.x,.18,e.z,.8+age,.07,e.color,16);}
  for(const p of [this.sim.player,...this.sim.targets])if(p.dead&&p.eliminated){m.box(p.x,.14,p.z,1,.03,.09,'#9e8188',Math.PI/4);m.box(p.x,.14,p.z,1,.03,.09,'#9e8188',-Math.PI/4);}else if(!p.dead){if((p.statuses.stun||0)>this.now){for(let i=0;i<3;i++){const a=this.now*3+i*2.094;m.disc(p.x+Math.cos(a)*.45,2,p.z+Math.sin(a)*.45,.09,'#ffe3a0',6);}}else if((p.statuses.slow||0)>this.now)m.ring(p.x,.13,p.z,p.radius+.14,.04,'#89cce0',16);}
 }
 drawHUD(c,camera,w,h){if(!this.config.enabled)return;c.save();c.textAlign='center';for(const n of this.numbers){const age=this.now-n.started,p=camera.project(n.x,3+age*.6,n.z,w,h);c.globalAlpha=Math.min(1,(n.expires-this.now)*4);c.font=`bold ${n.tier===3?19:n.tier===2?15:12}px Arial`;c.strokeStyle='#101c27';c.lineWidth=3;c.strokeText(Math.round(n.amount),p.x+13,p.y);c.fillStyle=n.tier===3?'#fff2bf':'#ffe1b5';c.fillText(Math.round(n.amount),p.x+13,p.y);}c.globalAlpha=1;
  for(const e of this.effects)if(e.kind==='camp'){const p=camera.project(e.x,2.7,e.z,w,h);c.font='bold 9px Arial';c.fillStyle=e.color;c.fillText(e.text,p.x,p.y);}
  const p=this.sim.player,health=p.health/p.maxHealth;if(!p.dead&&health<=this.config.criticalHealth){c.strokeStyle='#bd554e70';c.lineWidth=3;c.strokeRect(1,1,w-2,h-2);}c.restore();
 }
 presentUI(){const s=this.sim,p=s.player,now=this.now;const stun=Math.max(0,(p.statuses.stun||0)-now),slow=Math.max(0,(p.statuses.slow||0)-now);document.getElementById('feedback-state').textContent=p.dead?'':stun?'STUNNED '+stun.toFixed(1)+'s':slow?'SLOWED '+slow.toFixed(1)+'s':'';
  document.getElementById('incoming-hit').textContent=this.incoming?.expires>now?this.incoming.text:'';
  document.getElementById('feedback-message').textContent=this.notice?.expires>now?this.notice.text:'';
  const fill=document.getElementById('health-fill');fill.style.background=p.health/p.maxHealth<=this.config.criticalHealth?'#bc5148':p.health/p.maxHealth<=this.config.lowHealth?'#9e763a':'#287e68';
  const button=document.getElementById('ability-bar');button.classList.toggle('ultimate-notice',this.ready&&now-this.readyAt<.8);
 }
}