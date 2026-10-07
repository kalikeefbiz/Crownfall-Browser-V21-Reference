// Presentation only: reads existing simulation/control state; never queues actions.
// Positions, scale and opacity belong to CSS, independent of action IDs/bindings.
export class MobileHUD {
 constructor(){this.sim=null;this.event='';this.eventUntil=0;this.feedCount=0;this.feedUntil=0;}
 update(sim,abilities,paused,now){
  if(this.sim!==sim){this.sim=sim;this.event='';this.eventUntil=0;this.feedCount=0;this.feedUntil=0;}
  const p=sim.player,match=sim.match;
  document.getElementById('health-fill').style.width=Math.max(0,p.health/p.maxHealth*100)+'%';
  document.getElementById('health-value').textContent=`${Math.ceil(p.health)}/${p.maxHealth}`;
  document.getElementById('player-state').textContent=p.dead?(Number.isFinite(p.respawnAt)?`Respawn ${Math.max(0,Math.ceil(p.respawnAt-sim.now))}s`:'Eliminated'):match?.protected(p)?'Protected':sim.definition.id==='kit-asher'&&sim.inWilderness?'Inner Flame +5%':sim.definition.id==='set'?(sim.auraAllies.length?'Presence · 2% guard':'Presence · no allies'):'';
  const stance=document.getElementById('current-stance');stance.hidden=sim.definition.id!=='riven';stance.textContent=sim.definition.id==='riven'?sim.definition.stances[sim.stance].name.toUpperCase():'';
  for(const [id,button] of abilities.buttons){const a=sim.ability(id),remaining=sim.cooldowns.remaining(a.cooldownKey||id,sim.now),isUlt=!!a.ultimate,ready=isUlt&&(!match||match.ultimateReady(sim))&&remaining<=0&&!p.dead&&(!match||match.active);
   button.classList.toggle('ultimate-control',isUlt);button.classList.toggle('ultimate-ready',ready);
   button.style.setProperty('--charge',(match?p.ultimateMeter:100)+'%');
   const label=button.querySelector('span');
   if(id==='stance'){label.textContent='STANCE';button.setAttribute('aria-label','Switch stance · '+sim.definition.stances[sim.stance].name);}
   if(isUlt){label.textContent=ready?'READY':a.short;button.setAttribute('aria-label',a.name+(match?` · ${Math.floor(p.ultimateMeter)}%`:'')+(ready?' · Ready':''));}
   // Retain cooldown text; put character-specific information in existing controls.
   const icon=button.querySelector('strong');
   if(id==='step')icon.textContent='●'.repeat(sim.streak)+'○'.repeat(2-sim.streak);
   if(id==='reso')icon.textContent=sim.weapons.returning?'↶':sim.weapons.next===2?'↶':String(sim.weapons.next+1);
   if(id==='stance')icon.textContent=sim.stance==='reso'?'ϟ':'◎';
   if(a.effect==='buff'){const mod=p.modifiers?.[id];label.textContent=mod?.expires>sim.now?`${a.short} ${Math.ceil(mod.expires-sim.now)}s`:a.short;}
  }
  // Wall-clock lifetime is UI-only; no mutations to simulation event history.
  if(sim.lastEvent!==this.event){this.event=sim.lastEvent;this.eventUntil=now+2200;}
  const event=document.getElementById('combat-event');event.hidden=!!match||(!abilities.preview?.cancel&&now>this.eventUntil);event.style.opacity=abilities.preview?.cancel?'1':String(Math.min(1,Math.max(0,(this.eventUntil-now)/500)));
  if(match){const count=match.actors.reduce((n,a)=>n+a.record.deaths,0);if(count!==this.feedCount){this.feedCount=count;this.feedUntil=now+3500;}}
  const feed=document.getElementById('match-feed');feed.hidden=!match||now>=this.feedUntil;feed.style.opacity=String(Math.min(1,Math.max(0,(this.feedUntil-now)/700)));
 }
}