import test from 'node:test';
import assert from 'node:assert/strict';
import {direction,resolvePosition,angleDelta,easeAngle} from './movement.mjs';
test('Diagonal input is no faster than walking straight',()=>{const d=direction(1,-1,0);assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<1e-9);});
test('Forward follows an orbited camera',()=>{const d=direction(0,-1,Math.PI/2);assert.ok(Math.abs(d.x+1)<1e-9);assert.ok(Math.abs(d.z)<1e-9);});
test('Joystick preserves partial movement and zero input is stable',()=>{assert.deepEqual(direction(0,0,2),{x:0,z:0});assert.equal(direction(.3,0,0).x,.3);});
test('Obstacle contacts stop at the player radius and handle exact centers',()=>{for(const x of [0,.5,1]){const p=resolvePosition(x,0,[{x:0,z:0,r:1}]);assert.ok(Math.hypot(p.x,p.z)>=1.28-1e-9);}});
test('Walking stays inside the garden boundary',()=>{const p=resolvePosition(50,50,[]);assert.ok(Math.abs(Math.hypot(p.x,p.z)-23)<1e-9);});
test('Turning crosses the angle seam via the short route',()=>{assert.ok(Math.abs(angleDelta(Math.PI-.1,-Math.PI+.1)-.2)<1e-9);});

test('Camera follow eases along the shortest turn without overshooting',()=>{
 const start=Math.PI-.1,target=-Math.PI+.1;
 const next=easeAngle(start,target,2.8,1/60);
 assert.ok(next>start&&next<start+.2);
});
test('Camera follow is independent of frame rate',()=>{
 let a=0,b=0;
 for(let i=0;i<30;i++)a=easeAngle(a,1.5,2.8,1/30);
 for(let i=0;i<60;i++)b=easeAngle(b,1.5,2.8,1/60);
 assert.ok(Math.abs(a-b)<1e-9);
});
