const vm=require('node:vm'), fs=require('node:fs'), assert=require('node:assert/strict');
const elements=new Map();
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function element(id){if(!elements.has(id))elements.set(id,{open:false,hidden:false,textContent:'',innerHTML:'',getContext:()=>context,getBoundingClientRect:()=>({width:1200,height:740}),querySelectorAll:()=>[],showModal(){this.open=true},close(){this.open=false},focus(){},setAttribute(){},addEventListener(){}});return elements.get(id);}
const sandbox={console,document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},ResizeObserver:class{observe(){}},matchMedia:()=>({matches:false}),requestAnimationFrame(){}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),sandbox);
vm.runInContext(`
function reachable(start,goal,blocked,bounds){
 const step=8,queue=[[Math.round(start.x/step),Math.round(start.y/step)]],seen=new Set();
 for(let i=0;i<queue.length;i++){const [gx,gy]=queue[i],x=gx*step,y=gy*step,key=gx+','+gy;if(seen.has(key))continue;seen.add(key);if(x<0||y<0||x>bounds.w||y>bounds.h||blocked(x,y))continue;if(goal(x,y))return true;queue.push([gx+1,gy],[gx-1,gy],[gx,gy+1],[gx,gy-1]);}return false;
}
globalThis.results=[];
for(const b of STUDIOS){
 results.push([b.id+' reachable door',reachable({x:720,y:580},(x,y)=>Math.hypot(x-b.x-b.w/2,y-b.y-20)<35,townBlocked,world)]);
 player.x=b.x+b.w/2;player.y=b.y+30;results.push([b.id+' door interaction',proximity()?.type==='door']);interact();results.push([b.id+' entered',room===b]);
 results.push([b.id+' reachable exhibit',reachable(player,(x,y)=>Math.hypot(x-400,y-272)<55,roomBlocked,{w:800,h:620})]);
 drawRoom();player.x=400;player.y=279;interact();results.push([b.id+' collected',visited.has(b.id)]);$('#conversation').close();interact();$('#conversation').close();
 player.x=400;player.y=490;interact();results.push([b.id+' exited safely',room===null&&!townBlocked(player.x,player.y)]);
}
for(const id of ['graphics','mapping']){
 room=STUDIOS.find(b=>b.id===id);
 results.push([id+' empty floor beside bench is walkable',!roomBlocked(310,420)&&!roomBlocked(450,420)]);
 results.push([id+' bench still solid',roomBlocked(380,425)]);
 results.push([id+' immediately above bench is walkable',!roomBlocked(380,400)]);
 results.push([id+' can walk around both ends of bench',reachable({x:330,y:450},(x,y)=>Math.hypot(x-440,y-390)<10,roomBlocked,{w:800,h:620})]);
}
for(const b of STUDIOS){room=b;results.push([b.id+' empty side aisles are walkable',!roomBlocked(260,300)&&!roomBlocked(535,300)]);}
room=STUDIOS.find(b=>b.id==='audio');results.push(['keyboard still blocks its actual footprint',roomBlocked(400,410)]);
room=null;
results.push(['trees and canopies clear every road and sidewalk',trees.every(t=>treeClearOfPaths(t.x,t.y))]);
results.push(['southern road excludes vegetation',isReserved(800,930)]);
results.push(['west sidewalk excludes vegetation',isReserved(190,800)]);
results.push(['east sidewalk excludes vegetation',isReserved(1140,860)]);
results.push(['tree canopy clearance catches overhang',!treeClearOfPaths(800,1020)]);
results.push(['five unique stamps',visited.size===5]);
results.push(['lake blocks movement',townBlocked(900,710)]);
results.push(['world boundary blocks movement',townBlocked(-1,500)]);
results.push(['spawn safe',!townBlocked(720,580)]);
drawTown();frame(100);view.w=280;view.h=300;enter(STUDIOS[0]);frame(150);results.push(['small-screen player visible',player.y-camera.y>0&&player.y-camera.y<view.h]);
room=null;visited.clear();results.push(['boss locked before stamps',startBattle()===false]);
STUDIOS.forEach(b=>visited.add(b.id));
player.x=900;player.y=868;results.push(['boss interaction unlocked',proximity()?.type==='boss']);
results.push(['boss starts after five stamps',startBattle()===true]);
const before=JSON.stringify(battleState);battleTurn('invalid');results.push(['invalid move does not consume turn',JSON.stringify(battleState)===before]);
battleTurn('xr');results.push(['shield blocks counterattack',battleState.hp===100&&battleState.bossHp===108]);
closeBattle();results.push(['retreat closes encounter',!$('#battle').open&&battleState===null]);
startBattle();for(let i=0;i<10;i++)battleTurn('web');results.push(['defeat available without softlock',battleState.result==='lose'&&!bossDefeated&&visited.size===5]);
const lost=JSON.stringify(battleState);battleTurn('audio');results.push(['defeat prevents extra turns',JSON.stringify(battleState)===lost]);closeBattle();
startBattle();results.push(['retry restores health',battleState.hp===100&&battleState.bossHp===120]);
for(const id of ['mapping','graphics','xr','audio','web','graphics'])battleTurn(id);
results.push(['five-skill strategy wins',battleState.result==='win'&&bossDefeated&&battleState.bossHp===0]);
results.push(['champion appears in quest status',$('#progress').textContent==='Prairie Champion!']);
closeBattle();results.push(['completed boss cannot restart',startBattle()===false]);
`,sandbox);
for(const [label,pass] of sandbox.results)assert.ok(pass,label);
console.log(`${sandbox.results.length} game checks passed: routes, collisions, transitions, stamps, drawing and small-screen camera.`);
