/* Original Canvas artwork and game code. See ../../docs/summary.md: technical skills showcase. */
'use strict';
const STUDIOS = [
 {id:'web',name:'The Code Exchange',skill:'JavaScript & web development',landmark:'A fictional downtown brick workshop',color:'#c57752',roof:'#5f6761',x:220,y:280,w:182,d:105,h:82,exhibit:'The little browser that could',description:'A tiny browser is running a whole little city. JavaScript, browser APIs and interaction design turn an idea into something you can actually play with.',decor:'CRT workstations, a server rack, code notebooks, a planning board and a coffee-fuelled workbench.',evidence:'Interactive browser experiments and the Bubble Popping game.',project:'../bubbles/',prop:'computer'},
 {id:'xr',name:'Powerhouse Discovery Lab',skill:'3D graphics & XR experiments',landmark:'Inspired by the Saskatchewan Science Centre',color:'#ae6c50',roof:'#826454',x:1170,y:330,w:210,d:118,h:100,exhibit:'A pocket-sized other dimension',description:'Turn the headset on and watch a miniature world float above its pedestal. This room celebrates A-Frame scenes, 3D models and experiments with spatial interaction.',decor:'VR headset pedestal, wireframe cube, model turntables, optical markers, pipes and a tall brick chimney.',evidence:'A-Frame experiments, the personal 3D scene and Gaussian Splat Data Lab.',project:'../aframe/',prop:'headset'},
 {id:'graphics',name:'Prairie Pixel Gallery',skill:'Shaders, particles & animation',landmark:'Inspired by MacKenzie Art Gallery',color:'#e4c98b',roof:'#4c7976',x:235,y:875,w:215,d:100,h:75,exhibit:'The living particle canvas',description:'The gallery has a strict rule: the paintings must never sit still. This one celebrates shaders, particle motion, 3D mathematics and interactive animation.',decor:'Animated particle paintings, colour swatches, sculpture plinths, a shader projection wall and gallery benches.',evidence:'Swarming Particles, the WebGL cube and Gaussian Splat Data Lab.',project:'../exp3/',prop:'particles'},
 {id:'audio',name:'Darke Hall Sound Studio',skill:'Web audio & audio visualization',landmark:'Inspired by Darke Hall',color:'#b16e55',roof:'#3e6769',x:720,y:245,w:192,d:107,h:94,exhibit:'The prairie frequency',description:'Sound becomes shape on this listening desk. The exhibit celebrates Web Audio processing, frequency analysis and music-driven visuals. Sound can be enabled in the toolbar.',decor:'Mixing desk, twin speakers, record shelves, keyboard, acoustic panels and an animated spectrum display.',evidence:'Music Visualizer and Audio Review Tool.',project:'../music-vis/',prop:'spectrum'},
 {id:'mapping',name:'Legislative Map Room',skill:'Civic data & creative mapping',landmark:'Inspired by the Saskatchewan Legislative Building',color:'#dfcc9d',roof:'#719d8c',x:985,y:1020,w:270,d:125,h:90,exhibit:'A city made of connections',description:'Parks become dots. Pathways become lines. The city turns into an explorable story. This room celebrates working with Regina open data, geographic features and interactive visualizations.',decor:'A glowing city-map table, archival map drawers, park specimens, a pathway pinboard, globes and stone columns.',evidence:'Regina Civic Pulse and the map experiment.',project:'../regina-open-data/',prop:'map'}
];
const canvas=document.querySelector('#game'), ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s), keys=new Set(), visited=new Set();
const world={w:1600,h:1230}, player={x:668,y:390,dir:0,walk:0};
let room=null, camera={x:0,y:0}, view={w:960,h:600}, last=0,time=0,near=null,soundEnabled=false,audio=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed=27;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
// Use the same path geometry for drawing and vegetation clearance.
const townPaths=[
 {x:0,y:475,w:1600,h:86},{x:630,y:0,w:78,h:1230},
 {x:150,y:911,w:1350,h:52},{x:1120,y:510,w:56,h:438},
 {x:170,y:300,w:55,h:640},
 ...STUDIOS.map(b=>{const end=b.y<475?490:b.y<600?520:940;return {x:b.x+b.w/2-18,y:Math.min(b.y,end),w:36,h:Math.abs(end-b.y)+14};})
];
function overlapsPath(x,y,left=0,top=0,right=0,bottom=0){return townPaths.some(p=>x+right>=p.x&&x-left<=p.x+p.w&&y+bottom>=p.y&&y-top<=p.y+p.h);}
function treeClearOfPaths(x,y){return !overlapsPath(x,y,52,116,54,16);}
const trees=[];for(let i=0;i<120;i++){let x=50+rnd()*1500,y=80+rnd()*1100;if(!isReserved(x,y)&&treeClearOfPaths(x,y))trees.push({x,y,s:0.8+rnd()*.6});}
const flowers=[];for(let i=0;i<360;i++)flowers.push({x:rnd()*1600,y:rnd()*1230,c:['#f5d270','#f0a594','#eae7b1'][i%3]});
function isReserved(x,y){return overlapsPath(x,y,5,5,5,5)||(x>470&&x<1170&&y>410&&y<830)||(x>610&&x<725)||(y>465&&y<570)||STUDIOS.some(b=>x>b.x-70&&x<b.x+b.w+75&&y>b.y-b.h-b.d-45&&y<b.y+85);}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function poly(points,c){ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function text(t,x,y,size=12,color='#203d3e',align='center'){ctx.font=`bold ${size}px monospace`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(t,Math.round(x),Math.round(y));}
function box(x,y,w,d,h,front,top,side){rect(x,y-h,w,h,front);poly([[x,y-h],[x+12,y-h-d],[x+w+12,y-h-d],[x+w,y-h]],top);poly([[x+w,y],[x+w+12,y-d],[x+w+12,y-h-d],[x+w,y-h]],side||front);}
function shadow(x,y,w){ellipse(x,y,w,10,'#294d4430');}
function tree(t){const {x,y,s}=t;ctx.save();ctx.translate(x,y);ctx.scale(s,s);shadow(4,3,24);rect(-4,-24,8,25,'#775947');rect(-2,-22,3,22,'#a47a54');poly([[-29,-21],[-33,-40],[-24,-63],[-9,-76],[11,-75],[29,-56],[34,-33],[20,-18]],'#3e7655');poly([[-29,-38],[-22,-59],[-9,-69],[10,-69],[25,-53],[22,-38],[7,-30],[-9,-33]],'#58945f');rect(-14,-59,18,6,'#78ad6f');rect(8,-46,15,5,'#6aa465');rect(-25,-34,9,5,'#4b8757');ctx.restore();}
function bench(x,y){shadow(x+18,y,27);rect(x,y-15,39,5,'#8c634b');rect(x,y-23,39,6,'#b98b58');rect(x,y-8,39,5,'#bd905f');rect(x+4,y-5,3,9,'#3e5148');rect(x+32,y-5,3,9,'#3e5148');}
function lamp(x,y){shadow(x,y,10);rect(x-2,y-42,4,43,'#385958');rect(x-7,y-50,14,10,'#f6de93');rect(x-9,y-53,18,4,'#365653');rect(x-5,y-41,10,3,'#365653');}
function bed(x,y,w=70){box(x,y,w,22,5,'#bd9572','#795f45','#8c7256');for(let i=0;i<w;i+=10){rect(x+i+4,y-13,3,6,'#56855b');rect(x+i+2,y-18,7,6,i%20?'#f3c063':'#e69b88');}}
function building(b){const {x,y,w,d,h}=b;poly([[x,y],[x+w+45,y+15],[x+w+55,y-d+20],[x+w,y-d]],'#33554633');box(x,y,w,d,h,b.color,b.roof,'#966c51');rect(x-4,y-h-7,w+8,9,b.roof);rect(x,y-10,w,10,'#a89974');
 for(let i=20;i<w-12;i+=38){if(Math.abs(i-w/2)<23)continue;rect(x+i-3,y-h+19,24,32,'#735e4c');rect(x+i,y-h+22,18,25,'#91c4ba');rect(x+i+2,y-h+23,5,11,'#d2e2c3');rect(x+i+8,y-h+21,2,28,b.color);rect(x+i,y-h+34,18,2,b.color);}
 const dx=x+w/2;rect(dx-13,y-36,26,36,'#435951');rect(dx-9,y-31,18,21,'#e2d392');rect(dx+6,y-17,3,3,'#856d44');rect(dx-19,y,38,5,'#d9cca6');rect(dx-24,y+5,48,5,'#b5ad90');
 if(b.id==='mapping'){for(let j=0;j<6;j++){rect(x+52+j*30,y-62,10,56,'#efe0ba');rect(x+49+j*30,y-66,16,6,'#f7e7c3');}poly([[dx-70,y-h+15],[dx,y-h-17],[dx+70,y-h+15]],'#efdfb8');rect(dx-30,y-h-58,60,44,'#dfcf9c');ellipse(dx,y-h-57,33,25,'#729e88');rect(dx-3,y-h-95,6,15,'#cbcca1');rect(dx+3,y-h-96,17,9,'#bd6755');}
 if(b.id==='xr'){box(x+w-32,y-d-27,23,18,139,'#a36b53','#c58a63','#835a4e');for(let j=0;j<8;j++)rect(x+w-32,y-d-36-j*16,23,2,'#885a48');rect(x+25,y-h-29,75,16,'#9dc5b8');}
 if(b.id==='audio'){poly([[x-8,y-h],[dx,y-h-68],[x+w+8,y-h]],'#43666b');poly([[x+14,y-h-4],[dx,y-h-48],[x+w-14,y-h-4]],'#527a78');ellipse(dx,y-h+22,17,17,'#604c49');ellipse(dx,y-h+22,12,12,'#d7c67c');rect(dx-1,y-h+11,2,22,'#7c684e');rect(dx-11,y-h+21,22,2,'#7c684e');}
 if(b.id==='graphics'){rect(x+22,y-h-17,w-44,10,'#d8d8ad');for(let j=0;j<3;j++)rect(x+25+j*55,y-53,28,34,['#dc8a67','#82bdb6','#e9c66d'][j]);}
 if(b.id==='web'){box(x+20,y-d-h+16,35,20,16,'#536f69','#859889','#405751');}
 const label=b.id==='mapping'?'LEGISLATIVE MAP ROOM':b.id==='xr'?'POWERHOUSE LAB':b.id==='audio'?'DARKE HALL':b.id==='web'?'CODE EXCHANGE':'PIXEL GALLERY';
 const lw=label.length*6+14;rect(dx-lw/2,y-55,lw,15,'#25484b');text(label,dx,y-44,10,'#f6e6b2');
 text(visited.has(b.id)?'◆':'◇',dx,y+24,15,visited.has(b.id)?'#bf7938':'#f9ecc2');
}
function person(x,y,color='#d77762',walk=0,dir=0){shadow(x,y,11);const bob=Math.sin(walk)*1.2;rect(x-6,y-10,5,9+(walk?Math.sin(walk)*2:0),'#344b58');rect(x+2,y-10,5,9-(walk?Math.sin(walk)*2:0),'#344b58');rect(x-8,y-21+bob,16,13,color);rect(x-10,y-18+bob,3,10,'#e9b88a');rect(x+8,y-18+bob,3,10,'#e9b88a');rect(x-6,y-32+bob,13,12,'#efc498');rect(x-7,y-36+bob,15,6,'#714b3a');rect(x-9,y-32+bob,19,3,'#e2ac54');if(dir!==3){rect(x+(dir===1?-4:dir===2?4:-3),y-27+bob,2,2,'#35434b');if(!dir)rect(x+3,y-27+bob,2,2,'#35434b');}}
function goose(x,y,phase){shadow(x,y,10);ellipse(x,y-7,10,6,'#f5e9c4');rect(x+6,y-24,5,18,'#3c4b47');rect(x+5,y-25,8,6,'#3c4b47');rect(x+10,y-22,8,3,'#dcad58');rect(x+6,y-20,4,4,'#f8eccc');rect(x-5,y,2,4,'#b58245');rect(x+3,y,2,4,'#b58245');}
function ground(){rect(0,0,world.w,world.h,'#8bb877');for(let y=0;y<world.h;y+=32)for(let x=0;x<world.w;x+=32){if((x*7+y*13)%96===0)rect(x,y,32,32,'#8fb97a');}
 townPaths.forEach((p,i)=>rect(p.x,p.y,p.w,p.h,i<5?'#d3bf8c':'#dac998'));
 for(let x=0;x<1600;x+=28){rect(x,481,14,2,'#e4d4a7');rect(x+9,550,12,2,'#b6a982');}
 ellipse(900,713,205,129,'#c7c18c');ellipse(900,708,189,115,'#6caaa4');ellipse(900,702,175,103,'#77b9b1');
 for(let i=0;i<30;i++){const x=755+(i*47)%295,y=636+(i*31)%139;if(((x-900)/172)**2+((y-702)/99)**2<.9)rect(x+Math.sin(time+i)*3,y,10+i%12,2,'#a0d1bc');}
 ellipse(945,682,34,17,'#799969');ellipse(945,677,29,14,'#a8bd7d');
 rect(707,699,95,27,'#ad8656');for(let i=0;i<12;i++)rect(708+i*8,700,2,24,'#806b4d');rect(708,694,95,4,'#ddba7e');rect(708,727,95,4,'#80684d');
 for(const f of flowers)if(!isReserved(f.x,f.y)){rect(f.x,f.y,2,3,'#6d9c64');if(f.x%3<1)rect(f.x-1,f.y-2,4,3,f.c);}
 text('W A S C A N A   L A K E',910,768,12,'#315f62');
 // A civic square and fountain.
 rect(443,575,145,142,'#c8bf91');for(let y=580;y<715;y+=20)rect(445,y,140,1,'#aea981');for(let x=452;x<585;x+=24)rect(x,578,1,137,'#aea981');ellipse(515,646,39,23,'#758c7d');ellipse(515,640,39,22,'#e0cda1');ellipse(515,638,30,16,'#7cb8b1');rect(511,605,8,33,'#c9d2b1');ellipse(515,606,18,6,'#e4d8b3');if(!reduced){rect(514,590+Math.sin(time*3)*2,3,17,'#d3eee0');}
}
const propsOutside=[()=>bench(458,744),()=>bench(1025,846),()=>bench(773,567),()=>bed(442,589,38),()=>bed(565,589,22),()=>bed(1000,1090,70),()=>bed(1175,1090,70),()=>lamp(610,453),()=>lamp(610,762),()=>lamp(1105,567),()=>lamp(395,470),()=>tree({x:946,y:678,s:.55})];
function drawTown(){ground();const objects=trees.map(t=>({y:t.y,draw:()=>tree(t)}));for(const b of STUDIOS)objects.push({y:b.y,draw:()=>building(b)});objects.push({y:player.y,draw:()=>person(player.x,player.y,'#cd7155',player.walk,player.dir)});objects.push({y:603,draw:()=>{person(596,603,'#637db0');text('…',596,560,20,'#fff2bd');}});objects.push({y:843,draw:()=>{if(visited.size===5){ctx.save();ctx.translate(900,843);ctx.scale(3,3);goose(0,0,0);ctx.restore();text(bossDefeated?'PRAIRIE CHAMPION':'GOOSE OF WASCANA',900,752,12,'#253f45');}else goose(903+Math.sin(time*.4)*12,843,0);}});objects.push({y:814,draw:()=>goose(848,814,1)});propsOutside.forEach((p,i)=>objects.push({y:[744,846,567,589,589,1090,1090,453,762,567,470,678][i],draw:p}));objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());}
function monitor(x,y,kind,w=68){box(x,y,w,10,39,'#294b50','#68877c','#243f45');rect(x+5,y-34,w-10,26,'#142f3a');if(kind==='map'){for(let i=0;i<4;i++){rect(x+9+i*11,y-30,2,19,'#669987');rect(x+8,y-27+i*5,w-17,1,'#659889');}rect(x+27,y-27,5,5,'#e8bb68');}else if(kind==='spectrum'){for(let i=0;i<9;i++){let h=5+(Math.sin(time*3+i)*.5+.5)*16;rect(x+9+i*6,y-10-h,3,h,['#e5c572','#75beb5','#d88574'][i%3]);}}else if(kind==='particles'){for(let i=0;i<22;i++)rect(x+10+(Math.sin(time+i*7)*.5+.5)*(w-22),y-30+(Math.cos(time*.7+i)*.5+.5)*19,2,2,['#f5be69','#7ed3bc','#db8c8c'][i%3]);}else{for(let i=0;i<4;i++)rect(x+10+i%2*5,y-29+i*5,18+i*3,2,['#81c1ae','#e8be76'][i%2]);}rect(x+w/2-3,y,6,8,'#425e58');rect(x+w/2-12,y+7,24,3,'#789282');}
function shelf(x,y,type){box(x,y,78,15,65,'#8d684e','#c29a69','#6a584a');for(let row=0;row<2;row++){rect(x+5,y-58+row*28,68,21,'#4b5046');for(let i=0;i<9;i++)rect(x+8+i*7,y-56+row*28,5,19,['#83a998','#d1b777','#be8265','#536c79'][(i+row)%4]);}rect(x-2,y-6,82,5,'#c29a69');}
function plant(x,y){box(x-9,y,18,10,18,'#bc825e','#d5a179','#936549');poly([[x,y-19],[x-20,y-43],[x-17,y-49],[x-3,y-32],[x,y-57],[x+8,y-51],[x+8,y-33],[x+24,y-44],[x+22,y-32]],'#68a06c');}
function roomGround(){rect(0,0,800,620,'#142f35');rect(70,120,660,410,'#be9c72');for(let y=130;y<530;y+=25){rect(70,y,660,2,'#a58666');for(let x=80+(y%50?35:0);x<730;x+=70)rect(x,y,2,25,'#ad8b65');}rect(70,58,660,82,room.color);rect(70,130,660,10,'#ddc99b');rect(70,120,12,410,'#6e7961');rect(720,120,10,410,'#586d5e');rect(70,519,305,12,'#6e7961');rect(425,519,305,12,'#6e7961');rect(372,502,56,27,'#e5cd99');rect(220,260,365,172,'#648e89');rect(228,268,349,156,'#749b90');for(let i=0;i<8;i++)rect(237+i*43,275,3,140,'#a4b39a');rect(280,64,240,40,'#284b50');text(room.skill.toUpperCase(),400,89,12,'#f3dda0');text('EXIT ↓',400,555,12,'#dbc992');}
function exhibit(){const r=room;box(329,247,143,40,25,'#957457','#c9aa7a','#795f4f');
 if(r.prop==='headset'){ellipse(400,173,40,13,'#6cc5c33a');box(378,193,42,18,18,'#354f64','#94bdbc','#253f55');rect(382,176,13,9,'#7bd6cd');rect(403,176,13,9,'#7bd6cd');ctx.strokeStyle='#b3dacf';ctx.lineWidth=3;ctx.strokeRect(383,156,33,22);}
 else monitor(365,204,r.prop,72);
 const pulse=reduced?0:Math.sin(time*3)*3;text(visited.has(r.id)?'◆':'◇',400,135+pulse,20,'#ffe09a');
 text('INSPECT EXHIBIT',400,272,10,'#f4ddb0');}
