import {BOT_CONFIG,LANE} from './match-data.js';
// Small deterministic policy: advance, engage, retreat, then return. Commands use player input seams.
export class CrownfallBot {
 constructor(index){this.index=index;this.nextThink=0;this.nextRetreat=0;this.retreatUntil=0;this.nextStance=0;this.command={moveX:0,moveZ:0};this.state='advance';}
 read(sim,match){const p=sim.player,now=match.rules.elapsed;if(p.dead)return {moveX:0,moveZ:0};if(now<this.nextThink)return {...this.command,actions:[]};this.nextThink=now+BOT_CONFIG.thinkInterval;const sign=p.team===1?1:-1;
  const objective=match.wilderness?.assigned(p.id);const enemies=sim.targets.filter(t=>t.kind==='summoner'&&!t.dead&&t.team!==p.team&&Math.abs(t.z)<match.lane.halfWidth+3).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));const nearby=enemies[0];const enemy=objective&&(!nearby||Math.hypot(nearby.x-p.x,nearby.z-p.z)>5)?objective:nearby,distance=enemy?Math.hypot(enemy.x-p.x,enemy.z-p.z):Infinity;
  if(p.health/p.maxHealth<BOT_CONFIG.retreatHealth&&distance<BOT_CONFIG.retreatDistance&&now>=this.nextRetreat){this.retreatUntil=now+2;this.nextRetreat=now+7;}
  let tx=sign*match.lane.goalB,tz=BOT_CONFIG.laneOffsets[this.index%3],actions=[],angle=p.angle,attackHeld=false;
  const range=sim.definition.id==='set'?1.25:sim.definition.id==='riven'?5.5:3.7;
  if(enemy&&(distance<BOT_CONFIG.senseRange||objective===enemy)){angle=Math.atan2(enemy.x-p.x,enemy.z-p.z)+Math.sin(now*2+this.index)*BOT_CONFIG.aimError;const retreating=now<this.retreatUntil&&p.x*sign>-18;
   this.state=retreating?'retreat':objective===enemy?'wilderness':distance>range?'engage':'pressure';
   if(retreating){tx=p.x-sign*4;tz=BOT_CONFIG.laneOffsets[this.index%3];}
   else if(distance>range){tx=enemy.x-Math.sin(angle)*range*.8;tz=objective===enemy?enemy.z:Math.max(-match.lane.halfWidth+1,Math.min(match.lane.halfWidth-1,enemy.z));}
   else{tx=p.x;tz=p.z;}
   attackHeld=distance<range+1;
   const cast=(id,target)=>{if(sim.ability(id)?.ultimate&&(!match.ultimateReady(sim)||(enemy.kind!=='summoner'&&sim.ability(id).summonersOnly)))return;actions.push({id,angle,...(target?{targetOffset:{x:target.x-p.x,z:target.z-p.z}}:{})});};
   if(sim.definition.id==='kit-asher'){
    if(distance<3.7)cast('ring');if(distance<16)cast('dragon');if(sim.temporary.available('blast',now)&&distance<20)cast('blast');
    if(!retreating&&distance>5&&distance<9)cast('step');
   }else if(sim.definition.id==='set'){
    if(distance<7)cast('warcry');if(distance<14)cast('fist',enemy);if(!retreating&&distance>2&&distance<5)cast('predatory');
   }else{
    if(distance<9)cast('amp');if(distance<5)cast('death-scream');
    if(sim.stance==='reso'&&distance<9)cast('elf-dance');if(sim.stance==='pulse'&&distance<3.7)cast('percussive-solo');
    if(now>=this.nextStance&&((distance<4&&sim.stance==='reso')||(distance>5&&sim.stance==='pulse'))){cast('stance');this.nextStance=now+BOT_CONFIG.rivenSwitchSeconds;}
   }
  }else this.state='advance';
  let dx=tx-p.x,dz=tz-p.z,len=Math.hypot(dx,dz);if(len>.15){dx/=len;dz/=len;const probe=.65;if(sim.blocked(p.x+dx*probe,p.z+dz*probe)){const base=Math.atan2(dx,dz);let found=false;for(const delta of [.6,-.6,1.2,-1.2,1.57,-1.57]){const x=Math.sin(base+delta),z=Math.cos(base+delta);if(!sim.blocked(p.x+x*probe,p.z+z*probe)){dx=x;dz=z;found=true;break;}}if(!found)dx=dz=0;}}else dx=dz=0;
  this.command={moveX:dx,moveZ:dz,aiming:!!enemy&&(distance<BOT_CONFIG.senseRange||objective===enemy),aimX:Math.sin(angle),aimZ:Math.cos(angle),attackHeld};return {...this.command,actions};
 }
}