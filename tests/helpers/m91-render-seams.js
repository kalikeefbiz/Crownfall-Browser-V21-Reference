import {withoutM92Presentation} from './m92-presentation-seams.js';
import assert from 'node:assert/strict';
export function withoutM91Presentation(source){
 source=withoutM92Presentation(source,'renderer');
 assert.equal(source.split('this.art.render(map,camera,w/h,combat?.match?.rules);').length-1,1);source=source.replace('this.art.render(map,camera,w/h,combat?.match?.rules);','this.art.render(map,camera,w/h);');
 assert.equal(source.split("      for(const z of map.arena.spawnOffsets){").length-1,1);source=source.replace("      for(const z of map.arena.spawnOffsets){","      m.box(side*map.arena.spawnX,.055,0,3.6,.012,lw,'#243c46');\n      for(const z of map.arena.spawnOffsets){");
 assert.equal(source.split("for(const z of map.arena.spawnOffsets){m.box").length-1,1);source=source.replace("for(const z of map.arena.spawnOffsets){m.box","for(const z of map.arena.spawnOffsets){m.box(side*map.arena.spawnX,.075,z,2.1,.012,2.1,'#344d58');m.box");
return source;
}