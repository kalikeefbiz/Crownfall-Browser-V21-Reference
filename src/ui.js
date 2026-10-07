import {MAP,CONFIG} from './config.js';
export class SandboxHUD {
  constructor(){this.map=document.getElementById('minimap');this.ctx=this.map.getContext('2d');this.label=document.getElementById('summoner-label');this.last=0;}
  update(player,camera,now,fps,match=null){const pt=camera.project(player.x,2.4,player.z,innerWidth,innerHeight);this.label.style.transform=`translate(${pt.x}px,${pt.y}px)`;
    if(now-this.last<150)return;this.last=now;
    document.getElementById('state').textContent=player.animation==='run'?'MOVING':'IDLE';document.getElementById('fps').textContent=Math.round(fps)+' FPS';
    document.getElementById('position').textContent=`${player.x.toFixed(1)} / ${player.z.toFixed(1)}`;
    const map=match?.map||MAP,lane=match?.lane||{goalA:-21,goalB:21,halfWidth:3.8};const c=this.ctx,w=this.map.width,h=this.map.height,s=w/map.width,sz=h/map.depth,px=x=>(x+map.width/2)*s,pz=z=>(z+map.depth/2)*sz;
    c.fillStyle='#0b1e24';c.fillRect(0,0,w,h);c.fillStyle='#30494f';c.fillRect(0,pz(-lane.halfWidth),w,lane.halfWidth*2*sz);c.fillStyle='#6b848b';for(const r of map.walls)c.fillRect(px(r.x-r.w/2),pz(r.z-r.d/2),r.w*s,r.d*sz);
    c.strokeStyle='#728a90';c.lineWidth=1;const half=CONFIG.camera.halfHeight,halfW=half*innerWidth/innerHeight;c.strokeRect(px(camera.x-halfW),pz(camera.z-half/CONFIG.camera.tiltSin),halfW*2*s,half*2/CONFIG.camera.tiltSin*sz);
    if(match){const front=match.rules.front;c.fillStyle='#315969';c.fillRect(px(lane.goalA),pz(-lane.halfWidth),(front-lane.goalA)*s,lane.halfWidth*2*sz);c.fillStyle='#68434e';c.fillRect(px(front),pz(-lane.halfWidth),(lane.goalB-front)*s,lane.halfWidth*2*sz);c.fillStyle='#eee1b5';c.fillRect(px(front),pz(-lane.halfWidth),1,lane.halfWidth*2*sz);for(const x of [lane.goalA,0,lane.goalB]){c.fillStyle=x===0?'#9faaa8':x<0?'#68c6df':'#d97b8b';c.fillRect(px(x),pz(-lane.halfWidth),1,lane.halfWidth*2*sz);}for(const camp of match.wilderness.camps){c.fillStyle=camp.dead?'#56616b':camp.major?'#ffd877':'#b9e0aa';c.fillRect(px(camp.home.x)-2,pz(camp.home.z)-2,camp.major?6:4,camp.major?6:4);}for(const p of match.entities){if(p.dead)continue;c.fillStyle=p.team===1?'#63ffe0':'#ff7e8a';c.beginPath();c.arc(px(p.x),pz(p.z),p===player?4:3,0,Math.PI*2);c.fill();}return;}
    c.fillStyle='#ff9859';for(const m of MAP.markers){c.beginPath();c.arc(px(m.x),pz(m.z),2,0,Math.PI*2);c.fill();}c.fillStyle='#63ffe0';c.beginPath();c.arc(px(player.x),pz(player.z),4,0,Math.PI*2);c.fill();
  }
}