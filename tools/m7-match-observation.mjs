// Deterministic full-match telemetry. This is not human visual/mobile acceptance.
import {CrownfallMatch} from '../src/match.js';
import {CrownfallBot} from '../src/match-bots.js';
const runs=[];
for(const name of ['kit-asher','set','riven']){
 const m=new CrownfallMatch(name),pilot=new CrownfallBot(0);m.start();
 const states=new Set(),stances=new Set(),engagements=new Set();let handoffs=0,prior=0,stalls=0;const last=new Map(),still=new Map();
 for(let i=0;i<60*305&&!m.rules.result;i++){
  m.step(pilot.read(m.human,m));
  if(i%60)continue;
  if(m.rules.scoringTeam&&prior&&m.rules.scoringTeam!==prior)handoffs++;
  if(m.rules.scoringTeam)prior=m.rules.scoringTeam;
  for(const a of m.actors){const p=a.sim.player;if(a.bot)states.add(a.bot.state);if(a.sim.definition.id==='riven')stances.add(a.sim.stance);
   const prev=last.get(p.id),walking=['advance','engage','wilderness','retreat'].includes(a.bot?.state);
   const stuck=walking&&!p.dead&&prev&&!prev.dead&&Math.hypot(p.x-prev.x,p.z-prev.z)<.05;
   still.set(p.id,stuck?(still.get(p.id)||0)+1:0);if(still.get(p.id)===5)stalls++;
   last.set(p.id,{x:p.x,z:p.z,dead:p.dead});
  }
  const active=m.entities.filter(p=>!p.dead),visited=new Set();
  // Local combat clusters are telemetry proxies, not subjective proof of good fights.
  for(const p of active){if(visited.has(p))continue;const cluster=[p];visited.add(p);for(let n=0;n<cluster.length;n++)for(const q of active)if(!visited.has(q)&&Math.hypot(q.x-cluster[n].x,q.z-cluster[n].z)<7){visited.add(q);cluster.push(q);}
   const b=cluster.filter(q=>q.team===1).length,r=cluster.length-b;if(b&&r)engagements.add([Math.min(b,r),Math.max(b,r)].join('v'));
  }
 }
 runs.push({summoner:name,duration:+m.rules.elapsed.toFixed(1),result:m.rules.result,cp:m.rules.cp,tickets:m.rules.tickets,rotations:m.wilderness.rotationCount,rewards:m.wilderness.rewardCount,deaths:m.actors.reduce((n,a)=>n+a.record.deaths,0),scoringHandoffs:handoffs,states:[...states],rivenStances:[...stances],localClusters:[...engagements],fiveSecondStationaryNavigation:stalls});
}
console.log(JSON.stringify(runs,null,2));
if(runs.some(r=>!r.result||r.rivenStances.length!==2||r.fiveSecondStationaryNavigation))process.exitCode=1;