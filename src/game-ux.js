import {ControlLayouts} from './control-layout.js';
// M8 presentation orchestration. Gameplay creation, pause and reset stay in main.js.
// A future ceremonial visual belongs in the victory screen, never match rules.
export const UX_SUMMONERS=Object.freeze([
 {id:'kit-asher',name:'Kit Asher',role:'Damage Dealer',aether:'Expellant',identity:'Fire pressure. Precision and mobility.',accent:'#f3a35e'},
 {id:'set',name:'Set',role:'Tank',aether:'Embodiment',identity:'Close the distance. Hold your ground.',accent:'#bf9bea'},
 {id:'riven',name:'Riven',role:'Damage Dealer',aether:'Shaper',identity:'Switch stances. Shape the fight.',accent:'#86d9c5'}
]);
export const UX_CONFIG=Object.freeze({victorySeconds:2});
export class GameUX {
 constructor({getState,input,abilities}){
  this.getState=getState;this.input=input;this.abilities=abilities;this.state='main-menu';this.selected='kit-asher';this.loadingFrame=false;this.seenResult=null;this.victoryUntil=0;this.allowInput=false;
  this.nodes={};for(const id of ['main-menu','summoner-select','match-loading','victory','results','menu','settings-screen','game-layer','ux-backdrop','control-editor'])this.nodes[id]=document.getElementById(id);
  const by=id=>document.getElementById(id);
  const start=by('start'),reset=by('reset'),chooser=by('summoner'),mode=by('mode');
  // Retain the tested launch/reset implementation; this layer only chooses when to call it.
  this.launch=start.onclick;this.reset=reset.onclick;
  start.onclick=()=>{this.launch();this.enterArena();};
  const oldReset=reset.onclick;reset.onclick=()=>{oldReset();this.setState('paused');};
  const oldMode=mode.onchange;mode.onchange=e=>{oldMode(e);this.setState('paused');};
  const oldChoose=chooser.onchange;chooser.onchange=()=>{this.selected=chooser.value;oldChoose();this.renderSelection();};
  by('play').onclick=()=>this.openSelection();
  by('selection-back').onclick=()=>this.returnToMenu();
  by('confirm-summoner').onclick=()=>this.confirm();
  by('open-settings').onclick=()=>this.setState('settings');
  by('settings-back').onclick=()=>this.setState('main-menu');
  by('practice').onclick=()=>{mode.value='training';mode.onchange({target:mode});};
  by('pause-menu').onclick=()=>this.returnToMenu();
  by('view-results').onclick=()=>{if(this.state==='victory')this.setState('results');};
  by('play-again').onclick=()=>{if(this.state==='results')this.queueMatch();};
  by('back-menu').onclick=()=>this.returnToMenu();
  const list=by('summoner-cards');this.cards=new Map();
  for(const data of UX_SUMMONERS){const card=document.createElement('button');card.className='summoner-card';card.style.setProperty('--summoner-accent',data.accent);card.setAttribute('aria-label',data.name+', '+data.role+', '+data.aether);card.innerHTML=`<span class="selection-mark">SELECTED</span><strong>${data.name.toUpperCase()}</strong><span class="summoner-role">${data.role}</span><span class="summoner-class">${data.aether}</span><span class="summoner-identity">${data.identity}</span>`;card.onclick=()=>this.select(data.id);list.append(card);this.cards.set(data.id,card);}
  this.layouts=new ControlLayouts(this);this.renderSelection();this.setState('main-menu');
 }
 get rendersArena(){return ['countdown','active','training','paused','victory','control-editor'].includes(this.state);}
 get arenaRunning(){return ['countdown','active','training'].includes(this.state);}
 setState(state){this.state=state;this.sync();}
 select(id){if(this.state!=='summoner-select'||!UX_SUMMONERS.some(s=>s.id===id))return;const chooser=document.getElementById('summoner');chooser.value=id;chooser.onchange();}
 renderSelection(){const data=UX_SUMMONERS.find(s=>s.id===this.selected)||UX_SUMMONERS[0];for(const [id,card] of this.cards||[])card.setAttribute('aria-pressed',String(id===data.id));document.getElementById('selection-name').textContent=data.name;document.getElementById('intro-summoner').textContent=data.name.toUpperCase();document.getElementById('intro-class').textContent=data.role+' · '+data.aether;}
 openSelection(){if(this.state!=='main-menu')return;const mode=document.getElementById('mode');if(mode.value!=='match'){mode.value='match';mode.onchange({target:mode});}this.setState('summoner-select');}
 confirm(){if(this.state==='summoner-select')this.queueMatch();}
 queueMatch(){this.reset();this.seenResult=null;this.loadingFrame=false;this.renderSelection();this.setState('match-loading');}
 enterArena(){const d=this.getState();this.setState(d.match?(d.match.phase==='countdown'?'countdown':'active'):'training');}
 returnToMenu(){this.reset();this.seenResult=null;this.loadingFrame=false;this.setState('main-menu');}
 beforeFrame(){
  // One paint opportunity for the real initialization handoff, no pretend progress bar or timer.
  if(this.state==='match-loading'){if(this.loadingFrame){this.launch();this.enterArena();}else this.loadingFrame=true;}
  const d=this.getState();
  if(this.arenaRunning&&d.paused&&!d.match?.rules.result)this.setState('paused');
  else if(this.state==='paused'&&!d.paused)this.enterArena();
  if(this.state==='countdown'&&d.match?.active)this.setState('active');
  this.gateInput();
 }
 gateInput(){const d=this.getState(),allow=!d.paused&&(this.state==='active'||this.state==='training')&&!d.match?.rules.result;
  if(allow!==this.allowInput||!allow){this.input.clear();this.abilities.clear();}this.allowInput=allow;this.input.enabled=allow;
 }
 afterFrame(now){const d=this.getState(),result=d.match?.rules.result;
  if(result&&result!==this.seenResult){this.seenResult=result;this.victoryUntil=now+UX_CONFIG.victorySeconds*1000;const team=result.winner===1?'BLUE TEAM':result.winner===2?'RED TEAM':'DRAW';document.getElementById('victory-title').textContent=result.winner?'CROWNFALL':'DRAW';document.getElementById('victory-team').textContent=result.winner?team+' WINS':'REGULATION COMPLETE';document.getElementById('victory-outcome').textContent=result.winner===1?'VICTORY':result.winner===2?'DEFEAT':'NO WINNER';document.getElementById('results-team').textContent=result.winner?team+' WINS':'DRAW';const p=d.match.human.player,a=d.match.actors.find(a=>a.sim===d.match.human);document.getElementById('results-player').textContent=`YOU · ${p.name} · ${a.record.kills} / ${a.record.deaths} / ${a.record.assists} K/D/A · ${Math.round(a.record.pressureSeconds)}s Pressure`;const rows=document.getElementById('result-rows').children;for(let i=0;i<rows.length;i++)rows[i].classList.toggle('player-result',d.match.actors[i]?.sim===d.match.human);this.setState('victory');}
  if(this.state==='victory'&&now>=this.victoryUntil)this.setState('results');
  this.sync();
 }
 sync(){const panel={ 'main-menu':'main-menu','summoner-select':'summoner-select','match-loading':'match-loading',settings:'settings-screen',paused:'menu','control-editor':'control-editor',victory:'victory',results:'results' }[this.state];
  for(const id of ['main-menu','summoner-select','match-loading','victory','results','menu','settings-screen','control-editor'])this.nodes[id].hidden=id!==panel;
  const scenery=['main-menu','summoner-select','match-loading','settings','results'].includes(this.state);this.nodes['ux-backdrop'].hidden=!scenery;this.nodes['game-layer'].hidden=!this.rendersArena;this.nodes['game-layer'].inert=!this.arenaRunning;
  document.body?.setAttribute('data-screen',this.state);this.gateInput();this.layouts?.update();
 }
}