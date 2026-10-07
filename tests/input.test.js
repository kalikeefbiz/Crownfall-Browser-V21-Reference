import test from 'node:test';
import assert from 'node:assert/strict';
import {InputController} from '../src/input.js';
class Element {
 constructor(){this.handlers={};this.capture=new Set();this.style={};this.classList={add(){},remove(){}};}
 addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
 fire(name,event={}){for(const fn of this.handlers[name]??[])fn({preventDefault(){},...event});}
 querySelector(){return this.knob??=new Element();}
 getBoundingClientRect(){return {left:0,top:0,width:146,height:146};}
 setPointerCapture(id){this.capture.add(id);}
 hasPointerCapture(id){return this.capture.has(id);}
 releasePointerCapture(id){this.capture.delete(id);this.fire('lostpointercapture',{pointerId:id});}
}
function setup(){const move=new Element(),aim=new Element();globalThis.window=new Element();globalThis.document=new Element();document.getElementById=id=>id==='move-stick'?move:aim;return {input:new InputController(),move,aim};}
test('two fingers independently move and aim; releasing aim preserves movement',()=>{const {input,move,aim}=setup();move.fire('pointerdown',{pointerId:1,clientX:125,clientY:73});aim.fire('pointerdown',{pointerId:2,clientX:73,clientY:20});assert.equal(input.read().moveX,1);assert.equal(input.read().aiming,true);assert.ok(input.read().aimZ<0);aim.fire('pointerup',{pointerId:2});assert.equal(input.read().aiming,false);assert.equal(input.read().moveX,1);});
test('cancel and focus loss stop held input',()=>{const {input,move}=setup();move.fire('pointerdown',{pointerId:3,clientX:130,clientY:73});move.fire('pointercancel',{pointerId:3});assert.equal(input.read().moveX,0);window.fire('keydown',{code:'KeyW'});assert.equal(input.read().moveZ,-1);window.fire('blur');assert.equal(input.read().moveZ,0);});
test('unrelated finger does not release an owned stick',()=>{const {input,move}=setup();move.fire('pointerdown',{pointerId:1,clientX:125,clientY:73});move.fire('pointerup',{pointerId:2});assert.equal(input.read().moveX,1);move.fire('lostpointercapture',{pointerId:1});assert.equal(input.read().moveX,0);});
test('paused input yields no commands',()=>{const {input}=setup();window.fire('keydown',{code:'KeyD'});input.enabled=false;assert.equal(input.read().moveX,0);});
test('screen diagonal maps to matching projected direction at bounded speed',()=>{const {input,move}=setup();move.fire('pointerdown',{pointerId:1,clientX:130,clientY:130});const c=input.read();assert.ok(Math.abs(c.moveX-c.moveZ*.65)<1e-9);assert.ok(Math.abs(Math.hypot(c.moveX,c.moveZ)-1)<1e-9);});
test('small center drift is ignored',()=>{const {input,move}=setup();move.fire('pointerdown',{pointerId:1,clientX:74,clientY:74});assert.equal(input.read().moveX,0);assert.equal(input.read().moveZ,0);});