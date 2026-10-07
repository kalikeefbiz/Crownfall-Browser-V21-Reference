import {CONFIG} from './config.js';
export class InputController {
  constructor(){
    this.keys=new Set();this.enabled=true;this.sticks={};
    for(const id of ['move','aim']) {
      const el=document.getElementById(id+'-stick');
      const s=this.sticks[id]={el,knob:el.querySelector('.knob'),pointer:null,x:0,z:0};
      el.addEventListener('pointerdown',e=>{if(!this.enabled||s.pointer!==null)return;e.preventDefault();s.pointer=e.pointerId;el.setPointerCapture(e.pointerId);this.updateStick(s,e);});
      el.addEventListener('pointermove',e=>{if(e.pointerId===s.pointer)this.updateStick(s,e);});
      const release=e=>{if(e.pointerId===s.pointer)this.release(s);};
      el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
    }
    window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(this.enabled)this.keys.add(e.code);}});
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>this.clear());
    window.addEventListener('resize',()=>this.clear());
    document.addEventListener('visibilitychange',()=>this.clear());
  }
  updateStick(s,e){const r=s.el.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,z=e.clientY-r.top-r.height/2;
    const max=r.width*0.31,l=Math.hypot(x,z),mag=Math.min(1,l/max),dead=CONFIG.input.deadzone;
    s.x=l&&mag>dead?x/l*(mag-dead)/(1-dead):0;s.z=l&&mag>dead?z/l*(mag-dead)/(1-dead):0;
    if(l>max){x=x/l*max;z=z/l*max;}s.knob.style.transform=`translate(${x}px,${z}px)`;s.el.classList.add('active');
  }
  release(s){const old=s.pointer;s.pointer=null;s.x=s.z=0;s.knob.style.transform='';s.el.classList.remove('active');if(old!==null&&s.el.hasPointerCapture(old))s.el.releasePointerCapture(old);}
  clear(){this.keys.clear();Object.values(this.sticks).forEach(s=>this.release(s));}
  read(){if(!this.enabled)return {moveX:0,moveZ:0,aiming:false};
    const k=this.keys,m=this.sticks.move,a=this.sticks.aim;
    const x=(k.has('KeyD')||k.has('ArrowRight')?1:0)-(k.has('KeyA')||k.has('ArrowLeft')?1:0);
    const z=(k.has('KeyS')||k.has('ArrowDown')?1:0)-(k.has('KeyW')||k.has('ArrowUp')?1:0);
    // Convert screen direction to ground-plane direction, preserving analog magnitude.
    const sx=x||m.x, sz=z||m.z, magnitude=Math.min(1,Math.hypot(sx,sz));
    const groundLength=Math.hypot(sx,sz/CONFIG.camera.tiltSin);
    return {moveX:groundLength?sx/groundLength*magnitude:0,moveZ:groundLength?sz/CONFIG.camera.tiltSin/groundLength*magnitude:0,aiming:Math.hypot(a.x,a.z)>0.01,aimX:a.x,aimZ:a.z/CONFIG.camera.tiltSin};
  }
}