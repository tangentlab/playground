import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {addEnvironment} from './environment.js';
import {addNight,nightPlaces} from './night.js';
import {gardenAudio} from './audio.js';
import {direction,resolvePosition,angleDelta,easeAngle} from './movement.mjs';
const $=s=>document.querySelector(s),world=$('#world');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e7e8de');scene.fog=new THREE.Fog('#e7e8de',24,65);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,100);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;world.append(renderer.domElement);
renderer.domElement.setAttribute('aria-label','3D garden. Use WASD or arrow keys to walk, and drag to orbit.');renderer.domElement.tabIndex=0;
const night=new URLSearchParams(location.search).get('level')==='night';
const obstacles=[];
function solid(x,z,r){obstacles.push({x,z,r});}
function buildGarden(){
scene.add(new THREE.HemisphereLight(0xfff7df,0x687857,2.4));
const sun=new THREE.DirectionalLight(0xffeed5,3.2);sun.position.set(-8,16,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:60});sun.shadow.normalBias=.025;scene.add(sun);
const materials={sand:new THREE.MeshStandardMaterial({color:0xdad6bf,roughness:1}),stone:new THREE.MeshStandardMaterial({color:0xece7d7,roughness:.85}),clay:new THREE.MeshStandardMaterial({color:0xb76345,roughness:.8}),green:new THREE.MeshStandardMaterial({color:0x63795a,roughness:1}),bark:new THREE.MeshStandardMaterial({color:0x82735b,roughness:1}),dark:new THREE.MeshStandardMaterial({color:0x536454,roughness:.75})};
function mesh(geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:0xc1c7ae,roughness:1}),0,-.035,0).rotation.x=-Math.PI/2;
mesh(new THREE.CylinderGeometry(24,24,0.06,96),materials.sand,0,-.005,0);
// Fine concentric paving lines make movement legible without a busy grid.
for(const radius of [4,8,12,16,20,23.7]){const ring=mesh(new THREE.RingGeometry(radius,radius+.025,128),new THREE.MeshBasicMaterial({color:0xbabda5,side:THREE.DoubleSide}),0,.031,0);ring.rotation.x=-Math.PI/2;}
function tree(x,z,size=1){mesh(new THREE.CylinderGeometry(.1,.16,1.8,7),materials.bark,x,.9,z);const crown=mesh(new THREE.IcosahedronGeometry(1.2,1),materials.green,x,2.6,z);crown.scale.set(size,1.1*size,size);solid(x,z,.28);}
for(let i=0;i<29;i++){const t=i*2.39996,r=25+(i%5)*2;tree(Math.cos(t)*r,Math.sin(t)*r,.85+(i%4)*.16);}
for(const [x,z] of [[-6,-3],[8,2],[-10,7],[5,-12],[-14,-9],[13,-8]]){
 mesh(new THREE.CylinderGeometry(1.25,1.1,.35,32),materials.stone,x,.175,z);mesh(new THREE.CylinderGeometry(1.12,1.12,.03,32),materials.green,x,.36,z);solid(x,z,1.25);
 const crown=mesh(new THREE.IcosahedronGeometry(.8,1),materials.green,x,1.55,z);crown.scale.y=1.3;mesh(new THREE.CylinderGeometry(.075,.12,1.35,8),materials.bark,x,1,z);
}
// The portal: open middle, with separate collisions for its two legs.
const portal=new THREE.Shape();portal.moveTo(-1.8,0);portal.lineTo(-1.8,2.4);portal.absarc(0,2.4,1.8,Math.PI,0,true);portal.lineTo(1.8,0);portal.lineTo(1.2,0);portal.lineTo(1.2,2.4);portal.absarc(0,2.4,1.2,0,Math.PI,false);portal.lineTo(-1.2,0);portal.closePath();
mesh(new THREE.ExtrudeGeometry(portal,{depth:.6,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.04,curveSegments:32}),materials.clay,0,.03,-10);
solid(-1.5,-9.7,.4);solid(1.5,-9.7,.4);
// A stacked stone sculpture and a low bench form the other destinations.
mesh(new THREE.CylinderGeometry(1.6,1.6,.2,40),materials.stone,10,.1,-3);solid(10,-3,1.6);
for(const [y,r,sx] of [[.65,.8,1.3],[1.65,.7,.8],[2.6,.62,1.2]]){const rock=mesh(new THREE.IcosahedronGeometry(r,1),materials.dark,10,y,-3);rock.scale.x=sx;rock.rotation.z=y*.3;}
mesh(new THREE.BoxGeometry(3.5,.25,.85),materials.stone,-10,.65,11);solid(-10,11,1.8);
for(const x of [-11.25,-8.75])mesh(new THREE.BoxGeometry(.25,.6,.65),materials.clay,x,.3,11);
function marker(text,x,z){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#ece7d7';ctx.fillRect(0,0,256,128);ctx.fillStyle='#52624e';ctx.font='44px sans-serif';ctx.textAlign='center';ctx.fillText(text,128,78);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const sign=mesh(new THREE.BoxGeometry(.65,.34,.04),new THREE.MeshStandardMaterial({map:t}),x,.9,z);mesh(new THREE.CylinderGeometry(.025,.025,.75,8),materials.dark,x,.4,z);}
marker('01',-2.6,-8.8);marker('02',8,-1.8);marker('03',-7.5,10.5);
marker('04',-5.7,-10.8);marker('05',6,10.8);marker('06',11,11);
return addEnvironment(scene,solid,materials);
}
const updateEnvironment=night?addNight(scene,solid):buildGarden();
if(night){
 document.body.classList.add('night');document.title='Ryan, after hours — Playground';
 $('.intro .eyebrow').textContent='A LITTLE FURTHER AFTER DARK';$('.intro h1').innerHTML='Ryan,<br>after hours.';$('.intro>p:not(.eyebrow)').innerHTML='Follow the frequencies.<br>Find your own rhythm.';
 $('.edition b').textContent='002';$('.field-notes .eyebrow').textContent='AROUND THE NIGHT LAB';
 $('.field-notes ol').innerHTML=nightPlaces.map((p,i)=>`<li data-place="${i}"><span>0${i+1}</span>${p.name}<b>○</b></li>`).join('');
 $('#location').textContent='NIGHT LAB ↗';$('#loading-text').textContent='Tuning in to the night…';
 $('#world').setAttribute('aria-label','An interactive neon music courtyard');renderer.domElement.setAttribute('aria-label','3D night courtyard. Use WASD or arrow keys to walk, and drag to orbit.');
 $('#sound').title='Toggle electronic music and footsteps';
}
 document.querySelectorAll('[data-level]').forEach(a=>{if(a.dataset.level===(night?'night':'garden'))a.setAttribute('aria-current','page');});
