import * as THREE from 'three';

export function addEnvironment(scene,solid,materials){
 const water=new THREE.MeshStandardMaterial({color:0x77b9ba,roughness:.24,metalness:.15,transparent:true,opacity:.8});
 const birdMaterial=new THREE.MeshStandardMaterial({color:0x77858a,roughness:1});
 const beakMaterial=new THREE.MeshStandardMaterial({color:0xc39550});
 function part(parent,geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const fountain=new THREE.Group();fountain.position.set(-8,0,-12);scene.add(fountain);solid(-8,-12,1.9);
 part(fountain,new THREE.CylinderGeometry(1.9,2,.22,48),materials.stone,0,.11,0);
 const rim=part(fountain,new THREE.TorusGeometry(1.65,.22,10,64),materials.stone,0,.48,0);rim.rotation.x=Math.PI/2;
 part(fountain,new THREE.CylinderGeometry(1.62,1.62,.04,48),water,0,.4,0);
 part(fountain,new THREE.CylinderGeometry(.2,.4,1.3,16),materials.stone,0,.8,0);
 part(fountain,new THREE.CylinderGeometry(.65,.25,.22,32),materials.stone,0,1.5,0);
 const drops=[];
 for(let i=0;i<48;i++)drops.push(part(fountain,new THREE.SphereGeometry(.035,5,4),water,0,0,0));
 const ripples=[];
 for(let i=0;i<3;i++){const r=part(fountain,new THREE.TorusGeometry(1,.012,4,48),water,0,.43,0);r.rotation.x=Math.PI/2;ripples.push(r);}
 const bin=new THREE.Group();bin.position.set(7,0,10);scene.add(bin);solid(7,10,.62);
 part(bin,new THREE.CylinderGeometry(.52,.45,1.1,20),materials.dark,0,.62,0);
 part(bin,new THREE.CylinderGeometry(.58,.58,.12,24),materials.stone,0,1.22,0);
 part(bin,new THREE.BoxGeometry(.55,.15,.04),materials.bark,0,1.01,.51);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;part(bin,new THREE.BoxGeometry(.045,.86,.045),materials.green,Math.sin(a)*.49,.61,Math.cos(a)*.49);}
 const birds=[];
 for(let i=0;i<6;i++){
  const root=new THREE.Group();scene.add(root);const body=part(root,new THREE.SphereGeometry(.16,10,8),birdMaterial,0,.2,0);body.scale.set(.85,1,1.5);
  part(root,new THREE.SphereGeometry(.11,10,8),materials.dark,0,.36,.14);
  const beak=part(root,new THREE.ConeGeometry(.045,.12,6),beakMaterial,0,.34,.27);beak.rotation.x=Math.PI/2;
  const wings=[-1,1].map(side=>{const w=part(root,new THREE.SphereGeometry(.12,8,6),materials.dark,side*.13,.22,-.015);w.scale.set(.3,.7,1.7);return w;});
  birds.push({root,wings,x:12+Math.cos(i*2.4)*1.4,z:9+Math.sin(i*2.4)*1.4,flight:0});
 }
 return (time,dt,player,reduced)=>{
  drops.forEach((d,i)=>{const t=(time*.65+i/48)%1,a=i*2.39996;d.position.set(Math.cos(a)*t*1.4,1.65+1.6*t-2.85*t*t,Math.sin(a)*t*1.4);});
  ripples.forEach((r,i)=>r.scale.setScalar(.3+((time*.3+i/3)%1)*1.2));
  birds.forEach((b,i)=>{const near=Math.hypot(player.x-b.x,player.z-b.z)<2.5;b.flight=THREE.MathUtils.damp(b.flight,near?1:0,2,dt);const t=time+i*1.8;
   b.root.position.set(b.x+Math.sin(t*.7)*.3+b.flight*Math.cos(i)*1.4,.035+(reduced?0:Math.max(0,Math.sin(t*3))*.1)+b.flight*1.5,b.z+Math.cos(t*.6)*.3+b.flight*Math.sin(i)*1.4);
   b.root.rotation.y=Math.sin(t*.6)*1.5+i;
   b.wings.forEach((w,j)=>w.rotation.z=(j?1:-1)*(b.flight*.9+(reduced?0:Math.sin(t*24)*b.flight*.7)));
  });
 };
}
