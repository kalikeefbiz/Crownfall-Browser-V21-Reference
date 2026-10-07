import {withoutControlledFeel} from './controlled-feel-seams.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const seams=JSON.parse(fs.readFileSync(new URL('./predatory-visual-seams.json',import.meta.url)));
export function withoutPredatoryVisual(source,file){
 source=withoutControlledFeel(source,file);
 for(const [before,after] of [...(seams[file]||[])].reverse()){
  assert.equal(source.split(after).length-1,1,'Exact Predatory visual seam: '+file);
  source=source.replace(after,before);
 }
 return source;
}