// Presentation-only, versioned local preferences. No simulation/action values here.
export const LAYOUT_CONFIG=Object.freeze({version:1,key:'crownfall.controls.v1',minScale:.8,maxScale:1.35,defaultScale:1,minOpacity:.35,maxOpacity:1,defaultOpacity:.9});
export const CONTROL_SLOTS=['move','aim','basic','skill1','skill2','ultimate','special'];
export const CONTROL_NAMES={move:'Movement',aim:'Aim / facing',basic:'Basic attack',skill1:'Skill 1',skill2:'Skill 2',ultimate:'Ultimate',special:'Special / STANCE'};
export const defaultLayout=()=>({version:LAYOUT_CONFIG.version,controls:{}});
export function validateLayout(value){
 if(!value||value.version!==LAYOUT_CONFIG.version||!value.controls||typeof value.controls!=='object'||Array.isArray(value.controls))return defaultLayout();
 const controls={};for(const [slot,c] of Object.entries(value.controls)){
  if(!CONTROL_SLOTS.includes(slot)||!c||!['x','y','scale','opacity'].every(k=>typeof c[k]==='number'&&Number.isFinite(c[k]))||c.x<0||c.x>1||c.y<0||c.y>1||c.scale<LAYOUT_CONFIG.minScale||c.scale>LAYOUT_CONFIG.maxScale||c.opacity<LAYOUT_CONFIG.minOpacity||c.opacity>1)return defaultLayout();
  controls[slot]={x:c.x,y:c.y,scale:c.scale,opacity:c.opacity};
 }return {version:LAYOUT_CONFIG.version,controls};
}
export function loadLayout(storage){try{return validateLayout(JSON.parse(storage?.getItem(LAYOUT_CONFIG.key)||'null'));}catch{return defaultLayout();}}
export function layoutBounds(c,size,area){const diameter=size*c.scale,half=diameter/2,x=Math.max(area.left+half,Math.min(area.left+area.width-half,area.left+c.x*area.width)),y=Math.max(area.top+half,Math.min(area.top+area.height-half,area.top+c.y*area.height));return {x,y,left:x-half,top:y-half,width:diameter,height:diameter};}
const copy=v=>JSON.parse(JSON.stringify(v));
export class ControlLayouts{
 constructor(ux,storage){this.ux=ux;this.abilities=ux.abilities;try{this.storage=storage===undefined?window.localStorage:storage;}catch{this.storage=null;}this.saved=loadLayout(this.storage);this.draft=null;this.selected='move';this.proxies=new Map();this.applied=new Map();this.lastNodes=[];this.dirty=true;this.drag=null;this.resetArmed=false;
  const by=id=>document.getElementById(id);this.panel=by('control-editor');this.status=by('layout-status');
  by('edit-controls').onclick=()=>this.open();by('layout-save').onclick=()=>this.save();by('layout-cancel').onclick=()=>this.cancel();by('layout-reset').onclick=()=>this.reset();
  by('layout-collapse').onclick=()=>this.collapse(true);by('layout-reopen').onclick=()=>this.collapse(false);
  const select=by('layout-selected');for(const slot of CONTROL_SLOTS){const o=document.createElement('option');o.value=slot;o.textContent=CONTROL_NAMES[slot];select.append(o);}select.onchange=e=>this.select(e.target.value);
  for(const prop of ['x','y','scale','opacity']){const slider=by('layout-'+prop);slider.min=prop==='scale'?LAYOUT_CONFIG.minScale:prop==='opacity'?LAYOUT_CONFIG.minOpacity:0;slider.max=prop==='scale'?LAYOUT_CONFIG.maxScale:1;slider.oninput=e=>this.change(prop,Number(e.target.value));}
  window.addEventListener('resize',()=>{this.endDrag();this.dirty=true;});document.addEventListener('visibilitychange',()=>this.endDrag());
 }
 area(){const r=document.getElementById('control-safe-area').getBoundingClientRect();return r.width>120&&r.height>120?{left:r.left,top:r.top,width:r.width,height:r.height}:{left:12,top:12,width:innerWidth-24,height:innerHeight-24};}
 controls(){const entries=[['move',document.getElementById('move-control')],['aim',document.getElementById('aim-control')]];for(const button of this.abilities.buttons.values()){const slot=CONTROL_SLOTS[Number(button.dataset.slot)+2];if(slot)entries.push([slot,button]);}return entries;}
 size(slot,el){return el.offsetWidth||((slot==='move'||slot==='aim')?(innerWidth<=740?92:104):slot==='basic'?66:innerWidth<=740?56:58);}
 clear(){for(const [el,styles]of this.applied){for(const [key,value]of Object.entries(styles))el.style[key]=value;}this.applied.clear();document.body?.classList.remove('custom-controls');}
 style(el,values){if(!this.applied.has(el)){const old={};for(const key of Object.keys(values))old[key]=el.style[key]||'';this.applied.set(el,old);}Object.assign(el.style,values);}
 update(){const entries=this.controls(),nodes=entries.map(x=>x[1]);if(!this.dirty&&nodes.length===this.lastNodes.length&&nodes.every((n,i)=>n===this.lastNodes[i]))return;this.lastNodes=nodes;this.dirty=false;this.clear();const current=this.draft||this.saved,custom=Object.keys(current.controls).length>0;document.body?.classList.toggle('custom-controls',custom);
  const area=this.area();for(const [slot,el]of entries){const c=current.controls[slot];if(!c)continue;const size=this.size(slot,el),b=layoutBounds(c,size,area);this.style(el,{position:'fixed',left:(b.x-size/2)+'px',top:(b.y-size/2)+'px',right:'auto',bottom:'auto',transform:`scale(${c.scale})`,transformOrigin:`${size/2}px ${size/2}px`,opacity:String(c.opacity),zIndex:'2'});}
  const special=current.controls.special;if(special&&this.abilities.buttons.has('stance')){const el=this.abilities.buttons.get('stance'),b=layoutBounds(special,this.size('special',el),area);this.style(document.getElementById('current-stance'),{left:Math.max(area.left,Math.min(area.left+area.width-142,b.x-71))+'px',right:'auto',top:Math.max(area.top,b.top-17)+'px',bottom:'auto'});}
  // If a changed viewport buries a saved control, use the original CSS layout for
  // this viewport. Keep the preference intact so it can be edited or used elsewhere.
  if(!this.draft&&custom){const bounds=entries.filter(([,el])=>!el.hidden).map(([,el])=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);const buried=bounds.some((a,i)=>bounds.some((b,j)=>i!==j&&Math.hypot(a.left+a.width/2-b.left-b.width/2,a.top+a.height/2-b.top-b.height/2)+a.width/2<=b.width/2+1));if(buried){this.clear();document.getElementById('layout-summary').textContent='Saved controls overlap on this screen. M8 defaults are in use; edit to adjust.';}}
  if(this.draft)this.refreshProxies();
 }
 defaultRect(slot,el){const hidden=el.hidden;el.hidden=false;const r=el.getBoundingClientRect();el.hidden=hidden;const size=this.size(slot,el);return {x:r.left+size/2,y:r.top+size/2,width:size,height:size,left:r.left,top:r.top};}
 collapse(value){this.collapsed=value;document.getElementById('layout-dock').hidden=value;document.getElementById('layout-reopen').hidden=!value;document.getElementById('layout-reopen').setAttribute('aria-expanded',String(!value));}
 open(){if(this.ux.state!=='settings'||!this.ux.getState().paused)return;this.collapse(false);this.draft=copy(this.saved);this.resetArmed=false;document.getElementById('layout-reset').textContent='RESET TO DEFAULT';this.status.textContent='Drag a control, or select one to adjust it.';this.ux.setState('control-editor');this.dirty=true;this.update();
  for(const slot of CONTROL_SLOTS){const proxy=document.createElement('button');proxy.className='layout-handle';proxy.setAttribute('aria-label','Move '+CONTROL_NAMES[slot]);proxy.textContent=CONTROL_NAMES[slot];proxy.dataset.control=slot;document.getElementById('layout-handles').append(proxy);this.proxies.set(slot,proxy);
   proxy.addEventListener('pointerdown',e=>{if(this.drag)return;e.preventDefault();this.select(slot);const c=this.value(slot),b=layoutBounds(c,this.defaultSizes[slot],this.area());this.drag={pointer:e.pointerId,slot,offsetX:e.clientX-b.x,offsetY:e.clientY-b.y,proxy};proxy.setPointerCapture(e.pointerId);});
   proxy.addEventListener('pointermove',e=>{const d=this.drag;if(!d||d.pointer!==e.pointerId)return;const area=this.area(),c=this.value(d.slot);this.draft.controls[d.slot]={...c,x:Math.max(0,Math.min(1,(e.clientX-d.offsetX-area.left)/area.width)),y:Math.max(0,Math.min(1,(e.clientY-d.offsetY-area.top)/area.height))};this.dirty=true;this.update();this.showValues();});
   for(const name of ['pointerup','pointercancel','lostpointercapture'])proxy.addEventListener(name,e=>{if(this.drag?.pointer===e.pointerId)this.endDrag();});
  }this.select('move');this.refreshProxies();
 }
 // Capture validated CSS defaults each viewport. Temporary special button is presentation only.
 captureDefaults(){this.clear();this.defaults={};this.defaultSizes={};const entries=this.controls();let temporary=null;if(!entries.some(([s])=>s==='special')){temporary=document.createElement('button');temporary.className='ability';temporary.dataset.slot='4';document.getElementById('ability-bar').append(temporary);entries.push(['special',temporary]);}
  const area=this.area();for(const [slot,el]of entries){const r=this.defaultRect(slot,el);this.defaultSizes[slot]=r.width;this.defaults[slot]={x:Math.max(0,Math.min(1,(r.x-area.left)/area.width)),y:Math.max(0,Math.min(1,(r.y-area.top)/area.height)),scale:LAYOUT_CONFIG.defaultScale,opacity:LAYOUT_CONFIG.defaultOpacity};}temporary?.remove();
 }
 value(slot){return this.draft.controls[slot]||this.defaults[slot];}
 refreshProxies(){// Re-measure defaults after a viewport or ability layout change.
  if(!this.defaults||this.viewKey!==innerWidth+'x'+innerHeight){this.viewKey=innerWidth+'x'+innerHeight;this.captureDefaults();this.dirty=true;}
  const area=this.area();for(const [slot,proxy]of this.proxies){const c=this.value(slot),b=layoutBounds(c,this.defaultSizes[slot],area);Object.assign(proxy.style,{left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px',opacity:String(c.opacity)});proxy.classList.toggle('selected',slot===this.selected);}
  const boxes=CONTROL_SLOTS.map(slot=>({slot,...layoutBounds(this.value(slot),this.defaultSizes[slot],area)}));const buried=boxes.some(a=>boxes.some(b=>a!==b&&Math.hypot(a.x-b.x,a.y-b.y)+a.width/2<=b.width/2+1));document.getElementById('layout-save').disabled=buried;document.getElementById('layout-overlap').textContent=buried?'A control is fully covered. Select it from the list and move it before saving.':'';
 }
 select(slot){if(!CONTROL_SLOTS.includes(slot))return;this.selected=slot;document.getElementById('layout-selected').value=slot;this.refreshProxies();this.showValues();}
 showValues(){if(!this.draft)return;const c=this.value(this.selected);for(const prop of ['x','y','scale','opacity']){document.getElementById('layout-'+prop).value=c[prop];document.getElementById('layout-'+prop+'-value').textContent=Math.round(c[prop]*100)+'%';}}
 change(prop,value){if(!this.draft||!Number.isFinite(value))return;const limits={x:[0,1],y:[0,1],scale:[LAYOUT_CONFIG.minScale,LAYOUT_CONFIG.maxScale],opacity:[LAYOUT_CONFIG.minOpacity,1]};if(!limits[prop])return;this.draft.controls[this.selected]={...this.value(this.selected),[prop]:Math.max(limits[prop][0],Math.min(limits[prop][1],value))};this.dirty=true;this.update();this.showValues();}
 endDrag(){const d=this.drag;this.drag=null;if(d&&d.proxy.hasPointerCapture(d.pointer))d.proxy.releasePointerCapture(d.pointer);}
 close(){this.endDrag();for(const p of this.proxies.values())p.remove();this.proxies.clear();this.draft=null;this.defaults=null;this.dirty=true;this.update();this.ux.setState('settings');}
 save(){if(!this.draft||document.getElementById('layout-save').disabled)return;const next=validateLayout(this.draft);try{if(!this.storage)throw Error('Unavailable');this.storage.setItem(LAYOUT_CONFIG.key,JSON.stringify(next));this.saved=next;this.close();document.getElementById('layout-summary').textContent='Control layout saved on this device.';}catch{this.status.textContent='Storage unavailable. Changes are not saved. Try again or Cancel.';}}
 cancel(){if(this.draft)this.close();}
 reset(){if(!this.draft)return;if(!this.resetArmed){this.resetArmed=true;document.getElementById('layout-reset').textContent='CONFIRM RESET';this.status.textContent='Tap Confirm Reset, then Save to keep defaults. Cancel keeps your saved layout.';return;}this.resetArmed=false;document.getElementById('layout-reset').textContent='RESET TO DEFAULT';this.draft=defaultLayout();this.dirty=true;this.update();this.showValues();}
}