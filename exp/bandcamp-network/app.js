const $ = s => document.querySelector(s);
const space = $('#space'), canvas = $('#edges'), ctx = canvas.getContext('2d');
let releases = [], nodes = [], links = [], selected = 0, yaw = -.15, pitch = -.18, zoom = 1, layout = 'network', auto = false, drag = null, moved = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shared = (a,b) => a.tags.filter(t => b.tags.includes(t));
function position(i) {
  const n = releases.length, a = i * 2.399963;
  if (layout === 'timeline') {
    const times = releases.map(r => Date.parse(r.date) || 0), min = Math.min(...times), max = Math.max(...times);
    return [((times[i]-min)/(max-min || 1)-.5)*680, Math.sin(i*1.7)*105, Math.cos(i*1.7)*120];
  }
  if (layout === 'sphere') {const y = 1 - 2*(i+.5)/n, r = Math.sqrt(1-y*y); return [r*Math.cos(a)*290,y*230,r*Math.sin(a)*290];}
  const r = 85 + Math.sqrt(i)*64;
  return [Math.cos(a)*r, Math.sin(a)*r*.65, Math.sin(i*1.9)*180];
}
function choose(i) {
  selected = i;
  nodes.forEach((node,j) => {node.classList.toggle('selected',i===j);node.setAttribute('aria-pressed',String(i===j));});
  const r = releases[i], peers = links.filter(l=>l.a===i || l.b===i).map(l=>l.a===i?l.b:l.a);
  $('#detail-content').innerHTML = `<img src="${escape(r.art)}" alt="${escape(r.title)} cover"><h2>${escape(r.title)}</h2><p class="release-meta">Guidewire · ${escape(r.date || 'Date unavailable')}</p><div class="tags">${r.tags.map(t=>`<span class="tag">${escape(t)}</span>`).join('')}</div><a class="listen" href="${escape(r.url)}" target="_blank" rel="noopener">Listen on Bandcamp ↗</a><div class="related">CONNECTED RELEASES<br>${peers.map(j=>`<button data-peer="${j}" title="Shared tags: ${escape(shared(r,releases[j]).join(', '))}">${escape(releases[j].title)}</button>`).join(' · ') || 'No shared tags'}</div>`;
  document.querySelectorAll('[data-peer]').forEach(b=>b.onclick=()=>choose(Number(b.dataset.peer)));
}
function filter() {
  const q = $('#search').value.trim().toLowerCase();let count = 0;
  nodes.forEach((node,i)=>{const visible = [releases[i].title,...releases[i].tags].join(' ').toLowerCase().includes(q);node.hidden=!visible;if(visible)count++;});
  $('#status').textContent = q ? `${count} matching release${count===1?'':'s'}.` : '';
}
function render() {
  const w = space.clientWidth, h = space.clientHeight, dpr = devicePixelRatio || 1;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const fit = Math.min(w/850,h/550)*zoom;
  const points = releases.map((r,i)=>{
    const [x,y,z] = position(i), rx = x*Math.cos(yaw)+z*Math.sin(yaw), rz = -x*Math.sin(yaw)+z*Math.cos(yaw), ry=y*Math.cos(pitch)-rz*Math.sin(pitch), depth=y*Math.sin(pitch)+rz*Math.cos(pitch), scale=850/(850+depth)*fit;
    const p={x:w/2+rx*scale,y:h/2+ry*scale,s:scale,z:depth};
    nodes[i].style.transform=`translate(${p.x-48*scale}px,${p.y-48*scale}px) scale(${scale})`;
    nodes[i].style.zIndex=String(Math.round(1000-depth));
    nodes[i].style.opacity=i===selected?'1':String(Math.max(.45,1-(depth+300)/1300));return p;
  });
  for(const l of links){if(nodes[l.a].hidden||nodes[l.b].hidden)continue;const a=points[l.a],b=points[l.b],focus=l.a===selected||l.b===selected;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=focus?'#b1e8cc88':'#8ab49b22';ctx.lineWidth=focus?1.2:.7;ctx.stroke();if(focus){ctx.fillStyle='#b1e8cc';ctx.beginPath();ctx.arc((a.x+b.x)/2,(a.y+b.y)/2,2,0,Math.PI*2);ctx.fill();}}
}
let last=0;
function frame(time){if(auto&&!drag&&!document.hidden){yaw+=Math.min(time-last,50)*.00006;}last=time;render();requestAnimationFrame(frame);}
space.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw,pitch};moved=false;});
window.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)moved=true;yaw=drag.yaw+dx*.006;pitch=Math.max(-1.1,Math.min(1.1,drag.pitch+dy*.006));});
window.addEventListener('pointerup',()=>{drag=null;});window.addEventListener('pointercancel',()=>{drag=null;});
space.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.2,zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
$('#search').addEventListener('input',filter);
document.querySelectorAll('[data-layout]').forEach(b=>b.onclick=()=>{layout=b.dataset.layout;document.querySelectorAll('[data-layout]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});$('#view-label').textContent=`${b.textContent.toUpperCase()} VIEW`;});
$('#motion').onclick=()=>{auto=!auto;$('#motion').textContent=`Auto-orbit: ${auto?'on':'off'}`;$('#motion').setAttribute('aria-pressed',String(auto));};
$('#reset').onclick=()=>{yaw=-.15;pitch=-.18;zoom=1;};
try {
  const response = await fetch('collection.json');if(!response.ok)throw Error('Snapshot could not be loaded');
  const data = await response.json(); releases=data.releases;
  if(!releases.length)throw Error('The snapshot contains no releases');
  $('#count').textContent=releases.length;$('#snapshot').textContent=`PUBLIC SNAPSHOT / ${data.fetched}`;
  releases.forEach((r,i)=>{const b=document.createElement('button');b.className='record';b.setAttribute('aria-label',`Explore ${r.title}`);b.innerHTML=`<img src="${escape(r.art)}" alt="" draggable="false"><span>${escape(r.title)}</span><small>${escape(r.date.slice(0,4))}</small>`;b.onclick=e=>{if(e.detail===0||!moved)choose(i);};$('#nodes').append(b);nodes.push(b);});
  const seen=new Set();releases.forEach((r,i)=>releases.map((s,j)=>({j,n:j===i?0:shared(r,s).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n||Math.abs(i-a.j)-Math.abs(i-b.j)).slice(0,2).forEach(({j})=>{const key=[i,j].sort((a,b)=>a-b).join(':');if(!seen.has(key)){seen.add(key);links.push({a:i,b:j});}}));
  choose(0);requestAnimationFrame(frame);
  if(reduced)$('#motion').title='Reduced motion is enabled; auto-orbit starts off.';
} catch(error){$('#detail-content').textContent='The atlas could not load.';$('#status').textContent=`${error.message}. Serve this folder with a local HTTP server; see README.`;}
