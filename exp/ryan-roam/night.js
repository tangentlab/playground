import * as THREE from 'three';

export const nightPlaces=[{x:0,z:-10,name:'The synth lab'},{x:-8,z:-5,name:'The DJ booth'},{x:8,z:-5,name:'The VR station'},{x:-9,z:6,name:'The listening lounge'},{x:9,z:6,name:'The laser array'},{x:0,z:12,name:'The tape archive'}];

export function addNight(scene,solid){
 scene.background=new THREE.Color('#080d23');scene.fog=new THREE.Fog('#080d23',23,65);
 scene.add(new THREE.HemisphereLight(0xa4bcff,0x241b44,1.7));
 const moon=new THREE.DirectionalLight(0xbacfff,2);moon.position.set(-8,16,7);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-25,right:25,top:25,bottom:-25});scene.add(moon);
 const metal=new THREE.MeshStandardMaterial({color:0x242b46,roughness:.45,metalness:.55}),black=new THREE.MeshStandardMaterial({color:0x080d19,roughness:.65}),white=new THREE.MeshStandardMaterial({color:0xcbd6ed}),wood=new THREE.MeshStandardMaterial({color:0x68425c});
 const neon=color=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2});
 const cyan=neon(0x36e8ff),pink=neon(0xff489e),purple=neon(0x9470ff);
 function part(parent,g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(p,m,x,y,z,w,h,d)=>part(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,m,x,y,z,r,h)=>part(p,new THREE.CylinderGeometry(r,r,h,32),m,x,y,z);
 function label(parent,text,x,y,z,color='#7feaff',width=3){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#11192c';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.font='600 44px monospace';ctx.textAlign='center';ctx.fillText(text,384,80);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return box(parent,new THREE.MeshBasicMaterial({map:texture}),x,y,z,width,width/6,.04);}
 cyl(scene,metal,0,-.09,0,24,.18);
 const grid=new THREE.GridHelper(48,32,0x42577e,0x26334e);grid.position.y=.012;scene.add(grid);
 for(const radius of [5,17,23.8]){const ring=part(scene,new THREE.TorusGeometry(radius,.025,6,128),radius===17?pink:cyan,0,.025,0);ring.rotation.x=Math.PI/2;}
 // A distant skyline frames the open courtyard without adding obstacles.
 for(let i=0;i<42;i++){const a=i*2.39996,r=30+i%7,h=3+(i*7%13);box(scene,black,Math.cos(a)*r,h/2,Math.sin(a)*r,2,h,2);box(scene,i%2?cyan:purple,Math.cos(a)*r,h,Math.sin(a)*r,2.02,.035,2.02);}
 const stars=new THREE.BufferGeometry(),points=[];for(let i=0;i<180;i++){const a=i*2.39996;points.push(Math.cos(a)*45,15+(i*13%28),Math.sin(a)*45);}stars.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xb3cfff,size:.07})));
 const reels=[],meters=[],lasers=[];
 function station(i){const p=nightPlaces[i],g=new THREE.Group();g.position.set(p.x,0,p.z);scene.add(g);solid(p.x,p.z,2);cyl(g,metal,0,.12,0,2,.24);const ring=part(g,new THREE.TorusGeometry(1.95,.035,6,64),i%2?pink:cyan,0,.26,0);ring.rotation.x=Math.PI/2;label(g,`0${i+1} / ${['SYNTH LAB','DJ BOOTH','VR STATION','LISTENING','LASER ARRAY','TAPE ARCHIVE'][i]}`,0,2.9,0);return g;}
 function desk(g){box(g,wood,0,1,0,3,.18,1.3);for(const x of [-1.2,1.2])box(g,metal,x,.55,0,.12,1,.9);}
 function speaker(g,x,z){box(g,black,x,1.2,z,.7,1.9,.65);for(const y of [.85,1.6]){const cone=cyl(g,metal,x,y,z+.34,.24,.05);cone.rotation.x=Math.PI/2;const rim=part(g,new THREE.TorusGeometry(.24,.015,6,32),pink,x,y,z+.38);}}
 const synth=station(0);desk(synth);
 box(synth,black,0,1.18,0,2.8,.2,1);for(let i=0;i<24;i++){box(synth,white,-1.3+i*.112,1.3,.27,.102,.06,.42);if(i%7!==2&&i%7!==6)box(synth,black,-1.25+i*.112,1.36,.13,.06,.09,.25);}
 for(let i=0;i<16;i++)cyl(synth,i%4?metal:cyan,-1.25+i*.165,1.35,-.3,.04,.09);
 box(synth,metal,0,1.85,-.4,2.8,.85,.2);for(let i=0;i<24;i++)box(synth,i%3?purple:cyan,-1.25+(i%12)*.225,1.65+Math.floor(i/12)*.35,-.28,.05,.17,.03);
 for(let i=0;i<5;i++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1+i*.4,2,-.23),new THREE.Vector3(-.8+i*.4,1.5,-.03),new THREE.Vector3(-.4+i*.4,1.8,-.23)]);part(synth,new THREE.TubeGeometry(curve,12,.015,5,false),i%2?pink:cyan,0,0,0);}speaker(synth,-2.6,0);speaker(synth,2.6,0);solid(-2.6,-10,.5);solid(2.6,-10,.5);
 const dj=station(1);desk(dj);for(const x of [-.9,.9]){box(dj,black,x,1.18,0,1,.18,1);const record=cyl(dj,metal,x,1.3,0,.4,.04);box(record,pink,.2,.03,0,.2,.015,.025);reels.push(record);cyl(dj,cyan,x,1.33,0,.09,.015);}for(let i=0;i<5;i++){box(dj,white,-.3+i*.15,1.22,0,.02,.025,.55);box(dj,pink,-.3+i*.15,1.25,(i%3)*.1-.1,.08,.06,.08);}
 const vr=station(2);cyl(vr,black,0,.85,0,.75,1.4);const headset=new THREE.Group();headset.position.y=1.95;vr.add(headset);box(headset,white,0,0,0,1,.42,.55);box(headset,black,0,0,.29,.87,.29,.06);box(headset,cyan,0,-.04,.33,.65,.035,.015);const strap=part(headset,new THREE.TorusGeometry(.46,.055,8,32),black,0,.08,-.25);strap.rotation.x=Math.PI/2;for(const x of [-.85,.85]){box(vr,white,x,1.55,.2,.13,.4,.14);part(vr,new THREE.TorusGeometry(.16,.035,8,24),cyan,x,1.8,.2);}
 const lounge=station(3);desk(lounge);box(lounge,black,0,1.5,0,1.8,.8,.5);for(const x of [-.6,.6]){const s=cyl(lounge,metal,x,1.5,.28,.24,.06);s.rotation.x=Math.PI/2;}box(lounge,cyan,0,1.6,.27,.45,.15,.03);box(lounge,metal,0,1.1,.65,.55,.08,.45);box(lounge,pink,0,1.15,.64,.35,.01,.25);for(const x of [-1.1,1.1])box(lounge,wood,x,.55,1.15,.6,.6,.6);
 const laser=station(4);for(const x of [-1.2,1.2]){box(laser,metal,x,1.5,0,.16,2.8,.16);box(laser,black,x,2.5,0,.5,.35,.5);}box(laser,metal,0,2.6,0,2.8,.12,.12);
 // Narrow translucent beams stay above Ryan and move slowly, with no flashes.
 for(let i=0;i<7;i++){const g=new THREE.Group();g.position.set(9+(i%2?1.2:-1.2),2.6,6);scene.add(g);const beam=part(g,new THREE.CylinderGeometry(.015,.055,23,6),new THREE.MeshBasicMaterial({color:i%2?0xff489e:0x36e8ff,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}),0,11.5,0);g.rotation.set(-.9,0,.3);lasers.push(g);}
 const tape=station(5);box(tape,wood,0,1.45,0,2.8,2.3,.6);for(let i=0;i<24;i++){const x=-1.14+(i%8)*.32,y=.6+Math.floor(i/8)*.65;box(tape,i%3?metal:purple,x,y,.34,.26,.48,.15);box(tape,white,x,y+.13,.425,.2,.045,.01);}label(tape,'ANALOG / 024',0,2.7,.35,'#ffa1d1',2);
 for(let i=0;i<12;i++){const b=box(scene,i%2?pink:cyan,-2.2+i*.4,.6,-13,.2,1,.15);meters.push(b);}
 const glow=new THREE.PointLight(0xff49ba,35,18,2);glow.position.set(0,4,-8);scene.add(glow);const fill=new THREE.PointLight(0x39dfff,30,18,2);fill.position.set(7,3,4);scene.add(fill);
 return (time,dt,player,reduced)=>{if(reduced)return;reels.forEach(r=>r.rotation.y=time*.7);headset.position.y=1.95+Math.sin(time*.8)*.08;meters.forEach((b,i)=>{b.scale.y=.4+(Math.sin(time*2+i*.8)+1)*.6;b.position.y=.1+b.scale.y*.5;});lasers.forEach((g,i)=>{g.rotation.z=.4+Math.sin(time*.15+i*.3)*.45;g.rotation.x=-1.1+i*.07;});};
}