function drawRoom(){roomGround();shelf(108,215);shelf(605,215);plant(120,475);plant(672,475);
 const r=room;
 if(r.id==='web'){box(125,337,125,28,28,'#8d735c','#d4b88a','#77624f');monitor(153,302,'computer');box(593,327,45,28,98,'#354f54','#728b7f','#253f48');for(let i=0;i<5;i++){rect(598,239+i*15,31,9,'#182e39');rect(601,242+i*15,3,3,'#97cfac');}rect(128,83,91,41,'#e6d6aa');for(let i=0;i<6;i++)rect(135+i%3*27,90+Math.floor(i/3)*16,18,10,['#dca875','#85aa92'][i%2]);}
 if(r.id==='audio'){for(const x of [150,575]){box(x,337,53,25,92,'#33464d','#61706b','#26383e');ellipse(x+27,306,17,17,'#1b3138');ellipse(x+27,260,10,10,'#a6ad91');ellipse(x+27,306,7,7,'#b2b18e');}box(287,421,211,28,32,'#70574d','#485b5c','#3b4f51');for(let i=0;i<16;i++){rect(295+i*12,382,10,14,'#e8dbb6');if(i%3)rect(300+i*12,381,4,9,'#253d46');}for(let i=0;i<3;i++){rect(115+i*65,72,43,39,'#765f55');rect(546+i*52,72,36,39,'#765f55');}}
 if(r.id==='graphics'){monitor(121,301,'particles',112);monitor(555,301,'particles',112);box(157,422,46,30,44,'#cbb58a','#ebd7b0','#b69a72');poly([[164,374],[180,333],[201,354],[185,377]],'#d88867');bench(359,428);for(let i=0;i<5;i++)rect(120+i*18,89,13,19,['#d78969','#edc87c','#82bdb2','#627f9c','#b099bd'][i]);}
 if(r.id==='xr'){box(143,365,57,35,40,'#788d7d','#bac8a1','#536f68');ctx.strokeStyle='#b2ded0';ctx.lineWidth=2;const off=reduced?0:Math.sin(time)*6;ctx.strokeRect(151,279+off,35,35);ctx.strokeRect(163,268+off,35,35);for(const [x,y]of [[151,279],[186,279],[151,314],[186,314]]){ctx.beginPath();ctx.moveTo(x,y+off);ctx.lineTo(x+12,y-11+off);ctx.stroke();}monitor(563,329,'particles',88);for(let i=0;i<4;i++){rect(566+i*20,99,12,17,'#465c59');rect(568+i*20,101,5,5,'#d7d9b5');}}
 if(r.id==='mapping'){monitor(140,319,'map',100);box(560,360,94,30,65,'#a0805f','#c3a372','#836c55');for(let i=0;i<4;i++){rect(567,304+i*13,79,10,'#bc9d71');rect(600,307+i*13,15,3,'#796e51');}ellipse(620,267,23,23,'#73b3a7');rect(617,287,6,17,'#816f53');ellipse(622,304,18,4,'#d4c99d');for(const x of [93,694]){rect(x,168,12,180,'#dcd0a7');rect(x-6,161,24,9,'#e8dab7');}bench(362,429);}
 const items=[{y:247,draw:exhibit},{y:player.y,draw:()=>person(player.x,player.y,'#cd7155',player.walk,player.dir)}];items.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());}
