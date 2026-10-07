import {MATCH_DEFAULTS} from './match-data.js';
const clock=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export class MatchHUD {
 constructor(){this.lastResult=null;}
 update(match){const panel=document.getElementById('match-hud');panel.hidden=!match;document.getElementById('countdown').hidden=match?.phase!=='countdown';document.getElementById('ultimate-status').hidden=!match;document.getElementById('buff-status').hidden=!match;document.getElementById('final-lives').hidden=!match;if(!match)return;const r=match.rules,c=r.control*100;
  document.getElementById('match-clock').textContent=clock(Math.ceil(Math.max(0,r.settings.timeLimitSeconds-r.elapsed)));document.getElementById('countdown').textContent='READY · '+Math.ceil(match.countdownRemaining);const ult=match.human.activeAbilities().find(a=>a.ultimate),meter=match.human.player.ultimateMeter,cd=match.human.cooldowns.remaining(ult.id,match.human.now);document.getElementById('ultimate-status').textContent=meter>=100?(cd>0?'ULTIMATE 100% · COOLDOWN '+cd.toFixed(1)+'s':'ULTIMATE READY'):'ULTIMATE '+Math.floor(meter)+'%';
  document.getElementById('buff-status').textContent=Object.values(match.human.player.modifiers).filter(v=>v.label&&v.expires>r.elapsed).map(v=>v.label+' '+Math.ceil(v.expires-r.elapsed)+'s').join(' · ');document.getElementById('final-lives').textContent=[1,2].filter(team=>r.tickets[team]===0).map(team=>(team===1?'BLUE':'RED')+' FINAL: '+match.entities.filter(p=>p.team===team).map(p=>p.name.split(' ')[0]+': '+(p.eliminated?'OUT':p.finalRespawnAvailable?'1 RESPAWN':p.dead?'RETURNING':'LAST LIFE')).join(' / ')).join(' | ');
  document.getElementById('control-text').textContent=`BLUE ${c.toFixed(1)}% | RED ${(100-c).toFixed(1)}%`;
  document.getElementById('control-blue').style.width=c+'%';
  for(const team of [1,2])document.getElementById('score-'+team).textContent=`${Math.floor(r.cp[team])} / ${r.settings.cpTarget} CP · ${r.tickets[team]} TICKETS`;
  document.getElementById('pressure-state').textContent=r.scoringTeam?`${r.scoringTeam===1?'BLUE':'RED'} SCORING`:r.pressureTeam?`${r.pressureTeam===1?'BLUE':'RED'} PRESSURE · ${Math.max(0,r.settings.graceSeconds-r.pressureAge).toFixed(1)}s`:'NEUTRAL · NO SCORING';
  document.getElementById('match-feed').textContent=match.feed[0]||'Push the lane. Hold beyond 50% to score.';
  if(r.result&&this.lastResult!==r.result){this.lastResult=r.result;document.getElementById('results').hidden=false;document.getElementById('result-title').textContent=r.result.winner===1?'CROWNFALL · VICTORY':r.result.winner===2?'CROWNFALL · DEFEAT':'DRAW';
   const reason={'points':'Crownfall Point victory','total-control':'100% territorial control','tickets':'Opposing team eliminated','regulation':'Regulation · CP, then territory tiebreak'};document.getElementById('result-reason').textContent=`${reason[r.result.reason]} · ${clock(r.elapsed)}`;
   const body=document.getElementById('result-rows');body.innerHTML='';for(const a of match.actors){const row=document.createElement('tr');const p=a.sim.player,s=a.record;for(const value of [(p.team===1?'Blue ':'Red ')+p.name,`${s.kills}/${s.deaths}/${s.assists}`,Math.round(s.damage),Math.round(s.pressureSeconds)+'s']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}body.append(row);}
  }
 }
}
export function readMatchSettings(){const values={};for(const k of Object.keys(MATCH_DEFAULTS)){const input=document.getElementById('setting-'+k);if(input)values[k]=Number(input.value);}return values;}