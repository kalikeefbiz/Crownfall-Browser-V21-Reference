import {withoutM91Presentation} from './m91-render-seams.js';
import assert from 'node:assert/strict';
export function withoutM86Art(source){
 source=withoutM91Presentation(source);
 assert.equal(source.split("import {ArenaArt} from './arena-art.js';\n").length-1,1);source=source.replace("import {ArenaArt} from './arena-art.js';\n","");
 assert.equal(source.split("this.art=new ArenaArt(gl);gl.useProgram(this.program);\n    ").length-1,1);source=source.replace("this.art=new ArenaArt(gl);gl.useProgram(this.program);\n    ","");
 assert.equal(source.split("gl.disableVertexAttribArray(this.pos);gl.disableVertexAttribArray(this.col);this.art.render(map,camera,w/h);gl.useProgram(this.program);").length-1,1);source=source.replace("gl.disableVertexAttribArray(this.pos);gl.disableVertexAttribArray(this.col);this.art.render(map,camera,w/h);gl.useProgram(this.program);","");
 assert.equal(source.split("for(const z of [-lane.halfWidth+.15,lane.halfWidth-.15]){m.box((lane.goalA+front)/2,.085,z,front-lane.goalA,.008,.3,'#428ca0');m.box((front+lane.goalB)/2,.085,z,lane.goalB-front,.008,.3,'#ae596d');}").length-1,1);source=source.replace("for(const z of [-lane.halfWidth+.15,lane.halfWidth-.15]){m.box((lane.goalA+front)/2,.085,z,front-lane.goalA,.008,.3,'#428ca0');m.box((front+lane.goalB)/2,.085,z,lane.goalB-front,.008,.3,'#ae596d');}","m.box((lane.goalA+front)/2,.085,0,front-lane.goalA,.008,lane.halfWidth*2,'#294c55');m.box((front+lane.goalB)/2,.085,0,lane.goalB-front,.008,lane.halfWidth*2,'#573a45');");
 return source;
}