function townBlocked(x,y){if(x<30||x>1570||y<45||y>1195)return true;if(((x-900)/195)**2+((y-708)/121)**2<1&&!(x<802&&y>688&&y<742))return true;if(x>474&&x<554&&y>617&&y<672)return true;return STUDIOS.some(b=>x>b.x-9&&x<b.x+b.w+18&&y>b.y-b.d-8&&y<b.y+2)||trees.some(t=>Math.abs(x-t.x)<10&&Math.abs(y-t.y)<8);}
// Collision follows furniture at floor level, not its tall screen-space silhouette.
const floorBox=(x,y,w,d)=>({x,y:y-d,w:w+12,h:d});
const benchFootprint=(x,y)=>({x,y:y-15,w:39,h:19});
const monitorFootprint=(x,y,w)=>({x:x+w/2-12,y:y+5,w:24,h:5});
function roomObstacles(id){
 const common=[floorBox(329,247,143,40),floorBox(108,215,78,15),floorBox(605,215,78,15),floorBox(111,475,18,10),floorBox(663,475,18,10)];
 const furniture={
  web:[floorBox(125,337,125,28),floorBox(593,327,45,28)],
  audio:[floorBox(150,337,53,25),floorBox(575,337,53,25),floorBox(287,421,211,28)],
  graphics:[monitorFootprint(121,301,112),monitorFootprint(555,301,112),floorBox(157,422,46,30),benchFootprint(359,428)],
  xr:[floorBox(143,365,57,35),monitorFootprint(563,329,88)],
  mapping:[monitorFootprint(140,319,100),floorBox(560,360,94,30),benchFootprint(362,429),{x:93,y:340,w:12,h:8},{x:694,y:340,w:12,h:8}]
 };
 return common.concat(furniture[id]||[]);
}
function roomBlocked(x,y){
 if(x<94||x>705||y<152||y>507)return true;
 const radius=5;
 return roomObstacles(room.id).some(o=>{
  const dx=x-Math.max(o.x,Math.min(x,o.x+o.w));
  const dy=y-Math.max(o.y,Math.min(y,o.y+o.h));
  return dx*dx+dy*dy<radius*radius;
 });
}
function proximity(){if(room){if(Math.hypot(player.x-400,player.y-272)<66)return {type:'exhibit',label:'Inspect '+room.exhibit};if(Math.hypot(player.x-400,player.y-498)<54)return {type:'exit',label:'Return to town'};return null;}
 for(const b of STUDIOS)if(Math.hypot(player.x-(b.x+b.w/2),player.y-(b.y+20))<55)return {type:'door',b,label:'Enter '+b.name};if(Math.hypot(player.x-596,player.y-603)<55)return {type:'guide',label:'Talk to the neighbourhood guide'};if(Math.hypot(player.x-900,player.y-843)<45)return visited.size===5?{type:'boss',label:bossDefeated?'Greet the Goose of Wascana':'Challenge the Goose of Wascana'}:{type:'goose',label:'Consult the local expert'};return null;}
