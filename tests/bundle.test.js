// Integration smoke test with DOM/GPU doubles. Not a physical browser/rendering test.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('distributed build initializes, enters training, and renders moving combat without runtime errors',()=>{
 const elements=new Map(),errors=[],frames=[];let uploads=0,now=0;
 const gpu=new Proxy({}, {get:(_,name)=>{
  if(name==='getShaderParameter'||name==='getProgramParameter')return ()=>true;
  if(name==='bufferSubData')return (kind,offset,data)=>{assert.ok(data.length<=300000);for(const v of data)assert.ok(Number.isFinite(v));uploads++;};
  if(name==='getAttribLocation')return ()=>0;
  if(/^[A-Z_]+$/.test(name))return 1;
  return ()=>({});
 }});
 const context2d=new Proxy({}, {get:()=>()=>{},set:()=>true});
 class Element {
  constructor(){this.handlers={};this.dataset={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.capture=new Set();this.children=[];this.clientWidth=844;this.clientHeight=390;this.width=0;this.height=0;this.textContent='';this.hidden=false;}
  addEventListener(k,fn){(this.handlers[k]??=[]).push(fn);}emit(k,e={}){for(const fn of this.handlers[k]||[])fn({preventDefault(){},...e});}append(n){this.children.push(n);}setAttribute(){}blur(){}
  querySelector(){return this.child??=new Element();}getBoundingClientRect(){return {left:0,top:0,width:146,height:146};}
  setPointerCapture(id){this.capture.add(id);}hasPointerCapture(id){return this.capture.has(id);}releasePointerCapture(id){this.capture.delete(id);}
  getContext(type){return type==='webgl'?gpu:context2d;}
 }
 const document=new Element();document.getElementById=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};document.createElement=()=>new Element();
 const window=new Element();window.matchMedia=()=>new Element();
 const ctx=vm.createContext({window,document,console:{error:e=>errors.push(e)},performance:{now:()=>now},requestAnimationFrame:fn=>frames.push(fn),innerWidth:844,innerHeight:390,devicePixelRatio:2,Float32Array,Math,Map,Set});
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInContext(code,ctx);assert.equal(errors.length,0);assert.ok(window.crownfallDebug);document.getElementById('mode').onchange({target:{value:'training'}});document.getElementById('start').onclick();
 const tick=n=>{for(let i=0;i<n;i++){now+=1000/60;const fn=frames.shift();assert.ok(fn);fn(now);}};
 document.getElementById('station').onchange({target:{value:'dragon'}});window.emit('keydown',{code:'KeyR'});tick(100);assert.equal(window.crownfallDebug().combat.temporary.length,1);
 window.emit('keydown',{code:'KeyF'});tick(40);assert.ok(window.crownfallDebug().combat.stats.kills>=1);
 window.emit('keydown',{code:'KeyW'});window.emit('keydown',{code:'Space'});tick(40);window.emit('keyup',{code:'Space'});window.emit('keyup',{code:'KeyW'});
 document.getElementById('pause').onclick();assert.ok(window.crownfallDebug().paused);
 document.getElementById('summoner').value='set';document.getElementById('summoner').onchange();document.getElementById('start').onclick();
 window.emit('keydown',{code:'KeyQ'});window.emit('keydown',{code:'KeyE'});tick(60);assert.equal(window.crownfallDebug().combat.summoner,'set');assert.ok(window.crownfallDebug().combat.stats.damage>0);
 window.emit('keydown',{code:'KeyR'});tick(60);document.getElementById('station').onchange({target:{value:'aura'}});tick(2);assert.equal(window.crownfallDebug().combat.auraAllies,2);document.getElementById('damage-pulse').onclick();tick(1);
 document.getElementById('summoner').value='riven';document.getElementById('summoner').onchange();document.getElementById('start').onclick();tick(1);assert.equal(window.crownfallDebug().combat.summoner,'riven');assert.equal(window.crownfallDebug().combat.stance,'reso');assert.match(document.getElementById('ember-streak').textContent,/RESO BLADES/);
 document.getElementById('station').onchange({target:{value:'dragon'}});window.emit('keydown',{code:'Space'});tick(120);assert.equal(window.crownfallDebug().combat.stats.damage,0);window.emit('keyup',{code:'Space'});tick(120);assert.ok(window.crownfallDebug().combat.stats.damage>0);
 window.emit('keydown',{code:'KeyQ'});window.emit('keydown',{code:'KeyE'});tick(30);window.emit('keydown',{code:'KeyF'});tick(1);assert.equal(window.crownfallDebug().combat.stance,'pulse');assert.match(document.getElementById('ember-streak').textContent,/PERCUSSIVE PULSE/);window.emit('keydown',{code:'Space'});window.emit('keydown',{code:'KeyR'});tick(150);window.emit('keyup',{code:'Space'});window.emit('keydown',{code:'KeyQ'});tick(60);
 document.getElementById('reset-targets').onclick();tick(2);assert.equal(window.crownfallDebug().combat.scythes.length,2);window.emit('keydown',{code:'KeyF'});tick(1);assert.equal(window.crownfallDebug().combat.stance,'reso');
 document.getElementById('summoner').value='kit-asher';document.getElementById('summoner').onchange();tick(1);assert.equal(window.crownfallDebug().combat.summoner,'kit-asher');assert.equal(window.crownfallDebug().player.health,650);
document.getElementById('mode').onchange({target:{value:'match'}});document.getElementById('setting-cpTarget').value='10';document.getElementById('setting-cpPerSecond').value='100';document.getElementById('setting-graceSeconds').value='0';document.getElementById('setting-timeLimitSeconds').value='5';document.getElementById('start').onclick();tick(500);const result=window.crownfallDebug().match;assert.equal(result.actors.length,6);assert.ok(result.result);assert.equal(window.crownfallDebug().ux,'victory');assert.equal(document.getElementById('results').hidden,true);document.getElementById('view-results').onclick();assert.equal(document.getElementById('results').hidden,false);assert.equal(document.getElementById('result-rows').children.length,6);document.getElementById('play-again').onclick();tick(2);assert.equal(window.crownfallDebug().match.result,null);assert.equal(window.crownfallDebug().paused,false);assert.equal(errors.length,0);assert.ok(uploads>100);
});