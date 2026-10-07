import assert from 'node:assert/strict';
import fs from 'node:fs';
const seams=JSON.parse(fs.readFileSync(new URL('./controlled-feel-seams.json',import.meta.url)));
export function withoutControlledFeel(source,file){
 const path=file.includes('.')?file:'src/'+file+'.js';
 for(const [before,after] of [...(seams[path]||[])].reverse()){
  assert.equal(source.split(after).length-1,1,'Exact approved control/presentation seam: '+file);
  source=source.replace(after,before);
 }
 return source;
}
export function beforeReadability(value){
 const copy=structuredClone(value);
 for(const d of copy.animations?[copy]:Object.values(copy)){
  if(d.scale===2.6){d.scale=2;d.offset=[0,.62];}
  else if(d.scale===2.86){d.scale=2.2;d.offset=[0,.77];}
 }
 return copy;
}