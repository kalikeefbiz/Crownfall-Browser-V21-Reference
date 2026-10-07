// DOM/WebGL doubles for lifecycle and input integration, not browser visual QA.
import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync(new URL('../../dist/index.html',import.meta.url),'utf8');
export function boot(width=844,height=390,storage=null){
 const elements=new Map(),errors=[],frames=[];let now=0,uploads=0;
 class Element{
  constructor(){this.handlers={};this.dataset={};this.attrs={};this.flags=new Set();this.children=[];this.parts={};this.capture=new Set();this.style={setProperty(){}};this.classList={add:k=>this.flags.add(k),remove:k=>this.flags.delete(k),toggle:(k,v)=>v?this.flags.add(k):this.flags.delete(k)};this.clientWidth=width;this.clientHeight=height;this.textContent='';this.hidden=false;this.inert=false;}
  set innerHTML(value){this.html=value;this.children=[];this.parts={};}get innerHTML(){return this.html||'';}
  addEventListener(k,f){(this.handlers[k]??=[]).push(f);}emit(k,e={}){const event={preventDefault(){},...e};for(const f of this.handlers[k]||[])f(event);this['on'+k]?.(event);}
  setAttribute(k,v){this.attrs[k]=v;}querySelector(k){return this.parts[k]??=new Element();}append(n){this.children.push(n);n.parentNode=this;}remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);}blur(){}
  get offsetWidth(){if(this.id==='move-control'||this.id==='aim-control')return width<=740?92:104;if(this.dataset.slot!==undefined)return this.dataset.slot==0?66:width<=740?56:58;return 0;}
  getBoundingClientRect(){
   if(this.id==='control-safe-area')return {left:12,top:12,width:width-24,height:height-24};
   if(this.id==='move-stick')return elements.get('move-control').getBoundingClientRect();if(this.id==='aim-stick')return elements.get('aim-control').getBoundingClientRect();
   const size=this.offsetWidth||104;let left=0,top=0;
   if(this.id==='move-control'){left=20;top=height-10-size;}else if(this.id==='aim-control'){left=width-8-size;top=height-10-size;}
   else if(this.dataset.slot!==undefined){const i=Number(this.dataset.slot),right=width<=740?[102,166,142,76,10]:[114,180,152,84,16],bottom=width<=740?[0,50,112,120,116]:[0,52,118,128,122];left=width-8-right[i]-size;top=height-10-bottom[i]-size;}
   if(this.style.position==='fixed'){left=parseFloat(this.style.left);top=parseFloat(this.style.top);}
   const scale=Number(this.style.transform?.match(/scale\(([.\d]+)\)/)?.[1]||1);return {left:left-size*(scale-1)/2,top:top-size*(scale-1)/2,width:size*scale,height:size*scale};}
setPointerCapture(n){this.capture.add(n);}hasPointerCapture(n){return this.capture.has(n);}releasePointerCapture(n){this.capture.delete(n);}
  getContext(kind){return kind==='webgl'?gpu:context2d;}
 }
 const gpu=new Proxy({}, {get:(_,key)=>key==='getShaderParameter'||key==='getProgramParameter'?()=>true:key==='bufferSubData'?()=>uploads++:/^[A-Z_]+$/.test(key)?1:()=>({})});
 const context2d=new Proxy({}, {get:()=>()=>{},set:()=>true});
 for(const match of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){const el=new Element();el.hidden=/\bhidden\b/.test(match[0]);el.value=match[0].match(/\bvalue="([^"]+)"/)?.[1];el.id=match[1];elements.set(match[1],el);}
 const document=new Element();document.body=new Element();document.getElementById=id=>elements.get(id)||null;document.createElement=()=>new Element();
 const window=new Element();window.localStorage=storage;window.matchMedia=()=>new Element();
 const ctx=vm.createContext({window,document,console:{error:e=>errors.push(String(e))},performance:{now:()=>now},requestAnimationFrame:f=>frames.push(f),innerWidth:width,innerHeight:height,devicePixelRatio:2,Float32Array,Math,Map,Set});
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
 const tick=n=>{for(let i=0;i<n;i++){now+=1000/60;const f=frames.shift();if(!f)throw new Error('Animation loop stopped: '+errors.join(','));f(now);}};
 return {el:id=>elements.get(id),click:id=>elements.get(id).onclick(),tick,window,document,errors,get uploads(){return uploads;},debug:()=>JSON.parse(JSON.stringify(window.crownfallDebug()))};
}