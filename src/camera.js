import {CONFIG} from './config.js';
export class FollowCamera {
  constructor(player){this.snap(player);}
  snap(p){this.x=p.x;this.z=p.z;}
  update(p,dt){const t=1-Math.exp(-CONFIG.camera.follow*dt);this.x+=(p.x-this.x)*t;this.z+=(p.z-this.z)*t;}
  project(x,y,z,width,height){const scale=height/(2*CONFIG.camera.halfHeight);return {x:width/2+(x-this.x)*scale,y:height/2+((z-this.z)*CONFIG.camera.tiltSin-y*CONFIG.camera.tiltCos)*scale};}
}