function announce(t){$('#announcement').textContent=t;}
function enter(b){room=b;player.x=400;player.y=475;player.walk=0;updateArea();chime();}
function leave(){const b=room;if(!b)return;room=null;player.x=b.x+b.w/2;player.y=b.y+40;updateArea();}
function updateArea(){$('#area').textContent=room?room.name:'Wascana neighbourhood';$('#areaType').textContent=room?'CREATIVE CIRCUIT · '+room.id.toUpperCase():'THE QUEEN CITY';announce(room?'Entered '+room.name:'Returned to town');}
function showDialog(title,body,link){keys.clear();$('#dialogTitle').textContent=title;$('#dialogText').textContent=body;$('#projectLink').hidden=!link;if(link)$('#projectLink').href=link;$('#conversation').showModal();}
function interact(){if($('#battle').open)return;if($('#journal').open)return;if($('#conversation').open){$('#conversation').close();canvas.focus();return;}near=proximity();if(!near)return;if(near.type==='door')enter(near.b);if(near.type==='exit')leave();if(near.type==='guide')showDialog('Welcome to your creative neighbourhood.','Five studios, five little discoveries. Find the diamond at each front door and press E to step inside. Inspect the glowing exhibit for a stamp. Your field guide has the skill list, decoration ideas and directions. Watch out for the geese. They have opinions.');if(near.type==='boss'){if(bossDefeated)showDialog('A champion-sized HONK.','The Goose of Wascana salutes your creative circuit. The lake is peaceful, and your title is Prairie Champion.');else startBattle();}if(near.type==='goose')showDialog('HONK.','The local expert recommends more lakes, fewer meetings, and a strict breadcrumb policy. No stamp here. Just strong civic engagement.');if(near.type==='exhibit'){visited.add(room.id);updateProgress();chime();showDialog(room.exhibit,room.description+(visited.size===5?' Creative circuit complete! The Goose of Wascana awaits on the south shore of the lake. Find the giant goose and press E to challenge it with your five skills.':''),room.project);}}
function updateProgress(){$('#progress').textContent=bossDefeated?'Prairie Champion!':visited.size===5?'Boss unlocked · south shore':`${visited.size} / 5 discoveries`;$('#dots').textContent=STUDIOS.map(b=>visited.has(b.id)?'◆':'◇').join(' ');announce(`${visited.size} of 5 exhibits discovered`);renderGuide();}
function renderGuide(){$('#skillList').innerHTML=STUDIOS.map((b,i)=>`<article class="skill"><span class="stamp">${visited.has(b.id)?'◆ DISCOVERED':'◇ UNDISCOVERED'}</span><div class="meta">0${i+1} · ${b.name.toUpperCase()}</div><h3>${b.skill}</h3><p>${b.landmark}.</p><p><strong>Inside:</strong> ${b.decor}</p><p><strong>Project evidence:</strong> ${b.evidence}</p><button data-location="${b.id}">Find this studio ↗</button></article>`).join('');$('#skillList').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{const b=STUDIOS.find(s=>s.id===btn.dataset.location);$('#journal').close();if(room)leave();target=b;announce('Follow the compass to '+b.name);canvas.focus();});}
let target=null;
const bossSpot={x:900,y:843};
let bossDefeated=false,battleState=null;
const abilities=[
 {id:'web',name:'Debug burst',detail:'18 damage · dependable creative coding'},
 {id:'xr',name:'Reality shield',detail:'12 damage · block the next attack'},
 {id:'graphics',name:'Particle storm',detail:'30 damage · an all-out light show'},
 {id:'audio',name:'Resonant recovery',detail:'8 damage · restore 22 confidence'},
 {id:'mapping',name:'Map the pattern',detail:'10 damage · double your next attack'}
];
function startBattle(){
 if(visited.size!==5||bossDefeated||room)return false;
 keys.clear();battleState={hp:100,bossHp:120,turn:0,focus:false,result:null};
 $('#battleLog').textContent='Your turn. Choose a skill; the goose responds after each move.';
 $('#battleActions').innerHTML=abilities.map(a=>`<button data-ability="${a.id}">${a.name}<small>${a.detail}</small></button>`).join('');
 $('#battleActions').querySelectorAll('button').forEach(b=>b.onclick=()=>battleTurn(b.dataset.ability));
 renderBattle();$('#battle').showModal();return true;
}
function renderBattle(){
 const b=battleState;if(!b)return;
 $('#bossHealth').value=b.bossHp;$('#heroHealth').value=b.hp;
 $('#bossHealthText').textContent=b.bossHp+' / 120';$('#heroHealthText').textContent=b.hp+' / 100';
 $('#bossIntent').textContent=b.result==='win'?'Prairie champion! All five skills, one very impressed goose.':b.result==='lose'?'Take a breather. You can challenge the goose again with full confidence.':(b.turn%3===2?'The goose winds up a mighty HONK: 28 damage next turn.':'The goose readies a wing flap: 16 damage next turn.');
 $('#battleActions').querySelectorAll('button').forEach(el=>el.disabled=Boolean(b.result));
 $('#leaveBattle').textContent=b.result?'Return to town':'Retreat to town';
}
function battleTurn(id){
 const b=battleState;if(!$('#battle').open||!b||b.result||!abilities.some(a=>a.id===id))return false;
 let damage={web:18,xr:12,graphics:30,audio:8,mapping:10}[id];
 if(b.focus){damage*=2;b.focus=false;}
 if(id==='mapping')b.focus=true;
 if(id==='audio')b.hp=Math.min(100,b.hp+22);
 b.bossHp=Math.max(0,b.bossHp-damage);
 let report=abilities.find(a=>a.id===id).name+' deals '+damage+' resolve damage. ';
 if(b.bossHp===0){b.result='win';bossDefeated=true;report+='The goose bows. HONK of approval! You are the Prairie Champion.';updateProgress();chime();}
 else{const hit=id==='xr'?0:(b.turn%3===2?28:16);b.hp=Math.max(0,b.hp-hit);report+=hit?'The goose answers for '+hit+' confidence.':'Your reality shield blocks the goose completely.';b.turn++;if(b.hp===0){b.result='lose';report+=' You retreat with your skills and stamps intact.';}}
 $('#battleLog').textContent=report;renderBattle();return true;
}
function closeBattle(){$('#battle').close();keys.clear();battleState=null;canvas.focus();}
$('#leaveBattle').onclick=closeBattle;
$('#battle').addEventListener('cancel',e=>{e.preventDefault();closeBattle();});

