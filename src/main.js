import {GameUX} from './game-ux.js';
import {SUMMONERS} from './summoners.js';
import {CONFIG} from './config.js';
import {LocalCommandSource} from './simulation.js';
import {InputController} from './input.js';
import {FollowCamera} from './camera.js';
import {ArenaRenderer} from './renderer.js';
import {CombatFeedback} from './combat-feedback.js';
import {MobileHUD} from './hud-presentation.js';
import {SandboxHUD} from './ui.js';
import {CombatSimulation} from './combat.js';
import {AbilityInput} from './ability-input.js';
import {CombatHUD} from './combat-view.js';
import {CrownfallMatch} from './match.js';
import {MatchHUD,readMatchSettings} from './match-ui.js';
try {
 let mode='match',match=new CrownfallMatch(),sim=match.human;
 const input=new InputController(),source=new LocalCommandSource(input),camera=new FollowCamera(sim.player),renderer=new ArenaRenderer(document.getElementById('arena')),hud=new SandboxHUD();
 const abilities=new AbilityInput(input,()=>sim.player.angle),combatHUD=new CombatHUD(),matchHUD=new MatchHUD(),mobileHUD=new MobileHUD(),feedback=new CombatFeedback();
 let paused=true,last=performance.now(),acc=0,frames=60,started=false;
 const overlay=document.getElementById('menu'),start=document.getElementById('start'),chooser=document.getElementById('summoner'),modeSelect=document.getElementById('mode');
 function pause(value){paused=value;input.enabled=!value&&!match?.rules.result;input.clear();abilities.clear();acc=0;overlay.hidden=!value||!!match?.rules.result;document.getElementById('pause').setAttribute('aria-label',value?'Resume':'Pause');}
 function syncMenu(){const station=document.getElementById('station');station.innerHTML='';for(const area of sim.training.stations){const o=document.createElement('option');o.value=area.id;o.textContent=area.name;station.append(o);}station.value='dash';document.getElementById('summoner-name').textContent=SUMMONERS.find(e=>e.definition.id===sim.definition.id)?.name||'Kit Asher';document.getElementById('damage-pulse').hidden=mode!=='training'||sim.definition.id!=='set';document.getElementById('training-options').hidden=mode!=='training';document.getElementById('match-settings').hidden=mode!=='match';document.getElementById('mode-title').textContent=mode==='match'?'UCL 3v3 Crownfall.':'combat training.';document.getElementById('reset').textContent=mode==='match'?'New match':'Reset training';chooser.disabled=mode==='match'&&started&&!match?.rules.result;document.body?.classList.toggle('in-match',mode==='match');}
 function prepare(){const entry=SUMMONERS.find(v=>v.definition.id===chooser.value)||SUMMONERS[0];match=mode==='match'?new CrownfallMatch(entry.definition.id,readMatchSettings()):null;sim=match?match.human:new CombatSimulation(entry.definition,entry.training);if(!match&&entry.definition.id==='set')sim.station('dash');abilities.setDefinition(entry.definition);camera.snap(sim.player);input.clear();acc=0;started=false;document.getElementById('target-fire').checked=false;document.getElementById('results').hidden=true;start.textContent=match?'START CROWNFALL':'ENTER TRAINING';syncMenu();pause(true);}
 for(const entry of SUMMONERS){const o=document.createElement('option');o.value=entry.definition.id;o.textContent=entry.name;chooser.append(o);}chooser.value=sim.definition.id;modeSelect.value=mode;
 start.onclick=()=>{start.blur();if(!started&&mode==='match'){const selected=chooser.value;match=new CrownfallMatch(selected,readMatchSettings());sim=match.human;abilities.setDefinition(sim.definition);camera.snap(sim.player);}match?.start();started=true;start.textContent=mode==='match'?'RESUME MATCH':'RESUME TRAINING';syncMenu();pause(false);};
 document.getElementById('pause').onclick=()=>{if(!match?.rules.result)pause(!paused);};
 document.getElementById('reset').onclick=()=>prepare();
 chooser.onchange=()=>{if(mode==='match'&&started&&!match?.rules.result)return;prepare();};
 modeSelect.onchange=e=>{mode=e.target.value==='training'?'training':'match';prepare();};
 document.getElementById('damage-pulse').onclick=()=>{if(!match)sim.damagePulse();};
 document.getElementById('reset-targets').onclick=()=>{if(match)return;sim.resetTargets();sim.advanced.cancel();sim.refreshAura();sim.projectiles.items.forEach(p=>p.active=false);sim.weapons.reset();sim.zones=[];};
 document.getElementById('station').onchange=e=>{if(!match){sim.station(e.target.value);camera.snap(sim.player);}};
 document.getElementById('target-fire').onchange=e=>{if(!match)sim.targetFire=e.target.checked;};
 document.getElementById('quality').onchange=e=>renderer.quality=e.target.value;
 document.getElementById('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{document.getElementById('fullscreen').textContent='Use browser full screen';}};
 document.getElementById('play-again').onclick=()=>{prepare();start.onclick();};document.getElementById('back-menu').onclick=()=>prepare();
 window.addEventListener('keydown',e=>{if(e.code==='Escape'&&started&&!match?.rules.result)pause(!paused);});
 window.addEventListener('blur',()=>{if(started)pause(true);});
 window.matchMedia('(orientation: portrait)').addEventListener('change',e=>{if(e.matches&&started)pause(true);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)pause(true);});
 document.getElementById('arena').addEventListener('webglcontextlost',e=>{e.preventDefault();pause(true);document.getElementById('fatal').hidden=false;document.getElementById('fatal').textContent='Graphics context lost. Reload to restart.';});
 syncMenu();pause(true);
 const ux=new GameUX({getState:()=>({match,sim,started,paused}),input,abilities});
 function frame(now){ux.beforeFrame();if(!ux.rendersArena){last=now;acc=0;ux.afterFrame(now);requestAnimationFrame(frame);return;}const elapsed=Math.min((now-last)/1000,CONFIG.maxFrameDelta);last=now;frames+=((1/Math.max(elapsed,.001))-frames)*.05;
   feedback.bind(sim);
   const command=source.read(sim.tick);if(abilities.preview?.ability.basic&&!abilities.active?.dragged)abilities.preview.angle=command.aiming?Math.atan2(command.aimX,command.aimZ):sim.player.angle;
   if(abilities.preview&&(!abilities.preview.ability.basic||abilities.active?.dragged)&&!['radial','self','ground'].includes(abilities.preview.ability.aim)&&!abilities.preview.cancel){command.aiming=true;command.aimX=Math.sin(abilities.preview.angle);command.aimZ=Math.cos(abilities.preview.angle);}
   if(!paused){acc+=elapsed;while(acc>=1/CONFIG.tickRate){const cmd={...command,...abilities.read()};if(match?.phase==='countdown')abilities.clear();if(match)match.step(cmd);else sim.step(cmd);acc-=1/CONFIG.tickRate;if(match?.rules.result){pause(true);break;}}}
   const alpha=paused?1:acc*CONFIG.tickRate,p={...sim.player,x:sim.player.previous.x+(sim.player.x-sim.player.previous.x)*alpha,z:sim.player.previous.z+(sim.player.z-sim.player.previous.z)*alpha};
   feedback.update(sim);camera.update(p,elapsed);renderer.render(p,camera,now/1000,!paused&&command.aiming,sim,abilities.preview);hud.update(p,camera,now,frames,match);abilities.update(sim);combatHUD.update(sim,camera,abilities.preview);matchHUD.update(match);mobileHUD.update(sim,abilities,paused,now);feedback.presentUI();ux.afterFrame(now);requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 window.crownfallFeedback={subscribe:listener=>feedback.subscribe(listener)};
 window.crownfallDebug=()=>({ux:ux.state,tick:sim.tick,mode,match:match?.snapshot()||null,player:{...sim.player,previous:{...sim.player.previous}},paused,input:input.read(),camera:{x:camera.x,z:camera.z},quality:renderer.quality,combat:{summoner:sim.definition.id,stance:sim.stance,scythes:sim.weapons.blades.map(b=>({phase:b.phase,x:b.x,z:b.z})),outgoingHits:sim.weapons.outgoingHits,auraAllies:sim.auraAllies.length,modifiers:{...sim.player.modifiers},leaping:!!sim.advanced.leap,sequencing:!!sim.advanced.sequence,impacts:sim.advanced.impacts.map(i=>({x:i.x,z:i.z,at:i.at})),now:sim.now,streak:sim.streak,combo:sim.combo,temporary:[...sim.temporary.grants.values()],stats:{...sim.stats},targets:sim.targets.map(t=>({id:t.id,x:t.x,z:t.z,health:t.health,dead:t.dead,statuses:{...t.statuses}}))}});
} catch(error){const box=document.getElementById('fatal');box.hidden=false;box.textContent=error.message;console.error(error);}