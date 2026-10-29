import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url).pathname;
const listeners={},elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{style:{},textContent:'',innerHTML:'',value:0,paused:true,play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true},setAttribute(){},addEventListener(){},getContext(){return new Proxy({},{get:()=>()=>{}})},querySelector(sel){return element(sel)}});return elements.get(id)}
globalThis.document={getElementById:element,addEventListener:(n,f)=>listeners[n]=f,exitPointerLock(){},pointerLockElement:null};
globalThis.window={addEventListener(){}};globalThis.innerWidth=1200;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;let renderFrame;globalThis.requestAnimationFrame=f=>renderFrame=f;
let source=await readFile(root+'game.js','utf8');source=source.replace("'./vendor/three.module.js'",JSON.stringify('file://'+root+'vendor/three.module.js')).replace('new T.WebGLRenderer({canvas,antialias:true})','new FakeRenderer()');
source=`class FakeRenderer{shadowMap={};setPixelRatio(){}setSize(){}render(s,c){s.updateMatrixWorld();c.updateMatrixWorld();}}\n`+source+`\nexport {enter,pause,collect,reload,camera,scene,animals,supplies};export function state(){return {active,kills,ammo,reserve,hp,boots,scope,ended}};export function setShotReady(){shot=0};`;
const game=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let now=performance.now();function tick(seconds){for(let i=0;i<Math.ceil(seconds/.025);i++){now+=25;renderFrame(now)}}
game.enter();assert.equal(element('soundtrack').paused,false);element('sound').onclick();assert.equal(element('soundtrack').paused,true);element('sound').onclick();assert.equal(element('soundtrack').paused,false);game.pause();assert.equal(element('soundtrack').paused,true);assert.equal(game.state().active,false);game.enter();assert.equal(game.state().active,true);
listeners.mousedown({button:0});tick(.1);assert.equal(game.state().ammo,5);game.reload();tick(1.8);assert.equal(game.state().ammo,6);assert.equal(game.state().reserve,29);
for(const type of ['ammo','boots','scope','tonic','med']){const supply=game.supplies.find(s=>s.type===type);game.camera.position.copy(supply.g.position);game.collect();assert.equal(supply.used,true)}assert.equal(game.state().reserve,47);assert.equal(game.state().boots,true);assert.equal(game.state().scope,true);
listeners.mousedown({button:2});assert.equal(game.camera.fov,32);listeners.mouseup({button:2});assert.equal(game.camera.fov,70);
// Validate real Three.js ray intersections against five animal models.
for(let i=0;i<5;i++){const a=game.animals[i];a.g.position.set(0,0,-8);a.g.rotation.set(0,0,0);game.camera.position.set(0,1.25,-2);game.camera.rotation.set(0,0,0);game.scene.updateMatrixWorld(true);game.camera.updateMatrixWorld(true);game.setShotReady();listeners.mousedown({button:0});assert.equal(a.alive,false,`animal ${i} should be hit`);a.g.position.set(80,0,80);}
assert.equal(game.state().kills,5);game.camera.position.set(0,1.7,1);tick(.1);assert.equal(game.state().ended,true);assert.equal(element('soundtrack').paused,true);assert.match(element('h1').innerHTML,/COMPLETE/);
console.log('PASS: soundtrack start/mute/resume/pause/end, entry, firing, reload accounting, all five supply types, scope zoom, five real raycast hits, camp extraction.');
