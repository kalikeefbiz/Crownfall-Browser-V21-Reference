// M4 playtest defaults, not locked competitive balance. M1–M3 kits are unchanged.
export const MATCH_DEFAULTS=Object.freeze({startingTickets:15,respawnSeconds:3,cpTarget:1000,graceSeconds:2,cpPerSecond:12,depthBonus:0,timeLimitSeconds:300,countdownSeconds:3,protectionSeconds:2,ultimateDealt:.04,ultimateReceived:.025,durabilityMultiplier:1.3});
export const LANE=Object.freeze({goalA:-21,goalB:21,halfWidth:3.85});
export const MATCH_LANE=Object.freeze({goalA:-28,goalB:28,halfWidth:12});
// M7 arena geometry only. Coordinates: X = territorial axis, Z = lateral travel.
// Reflection across X=0 preserves equivalent access for both teams.
export const ARENA_LAYOUT=Object.freeze({
 spawnX:30, spawnOffsets:[0,-8,8], neutralWidth:4,
 routes:[{x:-22,z:-18,w:5,d:12},{x:22,z:-18,w:5,d:12},
 {x:-18,z:19,w:5,d:14},{x:18,z:19,w:5,d:14},
 {x:-7,z:-21,w:4,d:18},{x:7,z:-21,w:4,d:18},
 {x:0,z:20,w:7,d:16}],
});
export const MATCH_MAP=Object.freeze({width:68,depth:64,lane:MATCH_LANE,arena:ARENA_LAYOUT,
 walls:[
 // Low islands shape lateral choices, never divide the main lane.
 {x:-12,z:-18,w:4,d:3,h:.75},{x:12,z:-18,w:4,d:3,h:.75},
 {x:-12,z:18,w:4,d:3,h:.75},{x:12,z:18,w:4,d:3,h:.75},
 // Outer shelves frame camp pockets; inside and outside approaches remain open.
 {x:-28,z:-25,w:3,d:6,h:.65},{x:28,z:-25,w:3,d:6,h:.65},
 {x:-28,z:25,w:3,d:6,h:.65},{x:28,z:25,w:3,d:6,h:.65},
 {x:0,z:30,w:8,d:1,h:.65},{x:0,z:-30,w:18,d:1,h:.65}],
 markers:[{x:-30,z:0,label:'BLUE'},{x:0,z:0,label:'NEUTRAL'},{x:30,z:0,label:'RED'}]});
export const MATCH_TRAINING={targetRespawn:Infinity,targetHealth:1000,targetRadius:.45,stations:[],targets:[],zones:[{x:0,z:-22,w:68,d:20,tag:'wilderness',name:'WILDERNESS'},{x:0,z:22,w:68,d:20,tag:'wilderness',name:'WILDERNESS'}]};
export const BOT_CONFIG=Object.freeze({thinkInterval:.15,retreatHealth:.25,returnHealth:.55,senseRange:15,retreatDistance:8,aimError:.055,rivenSwitchSeconds:7,laneOffsets:[0,-8,8]});
export function matchSettings(values={}){const limits={startingTickets:[0,100],respawnSeconds:[1,60],cpTarget:[10,100000],graceSeconds:[0,10],cpPerSecond:[.1,1000],depthBonus:[0,5],timeLimitSeconds:[1,3600],countdownSeconds:[0,10],protectionSeconds:[0,10],ultimateDealt:[0,1],ultimateReceived:[0,1],durabilityMultiplier:[1,2]};const result={};for(const [k,v] of Object.entries(MATCH_DEFAULTS)){const n=Number(values[k]??v);result[k]=Math.min(limits[k][1],Math.max(limits[k][0],Number.isFinite(n)?n:v));}result.startingTickets=Math.floor(result.startingTickets);return result;}

// Temporary neutral creatures and balance; no new AxA lore.
export const WILDERNESS_CONFIG=Object.freeze({minorHealth:850,minorDamage:42,minorAttackInterval:1,minorRespawn:45,majorHealth:5200,majorDamage:110,majorAttackInterval:1,majorRespawn:100,majorDuration:25,majorDamageBonus:.25,minorDuration:20,mobilityBonus:.2,cooldownReduction:.2,defenseMitigation:.2,leash:12,aggroRange:9,monsterSpeed:3.8,minorReach:2.3,majorReach:3.2,rotationStart:14,rotationInterval:24,majorAttempt:48,rotationTimeout:24});
export const CAMP_SITES=[
 {id:'mobility-a',type:'mobility',x:-22,z:-22},{id:'mobility-b',type:'mobility',x:22,z:-22},
 {id:'cooldown-a',type:'cooldown',x:-18,z:24},{id:'cooldown-b',type:'cooldown',x:18,z:24},
 {id:'defense-a',type:'defense',x:-7,z:-27},{id:'defense-b',type:'defense',x:7,z:-27},
 {id:'major',type:'damage',x:0,z:26}];