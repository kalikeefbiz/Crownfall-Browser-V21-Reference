// Keep the M7 byte guard for the whole entrypoint after removing only these exact
// five approved UX seams. Any other entrypoint or gameplay change still fails.
import assert from 'node:assert/strict';
export function withoutM8UX(source){
 const seams=[
 ["import {GameUX} from './game-ux.js';\n",''],
 [' const ux=new GameUX({getState:()=>({match,sim,started,paused}),input,abilities});\n',''],
 ['function frame(now){ux.beforeFrame();if(!ux.rendersArena){last=now;acc=0;ux.afterFrame(now);requestAnimationFrame(frame);return;}const elapsed=','function frame(now){const elapsed='],
 ['feedback.presentUI();ux.afterFrame(now);requestAnimationFrame(frame);','feedback.presentUI();requestAnimationFrame(frame);'],
 ['window.crownfallDebug=()=>({ux:ux.state,tick:','window.crownfallDebug=()=>({tick:']
 ];
 for(const [addition,original]of seams){assert.equal(source.split(addition).length,2,'Expected exactly one approved M8 entry seam');source=source.replace(addition,original);}return source;
}