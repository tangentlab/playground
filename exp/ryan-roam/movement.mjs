export function direction(x, z, yaw) {
 const length = Math.hypot(x,z);
 if (!length) return {x:0,z:0};
 const scale = Math.min(1,length)/length;
 return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))*scale,z:(-x*Math.sin(yaw)+z*Math.cos(yaw))*scale};
}
export function resolvePosition(x,z,obstacles,limit=23) {
 const length=Math.hypot(x,z);
 if(length>limit){x*=limit/length;z*=limit/length;}
 for(const obstacle of obstacles){
  const dx=x-obstacle.x,dz=z-obstacle.z,d=Math.hypot(dx,dz),r=obstacle.r+.28;
  if(d<r){x=obstacle.x+(d?dx/d:1)*r;z=obstacle.z+(d?dz/d:0)*r;}
 }
 return {x,z};
}
export function angleDelta(current,target){return Math.atan2(Math.sin(target-current),Math.cos(target-current));}

export function easeAngle(current,target,rate,dt){return current+angleDelta(current,target)*(1-Math.exp(-rate*dt));}
