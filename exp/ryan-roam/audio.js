// Small procedural soundscape: no downloads or external audio assets.
export function gardenAudio(button){
 let ctx,master,wind,water,enabled=false,nextBird=0,stepDistance=0;
 function noise(filterType,frequency){
  const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type=filterType;filter.frequency.value=frequency;gain.gain.value=0;source.connect(filter).connect(gain).connect(master);source.start();return gain;
 }
 function tone(frequency,duration,volume,slide=frequency){const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(slide,now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain).connect(master);osc.start();osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
 button.onclick=async()=>{
  button.disabled=true;
  try{
   if(!ctx){const AudioContext=window.AudioContext||window.webkitAudioContext;ctx=new AudioContext();master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);wind=noise('lowpass',450);water=noise('bandpass',1700);}
   if(enabled){await ctx.suspend();enabled=false;}else{await ctx.resume();enabled=true;}
   button.textContent=enabled?'Sound on':'Sound off';button.setAttribute('aria-pressed',String(enabled));
  }catch(error){console.warn('Audio unavailable',error);button.textContent='Sound unavailable';}
  finally{button.disabled=false;document.querySelector('#world canvas').focus({preventScroll:true});}
 };
 document.addEventListener('visibilitychange',()=>{if(!ctx||!enabled)return;if(document.hidden)ctx.suspend().catch(()=>{});else ctx.resume().catch(()=>{});});
 return (dt,position,speed)=>{
  if(!enabled||ctx.state!=='running'||document.hidden)return;
  const now=ctx.currentTime,fountain=Math.hypot(position.x+8,position.z+12),birds=Math.hypot(position.x-12,position.z-9);
  wind.gain.setTargetAtTime(.045+Math.sin(now*.3)*.008,now,.3);water.gain.setTargetAtTime(.32/(1+(fountain/3)**2),now,.2);
  if(now>nextBird){tone(2400+Math.random()*600,.14,.055/(1+(birds/6)**2),3800);nextBird=now+.5+Math.random()*2.5;}
  if(speed>.1){stepDistance+=speed*dt;if(stepDistance>.65){tone(150,.065,.045,65);stepDistance=0;}}else stepDistance=.5;
 };
}
