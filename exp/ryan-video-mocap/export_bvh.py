"""Convert tracked landmarks to a fixed-length BVH skeleton (estimated, in place)."""
from pathlib import Path
import numpy as np,json
from scipy.spatial.transform import Rotation as R
from scipy.signal import savgol_filter
out=Path(__file__).resolve().parent;data=np.load(out/'landmarks-smoothed.npz');fps=float(data['fps']);w=data['world'][:,:,:3]*np.array([1,-1,-1]);n=len(w)
h=(w[:,23]+w[:,24])/2;ch=(w[:,11]+w[:,12])/2;ears=(w[:,7]+w[:,8])/2
points={'Hips':h,'Spine':h+(ch-h)*.4,'Chest':ch,'Neck':ch+(ears-ch)*.5,'Head':ears,'HeadTip':ears+(ears-ch)*.35}
for side,indices in [('Left',(11,13,15,19,23,25,27,31)),('Right',(12,14,16,20,24,26,28,32))]:
 for name,j in zip(['Arm','ForeArm','Hand','Finger','UpLeg','Leg','Foot','Toe'],indices):points[side+name]=w[:,j]
nodes=[('Hips',None,'Spine'),('Spine','Hips','Chest'),('Chest','Spine','Neck'),('Neck','Chest','Head'),('Head','Neck','HeadTip'),('HeadTip','Head',None)]
for side in ['Left','Right']:
 nodes += [(side+'Arm','Chest',side+'ForeArm'),(side+'ForeArm',side+'Arm',side+'Hand'),(side+'Hand',side+'ForeArm',side+'Finger'),(side+'Finger',side+'Hand',None),(side+'UpLeg','Hips',side+'Leg'),(side+'Leg',side+'UpLeg',side+'Foot'),(side+'Foot',side+'Leg',side+'Toe'),(side+'Toe',side+'Foot',None)]
parents={a:b for a,b,c in nodes};children={a:[] for a,b,c in nodes}
for name,parent,_ in nodes:
 if parent:children[parent].append(name)
offsets={'Hips':np.zeros(3)}
for name,parent,_ in nodes:
 if not parent:continue
 length=np.median(np.linalg.norm(points[name]-points[parent],axis=1))
 if name.endswith('Arm') or name.endswith('Hand') or name.endswith('Finger'):axis=np.array([1 if name.startswith('Left') else -1,0,0])
 elif name.endswith('UpLeg'):axis=np.array([1 if name.startswith('Left') else -1,-.15,0]);axis=axis/np.linalg.norm(axis)
 elif name.endswith('Leg') or name.endswith('Foot'):axis=np.array([0,-1,0])
 elif name.endswith('Toe'):axis=np.array([0,0,1])
 else:axis=np.array([0,1,0])
 offsets[name]=axis*length

def align(a,b):
 a=a/np.linalg.norm(a);b=b/np.linalg.norm(b);dot=np.clip(a@b,-1,1)
 if dot>.999999:return R.identity()
 axis=np.cross(a,b)
 if np.linalg.norm(axis)<1e-7:axis=np.cross(a,[1,0,0] if abs(a[0])<.9 else [0,1,0])
 return R.from_rotvec(axis/np.linalg.norm(axis)*np.arccos(dot))
global_rots={};local_rots={}
for name,parent,child in nodes:
 gs=[];ls=[]
 for f in range(n):
  if child:g=align(offsets[child],points[child][f]-points[name][f])
  else:g=global_rots[parent][f] if parent else R.identity()
  gs.append(g);ls.append(global_rots[parent][f].inv()*g if parent else g)
 global_rots[name]=gs;local_rots[name]=np.unwrap(R.concatenate(ls).as_euler('ZXY'),axis=0)*180/np.pi
# Root height is an estimate from the fixed-length skeleton's lowest foot.
fk={};
for name,parent,_ in nodes:
 fk[name]=np.zeros((n,3)) if not parent else fk[parent]+np.array([q.apply(offsets[name]) for q in global_rots[parent]])
root_y=-np.min(np.stack([fk[k][:,1] for k in ['LeftFoot','LeftToe','RightFoot','RightToe']]),axis=0)
root_y=savgol_filter(root_y,9,2)
order=[];lines=['HIERARCHY']
def write(name,depth=0):
 pad='  '*depth;order.append(name);lines.append(pad+('ROOT ' if depth==0 else 'JOINT ')+name);lines.append(pad+'{');lines.append(pad+'  OFFSET '+' '.join(f'{x:.6f}' for x in offsets[name]));lines.append(pad+'  CHANNELS '+('6 Xposition Yposition Zposition ' if depth==0 else '3 ')+'Zrotation Xrotation Yrotation')
 for c in children[name]:write(c,depth+1)
 if not children[name]:lines.extend([pad+'  End Site',pad+'  {',pad+'    OFFSET 0 0.02 0',pad+'  }'])
 lines.append(pad+'}')
write('Hips');lines.extend(['MOTION',f'Frames: {n}',f'Frame Time: {1/fps:.9f}'])
for f in range(n):
 vals=[0,root_y[f],0]
 for name in order:vals.extend(local_rots[name][f])
 assert np.all(np.isfinite(vals));lines.append(' '.join(f'{v:.6f}' for v in vals))
(out/'youtube-walk-estimated.bvh').write_text('\n'.join(lines)+'\n')
# Blender viewer uses the actual smoothed landmarks without fixed-length conversion.
(out/'landmarks-smoothed.json').write_text(json.dumps({'fps':fps,'world':data['world'].tolist(),'note':'Smoothed estimated world landmarks in MediaPipe coordinates; no calibrated trajectory.'}))
print('BVH exported:',n,'frames;',len(order),'joints;',fps,'fps')
