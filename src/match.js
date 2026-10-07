import {CONFIG} from './config.js';
import {Wilderness} from './wilderness.js';
import {CombatSimulation} from './combat.js';
import {SUMMONERS} from './summoners.js';
import {MATCH_TRAINING,BOT_CONFIG,MATCH_MAP,MATCH_LANE,ARENA_LAYOUT} from './match-data.js';
import {CrownfallRules} from './crownfall-rules.js';
import {CrownfallBot} from './match-bots.js';
import {respawn} from './combat-core.js';
// One local authority owns teams, lifecycle and victory. Every actor runs the existing combat engine.
export class CrownfallMatch {
 constructor(selected='kit-asher',settings={}){this.map=MATCH_MAP;this.lane=MATCH_LANE;this.rules=new CrownfallRules(settings,this.lane);this.actors=[];this.damageLog=new Map();this.feed=[];this.tick=0;this.phase='prematch';this.countdownRemaining=this.rules.settings.countdownSeconds;
  const chosen=SUMMONERS.find(s=>s.definition.id===selected)||SUMMONERS[0],blue=[chosen,...SUMMONERS.filter(s=>s!==chosen)],red=SUMMONERS;
  for(const team of [1,2])for(let slot=0;slot<3;slot++){const entry=(team===1?blue:red)[slot],sim=new CombatSimulation(entry.definition,MATCH_TRAINING,CONFIG,this.map);sim.match=this;const p=sim.player;p.maxHealth=p.health=Math.round(p.maxHealth*this.rules.settings.durabilityMultiplier);p.finalRespawnAvailable=true;p.eliminated=false;p.ultimateMeter=0;p.protectedUntil=0;p.id=`${team}-${slot}`;p.team=team;p.name=entry.name;p.summonerId=entry.definition.id;p.spawn={x:(team===1?-1:1)*ARENA_LAYOUT.spawnX,z:ARENA_LAYOUT.spawnOffsets[slot]};Object.assign(p,p.spawn);p.previous={...p.spawn};p.angle=team===1?Math.PI/2:-Math.PI/2;sim.weapons.reset();this.actors.push({sim,bot:team===1&&slot===0?null:new CrownfallBot(slot+team*3),record:{kills:0,deaths:0,assists:0,damage:0,pressureSeconds:0}});}
  this.entities=this.actors.map(a=>a.sim.player);this.wilderness=new Wilderness(this);for(const actor of this.actors)actor.sim.targets=[...this.entities.filter(p=>p!==actor.sim.player),...this.wilderness.camps];this.human=this.actors[0].sim;this.refreshAuras();
 }
 start(){if(this.phase==='prematch')this.phase=this.countdownRemaining>0?'countdown':'active';}
 get active(){return this.phase==='active'&&!this.rules.result;}
 protected(p){return this.active&&p.protectedUntil>this.rules.elapsed;}
 ultimateReady(sim){return sim.player.ultimateMeter>=100;}
 allowCast(sim,a){return this.active&&(!a.ultimate||this.ultimateReady(sim));}
 onCast(sim,a){if(a.ultimate)sim.player.ultimateMeter=0;if(!['buff','stance'].includes(a.effect))sim.player.protectedUntil=0;}
 refreshAuras(){for(const {sim}of this.actors)sim.refreshAura();}
 recordDamage(sim,target,amount,source){if(!this.active)return;if(target.kind==='monster'){this.wilderness.onDamage(target,source);return;}const attacker=this.actors.find(a=>a.sim.player===source),victim=this.actors.find(a=>a.sim.player===target);if(attacker&&source.team!==target.team){attacker.record.damage+=amount;if(victim&&source.kind==='summoner'&&target.kind==='summoner'){source.ultimateMeter=Math.min(100,source.ultimateMeter+amount*this.rules.settings.ultimateDealt);target.ultimateMeter=Math.min(100,target.ultimateMeter+amount*this.rules.settings.ultimateReceived);}const log=this.damageLog.get(target.id)||new Map();log.set(source.id,this.rules.elapsed);this.damageLog.set(target.id,log);}
  if(!target.dead||!victim)return;victim.record.deaths++;victim.sim.onDefeated();this.rules.defeat(target);if(attacker)attacker.record.kills++;
  for(const [id,time]of this.damageLog.get(target.id)||[]){const assist=this.actors.find(a=>a.sim.player.id===id);if(assist&&assist!==attacker&&assist.sim.player.team!==target.team&&this.rules.elapsed-time<=8)assist.record.assists++;}this.damageLog.delete(target.id);this.refreshAuras();
  this.feed.unshift(`${source?.name||'Combat'} defeated ${target.name}`);this.feed.length=Math.min(this.feed.length,3);
 }
 step(command,dt=1/60){if(this.rules.result||this.phase==='prematch')return;if(this.phase==='countdown'){this.countdownRemaining=Math.max(0,this.countdownRemaining-dt);if(this.countdownRemaining<1e-9){this.countdownRemaining=0;this.phase='active';}return;}if(!this.active)return;dt=Math.min(dt,Math.max(0,this.rules.settings.timeLimitSeconds-this.rules.elapsed));this.tick++;
  for(const {sim}of this.actors){const p=sim.player;if(p.dead&&p.respawnReserved&&this.rules.elapsed>=p.respawnAt){respawn(p);p.protectedUntil=this.rules.elapsed+this.rules.settings.protectionSeconds;delete p.respawnReserved;Object.assign(p,p.spawn);p.previous={...p.spawn};p.angle=p.team===1?Math.PI/2:-Math.PI/2;sim.stance=sim.definition.initialStance||null;sim.weapons.reset();}}
  // Build commands from one snapshot, then alternate actor order to avoid a fixed blue-first bias.
  this.wilderness.coordinate();const commands=new Map(this.actors.map(a=>[a,a.bot?a.bot.read(a.sim,this):command]));const ordered=this.tick%2?this.actors:[...this.actors].reverse();
  for(const actor of ordered)actor.sim.step(commands.get(actor),dt);this.wilderness.step(dt);this.rules.step(this.entities,dt);if(this.rules.result)this.phase='results';
  for(const a of this.actors)if(!a.sim.player.dead&&a.sim.player.team===this.rules.scoringTeam&&Math.abs(a.sim.player.z)<=this.lane.halfWidth)a.record.pressureSeconds+=dt;
 }
 snapshot(){return {phase:this.phase,countdownRemaining:this.countdownRemaining,control:this.rules.control,front:this.rules.front,cp:{...this.rules.cp},tickets:{...this.rules.tickets},pressureTeam:this.rules.pressureTeam,pressureAge:this.rules.pressureAge,scoringTeam:this.rules.scoringTeam,elapsed:this.rules.elapsed,result:this.rules.result,camps:this.wilderness.camps.map(c=>({id:c.id,health:c.health,dead:c.dead,respawnAt:c.respawnAt})),rotations:this.wilderness.rotationCount,rewards:this.wilderness.rewardCount,actors:this.actors.map(a=>({id:a.sim.player.id,name:a.sim.player.name,team:a.sim.player.team,x:a.sim.player.x,z:a.sim.player.z,health:a.sim.player.health,ultimateMeter:a.sim.player.ultimateMeter,protected:this.protected(a.sim.player),finalRespawnAvailable:a.sim.player.finalRespawnAvailable,eliminated:a.sim.player.eliminated,dead:a.sim.player.dead,respawnAt:a.sim.player.respawnAt,state:a.bot?.state||'human',...a.record}))};}
}