const updateAudio=gardenAudio($('#sound'),night);
const player=new THREE.Group();scene.add(player);player.position.set(0,.035,3);player.rotation.y=Math.PI;
let jumpAction,jumpElapsed=0,jumping=false;
let mixer,walk,idle,ready=false,walking=false,speed=0,yaw=0,pitch=.32,distance=6.5,last=0;
const WALK_SPEED=1.7, BOOST_SPEED=3.0;
let boostToggled=true;
let movementYaw=0, inputHeading=null, orbitGrace=0;
const keys=new Set(),touch={x:0,z:0},velocity=new THREE.Vector3(),aim=new THREE.Vector3(),offset=new THREE.Vector3();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function loadFailed(e){console.error(e);$('#loading-text').textContent='Ryan could not load. Check your connection and try again.';$('#progress').hidden=true;$('#retry').hidden=false;}
new GLTFLoader().load('./assets/ryan-flip.glb?v=1',gltf=>{
 player.add(gltf.scene);gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;if(o.material.map)o.material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}});
 mixer=new THREE.AnimationMixer(gltf.scene);
 const walkClip=gltf.animations.find(a=>a.name==='Walk'),idleClip=gltf.animations.find(a=>a.name==='Idle');
 if(!walkClip||!idleClip){loadFailed(new Error('Missing character animations'));return;}
 walk=mixer.clipAction(walkClip);idle=mixer.clipAction(idleClip);idle.play();
 const jumpClip=gltf.animations.find(a=>a.name==='FlipJump');
 if(!jumpClip){loadFailed(new Error('Missing flip animation'));return;}
 jumpAction=mixer.clipAction(jumpClip);jumpAction.setLoop(THREE.LoopOnce,1);jumpAction.clampWhenFinished=true;$('#jump').disabled=false;
 ready=true;$('#loading').classList.add('done');$('#status').textContent='Ready when you are';
},e=>{if(e.total){$('#progress').max=e.total;$('#progress').value=e.loaded;}},loadFailed);
function startJump(){
 if(!ready||jumping||!$('#guide').hidden)return;
 jumping=true;jumpElapsed=0;$('#jump').disabled=true;
 const from=walking?walk:idle;jumpAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();from.crossFadeTo(jumpAction,.08,false);
}
$('#jump').onclick=()=>{startJump();renderer.domElement.focus({preventScroll:true});};
const movementKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
addEventListener('keydown',e=>{if(e.code==='Space'&&!['BUTTON','A','INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();if(!e.repeat)startJump();}if(e.code==='ShiftLeft'||e.code==='ShiftRight')keys.add(e.code);if(movementKeys.includes(e.code)&&!['BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();keys.add(e.code);}});
addEventListener('keyup',e=>keys.delete(e.code));
function clearInput(){inputHeading=null;keys.clear();touch.x=touch.z=0;$('#stick').style.transform='';}
addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();last=0;}});
let drag=null;
renderer.domElement.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.focus({preventScroll:true});});
renderer.domElement.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const turn=-(e.clientX-drag.x)*.005;yaw+=turn;movementYaw+=turn;orbitGrace=.8;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.004,.12,.9);drag.x=e.clientX;drag.y=e.clientY;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,()=>drag=null);
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance+e.deltaY*.005,3,10);},{passive:false});
let stickId=null;const joystick=$('#joystick');
function moveStick(e){const rect=joystick.getBoundingClientRect();let x=(e.clientX-rect.left-55)/38,z=(e.clientY-rect.top-55)/38;const l=Math.max(1,Math.hypot(x,z));touch.x=x/l;touch.z=z/l;$('#stick').style.transform=`translate(${touch.x*34}px,${touch.z*34}px)`;}
joystick.addEventListener('pointerdown',e=>{stickId=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);});joystick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,()=>{stickId=null;touch.x=touch.z=0;$('#stick').style.transform='';});
$('#boost').onclick=()=>{boostToggled=!boostToggled;$('#boost').setAttribute('aria-pressed',String(boostToggled));renderer.domElement.focus({preventScroll:true});};
$('#help').onclick=()=>{const open=$('#guide').hidden;$('#guide').hidden=!open;$('#help').setAttribute('aria-expanded',String(open));clearInput();};
$('#reset').onclick=()=>{if(jumpAction){jumpAction.stop();walk.stop();idle.reset().play();}jumping=false;jumpElapsed=0;walking=false;$('#jump').disabled=!ready;player.position.set(0,.035,3);player.rotation.y=Math.PI;yaw=0;movementYaw=0;orbitGrace=0;pitch=.32;distance=6.5;velocity.set(0,0,0);boostToggled=true;$('#boost').setAttribute('aria-pressed','true');clearInput();$('#guide').hidden=true;$('#help').setAttribute('aria-expanded','false');renderer.domElement.focus();};
const places=night?nightPlaces:[{x:0,z:-9.7,name:'The portal'},{x:10,z:-3,name:'Balancing act'},{x:-10,z:11,name:'The quiet corner'},{x:-8,z:-12,name:'The fountain'},{x:7,z:10,name:'The garbage can'},{x:12,z:9,name:'The little flock'}],found=new Set();
function animate(ms){
 const dt=Math.min((ms-(last||ms))/1000,.05);last=ms;
 if(ready){
  const inputX=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+touch.x;
  const inputZ=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+touch.z;
  const hasInput=Math.hypot(inputX,inputZ)>.08;
  // Keep a held direction stable while the camera catches up, rather than
  // feeding the camera's own turn back into movement and walking in circles.
  if(hasInput){
   const heading=Math.atan2(inputX,inputZ);
   if(inputHeading===null||Math.abs(angleDelta(inputHeading,heading))>.2){movementYaw=yaw;inputHeading=heading;}
  }else inputHeading=null;
  const input=hasInput?direction(inputX,inputZ,movementYaw):{x:0,z:0};
  orbitGrace=Math.max(0,orbitGrace-dt);
  const boosting=boostToggled||keys.has('ShiftLeft')||keys.has('ShiftRight');
  const targetSpeed=boosting?BOOST_SPEED:WALK_SPEED;
  if(!jumping){velocity.x=THREE.MathUtils.damp(velocity.x,input.x*targetSpeed,10,dt);velocity.z=THREE.MathUtils.damp(velocity.z,input.z*targetSpeed,10,dt);}
  const before=player.position.clone(),next=resolvePosition(before.x+velocity.x*dt,before.z+velocity.z*dt,obstacles);
  player.position.x=next.x;player.position.z=next.z;speed=dt?player.position.distanceTo(before)/dt:0;
  if(speed>.025&&!jumping){const angle=Math.atan2(velocity.x,velocity.z);player.rotation.y+=angleDelta(player.rotation.y,angle)*(1-Math.exp(-12*dt));}
  const moving=speed>.04;
  if(moving&&!drag&&orbitGrace===0)yaw=easeAngle(yaw,player.rotation.y-Math.PI,2.8,dt);
  if(!jumping&&moving!==walking){walking=moving;const from=walking?idle:walk,to=walking?walk:idle;to.reset().play();from.crossFadeTo(to,.2,false);}
  $('#status').textContent=jumping?'Taking a leap':walking?(boosting?'Picking up the pace':'Taking the scenic route'):'Ready when you are';
  walk.timeScale=Math.max(.15,speed/.85);mixer.update(dt);
  if(jumping){jumpElapsed+=dt;if(jumpElapsed>=jumpAction.getClip().duration){jumping=false;walking=moving;const next=walking?walk:idle;next.reset().play();jumpAction.crossFadeTo(next,.14,false);$('#jump').disabled=false;}}
  places.forEach((p,i)=>{if(Math.hypot(player.position.x-p.x,player.position.z-p.z)<3.3&&!found.has(i)){found.add(i);const row=$(`[data-place="${i}"]`);row.classList.add('found');row.querySelector('b').textContent='✓';$('#discovery').textContent=found.size===places.length?'All six found. Stay a little longer.':`${p.name}, found. ${found.size} of ${places.length}.`;}});
 }
 updateEnvironment(ms/1000,dt,player.position,reduced);
 updateAudio(dt,player.position,jumping?0:speed);
 aim.copy(player.position).add(new THREE.Vector3(0,1,0));offset.set(Math.sin(yaw)*distance*Math.cos(pitch),distance*Math.sin(pitch),Math.cos(yaw)*distance*Math.cos(pitch));const desired=aim.clone().add(offset);
 camera.position.lerp(desired,reduced?1:1-Math.exp(-8*(dt||.016)));camera.lookAt(aim);renderer.render(scene,camera);
}
camera.position.set(0,3,9);renderer.setAnimationLoop(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#loading').classList.remove('done');$('#loading-text').textContent='The graphics connection was interrupted. Reload to return to the garden.';$('#progress').hidden=true;$('#retry').hidden=false;});