function openGuide(){if($('#battle').open)return;keys.clear();renderGuide();$('#journal').showModal();}
function chime(){if(!soundEnabled)return;if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume();[0,4,7].forEach((n,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=440*Math.pow(2,n/12);g.gain.setValueAtTime(0,audio.currentTime+i*.09);g.gain.linearRampToValueAtTime(.06,audio.currentTime+i*.09+.02);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.09+.3);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+i*.09);o.stop(audio.currentTime+i*.09+.32);});}
function resize(){const r=canvas.getBoundingClientRect();const scale=r.width<650?1.35:1.7;canvas.width=Math.round(r.width/scale);canvas.height=Math.round(r.height/scale);view.w=canvas.width;view.h=canvas.height;ctx.imageSmoothingEnabled=false;}
new ResizeObserver(resize).observe(canvas);
function frame(now){const dt=Math.min((now-last)/1000||0,.04);last=now;time+=dt;const paused=$('#journal').open||$('#conversation').open||$('#battle').open;
 if(!paused){let dx=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0),dy=(keys.has('s')||keys.has('ArrowDown')?1:0)-(keys.has('w')||keys.has('ArrowUp')?1:0);if(dx||dy){const speed=(keys.has('Shift')?205:125)*dt/Math.hypot(dx,dy),blocked=room?roomBlocked:townBlocked;const nx=player.x+dx*speed,ny=player.y+dy*speed;if(!blocked(nx,player.y))player.x=nx;if(!blocked(player.x,ny))player.y=ny;player.dir=dx<0?1:dx>0?2:dy<0?3:0;player.walk+=dt*13;}else player.walk=0;}
 camera.x=room?(view.w>800?(800-view.w)/2:Math.max(0,Math.min(800-view.w,player.x-view.w/2))):Math.max(0,Math.min(world.w-view.w,player.x-view.w/2));camera.y=room?(view.h>620?(620-view.h)/2:Math.max(0,Math.min(620-view.h,player.y-view.h/2))):Math.max(0,Math.min(world.h-view.h,player.y-view.h/2));ctx.clearRect(0,0,view.w,view.h);ctx.save();ctx.translate(-Math.round(camera.x),-Math.round(camera.y));room?drawRoom():drawTown();ctx.restore();near=proximity();const p=$('#prompt');p.hidden=!near||paused;if(near)p.textContent='[ E ] '+near.label;
 if(target&&!room){const dx=target.x+target.w/2-player.x,dy=target.y+25-player.y,d=Math.hypot(dx,dy);if(d<58)target=null;else{const a=Math.atan2(dy,dx),cx=view.w/2+Math.cos(a)*Math.min(view.w*.34,140),cy=view.h/2+Math.sin(a)*Math.min(view.h*.3,110);ellipse(cx,cy,12,12,'#213c40dd');text(['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(a/(Math.PI/4))+8)%8],cx,cy+5,18,'#f7d57b');text(target.name,view.w/2,view.h-17,11,'#203d3e');}}
 requestAnimationFrame(frame);
}
window.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(e.ctrlKey||e.metaKey||e.altKey)return;if($('#battle').open)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key)&&!$('#journal').open&&!$('#conversation').open)e.preventDefault();if(key==='e'&&!e.repeat){e.preventDefault();interact();return;}if(key==='j'&&!e.repeat&&!$('#conversation').open){e.preventDefault();$('#journal').open?$('#journal').close():openGuide();return;}if(!$('#journal').open&&!$('#conversation').open)keys.add(key);});
window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
$('#journalButton').onclick=openGuide;$('#closeJournal').onclick=()=>{$('#journal').close();canvas.focus();};$('#closeConversation').onclick=()=>{$('#conversation').close();canvas.focus();};$('#action').onclick=interact;$('#sound').onclick=()=>{soundEnabled=!soundEnabled;$('#sound').textContent=soundEnabled?'Sound on':'Sound off';$('#sound').setAttribute('aria-pressed',String(soundEnabled));chime();};$('#resetPosition').onclick=()=>{room=null;player.x=668;player.y=390;keys.clear();updateArea();canvas.focus();};
for(const btn of document.querySelectorAll('[data-key]')){btn.onpointerdown=e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);keys.add(btn.dataset.key);};btn.onpointerup=btn.onpointercancel=()=>keys.delete(btn.dataset.key);btn.onlostpointercapture=()=>keys.delete(btn.dataset.key);}
updateProgress();resize();requestAnimationFrame(frame);
