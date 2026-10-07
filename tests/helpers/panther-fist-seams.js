import assert from 'node:assert/strict';
import {withoutPredatoryVisual} from './predatory-visual-seams.js';
import fs from 'node:fs';
const seams=JSON.parse(fs.readFileSync(new URL('./panther-fist-seams.json',import.meta.url)));
export function withoutPantherFist(source,file){
 source=withoutPredatoryVisual(source,file);
 for(const [before,after] of [...(seams[file]||[])].reverse()){
  assert.equal(source.split(after).length-1,1,'Exact Panther Fist presentation seam: '+file);
  source=source.replace(after,before);
 }
 return source;
}